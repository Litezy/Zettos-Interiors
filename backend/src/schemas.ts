import { z } from 'zod'

export const ProjectStatusSchema = z.enum([
  'CONCEPT',
  'ONGOING',
  'COMPLETED',
])

export const ProjectRequestTypeSchema = z.enum([
  'INTERIOR_DESIGN',
  'BUILDING_CONSTRUCTION',
  'RENOVATION',
  'NOT_SURE',
])

export const PropertyTypeSchema = z.enum([
  'RESIDENTIAL',
  'COMMERCIAL',
  'NOT_SURE',
])

export const EnquiryStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'CONSULTATION_SCHEDULED',
  'QUOTATION_SENT',
  'IN_NEGOTIATION',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
])

const safeText = (max: number) => z.string().trim().max(max)

const assetUrl = z.string().trim().refine(
  (value) => {
    if (value.startsWith('/') && !value.startsWith('//')) return true
    try {
      return new URL(value).protocol === 'https:'
    } catch {
      return false
    }
  },
  'Use an HTTPS URL or a root-relative local asset path',
)

export const EnquiryInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: safeText(40).optional().default(''),
  preferredContact: z.enum(['EMAIL', 'PHONE', 'WHATSAPP']).default('EMAIL'),
  location: safeText(180).optional().default(''),
  projectType: ProjectRequestTypeSchema,
  propertyType: PropertyTypeSchema.default('NOT_SURE'),
  description: z.string().trim().min(15).max(5000),
  budget: safeText(120).optional().default(''),
  preferredStartDate: z.string().datetime().optional().or(z.literal('')),
  projectSize: safeText(120).optional().default(''),
  roomCount: z.coerce.number().int().min(1).max(100).optional(),
  website: z.string().max(200).optional().default(''),
  attachments: z
    .array(
      z.object({
        fileKey: z.string().regex(/^enquiry-pending\/[0-9a-f-]{36}$/i),
        fileName: z.string().trim().min(1).max(180),
        contentType: z.enum([
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
        ]),
        sizeBytes: z.number().int().positive(),
      }),
    )
    .max(5)
    .default([]),
})

export const LoginInputSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200),
})

export const PasswordResetRequestSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
})

export const PasswordResetCompleteSchema = z.object({
  token: z.string().min(32).max(200),
  password: z
    .string()
    .min(8)
    .max(200)
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number'),
})

const ImageInputSchema = z.object({
  url: assetUrl,
  fileKey: z.string().optional(),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
  sizeBytes: z.number().int().positive().optional(),
  alt: z.string().trim().min(3).max(300),
  sortOrder: z.number().int().min(0).max(1000).default(0),
})

export const ProjectInputSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  categorySlug: z.string().trim().min(2).max(100),
  status: ProjectStatusSchema,
  isConcept: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  location: safeText(180).optional().default(''),
  description: z.string().trim().min(10).max(8000),
  scope: z.array(z.string().trim().min(1).max(160)).max(30),
  highlights: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
  projectYear: z.number().int().min(1900).max(2200).optional(),
  coverImageUrl: assetUrl.optional().or(z.literal('')),
  images: z
    .array(
      ImageInputSchema.extend({
        role: z.enum(['GALLERY', 'BEFORE', 'AFTER']).default('GALLERY'),
      }),
    )
    .max(30)
    .default([]),
})

export const ServiceInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  short: z.string().trim().min(5).max(300),
  description: z.string().trim().min(10).max(8000),
  offerings: z.array(z.string().trim().min(1).max(300)).max(30),
  process: z.array(z.string().trim().min(1).max(1000)).max(20),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  images: z.array(ImageInputSchema).max(20).default([]),
})

export const ProjectCategoryInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sortOrder: z.number().int().min(0).max(1000).default(0),
})

export const FAQInputSchema = z.object({
  serviceId: z.string().uuid().nullable().optional(),
  question: z.string().trim().min(5).max(500),
  answer: z.string().trim().min(5).max(5000),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(1000).default(0),
})

export const TestimonialInputSchema = z.object({
  clientName: z.string().trim().min(2).max(160),
  attribution: safeText(200).optional().default(''),
  quote: z.string().trim().min(10).max(3000),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(1000).default(0),
})

export const EnquiryUpdateSchema = z.object({
  status: EnquiryStatusSchema.optional(),
  assignedToId: z.string().uuid().nullable().optional(),
})

export const EnquiryNoteSchema = z.object({
  body: z.string().trim().min(2).max(4000),
})

export const SiteSettingUpdateSchema = z.object({
  settings: z.record(z.string().min(1).max(100), z.unknown()).refine(
    (settings) => Object.keys(settings).length <= 100,
    'At most 100 settings may be updated at once',
  ),
})

export const AdminUserCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  role: z.enum(['SUPER_ADMIN', 'CONTENT_MANAGER']).default('CONTENT_MANAGER'),
  password: PasswordResetCompleteSchema.shape.password,
})

export const AdminUserUpdateSchema = z
  .object({
    role: z.enum(['SUPER_ADMIN', 'CONTENT_MANAGER']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (input) => input.role !== undefined || input.isActive !== undefined,
    'Provide a role or active-state change',
  )

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  q: z.string().trim().max(160).optional(),
})
