import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AdminShell } from '../components/admin'
import type { AdminProject } from '../components/admin'
import { apiRequest } from '../lib/api'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
})

type DashboardData = {
  counts: Record<string, number>
  recentEnquiries: Array<{
    id: string
    reference: string
    fullName: string
    projectType: string
    status: string
    createdAt: string
  }>
  recentActivity: Array<{
    id: string
    action: string
    entityType: string
    createdAt: string
    admin: { fullName: string } | null
  }>
}

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      apiRequest<DashboardData>('/api/admin/dashboard'),
      apiRequest<AdminProject[]>('/api/admin/projects?pageSize=100'),
    ])
      .then(([data, projectData]) => {
        if (active) {
          setDashboard(data)
          setProjects(projectData)
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Could not load dashboard data.',
          )
        }
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <AdminShell title="Overview">
      {error && <p className="admin-alert">{error}</p>}
      {!dashboard && !error ? (
        <p className="admin-notice">Loading your workspace…</p>
      ) : dashboard ? (
        <>
          <section className="admin-stats" aria-label="Website overview">
            {[
              ['New enquiries', dashboard.counts.newEnquiries],
              ['Active enquiries', dashboard.counts.activeEnquiries],
              ['Published projects', dashboard.counts.publishedProjects],
              ['Ongoing projects', dashboard.counts.ongoingProjects],
            ].map(([label, value]) => (
              <article className="admin-stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </section>
          <div className="admin-dashboard-grid">
            <section className="admin-panel">
              <div className="admin-panel__heading">
                <div>
                  <span className="eyebrow">Inbox</span>
                  <h2>Recent enquiries</h2>
                </div>
                <a className="text-link" href="/admin/enquiries">
                  View all ↗
                </a>
              </div>
              {dashboard.recentEnquiries.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Contact</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentEnquiries.map((item) => (
                        <tr key={item.id}>
                          <td>{item.reference}</td>
                          <td>{item.fullName}</td>
                          <td>{item.status.replaceAll('_', ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="admin-notice">No enquiries have arrived yet.</p>
              )}
            </section>
            <section className="admin-panel">
              <div className="admin-panel__heading">
                <div>
                  <span className="eyebrow">Portfolio</span>
                  <h2>Recently updated</h2>
                </div>
                <a className="text-link" href="/admin/projects">
                  Manage ↗
                </a>
              </div>
              <ul className="admin-project-list">
                {projects.slice(0, 6).map((project) => (
                  <li key={project.id}>
                    <span>{project.title}</span>
                    <small>
                      {project.status.toLowerCase()} ·{' '}
                      {project.isPublished ? 'published' : 'draft'}
                    </small>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <section className="admin-panel admin-activity">
            <div className="admin-panel__heading">
              <div>
                <span className="eyebrow">Team activity</span>
                <h2>Latest updates</h2>
              </div>
            </div>
            {dashboard.recentActivity.length ? (
              <ul className="admin-project-list">
                {dashboard.recentActivity.map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.admin?.fullName ?? 'Team member'} ·{' '}
                      {item.action.replaceAll('_', ' ').toLowerCase()}
                    </span>
                    <small>{new Date(item.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-notice">No recent activity.</p>
            )}
          </section>
        </>
      ) : null}
    </AdminShell>
  )
}
