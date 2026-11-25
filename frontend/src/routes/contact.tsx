import { createFileRoute } from '@tanstack/react-router'
import {
  Eyebrow,
  EnquiryForm,
  PageHeading,
  PageShell,
} from '../components/site'

export const Route = createFileRoute('/contact')({
  head: () => ({
    meta: [
      { title: 'Start a Project — Zettos Interior Units' },
      {
        name: 'description',
        content:
          'Tell Zettos Interior Units about your interior design, building or renovation project in Lagos.',
      },
    ],
  }),
  component: ContactPage,
})

function ContactPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Start a conversation"
        title={
          <>
            What are you
            <br />
            <em>dreaming up?</em>
          </>
        }
        description="A new home, a more thoughtful workspace or a room ready for a fresh start — tell us a little about it."
      />
      <section className="contact-information section-wrap section-wrap--sand">
        <div>
          <Eyebrow>Based in Lagos</Eyebrow>
          <h2>
            Let’s find the
            <br />
            <em>right way forward.</em>
          </h2>
        </div>
        <div className="contact-information__details">
          <p>
            Zettos Interior Units is based in Lagos, Nigeria. Share your brief
            using the form and we’ll be ready to discuss the next steps once the
            business contact channel is connected.
          </p>
          <div className="contact-detail">
            <span className="eyebrow">Email</span>
            {import.meta.env.VITE_CONTACT_EMAIL ? (
              <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`}>
                {import.meta.env.VITE_CONTACT_EMAIL}
              </a>
            ) : (
              <span>To be confirmed</span>
            )}
          </div>
          <div className="contact-detail">
            <span className="eyebrow">WhatsApp</span>
            {import.meta.env.VITE_WHATSAPP_NUMBER ? (
              <a
                href={`https://wa.me/${String(import.meta.env.VITE_WHATSAPP_NUMBER).replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                Message the studio ↗
              </a>
            ) : (
              <span>To be confirmed</span>
            )}
          </div>
          <div className="contact-detail">
            <span className="eyebrow">Location</span>
            <span>Lagos, Nigeria</span>
          </div>
        </div>
      </section>
      <section className="contact-form-section">
        <EnquiryForm />
      </section>
      <section className="contact-footnote">
        <Eyebrow>Project note</Eyebrow>
        <p>
          Only share project references you are comfortable sending. Please do
          not include confidential documents or sensitive personal information.
          Attachments are limited to five image or PDF files.
        </p>
      </section>
    </PageShell>
  )
}
