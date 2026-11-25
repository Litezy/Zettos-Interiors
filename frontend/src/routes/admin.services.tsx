import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AdminShell } from '../components/admin'
import { apiRequest } from '../lib/api'

export const Route = createFileRoute('/admin/services')({
  component: AdminServicesPage,
})

type AdminService = {
  id: string
  name: string
  slug: string
  short: string
  description: string
  offerings: string[]
  process: string[]
  isPublished: boolean
  sortOrder: number
  images: Array<{ url: string; alt: string; sortOrder: number }>
}

const emptyService = {
  name: '',
  slug: '',
  short: '',
  description: '',
  offerings: '',
  process: '',
  isPublished: false,
  sortOrder: '0',
  imageUrl: '',
  imageAlt: '',
}

const lines = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function AdminServicesPage() {
  const [services, setServices] = useState<AdminService[]>([])
  const [form, setForm] = useState(emptyService)
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadServices() {
    setLoading(true)
    setError('')
    try {
      setServices(await apiRequest<AdminService[]>('/api/admin/services'))
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not load services.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadServices()
  }, [])

  function editService(service: AdminService) {
    setSelectedId(service.id)
    setForm({
      name: service.name,
      slug: service.slug,
      short: service.short,
      description: service.description,
      offerings: service.offerings.join('\n'),
      process: service.process.join('\n'),
      isPublished: service.isPublished,
      sortOrder: String(service.sortOrder),
      imageUrl: service.images[0]?.url ?? '',
      imageAlt: service.images[0]?.alt ?? service.name,
    })
    setNotice('')
  }

  function startNew() {
    setSelectedId('')
    setForm(emptyService)
    setNotice('')
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const payload = {
      name: form.name,
      slug: form.slug,
      short: form.short,
      description: form.description,
      offerings: lines(form.offerings),
      process: lines(form.process),
      isPublished: form.isPublished,
      sortOrder: Number(form.sortOrder),
      images: form.imageUrl
        ? [{ url: form.imageUrl, alt: form.imageAlt, sortOrder: 0 }]
        : [],
    }

    try {
      await apiRequest<AdminService>(
        selectedId
          ? `/api/admin/services/${selectedId}`
          : '/api/admin/services',
        {
          method: selectedId ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        },
      )
      setNotice(selectedId ? 'Service updated.' : 'Service created.')
      startNew()
      await loadServices()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save this service.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove(service: AdminService) {
    if (!window.confirm(`Delete "${service.name}"? This cannot be undone.`)) {
      return
    }
    setError('')
    try {
      await apiRequest<null>(`/api/admin/services/${service.id}`, {
        method: 'DELETE',
      })
      if (selectedId === service.id) startNew()
      setNotice('Service deleted.')
      await loadServices()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not delete the service.',
      )
    }
  }

  function update<TField extends keyof typeof emptyService>(
    key: TField,
    value: (typeof emptyService)[TField],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <AdminShell title="Services">
      <div className="admin-page-heading">
        <p>Keep service descriptions and published offerings current.</p>
        <button className="button button--dark" type="button" onClick={startNew}>
          Add service
        </button>
      </div>
      {error && <p className="admin-alert">{error}</p>}
      {notice && <p className="admin-success">{notice}</p>}
      <div className="admin-editor-layout">
        <section className="admin-panel">
          <div className="admin-panel__heading">
            <div>
              <span className="eyebrow">{selectedId ? 'Edit entry' : 'New entry'}</span>
              <h2>{selectedId ? form.name : 'Service details'}</h2>
            </div>
          </div>
          <form className="admin-form" onSubmit={save}>
            <label>
              <span>Service name</span>
              <input
                required
                minLength={2}
                maxLength={160}
                value={form.name}
                onChange={(event) => {
                  const name = event.currentTarget.value
                  setForm((current) => ({
                    ...current,
                    name,
                    slug: selectedId ? current.slug : makeSlug(name),
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
            <label className="admin-form__full">
              <span>Short introduction</span>
              <input
                required
                minLength={5}
                maxLength={300}
                value={form.short}
                onChange={(event) => update('short', event.currentTarget.value)}
              />
            </label>
            <label className="admin-form__full">
              <span>Full description</span>
              <textarea
                required
                minLength={10}
                maxLength={8000}
                rows={5}
                value={form.description}
                onChange={(event) =>
                  update('description', event.currentTarget.value)
                }
              />
            </label>
            <label>
              <span>Offerings (one per line)</span>
              <textarea
                required
                rows={5}
                value={form.offerings}
                onChange={(event) =>
                  update('offerings', event.currentTarget.value)
                }
              />
            </label>
            <label>
              <span>Process steps (one per line)</span>
              <textarea
                required
                rows={5}
                value={form.process}
                onChange={(event) => update('process', event.currentTarget.value)}
              />
            </label>
            <label className="admin-form__full">
              <span>Image URL</span>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(event) => update('imageUrl', event.currentTarget.value)}
                placeholder="https://… or /images/…"
              />
            </label>
            {form.imageUrl && (
              <label className="admin-form__full">
                <span>Image description (alt text)</span>
                <input
                  required
                  minLength={3}
                  maxLength={300}
                  value={form.imageAlt}
                  onChange={(event) =>
                    update('imageAlt', event.currentTarget.value)
                  }
                />
              </label>
            )}
            <label>
              <span>Display order</span>
              <input
                type="number"
                min={0}
                max={1000}
                value={form.sortOrder}
                onChange={(event) => update('sortOrder', event.currentTarget.value)}
              />
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
              <button className="button button--dark" type="submit" disabled={saving}>
                {saving ? 'Saving…' : selectedId ? 'Save changes' : 'Create service'}
              </button>
              {selectedId && (
                <button
                  className="admin-button-secondary"
                  type="button"
                  onClick={startNew}
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
              <span className="eyebrow">Content</span>
              <h2>All services</h2>
            </div>
            <span className="admin-count">{services.length}</span>
          </div>
          {loading ? (
            <p className="admin-notice">Loading services…</p>
          ) : services.length ? (
            <ul className="admin-project-list">
              {services.map((service) => (
                <li key={service.id}>
                  <button
                    className="admin-list-item"
                    type="button"
                    onClick={() => editService(service)}
                  >
                    <span>{service.name}</span>
                    <small>{service.isPublished ? 'published' : 'draft'}</small>
                  </button>
                  <button
                    className="admin-delete"
                    type="button"
                    aria-label={`Delete ${service.name}`}
                    onClick={() => void remove(service)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-notice">No services yet. Add the first entry.</p>
          )}
        </section>
      </div>
    </AdminShell>
  )
}
