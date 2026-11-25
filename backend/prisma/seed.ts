import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import {
  projectCategories,
  projects,
  services,
} from '../../frontend/src/data/site.ts'

const prisma = new PrismaClient()

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function seed() {
  const categories = new Map<string, string>()
  for (const [sortOrder, name] of projectCategories.entries()) {
    const slug = slugify(name)
    const category = await prisma.projectCategory.upsert({
      where: { slug },
      create: { name, slug, sortOrder },
      update: { name, sortOrder },
      select: { id: true },
    })
    categories.set(name, category.id)
  }

  for (const [index, project] of projects.entries()) {
    const categoryId = categories.get(project.type)
    if (!categoryId) {
      throw new Error(`Missing project category for "${project.type}".`)
    }

    const images = [project.image, ...project.gallery]
      .filter((url, imageIndex, all) => all.indexOf(url) === imageIndex)
      .map((url, sortOrder) => ({
        url,
        alt: project.alt,
        role: 'GALLERY' as const,
        sortOrder,
      }))

    await prisma.project.upsert({
      where: { slug: project.id },
      create: {
        title: project.title,
        slug: project.id,
        categoryId,
        status: project.status,
        isConcept: project.status === 'CONCEPT',
        isPublished: true,
        location: project.location,
        description: project.description,
        scope: project.scope,
        highlights: [],
        coverImageUrl: project.image,
        images: { create: images },
      },
      update: {
        title: project.title,
        categoryId,
        status: project.status,
        isConcept: project.status === 'CONCEPT',
        isPublished: true,
        location: project.location,
        description: project.description,
        scope: project.scope,
        coverImageUrl: project.image,
        images: { deleteMany: {}, create: images },
      },
    })

    if ((index + 1) % 10 === 0 || index === projects.length - 1) {
      console.info(`Seeded ${index + 1}/${projects.length} projects.`)
    }
  }

  for (const [sortOrder, service] of services.entries()) {
    const slug = service.id
    const images = [
      {
        url: service.image,
        alt: service.alt,
        sortOrder: 0,
      },
    ]
    const faqs = service.faqs.map((faq, faqOrder) => ({
      question: faq.question,
      answer: faq.answer,
      isPublished: true,
      sortOrder: faqOrder,
    }))

    await prisma.service.upsert({
      where: { slug },
      create: {
        name: service.name,
        slug,
        short: service.short,
        description: service.introduction,
        offerings: service.offerings,
        process: service.process,
        isPublished: true,
        sortOrder,
        images: { create: images },
        faqs: { create: faqs },
      },
      update: {
        name: service.name,
        short: service.short,
        description: service.introduction,
        offerings: service.offerings,
        process: service.process,
        isPublished: true,
        sortOrder,
        images: { deleteMany: {}, create: images },
        faqs: { deleteMany: {}, create: faqs },
      },
    })
  }

  console.info(
    `Seed complete: ${projectCategories.length} categories, ${projects.length} projects, ${services.length} services.`,
  )
}

seed()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
