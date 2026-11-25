import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SiteIcon } from '../components/icons'
import {
  Eyebrow,
  PageShell,
  PublicDataError,
} from '../components/site'
import { services as localServices } from '../data/site'
import { apiRequest, isApiConfigured } from '../lib/api'
import { mapPublicService } from '../lib/content'
import type { PublicService } from '../lib/content'

export const Route = createFileRoute('/services/$serviceId')({
  head: ({ params }) => {
    return {
      meta: [
        {
          title: `${params.serviceId.replace(/-/g, ' ')} — Zettos Interior Units`,
        },
        {
          name: 'description',
          content: 'Explore services by Zettos Interior Units.',
        },
      ],
    }
  },
  component: ServiceDetailPage,
})

function ServiceDetailPage() {
  const { serviceId } = Route.useParams()
  const [service, setService] = useState<
    ReturnType<typeof mapPublicService> | null
  >(null)
  const [error, setError] = useState<Error | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setService(null)
    setError(null)
    if (!isApiConfigured()) {
      const localService = localServices.find((item) => item.id === serviceId)
      if (localService) setService(localService)
      else setError(new Error('Service not found.'))
      return () => {
        active = false
      }
    }

    apiRequest<PublicService>(
      `/api/public/services/${encodeURIComponent(serviceId)}`,
    )
      .then((item) => {
        if (active) setService(mapPublicService(item))
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause
              : new Error('Could not load this service.'),
          )
        }
      })
    return () => {
      active = false
    }
  }, [serviceId, retry])

  if (error) {
    return (
      <PublicDataError error={error} reset={() => setRetry((count) => count + 1)} />
    )
  }
  if (!service) {
    return (
      <PageShell>
        <section className="not-found">
          <Eyebrow>Service</Eyebrow>
          <h1>Loading service details…</h1>
        </section>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <section className="detail-hero">
        <img src={service.image} alt={service.alt} />
        <div className="detail-hero__shade" />
        <div className="detail-hero__content">
          <Eyebrow light>{service.number} / Zettos services</Eyebrow>
          <h1>
            {service.name.split(' ').slice(0, -1).join(' ')}
            <br />
            <em>{service.name.split(' ').slice(-1)}</em>
          </h1>
          <p>{service.short}</p>
          <a className="button button--cream" href="/contact">
            Discuss your project <SiteIcon name="arrow-up-right" />
          </a>
        </div>
      </section>
      <section className="service-detail-copy section-wrap">
        <div>
          <Eyebrow>Thoughtfully considered</Eyebrow>
          <h2>
            Good spaces start
            <br />
            <em>with good questions.</em>
          </h2>
        </div>
        <div>
          <p>{service.introduction}</p>
          <p>
            We’ll confirm the available scope, timelines, budget considerations
            and professional requirements with you before any work proceeds.
          </p>
        </div>
      </section>
      <section className="service-offerings section-wrap section-wrap--sand">
        <Eyebrow>Possible areas of focus</Eyebrow>
        <h2>
          A tailored scope,
          <br />
          <em>not a one-size-fits-all list.</em>
        </h2>
        <div className="service-list">
          {service.offerings.map((item, index) => (
            <div className="service-list__item" key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item}</h3>
              <SiteIcon name="arrow-up-right" />
            </div>
          ))}
        </div>
        <p className="scope-note">
          Indicative service categories only. Final scope and technical delivery
          are confirmed for each project.
        </p>
      </section>
      <section className="service-journey section-wrap">
        <div className="service-journey__intro">
          <Eyebrow>A collaborative process</Eyebrow>
          <h2>
            Clear steps.
            <br />
            <em>Thoughtful decisions.</em>
          </h2>
          <p>
            We agree the right sequence together. Timing, deliverables and
            professional responsibilities depend on the confirmed brief.
          </p>
        </div>
        <div className="service-journey__steps">
          {service.process.map((step, index) => (
            <article key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="service-faq section-wrap section-wrap--sand">
        <div>
          <Eyebrow>Helpful to know</Eyebrow>
          <h2>
            A few first
            <br />
            <em>questions.</em>
          </h2>
        </div>
        <div className="service-faq__list">
          {service.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>
                {faq.question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="short-cta">
        <Eyebrow light>Start with a conversation</Eyebrow>
        <h2>
          Tell us about
          <br />
          <em>the space you imagine.</em>
        </h2>
        <a className="button button--cream" href="/contact">
          Start a project <SiteIcon name="arrow-up-right" />
        </a>
      </section>
    </PageShell>
  )
}
