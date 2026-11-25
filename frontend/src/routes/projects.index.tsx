import { createFileRoute } from '@tanstack/react-router'
import { projects as localProjects } from '../data/site'
import {
  Eyebrow,
  PageHeading,
  PageShell,
  ProjectExplorer,
  PublicDataError,
} from '../components/site'
import { apiRequest, isApiConfigured } from '../lib/api'
import { mapPublicProject } from '../lib/content'
import type { PublicProject } from '../lib/content'

export const Route = createFileRoute('/projects/')({
  loader: async () => {
    if (!isApiConfigured()) return { projects: localProjects }

    const items = await apiRequest<PublicProject[]>(
      '/api/public/projects?pageSize=100',
    )
    return { projects: items.map(mapPublicProject) }
  },
  errorComponent: PublicDataError,
  head: () => ({
    meta: [
      { title: 'Project Concepts — Zettos Interior Units' },
      {
        name: 'description',
        content:
          'Explore concept visualisations for considered interiors and architectural spaces by Zettos Interior Units.',
      },
    ],
  }),
  component: ProjectsPage,
})

function ProjectsPage() {
  const { projects } = Route.useLoaderData()
  return (
    <PageShell>
      <PageHeading
        eyebrow="A collection of ideas"
        title={
          <>
            Spaces, shaped
            <br />
            <em>with intention.</em>
          </>
        }
        description="A visual exploration of materials, atmosphere and the possibilities of a well-considered space."
      />
      <section className="projects-page section-wrap">
        <div className="projects-page__intro">
          <Eyebrow>Selected work & concepts</Eyebrow>
          <p>
            Explore concept visualisations, current site-progress photographs
            and completed work shared by Zettos. Each project is identified by
            its current status.
          </p>
        </div>
        <ProjectExplorer items={projects} />
      </section>
    </PageShell>
  )
}
