import { describe, expect, it } from 'vitest'
import {
  EnquiryInputSchema,
  PasswordResetCompleteSchema,
  ProjectInputSchema,
} from './schemas.js'

const validEnquiry = {
  fullName: 'Taylor Client',
  email: 'CLIENT@EXAMPLE.COM',
  projectType: 'INTERIOR_DESIGN',
  description: 'We are planning an interior refresh for our family home.',
}

describe('EnquiryInputSchema', () => {
  it('normalizes email and applies defaults for an enquiry', () => {
    const result = EnquiryInputSchema.safeParse(validEnquiry)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('client@example.com')
      expect(result.data.attachments).toEqual([])
      expect(result.data.propertyType).toBe('NOT_SURE')
    }
  })

  it('rejects attachments that do not use server-issued enquiry keys', () => {
    const result = EnquiryInputSchema.safeParse({
      ...validEnquiry,
      attachments: [
        {
          fileKey: 'projects/public-image.jpg',
          fileName: 'brief.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 1200,
        },
      ],
    })

    expect(result.success).toBe(false)
  })

  it('limits the number of submitted attachments', () => {
    const attachments = Array.from({ length: 6 }, (_, index) => ({
      fileKey: `enquiry-pending/00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      fileName: `brief-${index}.jpg`,
      contentType: 'image/jpeg',
      sizeBytes: 1200,
    }))

    expect(
      EnquiryInputSchema.safeParse({ ...validEnquiry, attachments }).success,
    ).toBe(false)
  })
})

describe('PasswordResetCompleteSchema', () => {
  it('requires a strong replacement password of at least eight characters', () => {
    expect(
      PasswordResetCompleteSchema.safeParse({
        token: 'a'.repeat(32),
        password: 'Strng7A',
      }).success,
    ).toBe(false)

    expect(
      PasswordResetCompleteSchema.safeParse({
        token: 'a'.repeat(32),
        password: 'Strng77A',
      }).success,
    ).toBe(true)

    expect(
      PasswordResetCompleteSchema.safeParse({
        token: 'a'.repeat(32),
        password: 'StrongPass123',
      }).success,
    ).toBe(true)
  })
})

describe('ProjectInputSchema', () => {
  it('accepts local assets but rejects unsafe image schemes', () => {
    const project = {
      title: 'Current site work',
      slug: 'current-site-work',
      categorySlug: 'construction',
      status: 'ONGOING',
      description: 'A project update shared by the Zettos team.',
      scope: ['Ongoing site works'],
      coverImageUrl: '/images/site_1.JPG',
      images: [
        {
          url: '/images/site_1.JPG',
          alt: 'A current project site',
          role: 'GALLERY',
        },
      ],
    }

    expect(ProjectInputSchema.safeParse(project).success).toBe(true)
    expect(
      ProjectInputSchema.safeParse({
        ...project,
        coverImageUrl: 'javascript:alert(1)',
      }).success,
    ).toBe(false)
  })
})
