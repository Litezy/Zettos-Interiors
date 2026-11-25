import { createHash, randomBytes } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { compare, hash } from 'bcryptjs'
import { config } from './config.js'
import { prisma } from './db.js'
import { ApiError } from './errors.js'
import type { AdminRole } from '@prisma/client'

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secure: config.nodeEnv === 'production',
}

export type AuthenticatedAdmin = {
  id: string
  fullName: string
  email: string
  role: AdminRole
}

export const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex')

export async function hashPassword(password: string) {
  return hash(password, 12)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash)
}

export async function startAdminSession(
  userId: string,
  reply: FastifyReply,
) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(
    Date.now() + config.sessionTtlDays * 24 * 60 * 60 * 1000,
  )

  await prisma.$transaction([
    prisma.adminSession.create({
      data: {
        userId,
        tokenHash: sha256(token),
        expiresAt,
      },
    }),
    prisma.adminUser.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    }),
    prisma.activityLog.create({
      data: {
        adminId: userId,
        action: 'ADMIN_LOGIN',
        entityType: 'AdminUser',
        entityId: userId,
      },
    }),
  ])

  reply.setCookie(config.cookieName, token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: config.sessionTtlDays * 24 * 60 * 60,
  })

  return expiresAt
}

export function clearAdminSession(reply: FastifyReply) {
  reply.clearCookie(config.cookieName, SESSION_COOKIE_OPTIONS)
}

export async function endAdminSession(request: FastifyRequest) {
  const token = request.cookies[config.cookieName]
  if (!token) return

  await prisma.adminSession.deleteMany({
    where: { tokenHash: sha256(token) },
  })
}

export async function requireAdmin(
  request: FastifyRequest,
  roles?: AdminRole[],
): Promise<AuthenticatedAdmin> {
  const token = request.cookies[config.cookieName]
  if (!token) {
    throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Please sign in.')
  }

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  })

  if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
    if (session) {
      await prisma.adminSession.deleteMany({
        where: { tokenHash: sha256(token) },
      })
    }
    throw new ApiError(401, 'SESSION_EXPIRED', 'Please sign in again.')
  }

  if (roles && !roles.includes(session.user.role)) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have permission for this action.')
  }

  return {
    id: session.user.id,
    fullName: session.user.fullName,
    email: session.user.email,
    role: session.user.role,
  }
}
