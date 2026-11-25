export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function errorResponse(code: string, message: string) {
  return { error: { code, message } }
}
