import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'

process.env.DATABASE_URL ??=
  'postgresql://zettos:placeholder@localhost:5432/zettos?schema=public'
process.env.FRONTEND_ORIGINS =
  'http://localhost:3000,https://www.zettos.example'

const { buildServer } = await import('./server.js')

describe('API request guards', () => {
  let app: FastifyInstance

  beforeEach(() => {
    app = buildServer()
  })

  afterEach(async () => {
    await app.close()
  })

  it('requires an authenticated admin session', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Please sign in.',
      },
    })
  })

  it('rejects admin requests from an untrusted origin before accessing data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/projects',
      headers: { origin: 'https://not-zettos.example' },
    })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('INVALID_ORIGIN')
  })

  it('accepts each configured frontend origin', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/projects',
      headers: { origin: 'https://www.zettos.example' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('AUTHENTICATION_REQUIRED')
  })

  it('rejects uploads whose bytes do not match their declared MIME type', async () => {
    const boundary = 'zettos-upload-test'
    const payload = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="brief.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
      ),
      Buffer.from('not an image'),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ])
    const response = await app.inject({
      method: 'POST',
      url: '/api/public/enquiry-uploads',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.code).toBe('INVALID_FILE')
  })

  it('validates login bodies after checking the frontend origin', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:3000' },
      payload: {},
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.code).toBe('VALIDATION_ERROR')
  })
})
