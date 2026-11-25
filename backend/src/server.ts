import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { config } from './config.js'
import { prisma } from './db.js'
import { ApiError, errorResponse } from './errors.js'
import { Prisma } from '@prisma/client'
import { registerAuthRoutes } from './routes/auth.js'
import { registerAdminRoutes } from './routes/admin.js'
import { registerPublicRoutes } from './routes/public.js'

export function buildServer() {
  const app = Fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'info' : 'warn',
      redact: [
        'req.headers.cookie',
        'req.headers.authorization',
        'res.headers.set-cookie',
      ],
    },
    bodyLimit: config.uploadMaxBytes + 1024 * 1024,
  })

  app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
  app.register(cors, {
    origin: (origin, callback) => {
      callback(null, !origin || config.frontendOrigins.includes(origin))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
  app.register(cookie)
  app.register(multipart, {
    limits: { fileSize: config.uploadMaxBytes, files: 1, fields: 1, parts: 2 },
  })
  app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  })

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      return reply
        .code(error.statusCode)
        .send(errorResponse(error.code, error.message))
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return reply
          .code(409)
          .send(errorResponse('DUPLICATE_VALUE', 'A record with that value already exists.'))
      }
      if (error.code === 'P2003') {
        return reply
          .code(409)
          .send(errorResponse('RELATED_RECORD_EXISTS', 'This record is still in use.'))
      }
      if (error.code === 'P2025') {
        return reply.code(404).send(errorResponse('NOT_FOUND', 'Record not found.'))
      }
    }

    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : undefined
    if (statusCode === 429) {
      return reply
        .code(429)
        .send(errorResponse('RATE_LIMITED', 'Too many requests. Please try again later.'))
    }
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      const code = statusCode === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST'
      const message =
        statusCode === 404
          ? 'The requested resource was not found.'
          : 'The request could not be processed.'
      return reply.code(statusCode).send(errorResponse(code, message))
    }

    request.log.error({ err: error }, 'Unhandled API error.')
    return reply
      .code(500)
      .send(errorResponse('INTERNAL_ERROR', 'The request could not be completed.'))
  })

  app.get('/api/health', async () => {
    await prisma.$queryRaw`SELECT 1`
    return { data: { status: 'ok' } }
  })

  app.register(registerAuthRoutes)
  app.register(registerPublicRoutes)
  app.register(registerAdminRoutes)

  return app
}

async function start() {
  const app = buildServer()
  await prisma.$connect()
  await app.listen({ host: config.host, port: config.port })
  app.log.info({ host: config.host, port: config.port }, 'Zettos API listening.')

  const shutdown = async () => {
    await app.close()
    await prisma.$disconnect()
  }

  process.once('SIGINT', () => void shutdown())
  process.once('SIGTERM', () => void shutdown())
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  start().catch((error: unknown) => {
    console.error('Failed to start Zettos API:', error)
    process.exitCode = 1
  })
}
