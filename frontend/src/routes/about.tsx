import { createFileRoute } from '@tanstack/react-router'
import { imageCatalog } from '../data/site'
import { Eyebrow, PageHeading, PageShell } from '../components/site'

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: 'About the Studio — Zettos Interior Units' },
      {
        name: 'description',
        content:
          'Discover the Zettos design philosophy: thoughtful interiors and considered building, shaped around people and place.',
      },
    ],
  }),
  component: AboutPage,
})

function AboutPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="The studio"
        title={
          <>
            Thoughtful by nature.
            <br />
            <em>Intentional by design.</em>
          </>
        }
        description="Zettos Interior Units is a Lagos design-and-build studio bringing interior thinking and building ideas together around the people who use them."
      />
      <section className="about-feature section-wrap">
        <div className="about-feature__image">
          <img
            src={imageCatalog.gatheredLight}
            alt="Warm modern interior with filtered daylight and natural finishes"
          />
          <span className="image-caption">
            The feeling of a space matters as much as its form.
          </span>
        </div>
        <div className="about-feature__copy">
          <Eyebrow>Our philosophy</Eyebrow>
          <h2>Beauty is only the beginning.</h2>
          <p>
            A well-designed space is more than a beautiful image. It should
            support the way people move, gather, rest and work. We look for the
            balance between atmosphere and everyday function, between a strong
            idea and the details that make it work.
          </p>
          <p>
            Our ambition is simple: listen carefully, think clearly and help
            shape places that feel considered from the first impression to the
            smallest finishing touch.
          </p>
        </div>
      </section>
      <section className="values-section section-wrap section-wrap--sand">
        <div className="section-heading">
          <div>
            <Eyebrow>What guides us</Eyebrow>
            <h2>
              Good work is built
              <br />
              <em>on good principles.</em>
            </h2>
          </div>
          <p>
            These are the values we bring to every conversation and every brief.
          </p>
        </div>
        <div className="values-grid">
          {[
            [
              '01',
              'Listen first',
              'Understanding the people and purpose behind a project is where thoughtful decisions begin.',
            ],
            [
              '02',
              'Make it matter',
              'We favour considered choices that bring clarity, usefulness and character to a space.',
            ],
            [
              '03',
              'Care for detail',
              'Materials, proportions, light and finish all have a part to play in the whole.',
            ],
            [
              '04',
              'Work with integrity',
              'Clear expectations and the right professional expertise belong in every project.',
            ],
          ].map(([number, title, copy]) => (
            <article className="value-card" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="about-leadership section-wrap">
        <div className="about-leadership__portrait">
          <img
            src="/images/ceo_img.JPG"
            alt="Chief Executive Officer of Zettos Interior Units"
            loading="lazy"
          />
        </div>
        <div className="about-leadership__copy">
          <Eyebrow>Leadership</Eyebrow>
          <h2>
            A personal approach.
            <br />
            <em>Built on experience.</em>
          </h2>
          <p>
            Zettos Interior Units is led by Nnadi Israel Chibuzo, its Chief
            Executive Officer. Over the past five years, the company has built
            experience across projects for government and major firms.
          </p>
          <p className="scope-note">
            A fuller biography can be added once approved for publication.
          </p>
        </div>
      </section>
      <section className="about-team section-wrap">
        <Eyebrow>People make places</Eyebrow>
        <h2>
          A collaborative spirit.
          <br />
          <em>A personal approach.</em>
        </h2>
        <p>
          The Zettos team and project partners are being introduced soon. The
          right design, construction and technical professionals are brought
          into each project according to its scope and requirements.
        </p>
        <a className="text-link" href="/contact">
          Start a conversation <span aria-hidden="true">↗</span>
        </a>
      </section>
      <section className="short-cta">
        <Eyebrow light>Spaces that inspire. Structures that last.</Eyebrow>
        <h2>
          Let’s talk about
          <br />
          <em>what you’re imagining.</em>
        </h2>
        <a className="button button--cream" href="/contact">
          Start a project <span aria-hidden="true">↗</span>
        </a>
      </section>
    </PageShell>
  )
}
