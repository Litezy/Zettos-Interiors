import { createFileRoute } from '@tanstack/react-router'
import { services as localServices } from '../data/site'
import {
  Eyebrow,
  PageHeading,
  PageShell,
  ServiceCards,
  PublicDataError,
} from '../components/site'
import { apiRequest, isApiConfigured } from '../lib/api'
import { mapPublicService } from '../lib/content'
import type { PublicService } from '../lib/content'

export const Route = createFileRoute('/services/')({
  loader: async () => {
    if (!isApiConfigured()) return { services: localServices }

    const items = await apiRequest<PublicService[]>('/api/public/services')
    return { services: items.map(mapPublicService) }
  },
  errorComponent: PublicDataError,
  head: () => ({
    meta: [
      { title: 'Design & Build Services — Zettos Interior Units' },
      {
        name: 'description',
        content:
          'Explore interior design and building project possibilities with Zettos Interior Units in Lagos.',
      },
    ],
  }),
  component: ServicesPage,
})

function ServicesPage() {
  const { services } = Route.useLoaderData()
  return (
    <PageShell>
      <PageHeading
        eyebrow="Design · Build · Belong"
        title={
          <>
            Thoughtful work.
            <br />
            <em>From inside out.</em>
          </>
        }
        description="Interiors and building ideas brought together with care for the people, purpose and place behind every project."
      />
      <section className="services-page section-wrap section-wrap--sand">
        <div className="section-heading">
          <div>
            <Eyebrow>How we can help</Eyebrow>
            <h2>
              One considered
              <br />
              <em>conversation at a time.</em>
            </h2>
          </div>
          <p>
            No two briefs are alike. We’ll discuss your goals, scope and
            requirements before confirming the services and professional
            expertise a project needs.
          </p>
        </div>
        <ServiceCards items={services} />
        <p className="scope-note">
          Service categories shown are indicative. Project availability and
          scope should be confirmed directly with Zettos.
        </p>
      </section>
      <section className="service-details section-wrap">
        <Eyebrow>Areas to explore</Eyebrow>
        <h2>
          A space for every
          <br />
          <em>kind of possibility.</em>
        </h2>
        <div className="service-list">
          {services
            .flatMap((service) => service.offerings)
            .map((offering, index) => (
              <div className="service-list__item" key={offering}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{offering}</h3>
                <span aria-hidden="true">↗</span>
              </div>
            ))}
        </div>
        <p className="scope-note">
          Examples are a starting point for discussion, not a confirmation of
          service availability, licensing or technical scope.
        </p>
      </section>
      <section className="short-cta">
        <Eyebrow light>Tell us what you’re planning</Eyebrow>
        <h2>
          Your brief is
          <br />
          <em>a good place to begin.</em>
        </h2>
        <a className="button button--cream" href="/contact">
          Share your project <span aria-hidden="true">↗</span>
        </a>
      </section>
    </PageShell>
  )
}
