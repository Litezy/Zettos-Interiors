import type { FastifyInstance } from 'fastify'
import { Prisma, type AdminRole } from '@prisma/client'
import { requireAdmin, hashPassword, type AuthenticatedAdmin } from '../auth.js'
import { prisma } from '../db.js'
import { ApiError } from '../errors.js'
import { requireFrontendOrigin } from '../origin.js'
import {
  AdminUserCreateSchema,
  AdminUserUpdateSchema,
  EnquiryNoteSchema,
  EnquiryStatusSchema,
  EnquiryUpdateSchema,
  FAQInputSchema,
  PaginationSchema,
  ProjectCategoryInputSchema,
  ProjectInputSchema,
  ServiceInputSchema,
  SiteSettingUpdateSchema,
  TestimonialInputSchema,
} from '../schemas.js'
import {
  createPrivateDownload,
  publicAssetUrl,
  uploadMediaFile,
  verifyUploadedProjectFile,
  verifyUploadedServiceFile,
} from '../services/storage.js'
import { parseBody } from '../validation.js'
import { z } from 'zod'

const contentRoles: AdminRole[] = ['SUPER_ADMIN', 'CONTENT_MANAGER']
const superAdminRoles: AdminRole[] = ['SUPER_ADMIN']
const idParams = z.object({ id: z.string().uuid() })

const enquiryQuerySchema = PaginationSchema.extend({
  status: EnquiryStatusSchema.optional(),
})

async function assertAdmin(
  request: Parameters<typeof requireAdmin>[0],
  roles: AdminRole[],
) {
  return requireAdmin(request, roles)
}

async function logActivity(
  admin: AuthenticatedAdmin,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Prisma.InputJsonValue,
) {
  await prisma.activityLog.create({
    data: {
      adminId: admin.id,
      action,
      entityType,
      entityId,
      ...(details ? { details } : {}),
    },
  })
}

async function verifyImages(
  images: Array<{
    fileKey?: string
    contentType?: string
    sizeBytes?: number
  }>,
  kind: 'project' | 'service',
) {
  for (const image of images) {
    if (!image.fileKey) continue
    if (!image.contentType || !image.sizeBytes) {
      throw new ApiError(
        400,
        'INVALID_IMAGE',
        'Uploaded images must include their content type and size.',
      )
    }

    const verify =
      kind === 'project'
        ? verifyUploadedProjectFile
        : verifyUploadedServiceFile
    await verify({
      fileKey: image.fileKey,
      contentType: image.contentType,
      sizeBytes: image.sizeBytes,
    })
  }
}

type ManagedImage = {
  url: string
  fileKey?: string
  contentType?: string
  alt: string
  sortOrder: number
  role?: 'GALLERY' | 'BEFORE' | 'AFTER'
}

function imageData(images: ManagedImage[]) {
  return images.map((image) => {
    let url = image.url
    if (image.fileKey) {
      if (!image.contentType) {
        throw new ApiError(
          400,
          'INVALID_IMAGE',
          'Uploaded images must include their content type.',
        )
      }
      url = publicAssetUrl(image.fileKey, image.contentType)
    }
    return {
      url,
      ...(image.fileKey ? { fileKey: image.fileKey } : {}),
      alt: image.alt,
      sortOrder: image.sortOrder,
      ...(image.role ? { role: image.role } : {}),
    }
  })
}

function csvCell(value: unknown) {
  let text = value == null ? '' : String(value)
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export async function registerAdminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireFrontendOrigin)

  app.get('/api/admin/dashboard', async (request) => {
    await assertAdmin(request, contentRoles)
    const [
      totalEnquiries,
      newEnquiries,
      activeEnquiries,
      publishedProjects,
      ongoingProjects,
      completedProjects,
      draftProjects,
      recentEnquiries,
      recentActivity,
    ] = await Promise.all([
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { status: 'NEW' } }),
      prisma.enquiry.count({
        where: {
          status: {
            in: [
              'CONTACTED',
              'CONSULTATION_SCHEDULED',
              'QUOTATION_SENT',
              'IN_NEGOTIATION',
              'APPROVED',
              'IN_PROGRESS',
            ],
          },
        },
      }),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.project.count({
        where: { isPublished: true, status: 'ONGOING' },
      }),
      prisma.project.count({
        where: { isPublished: true, status: 'COMPLETED' },
      }),
      prisma.project.count({ where: { isPublished: false } }),
      prisma.enquiry.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reference: true,
          fullName: true,
          projectType: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.activityLog.findMany({
        take: 12,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { fullName: true } },
        },
      }),
    ])

    return {
      data: {
        counts: {
          totalEnquiries,
          newEnquiries,
          activeEnquiries,
          publishedProjects,
          ongoingProjects,
          completedProjects,
          draftProjects,
        },
        recentEnquiries,
        recentActivity,
      },
    }
  })

  app.get('/api/admin/projects', async (request) => {
    await assertAdmin(request, contentRoles)
    const query = parseBody(PaginationSchema, request.query)
    const where: Prisma.ProjectWhereInput = query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { location: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}
    const [items, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { updatedAt: 'desc' },
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

  app.post('/api/admin/projects', async (request, reply) => {
    const admin = await assertAdmin(request, contentRoles)
    const input = parseBody(ProjectInputSchema, request.body)
    await verifyImages(input.images, 'project')
    const category = await prisma.projectCategory.findUnique({
      where: { slug: input.categorySlug },
      select: { id: true },
    })
    if (!category) {
      throw new ApiError(400, 'CATEGORY_NOT_FOUND', 'Select a valid project category.')
    }

    const project = await prisma.project.create({
      data: {
        title: input.title,
        slug: input.slug,
        categoryId: category.id,
        status: input.status,
        isConcept: input.isConcept,
        isPublished: input.isPublished,
        location: input.location || null,
        description: input.description,
        scope: input.scope,
        highlights: input.highlights,
        projectYear: input.projectYear,
        coverImageUrl:
          input.coverImageUrl ||
          input.images[0]?.url ||
          null,
        images: {
          create: imageData(input.images),
        },
      },
      include: { category: true, images: true },
    })
    await logActivity(admin, 'PROJECT_CREATED', 'Project', project.id)
    return reply.code(201).send({ data: project })
  })

  app.patch('/api/admin/projects/:id', async (request) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    const input = parseBody(ProjectInputSchema, request.body)
    await verifyImages(input.images, 'project')
    const category = await prisma.projectCategory.findUnique({
      where: { slug: input.categorySlug },
      select: { id: true },
    })
    if (!category) {
      throw new ApiError(400, 'CATEGORY_NOT_FOUND', 'Select a valid project category.')
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        title: input.title,
        slug: input.slug,
        categoryId: category.id,
        status: input.status,
        isConcept: input.isConcept,
        isPublished: input.isPublished,
        location: input.location || null,
        description: input.description,
        scope: input.scope,
        highlights: input.highlights,
        projectYear: input.projectYear,
        coverImageUrl:
          input.coverImageUrl ||
          input.images[0]?.url ||
          null,
        images: {
          deleteMany: {},
          create: imageData(input.images),
        },
      },
      include: { category: true, images: true },
    })
    await logActivity(admin, 'PROJECT_UPDATED', 'Project', project.id)
    return { data: project }
  })

  app.delete('/api/admin/projects/:id', async (request, reply) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    await prisma.project.delete({ where: { id } })
    await logActivity(admin, 'PROJECT_DELETED', 'Project', id)
    return reply.code(204).send()
  })

  app.get('/api/admin/project-categories', async (request) => {
    await assertAdmin(request, contentRoles)
    const categories = await prisma.projectCategory.findMany({
      include: { _count: { select: { projects: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return { data: categories }
  })

  app.post('/api/admin/project-categories', async (request, reply) => {
    const admin = await assertAdmin(request, contentRoles)
    const input = parseBody(ProjectCategoryInputSchema, request.body)
    const category = await prisma.projectCategory.create({ data: input })
    await logActivity(admin, 'PROJECT_CATEGORY_CREATED', 'ProjectCategory', category.id)
    return reply.code(201).send({ data: category })
  })

  app.patch('/api/admin/project-categories/:id', async (request) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    const input = parseBody(ProjectCategoryInputSchema, request.body)
    const category = await prisma.projectCategory.update({
      where: { id },
      data: input,
    })
    await logActivity(admin, 'PROJECT_CATEGORY_UPDATED', 'ProjectCategory', id)
    return { data: category }
  })

  app.delete('/api/admin/project-categories/:id', async (request, reply) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    await prisma.projectCategory.delete({ where: { id } })
    await logActivity(admin, 'PROJECT_CATEGORY_DELETED', 'ProjectCategory', id)
    return reply.code(204).send()
  })

  app.get('/api/admin/services', async (request) => {
    await assertAdmin(request, contentRoles)
    const services = await prisma.service.findMany({
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        faqs: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return { data: services }
  })

  app.post('/api/admin/services', async (request, reply) => {
    const admin = await assertAdmin(request, contentRoles)
    const input = parseBody(ServiceInputSchema, request.body)
    await verifyImages(input.images, 'service')
    const service = await prisma.service.create({
      data: {
        name: input.name,
        slug: input.slug,
        short: input.short,
        description: input.description,
        offerings: input.offerings,
        process: input.process,
        isPublished: input.isPublished,
        sortOrder: input.sortOrder,
        images: { create: imageData(input.images) },
      },
      include: { images: true },
    })
    await logActivity(admin, 'SERVICE_CREATED', 'Service', service.id)
    return reply.code(201).send({ data: service })
  })

  app.patch('/api/admin/services/:id', async (request) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    const input = parseBody(ServiceInputSchema, request.body)
    await verifyImages(input.images, 'service')
    const service = await prisma.service.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        short: input.short,
        description: input.description,
        offerings: input.offerings,
        process: input.process,
        isPublished: input.isPublished,
        sortOrder: input.sortOrder,
        images: {
          deleteMany: {},
          create: imageData(input.images),
        },
      },
      include: {
        images: true,
        faqs: { orderBy: { sortOrder: 'asc' } },
      },
    })
    await logActivity(admin, 'SERVICE_UPDATED', 'Service', id)
    return { data: service }
  })

  app.delete('/api/admin/services/:id', async (request, reply) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    await prisma.service.delete({ where: { id } })
    await logActivity(admin, 'SERVICE_DELETED', 'Service', id)
    return reply.code(204).send()
  })

  app.post('/api/admin/media', async (request) => {
    await assertAdmin(request, contentRoles)
    const { kind } = parseBody(
      z.object({ kind: z.enum(['project', 'service']) }),
      request.query,
    )
    const file = await request.file()
    if (!file || file.fieldname !== 'file') {
      throw new ApiError(400, 'INVALID_UPLOAD', 'Provide a media kind and one file.')
    }
    return { data: await uploadMediaFile(file, kind) }
  })

  app.get('/api/admin/enquiries', async (request) => {
    await assertAdmin(request, contentRoles)
    const query = parseBody(enquiryQuerySchema, request.query)
    const where: Prisma.EnquiryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
              { reference: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const [items, total] = await prisma.$transaction([
      prisma.enquiry.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, fullName: true } },
          _count: { select: { attachments: true, notes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.enquiry.count({ where }),
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

  app.get('/api/admin/enquiries/export.csv', async (request, reply) => {
    await assertAdmin(request, contentRoles)
    const query = parseBody(enquiryQuerySchema, request.query)
    const where: Prisma.EnquiryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
              { reference: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const [total, enquiries] = await prisma.$transaction([
      prisma.enquiry.count({ where }),
      prisma.enquiry.findMany({
        where,
        take: 10000,
        orderBy: { createdAt: 'desc' },
        select: {
          reference: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          projectType: true,
          propertyType: true,
          location: true,
          budget: true,
          createdAt: true,
        },
      }),
    ])
    if (total > enquiries.length) {
      throw new ApiError(
        413,
        'EXPORT_TOO_LARGE',
        'This export exceeds 10,000 enquiries. Narrow the search and try again.',
      )
    }
    const columns = [
      'Reference',
      'Name',
      'Email',
      'Phone',
      'Status',
      'Project type',
      'Property type',
      'Location',
      'Budget',
      'Submitted at',
    ]
    const rows = enquiries.map((enquiry) =>
      [
        enquiry.reference,
        enquiry.fullName,
        enquiry.email,
        enquiry.phone,
        enquiry.status,
        enquiry.projectType,
        enquiry.propertyType,
        enquiry.location,
        enquiry.budget,
        enquiry.createdAt.toISOString(),
      ]
        .map(csvCell)
        .join(','),
    )
    return reply
      .type('text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="zettos-enquiries.csv"')
      .send([columns.map(csvCell).join(','), ...rows].join('\r\n'))
  })

  app.get('/api/admin/enquiries/:id', async (request) => {
    await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
        attachments: {
          select: {
            id: true,
            fileName: true,
            contentType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
        notes: {
          include: { admin: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: { actor: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!enquiry) throw new ApiError(404, 'ENQUIRY_NOT_FOUND', 'Enquiry not found.')
    return { data: enquiry }
  })

  app.patch('/api/admin/enquiries/:id', async (request) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    const input = parseBody(EnquiryUpdateSchema, request.body)
    if (!input.status && input.assignedToId === undefined) {
      throw new ApiError(400, 'NO_CHANGES', 'Provide a status or assignee to update.')
    }

    const existing = await prisma.enquiry.findUnique({
      where: { id },
      select: { id: true, status: true, assignedToId: true, reference: true },
    })
    if (!existing) throw new ApiError(404, 'ENQUIRY_NOT_FOUND', 'Enquiry not found.')

    if (input.assignedToId) {
      const assignee = await prisma.adminUser.findFirst({
        where: { id: input.assignedToId, isActive: true },
        select: { id: true },
      })
      if (!assignee) {
        throw new ApiError(400, 'INVALID_ASSIGNEE', 'Select an active admin user.')
      }
    }

    const updated = await prisma.$transaction(async (transaction) => {
      const enquiry = await transaction.enquiry.update({
        where: { id },
        data: {
          ...(input.status ? { status: input.status } : {}),
          ...(input.assignedToId !== undefined
            ? { assignedToId: input.assignedToId }
            : {}),
        },
      })

      const changedStatus = input.status && input.status !== existing.status
      const changedAssignee =
        input.assignedToId !== undefined &&
        input.assignedToId !== existing.assignedToId
      if (changedStatus || changedAssignee) {
        await transaction.enquiryActivity.create({
          data: {
            enquiryId: id,
            actorId: admin.id,
            type: changedStatus ? 'STATUS_CHANGED' : 'ASSIGNED',
            body: changedStatus
              ? `Status changed from ${existing.status} to ${input.status}.`
              : input.assignedToId
                ? 'Enquiry assigned to an admin user.'
                : 'Enquiry unassigned.',
          },
        })
        await transaction.activityLog.create({
          data: {
            adminId: admin.id,
            action: changedStatus ? 'ENQUIRY_STATUS_CHANGED' : 'ENQUIRY_ASSIGNED',
            entityType: 'Enquiry',
            entityId: id,
            details: { reference: existing.reference },
          },
        })
      }
      return enquiry
    })
    return { data: updated }
  })

  app.post('/api/admin/enquiries/:id/notes', async (request, reply) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    const input = parseBody(EnquiryNoteSchema, request.body)
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      select: { id: true, reference: true },
    })
    if (!enquiry) throw new ApiError(404, 'ENQUIRY_NOT_FOUND', 'Enquiry not found.')

    const note = await prisma.enquiryNote.create({
      data: {
        enquiryId: id,
        adminId: admin.id,
        body: input.body,
      },
      include: { admin: { select: { id: true, fullName: true } } },
    })
    await prisma.enquiryActivity.create({
      data: {
        enquiryId: id,
        actorId: admin.id,
        type: 'NOTE_ADDED',
        body: 'An internal note was added.',
      },
    })
    await logActivity(admin, 'ENQUIRY_NOTE_ADDED', 'Enquiry', id, {
      reference: enquiry.reference,
    })
    return reply.code(201).send({ data: note })
  })

  app.get(
    '/api/admin/enquiries/:id/attachments/:attachmentId',
    async (request) => {
      await assertAdmin(request, contentRoles)
      const params = parseBody(
        z.object({ id: z.string().uuid(), attachmentId: z.string().uuid() }),
        request.params,
      )
      const attachment = await prisma.enquiryAttachment.findFirst({
        where: { id: params.attachmentId, enquiryId: params.id },
        select: { fileKey: true, fileName: true, contentType: true },
      })
      if (!attachment || !attachment.fileKey.startsWith('enquiry-pending/')) {
        throw new ApiError(404, 'ATTACHMENT_NOT_FOUND', 'Attachment not found.')
      }
      const downloadUrl = await createPrivateDownload(
        attachment.fileKey,
        attachment.contentType,
      )
      return { data: { downloadUrl, expiresIn: 300 } }
    },
  )

  app.get('/api/admin/faqs', async (request) => {
    await assertAdmin(request, contentRoles)
    const items = await prisma.fAQ.findMany({
      include: { service: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return { data: items }
  })

  app.post('/api/admin/faqs', async (request, reply) => {
    const admin = await assertAdmin(request, contentRoles)
    const input = parseBody(FAQInputSchema, request.body)
    const faq = await prisma.fAQ.create({ data: input })
    await logActivity(admin, 'FAQ_CREATED', 'FAQ', faq.id)
    return reply.code(201).send({ data: faq })
  })

  app.patch('/api/admin/faqs/:id', async (request) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    const input = parseBody(FAQInputSchema, request.body)
    const faq = await prisma.fAQ.update({ where: { id }, data: input })
    await logActivity(admin, 'FAQ_UPDATED', 'FAQ', id)
    return { data: faq }
  })

  app.delete('/api/admin/faqs/:id', async (request, reply) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    await prisma.fAQ.delete({ where: { id } })
    await logActivity(admin, 'FAQ_DELETED', 'FAQ', id)
    return reply.code(204).send()
  })

  app.get('/api/admin/testimonials', async (request) => {
    await assertAdmin(request, contentRoles)
    return {
      data: await prisma.testimonial.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
    }
  })

  app.post('/api/admin/testimonials', async (request, reply) => {
    const admin = await assertAdmin(request, contentRoles)
    const input = parseBody(TestimonialInputSchema, request.body)
    const testimonial = await prisma.testimonial.create({ data: input })
    await logActivity(admin, 'TESTIMONIAL_CREATED', 'Testimonial', testimonial.id)
    return reply.code(201).send({ data: testimonial })
  })

  app.patch('/api/admin/testimonials/:id', async (request) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    const input = parseBody(TestimonialInputSchema, request.body)
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: input,
    })
    await logActivity(admin, 'TESTIMONIAL_UPDATED', 'Testimonial', id)
    return { data: testimonial }
  })

  app.delete('/api/admin/testimonials/:id', async (request, reply) => {
    const admin = await assertAdmin(request, contentRoles)
    const { id } = parseBody(idParams, request.params)
    await prisma.testimonial.delete({ where: { id } })
    await logActivity(admin, 'TESTIMONIAL_DELETED', 'Testimonial', id)
    return reply.code(204).send()
  })

  app.get('/api/admin/settings', async (request) => {
    await assertAdmin(request, superAdminRoles)
    const settings = await prisma.siteSetting.findMany({
      orderBy: { key: 'asc' },
    })
    return { data: Object.fromEntries(settings.map(({ key, value }) => [key, value])) }
  })

  app.put('/api/admin/settings', async (request) => {
    const admin = await assertAdmin(request, superAdminRoles)
    const { settings } = parseBody(SiteSettingUpdateSchema, request.body)
    await prisma.$transaction(
      Object.entries(settings).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: {
            key,
            value: value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue),
          },
          update: {
            value: value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue),
          },
        }),
      ),
    )
    await logActivity(admin, 'SITE_SETTINGS_UPDATED', 'SiteSetting', null, {
      keys: Object.keys(settings),
    })
    return { data: { updatedKeys: Object.keys(settings) } }
  })

  app.get('/api/admin/users', async (request) => {
    await assertAdmin(request, superAdminRoles)
    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    return { data: users }
  })

  app.post('/api/admin/users', async (request, reply) => {
    const admin = await assertAdmin(request, superAdminRoles)
    const input = parseBody(AdminUserCreateSchema, request.body)
    const user = await prisma.adminUser.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        role: input.role,
        passwordHash: await hashPassword(input.password),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })
    await logActivity(admin, 'ADMIN_USER_CREATED', 'AdminUser', user.id)
    return reply.code(201).send({ data: user })
  })

  app.patch('/api/admin/users/:id', async (request) => {
    const admin = await assertAdmin(request, superAdminRoles)
    const { id } = parseBody(idParams, request.params)
    const input = parseBody(AdminUserUpdateSchema, request.body)
    const existing = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true },
    })
    if (!existing) throw new ApiError(404, 'ADMIN_NOT_FOUND', 'Admin user not found.')

    const isDisablingSelf = admin.id === id && input.isActive === false
    const isDemotingSelf =
      admin.id === id && input.role === 'CONTENT_MANAGER'
    if (isDisablingSelf || isDemotingSelf) {
      throw new ApiError(
        400,
        'SELF_LOCKOUT',
        'You cannot deactivate or demote your own account.',
      )
    }

    const removesActiveSuperAdmin =
      existing.role === 'SUPER_ADMIN' &&
      existing.isActive &&
      (input.isActive === false || input.role === 'CONTENT_MANAGER')
    if (removesActiveSuperAdmin) {
      const activeSuperAdmins = await prisma.adminUser.count({
        where: { role: 'SUPER_ADMIN', isActive: true },
      })
      if (activeSuperAdmins <= 1) {
        throw new ApiError(
          409,
          'LAST_SUPER_ADMIN',
          'At least one active Super Admin must remain.',
        )
      }
    }

    const user = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.adminUser.update({
        where: { id },
        data: {
          ...(input.role !== undefined ? { role: input.role } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      })
      if (input.isActive === false) {
        await transaction.adminSession.deleteMany({ where: { userId: id } })
      }
      return updated
    })
    await logActivity(admin, 'ADMIN_USER_UPDATED', 'AdminUser', id)
    return { data: user }
  })
}
