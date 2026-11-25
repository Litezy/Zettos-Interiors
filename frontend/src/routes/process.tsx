import { createFileRoute } from '@tanstack/react-router'
import { processSteps } from '../data/site'
import { SiteIcon } from '../components/icons'
import { Eyebrow, PageHeading, PageShell } from '../components/site'

export const Route = createFileRoute('/process')({
  head: () => ({
    meta: [
      { title: 'Our Approach — Zettos Interior Units' },
      {
        name: 'description',
        content:
          'Learn how Zettos approaches interior and building projects, from an initial conversation to planning and delivery.',
      },
    ],
  }),
  component: ProcessPage,
})

function ProcessPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Our approach"
        title={
          <>
            A clear path.
            <br />
            <em>Considered at every step.</em>
          </>
        }
        description="Good collaboration turns a big idea into a series of clear decisions. Here’s how we begin."
      />
      <section className="process-page section-wrap section-wrap--ivory">
        <div className="process-page__intro">
          <Eyebrow>From first conversation to handover</Eyebrow>
          <h2>
            Each project follows
            <br />
            <em>its own rhythm.</em>
          </h2>
          <p>
            The steps below are a starting framework. The exact process,
            deliverables and professional roles depend on your project scope,
            site conditions and applicable requirements.
          </p>
        </div>
        <div className="process-timeline">
          {processSteps.map((step) => (
            <article className="process-timeline__step" key={step.number}>
              <span className="process-timeline__number">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="process-split section-wrap section-wrap--sand">
        <article>
          <Eyebrow>Interior design</Eyebrow>
          <h2>
            Begin with how
            <br />
            <em>you want to feel.</em>
          </h2>
          <p>
            We start with the people, routines and practical requirements that
            shape a space. From there, the brief can develop into a concept,
            spatial plan, material direction and an agreed implementation
            approach.
          </p>
        </article>
        <article>
          <Eyebrow>Building projects</Eyebrow>
          <h2>
            Plan carefully.
            <br />
            <em>Build responsibly.</em>
          </h2>
          <p>
            Construction starts with understanding the site, scope and
            requirements. Design coordination, cost planning, approvals and
            technical work should involve the suitably qualified professionals
            and authorities required for the project.
          </p>
        </article>
      </section>
      <section className="short-cta">
        <Eyebrow light>Your project, your priorities</Eyebrow>
        <h2>
          Let’s work out
          <br />
          <em>the right next step.</em>
        </h2>
        <a className="button button--cream" href="/contact">
          Talk to the studio <SiteIcon name="arrow-up-right" />
        </a>
      </section>
    </PageShell>
  )
}
