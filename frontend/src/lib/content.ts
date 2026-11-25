import { imageCatalog } from '../data/site'
import type { Project } from '../data/site'
import type { ServiceCardData } from '../components/site'

export type PublicProject = {
  id: string
  slug: string
  title: string
  status: Project['status']
  location: string | null
  description: string
  scope: string[]
  coverImageUrl: string | null
  category: { name: string; slug: string }
  images: Array<{
    id: string
    url: string
    alt: string
    role: 'GALLERY' | 'BEFORE' | 'AFTER'
    sortOrder: number
  }>
}

export type PublicService = {
  id: string
  slug: string
  name: string
  short: string
  description: string
  offerings: string[]
  process: string[]
  sortOrder: number
  images: Array<{ id: string; url: string; alt: string; sortOrder: number }>
  faqs: Array<{ id: string; question: string; answer: string }>
}

export function mapPublicProject(item: PublicProject): Project {
  const gallery = item.images
    .filter((image) => image.role === 'GALLERY')
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((image) => image.url)
  const leadImage = item.images.find((image) => image.role === 'GALLERY')

  return {
    id: item.slug,
    title: item.title,
    type: item.category.name,
    status: item.status,
    location: item.location ?? 'Details to be confirmed',
    image: item.coverImageUrl ?? leadImage?.url ?? imageCatalog.quietForm,
    gallery,
    alt: leadImage?.alt ?? item.title,
    description: item.description,
    scope: item.scope,
  }
}

export function mapPublicService(item: PublicService): ServiceCardData & {
  introduction: string
  process: string[]
  faqs: Array<{ question: string; answer: string }>
} {
  const image = item.images.length ? item.images[0] : undefined
  return {
    id: item.slug,
    number: String(item.sortOrder + 1).padStart(2, '0'),
    name: item.name,
    short: item.short,
    image: image?.url ?? imageCatalog.quietForm,
    alt: image?.alt ?? item.name,
    introduction: item.description,
    offerings: item.offerings,
    process: item.process,
    faqs: item.faqs.map(({ question, answer }) => ({ question, answer })),
  }
}
