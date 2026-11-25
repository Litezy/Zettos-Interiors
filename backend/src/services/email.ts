import { Resend } from 'resend'
import { config } from '../config.js'

type DeliveryResult =
  | { configured: false; delivered: false }
  | { configured: true; delivered: boolean; messageId?: string }

let resend: Resend | undefined

function getResend() {
  if (!config.emailEnabled || !config.resendApiKey || !config.emailFrom) {
    return undefined
  }
  resend ??= new Resend(config.resendApiKey)
  return resend
}

export async function sendEnquiryEmails(input: {
  reference: string
  fullName: string
  email: string
  phone: string
  projectType: string
  location: string
  description: string
}) {
  const client = getResend()
  if (!client) return { configured: false as const, delivered: false as const }

  const text = [
    `Enquiry reference: ${input.reference}`,
    `Name: ${input.fullName}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || 'Not provided'}`,
    `Project type: ${input.projectType}`,
    `Location: ${input.location || 'Not provided'}`,
    '',
    input.description,
  ].join('\n')

  const outcomes = await Promise.all([
    client.emails.send({
      from: config.emailFrom!,
      to: input.email,
      subject: `We received your project enquiry (${input.reference})`,
      text: `Thank you for contacting Zettos Interior Units. Your enquiry has been recorded with reference ${input.reference}.\n\n${text}`,
    }),
    ...(config.adminNotificationEmail
      ? [
          client.emails.send({
            from: config.emailFrom!,
            to: config.adminNotificationEmail,
            subject: `New project enquiry — ${input.reference}`,
            text,
          }),
        ]
      : []),
  ])

  const failed = outcomes.some((outcome) => outcome.error)
  const messageId = outcomes.find((outcome) => outcome.data?.id)?.data?.id
  return {
    configured: true as const,
    delivered: !failed,
    ...(messageId ? { messageId } : {}),
  } satisfies DeliveryResult
}

export async function sendPasswordResetEmail(input: {
  email: string
  fullName: string
  token: string
  frontendOrigin: string
}) {
  const client = getResend()
  if (!client) return { configured: false as const, delivered: false as const }

  const resetUrl = new URL('/admin/reset', input.frontendOrigin)
  resetUrl.searchParams.set('token', input.token)
  const result = await client.emails.send({
    from: config.emailFrom!,
    to: input.email,
    subject: 'Reset your Zettos admin password',
    text: `Hello ${input.fullName},\n\nUse this one-time link within 30 minutes to reset your password:\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
  })

  return {
    configured: true as const,
    delivered: !result.error,
    ...(result.data?.id ? { messageId: result.data.id } : {}),
  } satisfies DeliveryResult
}
