import { z } from 'zod'

const frontendOriginList = z
  .string()
  .transform((origins) =>
    origins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().url()).min(1))

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  FRONTEND_ORIGINS: frontendOriginList.optional(),
  FRONTEND_ORIGIN: z.string().url().optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_COOKIE_NAME: z.string().min(1).default('zettos_session'),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  EMAIL_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional().or(z.literal('')),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  UPLOAD_MAX_BYTES: z.coerce.number().int().min(1024).max(25 * 1024 * 1024).default(10 * 1024 * 1024),
})

const result = EnvironmentSchema.safeParse(process.env)

if (!result.success) {
  throw new Error(
    `Invalid backend environment: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
  )
}

export const config = {
  nodeEnv: result.data.NODE_ENV,
  host: result.data.HOST,
  port: result.data.PORT,
  frontendOrigins:
    result.data.FRONTEND_ORIGINS ??
    [result.data.FRONTEND_ORIGIN ?? 'http://localhost:3000'],
  databaseUrl: result.data.DATABASE_URL,
  cookieName: result.data.SESSION_COOKIE_NAME,
  sessionTtlDays: result.data.SESSION_TTL_DAYS,
  emailEnabled: result.data.EMAIL_ENABLED,
  adminNotificationEmail: result.data.ADMIN_NOTIFICATION_EMAIL || undefined,
  resendApiKey: result.data.RESEND_API_KEY,
  emailFrom: result.data.EMAIL_FROM,
  cloudinaryCloudName: result.data.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: result.data.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: result.data.CLOUDINARY_API_SECRET,
  uploadMaxBytes: result.data.UPLOAD_MAX_BYTES,
} as const
