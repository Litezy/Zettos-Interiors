import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Eyebrow,
  PageShell,
  ProjectCard,
  PublicDataError,
} from '../components/site'
import { projects as localProjects } from '../data/site'
import { apiRequest, isApiConfigured } from '../lib/api'
import { mapPublicProject } from '../lib/content'
import type { PublicProject } from '../lib/content'

export const Route = createFileRoute('/projects/$projectId')({
  head: ({ params }) => {
    return {
      meta: [
        {
          title: `${params.projectId.replace(/-/g, ' ')} — Zettos Interior Units`,
        },
        {
          name: 'description',
          content: 'Explore a project by Zettos Interior Units.',
        },
      ],
    }
  },
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const [project, setProject] = useState<ReturnType<typeof mapPublicProject> | null>(
    null,
  )
  const [projects, setProjects] = useState<
    ReturnType<typeof mapPublicProject>[]
  >([])
  const [error, setError] = useState<Error | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setProject(null)
    setError(null)
    if (!isApiConfigured()) {
      const localProject = localProjects.find((item) => item.id === projectId)
      setProjects(localProjects)
      if (localProject) setProject(localProject)
      else setError(new Error('Project not found.'))
      return () => {
        active = false
      }
    }

    Promise.all([
      apiRequest<PublicProject>(
        `/api/public/projects/${encodeURIComponent(projectId)}`,
      ),
      apiRequest<PublicProject[]>('/api/public/projects?pageSize=100'),
    ])
      .then(([item, collection]) => {
        if (active) {
          setProject(mapPublicProject(item))
          setProjects(collection.map(mapPublicProject))
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause
              : new Error('Could not load this project.'),
          )
        }
      })
    return () => {
      active = false
    }
  }, [projectId, retry])

  if (error) {
    return (
      <PublicDataError error={error} reset={() => setRetry((count) => count + 1)} />
    )
  }
  if (!project) {
    return (
      <PageShell>
        <section className="not-found">
          <Eyebrow>Project</Eyebrow>
          <h1>Loading project details…</h1>
        </section>
      </PageShell>
    )
  }

  const related = projects
    .filter((item) => item.id !== project.id && item.type === project.type)
    .concat(projects.filter((item) => item.type !== project.type))
    .slice(0, 2)
  const isConcept = project.status === 'CONCEPT'

  return (
    <PageShell>
      <section className="project-detail">
        <div className="project-detail__image">
          <img src={project.image} alt={project.alt} />
          <span
            className={`concept-chip ${project.status === 'ONGOING' ? 'concept-chip--ongoing' : ''}`}
          >
            {isConcept
              ? 'Concept visualisation'
              : project.status === 'ONGOING'
                ? 'Ongoing · site progress'
                : 'Completed project'}
          </span>
        </div>
        <div className="project-detail__content">
          <Eyebrow>
            {project.type} ·{' '}
            {isConcept
              ? 'Concept study'
              : project.status === 'ONGOING'
                ? 'Ongoing'
                : 'Completed'}
          </Eyebrow>
          <h1>{project.title}</h1>
          <p className="project-detail__location">{project.location}</p>
          <p>{project.description}</p>
          <div className="project-detail__scope">
            <span className="eyebrow">Areas explored</span>
            {project.scope.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <p className="project-detail__disclaimer">
            {isConcept
              ? 'This is an illustrative concept visualisation. It is not a record of a completed Zettos project, client or location.'
              : project.status === 'ONGOING'
                ? 'This is a current site-progress image supplied by Zettos. Project name, client and location details are not yet confirmed for publication.'
                : 'This project is marked as completed. Contact Zettos for further project details.'}
          </p>
          <a className="text-link" href="/contact">
            Discuss an idea of your own <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
      {isConcept && (
        <section className="concept-gallery section-wrap">
          <div className="section-heading">
            <div>
              <Eyebrow>Material & atmosphere</Eyebrow>
              <h2>
                A direction,
                <br />
                <em>in visual notes.</em>
              </h2>
            </div>
            <p>
              These additional editorial images are visual references for
              materials and mood; they are not photographs of this concept or a
              completed Zettos project.
            </p>
          </div>
          <div className="concept-gallery__grid">
            {project.gallery.map((image, index) => (
              <img
                key={image}
                src={image}
                alt={`${project.type} concept visual reference ${index + 1}`}
                loading="lazy"
              />
            ))}
          </div>
        </section>
      )}
      <section className="related-projects section-wrap section-wrap--sand">
        <div className="section-heading">
          <div>
            <Eyebrow>Keep exploring</Eyebrow>
            <h2>
              More ideas,
              <br />
              <em>more possibilities.</em>
            </h2>
          </div>
          <a className="text-link" href="/projects">
            All projects <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="project-grid">
          {related.map((item) => (
            <ProjectCard key={item.id} project={item} />
          ))}
        </div>
      </section>
    </PageShell>
  )
}
