import { randomBytes } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { config } from '../config.js'
import { prisma } from '../db.js'
import { ApiError } from '../errors.js'
import {
  EnquiryInputSchema,
  PaginationSchema,
  ProjectStatusSchema,
} from '../schemas.js'
import { sendEnquiryEmails } from '../services/email.js'
import {
  uploadEnquiryFile,
  verifyUploadedEnquiryFile,
} from '../services/storage.js'
import { parseBody } from '../validation.js'
import { z } from 'zod'

const publicProjectsQuerySchema = PaginationSchema.extend({
  category: z.string().trim().min(1).max(100).optional(),
  status: ProjectStatusSchema.optional(),
})

const publicSettings = new Set([
  'businessName',
  'tagline',
  'businessEmail',
  'businessPhone',
  'whatsappNumber',
  'officeAddress',
  'socialLinks',
  'seoTitle',
  'seoDescription',
])

export async function registerPublicRoutes(app: FastifyInstance) {
  app.get('/api/public/projects', async (request) => {
    const query = parseBody(publicProjectsQuerySchema, request.query)
    const where: Prisma.ProjectWhereInput = {
      isPublished: true,
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
              { location: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [items, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          images: {
            orderBy: { sortOrder: 'asc' },
            select: { id: true, url: true, alt: true, role: true, sortOrder: true },
          },
        },
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.project.count({ where }),
    ])

    return {
      data: items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    }
  })

  app.get('/api/public/project-categories', async () => {
    const categories = await prisma.projectCategory.findMany({
      where: { projects: { some: { isPublished: true } } },
      select: { name: true, slug: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return { data: categories }
  })

  app.get('/api/public/projects/:slug', async (request) => {
    const params = parseBody(
      z.object({ slug: z.string().min(1).max(180) }),
      request.params,
    )
    const project = await prisma.project.findFirst({
      where: { slug: params.slug, isPublished: true },
      include: {
        category: { select: { name: true, slug: true } },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, alt: true, role: true, sortOrder: true },
        },
      },
    })

    if (!project) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.')
    }

    return { data: project }
  })

  app.get('/api/public/services', async () => {
    const services = await prisma.service.findMany({
      where: { isPublished: true },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, alt: true, sortOrder: true },
        },
        faqs: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, question: true, answer: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
    return { data: services }
  })

  app.get('/api/public/services/:slug', async (request) => {
    const params = parseBody(
      z.object({ slug: z.string().min(1).max(180) }),
      request.params,
    )
    const service = await prisma.service.findFirst({
      where: { slug: params.slug, isPublished: true },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, alt: true, sortOrder: true },
        },
        faqs: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, question: true, answer: true },
        },
      },
    })

    if (!service) {
      throw new ApiError(404, 'SERVICE_NOT_FOUND', 'Service not found.')
    }
    return { data: service }
  })

  app.get('/api/public/settings', async () => {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: [...publicSettings] } },
      select: { key: true, value: true },
    })
    return {
      data: Object.fromEntries(settings.map(({ key, value }) => [key, value])),
    }
  })

  app.get('/api/public/faqs', async () => {
    const faqs = await prisma.fAQ.findMany({
      where: { isPublished: true, serviceId: null },
      select: { id: true, question: true, answer: true, sortOrder: true },
      orderBy: { sortOrder: 'asc' },
    })
    return { data: faqs }
  })

  app.get('/api/public/testimonials', async () => {
    const testimonials = await prisma.testimonial.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        clientName: true,
        attribution: true,
        quote: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    })
    return { data: testimonials }
  })

  app.post(
    '/api/public/enquiry-uploads',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
    },
    async (request) => {
      const file = await request.file()
      if (!file || file.fieldname !== 'file') {
        throw new ApiError(400, 'INVALID_UPLOAD', 'Choose a file to upload.')
      }
      return { data: await uploadEnquiryFile(file) }
    },
  )

  app.post(
    '/api/public/enquiries',
    {
      config: { rateLimit: { max: 4, timeWindow: '1 hour' } },
    },
    async (request, reply) => {
      const input = parseBody(EnquiryInputSchema, request.body)
      if (input.website) {
        throw new ApiError(400, 'INVALID_REQUEST', 'The enquiry could not be accepted.')
      }

      if (
        input.attachments.some(
          (attachment) =>
            attachment.sizeBytes > config.uploadMaxBytes ||
            !attachment.fileKey.startsWith('enquiry-pending/'),
        )
      ) {
        throw new ApiError(
          400,
          'INVALID_ATTACHMENT',
          'One or more attachments are invalid.',
        )
      }

      await Promise.all(input.attachments.map(verifyUploadedEnquiryFile))

      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const reference = `ZT-${datePart}-${randomBytes(4).toString('hex').toUpperCase()}`
      const enquiry = await prisma.enquiry.create({
        data: {
          reference,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone || null,
          preferredContact: input.preferredContact,
          location: input.location || null,
          projectType: input.projectType,
          propertyType: input.propertyType,
          description: input.description,
          budget: input.budget || null,
          preferredStartDate: input.preferredStartDate
            ? new Date(input.preferredStartDate)
            : null,
          projectSize: input.projectSize || null,
          roomCount: input.roomCount,
          attachments: {
            create: input.attachments.map((attachment) => ({
              fileKey: attachment.fileKey,
              fileName: attachment.fileName,
              contentType: attachment.contentType,
              sizeBytes: attachment.sizeBytes,
            })),
          },
          activities: {
            create: { type: 'SUBMITTED', body: 'Enquiry received from the public website.' },
          },
        },
        select: { id: true, reference: true },
      })

      let notification: 'sent' | 'not_configured' | 'failed' = 'not_configured'
      try {
        const delivery = await sendEnquiryEmails({
          reference: enquiry.reference,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          projectType: input.projectType,
          location: input.location,
          description: input.description,
        })
        notification = !delivery.configured
          ? 'not_configured'
          : delivery.delivered
            ? 'sent'
            : 'failed'
        if (notification === 'failed') {
          request.log.error(
            { enquiryId: enquiry.id, reference },
            'Enquiry was saved but email notification failed.',
          )
        }
      } catch (error) {
        notification = 'failed'
        request.log.error(
          { err: error, enquiryId: enquiry.id, reference },
          'Enquiry was saved but email notification failed.',
        )
      }

      return reply.code(201).send({
        data: { reference: enquiry.reference },
        meta: { notification },
      })
    },
  )
}
