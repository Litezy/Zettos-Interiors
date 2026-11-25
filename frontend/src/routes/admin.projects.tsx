import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  AdminShell,
} from '../components/admin'
import type { AdminCategory, AdminProject } from '../components/admin'
import { apiRequest } from '../lib/api'

export const Route = createFileRoute('/admin/projects')({
  component: AdminProjectsPage,
})

const initialForm = {
  title: '',
  slug: '',
  categorySlug: '',
  status: 'CONCEPT' as AdminProject['status'],
  isConcept: true,
  isPublished: false,
  location: '',
  description: '',
  scope: '',
  highlights: '',
  projectYear: '',
  coverImageUrl: '',
  gallery: '',
}

const splitLines = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [form, setForm] = useState(initialForm)
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [projectData, categoryData] = await Promise.all([
        apiRequest<AdminProject[]>('/api/admin/projects?pageSize=100'),
        apiRequest<AdminCategory[]>('/api/admin/project-categories'),
      ])
      setProjects(projectData)
      setCategories(categoryData)
      if (!form.categorySlug && categoryData[0]) {
        setForm((current) => ({ ...current, categorySlug: categoryData[0].slug }))
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not load projects.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function editProject(project: AdminProject) {
    setSelectedId(project.id)
    setForm({
      title: project.title,
      slug: project.slug,
      categorySlug: project.category.slug,
      status: project.status,
      isConcept: project.isConcept,
      isPublished: project.isPublished,
      location: project.location ?? '',
      description: project.description,
      scope: project.scope.join('\n'),
      highlights: project.highlights.join('\n'),
      projectYear: project.projectYear ? String(project.projectYear) : '',
      coverImageUrl: project.coverImageUrl ?? '',
      gallery: project.images.map((image) => image.url).join('\n'),
    })
    setNotice('')
  }

  function startNewProject() {
    setSelectedId('')
    setForm({
      ...initialForm,
      categorySlug: categories[0]?.slug ?? '',
    })
    setNotice('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    const galleryUrls = splitLines(form.gallery)
    const urls = form.coverImageUrl
      ? [form.coverImageUrl, ...galleryUrls]
      : galleryUrls
    const images = [...new Set(urls)].map((url, sortOrder) => ({
      url,
      alt: form.title,
      role: 'GALLERY' as const,
      sortOrder,
    }))
    const payload = {
      title: form.title,
      slug: form.slug,
      categorySlug: form.categorySlug,
      status: form.status,
      isConcept: form.status === 'CONCEPT' || form.isConcept,
      isPublished: form.isPublished,
      location: form.location,
      description: form.description,
      scope: splitLines(form.scope),
      highlights: splitLines(form.highlights),
      ...(form.projectYear ? { projectYear: Number(form.projectYear) } : {}),
      coverImageUrl: form.coverImageUrl,
      images,
    }

    try {
      await apiRequest<AdminProject>(
        selectedId
          ? `/api/admin/projects/${selectedId}`
          : '/api/admin/projects',
        {
          method: selectedId ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        },
      )
      setNotice(selectedId ? 'Project updated.' : 'Project created.')
      startNewProject()
      await loadData()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save this project.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteProject(project: AdminProject) {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
      return
    }
    setError('')
    try {
      await apiRequest<null>(`/api/admin/projects/${project.id}`, {
        method: 'DELETE',
      })
      if (selectedId === project.id) startNewProject()
      setNotice('Project deleted.')
      await loadData()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not delete this project.',
      )
    }
  }

  function update<TField extends keyof typeof initialForm>(
    key: TField,
    value: (typeof initialForm)[TField],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <AdminShell title="Projects">
      <div className="admin-page-heading">
        <p>Manage project descriptions, status, categories and public visibility.</p>
        <button className="button button--dark" type="button" onClick={startNewProject}>
          Add project
        </button>
      </div>
      {error && <p className="admin-alert">{error}</p>}
      {notice && <p className="admin-success">{notice}</p>}
      <div className="admin-editor-layout">
        <section className="admin-panel">
          <div className="admin-panel__heading">
            <div>
              <span className="eyebrow">{selectedId ? 'Edit entry' : 'New entry'}</span>
              <h2>{selectedId ? form.title : 'Project details'}</h2>
            </div>
          </div>
          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              <span>Project title</span>
              <input
                required
                minLength={2}
                maxLength={160}
                value={form.title}
                onChange={(event) => {
                  const title = event.currentTarget.value
                  setForm((current) => ({
                    ...current,
                    title,
                    slug: selectedId ? current.slug : slugify(title),
                  }))
                }}
              />
            </label>
            <label>
              <span>URL slug</span>
              <input
                required
                minLength={2}
                maxLength={180}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={form.slug}
                onChange={(event) => update('slug', event.currentTarget.value)}
              />
            </label>
            <label>
              <span>Category</span>
              <select
                required
                value={form.categorySlug}
                onChange={(event) =>
                  update('categorySlug', event.currentTarget.value)
                }
              >
                {categories.map((category) => (
                  <option value={category.slug} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Project status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  update('status', event.currentTarget.value as AdminProject['status'])
                }
              >
                <option value="CONCEPT">Concept</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>
            <label>
              <span>Location or note</span>
              <input
                maxLength={180}
                value={form.location}
                onChange={(event) => update('location', event.currentTarget.value)}
              />
            </label>
            <label>
              <span>Project year (optional)</span>
              <input
                type="number"
                min={1900}
                max={2200}
                value={form.projectYear}
                onChange={(event) =>
                  update('projectYear', event.currentTarget.value)
                }
              />
            </label>
            <label className="admin-form__full">
              <span>Description</span>
              <textarea
                required
                minLength={10}
                maxLength={8000}
                rows={4}
                value={form.description}
                onChange={(event) =>
                  update('description', event.currentTarget.value)
                }
              />
            </label>
            <label>
              <span>Scope (one item per line)</span>
              <textarea
                required
                rows={4}
                value={form.scope}
                onChange={(event) => update('scope', event.currentTarget.value)}
              />
            </label>
            <label>
              <span>Highlights (one per line)</span>
              <textarea
                rows={4}
                value={form.highlights}
                onChange={(event) =>
                  update('highlights', event.currentTarget.value)
                }
              />
            </label>
            <label className="admin-form__full">
              <span>Cover image URL</span>
              <input
                type="text"
                value={form.coverImageUrl}
                onChange={(event) =>
                  update('coverImageUrl', event.currentTarget.value)
                }
                placeholder="https://… or /images/…"
              />
            </label>
            <label className="admin-form__full">
              <span>Additional gallery image URLs (one per line)</span>
              <textarea
                rows={3}
                value={form.gallery}
                onChange={(event) => update('gallery', event.currentTarget.value)}
              />
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.isConcept}
                onChange={(event) => update('isConcept', event.currentTarget.checked)}
              />
              <span>Mark as illustrative concept</span>
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) =>
                  update('isPublished', event.currentTarget.checked)
                }
              />
              <span>Visible on the public website</span>
            </label>
            <div className="admin-form__actions admin-form__full">
              <button
                className="button button--dark"
                type="submit"
                disabled={saving || !categories.length}
              >
                {saving ? 'Saving…' : selectedId ? 'Save changes' : 'Create project'}
              </button>
              {selectedId && (
                <button
                  className="admin-button-secondary"
                  type="button"
                  onClick={startNewProject}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>
        <section className="admin-panel">
          <div className="admin-panel__heading">
            <div>
              <span className="eyebrow">Portfolio</span>
              <h2>All projects</h2>
            </div>
            <span className="admin-count">{projects.length}</span>
          </div>
          {loading ? (
            <p className="admin-notice">Loading projects…</p>
          ) : projects.length ? (
            <ul className="admin-project-list">
              {projects.map((project) => (
                <li key={project.id}>
                  <button
                    className="admin-list-item"
                    type="button"
                    onClick={() => editProject(project)}
                  >
                    <span>{project.title}</span>
                    <small>
                      {project.status.toLowerCase()} ·{' '}
                      {project.isPublished ? 'published' : 'draft'}
                    </small>
                  </button>
                  <button
                    className="admin-delete"
                    type="button"
                    aria-label={`Delete ${project.title}`}
                    onClick={() => void deleteProject(project)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-notice">No projects yet. Add the first entry.</p>
          )}
        </section>
      </div>
    </AdminShell>
  )
}
