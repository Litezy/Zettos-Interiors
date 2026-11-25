import { createFileRoute } from '@tanstack/react-router'
import {
  imageCatalog,
  processSteps,
  projects as localProjects,
  services as localServices,
} from '../data/site'
import {
  Eyebrow,
  PageShell,
  ProjectPreview,
  ServiceCards,
  PublicDataError,
} from '../components/site'
import { SiteIcon } from '../components/icons'
import { apiRequest, isApiConfigured } from '../lib/api'
import {
  mapPublicProject,
  mapPublicService,
} from '../lib/content'
import type { PublicProject, PublicService } from '../lib/content'

export const Route = createFileRoute('/')({
  loader: async () => {
    if (!isApiConfigured()) {
      return { projects: localProjects, services: localServices }
    }

    const [apiProjects, apiServices] = await Promise.all([
      apiRequest<PublicProject[]>('/api/public/projects?pageSize=100'),
      apiRequest<PublicService[]>('/api/public/services'),
    ])
    return {
      projects: apiProjects.map(mapPublicProject),
      services: apiServices.map(mapPublicService),
    }
  },
  errorComponent: PublicDataError,
  head: () => ({
    meta: [
      {
        title:
          'Zettos Interior Units — Spaces that inspire. Structures that last.',
      },
      {
        name: 'description',
        content:
          'A Lagos design-and-build studio shaping considered interiors and architectural spaces. Explore the Zettos approach and start a project conversation.',
      },
      { property: 'og:title', content: 'Zettos Interior Units' },
      {
        property: 'og:description',
        content: 'Spaces that inspire. Structures that last.',
      },
      { property: 'og:type', content: 'website' },
    ],
  }),
  component: Home,
})

function Home() {
  const { projects, services } = Route.useLoaderData()

  return (
    <PageShell>
      <section className="hero">
        <img
          className="hero__image"
          src={imageCatalog.quietForm}
          alt="Sunlit contemporary living space with warm natural materials"
          fetchPriority="high"
        />
        <div className="hero__shade" />
        <div className="hero__content">
          <Eyebrow light>Design · Build · Belong</Eyebrow>
          <h1>
            Spaces that
            <br />
            inspire. <em>Structures</em>
            <br />
            <em>that last.</em>
          </h1>
          <p>
            Thoughtful interiors and considered building, shaped around the way
            you want to live.
          </p>
          <div className="hero__actions">
            <a className="button button--cream" href="/projects">
              Explore our projects <SiteIcon name="arrow-up-right" />
            </a>
            <a className="hero__text-link" href="/contact">
              Start a project <SiteIcon name="arrow-up-right" />
            </a>
          </div>
        </div>
        <div className="hero__caption">
          <span>01 — A considered point of view</span>
          <span>Lagos, Nigeria</span>
        </div>
        <div className="hero__vertical">ZETTOS INTERIOR UNITS</div>
      </section>

      <section className="intro-section section-wrap">
        <div className="intro-section__label">
          <Eyebrow>A creative design-and-build studio</Eyebrow>
          <span className="intro-section__index">01 / 04</span>
        </div>
        <div className="intro-section__copy">
          <h2>
            Every space has
            <br />a story waiting <em>to unfold.</em>
          </h2>
          <div className="intro-section__bottom">
            <p>
              At Zettos, we bring interior design and building together with a
              shared care for detail, function and feeling. From the first
              conversation to the finishing touches, we believe good spaces make
              everyday life better.
            </p>
            <a className="text-link" href="/about">
              Meet the studio <SiteIcon name="arrow-up-right" />
            </a>
          </div>
        </div>
        <div className="intro-section__image">
          <img
            src={imageCatalog.gatheredLight}
            alt="A calm, light-filled interior with natural wood and soft furnishings"
            loading="lazy"
          />
          <span>Spaces shaped around real life.</span>
        </div>
      </section>

      <section className="services-section section-wrap section-wrap--sand">
        <div className="section-heading">
          <div>
            <Eyebrow>What we do</Eyebrow>
            <h2>
              Two disciplines.
              <br />
              <em>One thoughtful vision.</em>
            </h2>
          </div>
          <p>
            Whether you are reimagining a room or shaping a building, a clear
            point of view brings every detail together.
          </p>
        </div>
        <ServiceCards items={services} />
        <p className="scope-note">
          Project scope and service availability are confirmed together at the
          start of each enquiry.
        </p>
      </section>

      <section className="experience-band">
        <div className="experience-band__intro">
          <Eyebrow>Experience you can build on</Eyebrow>
          <h2>
            Grounded in
            <br />
            <em>real project work.</em>
          </h2>
          <p>
            Over the past five years, Zettos has built experience across
            projects for government and major firms. Project-specific stories
            and photography are being curated for this portfolio.
          </p>
        </div>
        <div className="experience-band__facts">
          <article>
            <span>01</span>
            <strong>Five years</strong>
            <p>of project experience</p>
          </article>
          <article>
            <span>02</span>
            <strong>Public & private</strong>
            <p>government and major-firm work</p>
          </article>
          <article>
            <span>03</span>
            <strong>Lagos based</strong>
            <p>working across design and building</p>
          </article>
        </div>
      </section>

      <section className="portfolio-section section-wrap">
        <div className="section-heading section-heading--portfolio">
          <div>
            <Eyebrow>Selected concepts</Eyebrow>
            <h2>
              Ideas for spaces
              <br />
              <em>well considered.</em>
            </h2>
          </div>
          <a className="text-link" href="/projects">
            View all projects <SiteIcon name="arrow-up-right" />
          </a>
        </div>
        <ProjectPreview limit={3} items={projects} />
      </section>

      <section className="statement-section">
        <img src={imageCatalog.architecture} alt="" loading="lazy" />
        <div className="statement-section__shade" />
        <div className="statement-section__content">
          <Eyebrow light>From first thought to final detail</Eyebrow>
          <h2>
            Design is how
            <br />a place <em>feels.</em>
          </h2>
          <p>
            We bring together creative thinking, careful planning and
            craftsmanship to make spaces that feel like they belong.
          </p>
          <a className="button button--cream" href="/process">
            Discover our approach <SiteIcon name="arrow-up-right" />
          </a>
        </div>
        <span className="statement-section__note">
          Thoughtfully designed · Beautifully built
        </span>
      </section>

      <section className="approach-section section-wrap section-wrap--ivory">
        <div className="approach-section__intro">
          <Eyebrow>The way we work</Eyebrow>
          <h2>
            A clear path,
            <br />
            <em>from the beginning.</em>
          </h2>
          <p>
            Every project is different. Our approach keeps the conversation
            clear, the details considered and the next step understood.
          </p>
          <a className="text-link" href="/process">
            Explore the process <SiteIcon name="arrow-up-right" />
          </a>
        </div>
        <div className="steps-list">
          {processSteps.map((step) => (
            <article className="step-row" key={step.number}>
              <span className="step-row__number">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
              <span className="step-row__arrow">
                <SiteIcon name="arrow-up-right" />
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-cta">
        <div className="closing-cta__decoration" aria-hidden="true">
          Z
        </div>
        <Eyebrow light>Have a space in mind?</Eyebrow>
        <h2>
          Let’s make room
          <br />
          <em>for what’s next.</em>
        </h2>
        <a className="button button--cream" href="/contact">
          Tell us about your project <SiteIcon name="arrow-up-right" />
        </a>
      </section>
    </PageShell>
  )
}
