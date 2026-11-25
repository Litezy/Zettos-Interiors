import type { FastifyReply, FastifyRequest } from 'fastify'
import { config } from './config.js'
import { ApiError } from './errors.js'

export async function requireFrontendOrigin(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  if (
    !request.headers.origin ||
    !config.frontendOrigins.includes(request.headers.origin)
  ) {
    throw new ApiError(403, 'INVALID_ORIGIN', 'Request origin is not allowed.')
  }
}
