import { randomBytes } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import {
  clearAdminSession,
  endAdminSession,
  hashPassword,
  requireAdmin,
  sha256,
  startAdminSession,
  verifyPassword,
} from '../auth.js'
import { prisma } from '../db.js'
import { config } from '../config.js'
import { ApiError } from '../errors.js'
import { requireFrontendOrigin } from '../origin.js'
import {
  LoginInputSchema,
  PasswordResetCompleteSchema,
  PasswordResetRequestSchema,
} from '../schemas.js'
import { sendPasswordResetEmail } from '../services/email.js'
import { parseBody } from '../validation.js'

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post(
    '/api/auth/login',
    {
      preHandler: requireFrontendOrigin,
      config: { rateLimit: { max: 8, timeWindow: '15 minutes' } },
    },
    async (request, reply) => {
      const input = parseBody(LoginInputSchema, request.body)
      const user = await prisma.adminUser.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          passwordHash: true,
        },
      })

      const passwordMatches =
        user && (await verifyPassword(input.password, user.passwordHash))
      if (!user || !user.isActive || !passwordMatches) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
      }

      const expiresAt = await startAdminSession(user.id, reply)

      return reply.send({
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          },
          expiresAt,
        },
      })
    },
  )

  app.post(
    '/api/auth/logout',
    { preHandler: requireFrontendOrigin },
    async (request, reply) => {
      await endAdminSession(request)
      clearAdminSession(reply)
      return reply.send({ data: { signedOut: true } })
    },
  )

  app.get('/api/auth/me', async (request) => {
    const user = await requireAdmin(request)
    return { data: { user } }
  })

  app.post(
    '/api/auth/password-reset',
    {
      preHandler: requireFrontendOrigin,
      config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
    },
    async (request, reply) => {
      const input = parseBody(PasswordResetRequestSchema, request.body)
      const user = await prisma.adminUser.findUnique({
        where: { email: input.email },
        select: { id: true, email: true, fullName: true, isActive: true },
      })

      if (user?.isActive && config.emailEnabled) {
        const token = randomBytes(32).toString('base64url')
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

        await prisma.$transaction([
          prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
          prisma.passwordResetToken.create({
            data: {
              userId: user.id,
              tokenHash: sha256(token),
              expiresAt,
            },
          }),
        ])

        try {
          const delivery = await sendPasswordResetEmail({
            email: user.email,
            fullName: user.fullName,
            token,
            frontendOrigin:
              request.headers.origin ??
              config.frontendOrigins[0] ??
              'http://localhost:3000',
          })
          if (!delivery.configured || !delivery.delivered) {
            request.log.error(
              { adminId: user.id, configured: delivery.configured },
              'Password reset delivery is unavailable.',
            )
          }
        } catch (error) {
          request.log.error(
            { err: error, adminId: user.id },
            'Password reset delivery failed.',
          )
        }
      }

      return reply.code(202).send({
        data: {
          message:
            'If an active admin account matches that email, password reset instructions will be sent.',
        },
      })
    },
  )

  app.post(
    '/api/auth/password-reset/complete',
    {
      preHandler: requireFrontendOrigin,
      config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    },
    async (request, reply) => {
      const input = parseBody(PasswordResetCompleteSchema, request.body)
      const tokenHash = sha256(input.token)
      const reset = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { id: true, userId: true, expiresAt: true, usedAt: true },
      })

      if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
        throw new ApiError(
          400,
          'INVALID_RESET_TOKEN',
          'This reset link is invalid or has expired. Request a new one.',
        )
      }

      const passwordHash = await hashPassword(input.password)
      await prisma.$transaction(async (transaction) => {
        const claimed = await transaction.passwordResetToken.updateMany({
          where: {
            id: reset.id,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { usedAt: new Date() },
        })
        if (claimed.count !== 1) {
          throw new ApiError(
            400,
            'INVALID_RESET_TOKEN',
            'This reset link is invalid or has expired. Request a new one.',
          )
        }

        await transaction.adminUser.update({
          where: { id: reset.userId },
          data: { passwordHash },
        })
        await transaction.adminSession.deleteMany({
          where: { userId: reset.userId },
        })
      })

      clearAdminSession(reply)
      return reply.send({ data: { passwordUpdated: true } })
    },
  )

}
