import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AdminShell } from '../components/admin'
import { SiteIcon } from '../components/icons'
import { apiRequest, downloadApiFile } from '../lib/api'

export const Route = createFileRoute('/admin/enquiries')({
  component: AdminEnquiriesPage,
})

const enquiryStatuses = [
  'NEW',
  'CONTACTED',
  'CONSULTATION_SCHEDULED',
  'QUOTATION_SENT',
  'IN_NEGOTIATION',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
] as const

type EnquiryStatus = (typeof enquiryStatuses)[number]

type EnquiryListItem = {
  id: string
  reference: string
  fullName: string
  email: string
  projectType: string
  status: EnquiryStatus
  createdAt: string
  _count: { attachments: number; notes: number }
}

type EnquiryDetail = EnquiryListItem & {
  phone: string | null
  location: string | null
  preferredContact: string
  propertyType: string
  description: string
  budget: string | null
  preferredStartDate: string | null
  projectSize: string | null
  roomCount: number | null
  attachments: Array<{
    id: string
    fileName: string
    contentType: string
    sizeBytes: number
  }>
  notes: Array<{
    id: string
    body: string
    createdAt: string
    admin: { fullName: string }
  }>
  activities: Array<{
    id: string
    type: string
    body: string
    createdAt: string
    actor: { fullName: string } | null
  }>
}

function AdminEnquiriesPage() {
  const [items, setItems] = useState<EnquiryListItem[]>([])
  const [selected, setSelected] = useState<EnquiryDetail | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadList() {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    if (search.trim()) params.set('q', search.trim())
    try {
      const data = await apiRequest<EnquiryListItem[]>(
        `/api/admin/enquiries?${params.toString()}`,
      )
      setItems(data)
      if (selected && !data.some((item) => item.id === selected.id)) {
        setSelected(null)
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not load enquiries.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadDetail(id: string) {
    setError('')
    try {
      const result = await apiRequest<EnquiryDetail>(`/api/admin/enquiries/${id}`)
      setSelected(result)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not load this enquiry.',
      )
    }
  }

  useEffect(() => {
    void loadList()
  }, [statusFilter])

  async function updateStatus(status: EnquiryStatus) {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      await apiRequest(`/api/admin/enquiries/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setNotice('Enquiry status updated.')
      await Promise.all([loadDetail(selected.id), loadList()])
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not update status.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      await apiRequest(`/api/admin/enquiries/${selected.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body: note }),
      })
      setNote('')
      setNotice('Internal note added.')
      await loadDetail(selected.id)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not add the note.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function downloadAttachment(attachmentId: string, fileName: string) {
    if (!selected) return
    setError('')
    try {
      const result = await apiRequest<{ downloadUrl: string }>(
        `/api/admin/enquiries/${selected.id}/attachments/${attachmentId}`,
      )
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer')
      setNotice(`Opening ${fileName}.`)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not open this attachment.',
      )
    }
  }

  async function exportCsv() {
    setError('')
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (search.trim()) params.set('q', search.trim())
    try {
      await downloadApiFile(
        `/api/admin/enquiries/export.csv?${params.toString()}`,
        'zettos-enquiries.csv',
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not export enquiries.',
      )
    }
  }

  return (
    <AdminShell title="Enquiries">
      <div className="admin-page-heading">
        <p>Review incoming briefs, follow up and keep a clear project history.</p>
        <button className="admin-button-secondary" type="button" onClick={() => void exportCsv()}>
          Export CSV
        </button>
      </div>
      {error && <p className="admin-alert">{error}</p>}
      {notice && <p className="admin-success">{notice}</p>}
      <div className="admin-enquiry-layout">
        <section className="admin-panel admin-enquiry-list">
          <div className="admin-filter-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void loadList()
              }}
              placeholder="Search name, email or reference"
              aria-label="Search enquiries"
            />
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.currentTarget.value)}
            >
              <option value="">All statuses</option>
              {enquiryStatuses.map((status) => (
                <option value={status} key={status}>
                  {status.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
            <button
              className="admin-button-secondary"
              type="button"
              onClick={() => void loadList()}
            >
              Search
            </button>
          </div>
          {loading ? (
            <p className="admin-notice">Loading enquiries…</p>
          ) : items.length ? (
            <ul className="admin-project-list">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    className={`admin-list-item ${selected?.id === item.id ? 'admin-list-item--active' : ''}`}
                    type="button"
                    onClick={() => void loadDetail(item.id)}
                  >
                    <span>{item.fullName}</span>
                    <small>
                      {item.reference} · {item.status.replaceAll('_', ' ')}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-notice">No enquiries match this filter.</p>
          )}
        </section>
        <section className="admin-panel admin-enquiry-detail">
          {selected ? (
            <>
              <div className="admin-panel__heading">
                <div>
                  <span className="eyebrow">{selected.reference}</span>
                  <h2>{selected.fullName}</h2>
                </div>
                <select
                  aria-label="Enquiry status"
                  value={selected.status}
                  disabled={saving}
                  onChange={(event) =>
                    void updateStatus(event.currentTarget.value as EnquiryStatus)
                  }
                >
                  {enquiryStatuses.map((status) => (
                    <option value={status} key={status}>
                      {status.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <dl className="admin-detail-grid">
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${selected.email}`}>{selected.email}</a>
                  </dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{selected.phone || 'Not provided'}</dd>
                </div>
                <div>
                  <dt>Project type</dt>
                  <dd>{selected.projectType.replaceAll('_', ' ')}</dd>
                </div>
                <div>
                  <dt>Property type</dt>
                  <dd>{selected.propertyType.replaceAll('_', ' ')}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{selected.location || 'Not provided'}</dd>
                </div>
                <div>
                  <dt>Preferred contact</dt>
                  <dd>{selected.preferredContact}</dd>
                </div>
                <div>
                  <dt>Budget</dt>
                  <dd>{selected.budget || 'Not provided'}</dd>
                </div>
                <div>
                  <dt>Preferred start</dt>
                  <dd>
                    {selected.preferredStartDate
                      ? new Date(selected.preferredStartDate).toLocaleDateString()
                      : 'Not provided'}
                  </dd>
                </div>
              </dl>
              <div className="admin-enquiry-brief">
                <span className="eyebrow">Project brief</span>
                <p>{selected.description}</p>
              </div>
              {selected.attachments.length > 0 && (
                <div className="admin-enquiry-brief">
                  <span className="eyebrow">Attachments</span>
                  <ul className="admin-attachment-list">
                    {selected.attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <button
                          className="text-link"
                          type="button"
                          onClick={() =>
                            void downloadAttachment(
                              attachment.id,
                              attachment.fileName,
                            )
                          }
                        >
                          {attachment.fileName}{' '}
                          <SiteIcon name="arrow-up-right" />
                        </button>
                        <small>
                          {Math.ceil(attachment.sizeBytes / 1024)} KB ·{' '}
                          {attachment.contentType}
                        </small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <form className="admin-note-form" onSubmit={addNote}>
                <label>
                  <span>Internal note</span>
                  <textarea
                    required
                    minLength={2}
                    maxLength={4000}
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.currentTarget.value)}
                  />
                </label>
                <button className="admin-button-secondary" type="submit" disabled={saving}>
                  Add note
                </button>
              </form>
              <div className="admin-enquiry-brief">
                <span className="eyebrow">Notes & activity</span>
                <ul className="admin-project-list">
                  {[...selected.notes, ...selected.activities]
                    .sort(
                      (left, right) =>
                        new Date(right.createdAt).getTime() -
                        new Date(left.createdAt).getTime(),
                    )
                    .map((entry) => (
                      <li key={entry.id}>
                        <span>{entry.body}</span>
                        <small>
                          {'admin' in entry
                            ? entry.admin.fullName
                            : entry.actor?.fullName ?? 'Activity'}{' '}
                          · {new Date(entry.createdAt).toLocaleString()}
                        </small>
                      </li>
                    ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="admin-notice">
              Select an enquiry to review its brief and add internal notes.
            </p>
          )}
        </section>
      </div>
    </AdminShell>
  )
}
