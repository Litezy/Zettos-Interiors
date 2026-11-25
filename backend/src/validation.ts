import type { ZodType } from 'zod'
import { ApiError } from './errors.js'

export function parseBody<T extends ZodType>(
  schema: T,
  body: unknown,
): T['_output'] {
  const result = schema.safeParse(body)

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
      .join('; ')
    throw new ApiError(400, 'VALIDATION_ERROR', message)
  }

  return result.data
}
