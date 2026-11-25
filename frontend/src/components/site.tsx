import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { projects, services } from '../data/site'
import type { Project } from '../data/site'
import { apiRequest } from '../lib/api'

const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER as
  string | undefined

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${inverse ? 'brand--inverse' : ''}`}
      aria-label="Zettos Interior Units — home"
    >
      <svg
        className="brand__symbol"
        viewBox="0 0 42 42"
        fill="none"
        aria-hidden="true"
      >
        <path d="M7 8.5h28L7 33.5h28" />
        <path d="M7 8.5v7m28 10v8" />
      </svg>
      <span className="brand__wordmark">
        <strong>ZETTOS</strong>
        <span>INTERIOR UNITS</span>
      </span>
    </Link>
  )
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header" id="top">
      <div className="site-header__inner">
        <BrandMark />
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={
            menuOpen ? 'Close navigation menu' : 'Open navigation menu'
          }
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>
        <nav
          className={`primary-nav ${menuOpen ? 'primary-nav--open' : ''}`}
          id="primary-navigation"
          aria-label="Main navigation"
        >
          <Link to="/about" activeProps={{ 'aria-current': 'page' }} onClick={closeMenu}>
            About us
          </Link>
          <Link to="/services" activeProps={{ 'aria-current': 'page' }} onClick={closeMenu}>
            Services
          </Link>
          <Link to="/projects" activeProps={{ 'aria-current': 'page' }} onClick={closeMenu}>
            Projects
          </Link>
          <Link to="/process" activeProps={{ 'aria-current': 'page' }} onClick={closeMenu}>
            Our approach
          </Link>
          <Link
            className="nav-cta"
            to="/contact"
            activeProps={{ 'aria-current': 'page' }}
            onClick={closeMenu}
          >
            Start a project <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="footer-intro">
          <BrandMark inverse />
          <p>
            Spaces that inspire.
            <br />
            Structures that last.
          </p>
        </div>
        <div className="footer-column">
          <span className="eyebrow">Explore</span>
          <Link to="/about">About us</Link>
          <Link to="/services">Services</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/process">Our approach</Link>
        </div>
        <div className="footer-column">
          <span className="eyebrow">Get in touch</span>
          <Link to="/contact">
            Tell us about your project <span aria-hidden="true">↗</span>
          </Link>
          <p>Lagos, Nigeria</p>
          <p className="footer-note">
            Contact details will be added once confirmed.
          </p>
        </div>
        <div className="footer-note-card">
          <span className="eyebrow">A good place to begin</span>
          <p>Every considered space starts with a conversation.</p>
          <Link className="text-link text-link--light" to="/contact">
            Share your brief <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} Zettos Interior Units</span>
        <span>Thoughtfully designed. Beautifully built.</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  )
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  )
}

export function PublicDataError({
  error,
  reset,
}: {
  error: unknown
  reset: () => void
}) {
  return (
    <PageShell>
      <section className="not-found">
        <Eyebrow>Content unavailable</Eyebrow>
        <h1>We could not load this page.</h1>
        <p>
          {error instanceof Error
            ? error.message
            : 'Please try again in a moment.'}
        </p>
        <button className="text-link" type="button" onClick={reset}>
          Try again <span aria-hidden="true">↻</span>
        </button>
      </section>
    </PageShell>
  )
}

export function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode
  light?: boolean
}) {
  return (
    <span className={`eyebrow ${light ? 'eyebrow--light' : ''}`}>
      {children}
    </span>
  )
}

export function ProjectCard({ project }: { project: Project }) {
  const statusLabel =
    project.status === 'CONCEPT'
      ? 'Concept visualisation'
      : project.status === 'ONGOING'
        ? 'Ongoing · site progress'
        : 'Completed project'

  return (
    <article className="project-card">
      <a className="project-card__image-link" href={`/projects/${project.id}`}>
        <img
          src={project.image}
          alt={project.alt}
          loading="lazy"
          className="project-card__image"
        />
        <span
          className={`concept-chip ${project.status === 'ONGOING' ? 'concept-chip--ongoing' : ''}`}
        >
          {statusLabel}
        </span>
        <span className="project-card__arrow" aria-hidden="true">
          ↗
        </span>
      </a>
      <div className="project-card__meta">
        <div>
          <span className="project-card__category">{project.type}</span>
          <h3>
            <a href={`/projects/${project.id}`}>{project.title}</a>
          </h3>
        </div>
        <span className="project-card__location">{project.location}</span>
      </div>
    </article>
  )
}

export function ProjectExplorer({
  items = projects,
}: {
  items?: Project[]
}) {
  const [activeFilter, setActiveFilter] = useState<string>('All')
  const [visibleCount, setVisibleCount] = useState(12)
  const [search, setSearch] = useState('')
  const categories = [...new Set(items.map((project) => project.type))]
  const filters = ['All', ...categories, 'Ongoing', 'Completed']
  const categoryProjects =
    activeFilter === 'All'
      ? items
      : activeFilter === 'Ongoing' || activeFilter === 'Completed'
        ? items.filter(
            (project) =>
              project.status ===
              (activeFilter === 'Ongoing' ? 'ONGOING' : 'COMPLETED'),
          )
        : items.filter((project) => project.type === activeFilter)
  const shownProjects = categoryProjects.filter((project) => {
    const term = search.trim().toLowerCase()
    return (
      !term ||
      project.title.toLowerCase().includes(term) ||
      project.type.toLowerCase().includes(term) ||
      project.status.toLowerCase().includes(term) ||
      project.description.toLowerCase().includes(term)
    )
  })
  const visibleProjects = shownProjects.slice(0, visibleCount)

  return (
    <>
      <div className="filter-list" role="group" aria-label="Filter projects">
        {filters.map((filter) => (
          <button
            type="button"
            className={`filter-button ${activeFilter === filter ? 'filter-button--active' : ''}`}
            aria-pressed={activeFilter === filter}
            key={filter}
            onClick={() => {
              setActiveFilter(filter)
              setVisibleCount(12)
            }}
          >
            <span>{filter}</span>
            <span className="filter-button__count">
              {filter === 'All'
                ? items.length
                : filter === 'Ongoing' || filter === 'Completed'
                  ? items.filter(
                      (project) =>
                        project.status ===
                        (filter === 'Ongoing' ? 'ONGOING' : 'COMPLETED'),
                    ).length
                  : items.filter((project) => project.type === filter).length}
            </span>
          </button>
        ))}
      </div>
      <div className="project-controls">
        <label className="project-search">
          <span className="sr-only">Search projects</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value)
              setVisibleCount(12)
            }}
            placeholder="Search projects"
          />
          <span aria-hidden="true">⌕</span>
        </label>
        <p className="project-result-count" aria-live="polite">
          Showing {Math.min(visibleCount, shownProjects.length)} of{' '}
          {shownProjects.length} projects
        </p>
      </div>
      {visibleProjects.length ? (
        <div className="project-grid">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="empty-note">
          <span className="eyebrow">More to come</span>
          <p>
            {search
              ? 'No concepts match that search. Try a different term.'
              : 'There are no concept studies in this category yet.'}
          </p>
        </div>
      )}
      {visibleCount < shownProjects.length && (
        <button
          className="load-more-button"
          type="button"
          onClick={() => setVisibleCount((count) => count + 12)}
        >
          Load more concepts <span aria-hidden="true">↓</span>
        </button>
      )}
      <p className="concept-disclaimer">
        Concept studies are illustrative. Ongoing site-progress photographs
        were supplied by Zettos; project details will be added when confirmed.
      </p>
    </>
  )
}

export function ProjectPreview({
  limit,
  items = projects,
}: {
  limit: number
  items?: Project[]
}) {
  const featuredProjects = [
    ...items.filter((project) => project.status === 'ONGOING'),
    ...[...new Set(items.map((project) => project.type))]
      .map((category) => items.find((project) => project.type === category))
      .filter((project): project is Project => Boolean(project)),
  ]

  return (
    <>
      <div className="project-grid">
        {featuredProjects.slice(0, limit).map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <p className="concept-disclaimer">
        Concept visualisations are illustrative; ongoing site progress is
        identified separately and shared with project details pending.
      </p>
    </>
  )
}

export function EnquiryForm() {
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState<'error' | 'success'>('error')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStartDate, setSelectedStartDate] = useState<Date>()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return

    const values = new FormData(form)
    const selectedFiles = values
      .getAll('attachments')
      .filter((value): value is File => value instanceof File && value.size > 0)

    if (selectedFiles.length > 5) {
      setNotice('Please attach no more than five files.')
      setNoticeType('error')
      return
    }

    setIsSubmitting(true)
    setNotice('')
    try {
      const attachments: Array<{
        fileKey: string
        fileName: string
        contentType: string
        sizeBytes: number
      }> = []
      for (const file of selectedFiles) {
        const uploadBody = new FormData()
        uploadBody.append('file', file)
        const upload = await apiRequest<{
          fileKey: string
          contentType: string
          sizeBytes: number
          fileName: string
        }>('/api/public/enquiry-uploads', {
          method: 'POST',
          body: uploadBody,
        })
        attachments.push({
          fileKey: upload.fileKey,
          fileName: file.name,
          contentType: upload.contentType,
          sizeBytes: upload.sizeBytes,
        })
      }

      const preferredStartDate = String(values.get('preferredStartDate') || '')
      const result = await apiRequest<{ reference: string }>(
        '/api/public/enquiries',
        {
          method: 'POST',
          body: JSON.stringify({
            fullName: String(values.get('name')),
            email: String(values.get('email')),
            phone: String(values.get('phone') || ''),
            preferredContact: String(values.get('preferredContact')),
            location: String(values.get('location') || ''),
            projectType: String(values.get('projectType')),
            propertyType: String(values.get('propertyType')),
            description: String(values.get('message')),
            budget: String(values.get('budget') || ''),
            preferredStartDate: preferredStartDate
              ? `${preferredStartDate}T00:00:00.000Z`
              : '',
            projectSize: String(values.get('projectSize') || ''),
            roomCount: values.get('roomCount')
              ? Number(values.get('roomCount'))
              : undefined,
            website: String(values.get('website') || ''),
            attachments,
          }),
        },
      )
      form.reset()
      setSelectedStartDate(undefined)
      setNotice(
        `Thank you — your enquiry has been received. Your reference is ${result.reference}.`,
      )
      setNoticeType('success')
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'We could not submit your enquiry. Please try again.',
      )
      setNoticeType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
    : undefined

  return (
    <div className="enquiry-layout">
      <div className="enquiry-aside">
        <Eyebrow light>Tell us what you have in mind</Eyebrow>
        <h2>
          Good work
          <br />
          starts with
          <br />
          <em>a conversation.</em>
        </h2>
        <p>
          Share a little about your space, your plans and what matters to you.
          We’ll use it as a starting point for the conversation.
        </p>
        {whatsappHref ? (
          <a
            className="contact-shortcut"
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
          >
            Or start a WhatsApp conversation <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <p className="contact-shortcut contact-shortcut--muted">
            WhatsApp contact will appear here once a business number is
            confirmed.
          </p>
        )}
      </div>
      <form className="enquiry-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            <span>Your name *</span>
            <input
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={120}
              placeholder="How should we address you?"
              required
            />
          </label>
          <label>
            <span>Email address *</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            <span>Phone number</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+234"
            />
          </label>
          <label>
            <span>What are you planning? *</span>
            <select name="projectType" defaultValue="" required>
              <option value="" disabled>
                Select a project type
              </option>
              <option value="INTERIOR_DESIGN">Interior design</option>
              <option value="BUILDING_CONSTRUCTION">
                Building construction
              </option>
              <option value="RENOVATION">Renovation</option>
              <option value="NOT_SURE">Not sure yet</option>
            </select>
          </label>
          <label>
            <span>Property type</span>
            <select name="propertyType" defaultValue="NOT_SURE">
              <option value="NOT_SURE">Not sure</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </label>
          <label>
            <span>Preferred contact</span>
            <select name="preferredContact" defaultValue="EMAIL">
              <option value="EMAIL">Email</option>
              <option value="PHONE">Phone</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </label>
          <label>
            <span>Budget range (optional)</span>
            <input name="budget" maxLength={120} placeholder="Your guide range" />
          </label>
          <label>
            <span>Preferred start date (optional)</span>
            <DatePickerField
              date={selectedStartDate}
              onChange={setSelectedStartDate}
            />
          </label>
          <label className="form-grid__full">
            <span>Project location</span>
            <input
              name="location"
              autoComplete="street-address"
              placeholder="Area or city"
            />
          </label>
          <label>
            <span>Approximate project size (optional)</span>
            <input
              name="projectSize"
              maxLength={120}
              placeholder="For example, 150 m²"
            />
          </label>
          <label>
            <span>Number of rooms (optional)</span>
            <input name="roomCount" type="number" min={1} max={100} />
          </label>
          <label className="form-grid__full">
            <span>A little about your project *</span>
            <textarea
              name="message"
              rows={5}
              minLength={15}
              maxLength={5000}
              placeholder="What would you love to create?"
              required
            />
          </label>
          <label className="form-grid__full">
            <span>Reference files (optional, up to 5)</span>
            <input
              name="attachments"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
            />
          </label>
          <label className="form-honeypot" aria-hidden="true">
            Leave this field empty
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
          </label>
        </div>
        {notice && (
          <p className={`form-notice form-notice--${noticeType}`} role="status">
            {notice}
          </p>
        )}
        <button className="button button--dark" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending enquiry…' : 'Send my enquiry'}{' '}
          {!isSubmitting && <span aria-hidden="true">↗</span>}
        </button>
        <p className="form-privacy">
          We’ll only use these details to respond to your project enquiry.
        </p>
      </form>
    </div>
  )
}

function DatePickerField({
  date,
  onChange,
}: {
  date: Date | undefined
  onChange: (date: Date | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const dateValue = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : ''
  const label = date
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
      }).format(date)
    : 'Choose a date'

  return (
    <div className="date-picker">
      <input type="hidden" name="preferredStartDate" value={dateValue} />
      <button
        className="date-picker__trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{label}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      </button>
      {open && (
        <div
          className="date-picker__popover"
          role="dialog"
          aria-label="Select a preferred start date"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
          }}
        >
          <div className="date-picker__heading">
            <span>Preferred start date</span>
            <button
              type="button"
              aria-label="Close calendar"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(nextDate) => {
              onChange(nextDate)
              if (nextDate) setOpen(false)
            }}
            disabled={{ before: new Date() }}
            autoFocus
          />
        </div>
      )}
    </div>
  )
}

export type ServiceCardData = {
  id: string
  number: string
  name: string
  short: string
  image: string
  alt: string
  offerings: string[]
}

export function ServiceCards({
  items = services,
}: {
  items?: ServiceCardData[]
}) {
  return (
    <div className="service-grid">
      {items.map((service) => (
        <article className="service-card" key={service.id}>
          <a
            href={`/services/${service.id}`}
            className="service-card__image-link"
          >
            <img src={service.image} alt={service.alt} loading="lazy" />
            <span className="service-card__number">{service.number}</span>
            <span className="project-card__arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <div className="service-card__body">
            <h3>
              <a href={`/services/${service.id}`}>{service.name}</a>
            </h3>
            <p>{service.short}</p>
            <ul
              className="service-card__scope"
              aria-label="Possible project scope"
            >
              {service.offerings.slice(0, 3).map((offering) => (
                <li key={offering}>{offering}</li>
              ))}
            </ul>
            <a className="text-link" href={`/services/${service.id}`}>
              Explore this service <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
      ))}
    </div>
  )
}

export function PageHeading({
  eyebrow,
  title,
  description,
  dark = false,
}: {
  eyebrow: string
  title: ReactNode
  description: string
  dark?: boolean
}) {
  return (
    <section className={`page-heading ${dark ? 'page-heading--dark' : ''}`}>
      <div className="page-heading__inner">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  )
}
