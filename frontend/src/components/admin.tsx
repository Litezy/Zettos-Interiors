import { useEffect, useState } from 'react'
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react'
import { SiteIcon } from './icons'
import { apiRequest } from '../lib/api'

export type AdminUser = {
  id: string
  fullName: string
  email: string
  role: 'SUPER_ADMIN' | 'CONTENT_MANAGER'
}

export type AdminProject = {
  id: string
  title: string
  slug: string
  status: 'CONCEPT' | 'ONGOING' | 'COMPLETED'
  isConcept: boolean
  isPublished: boolean
  location: string | null
  description: string
  scope: string[]
  highlights: string[]
  projectYear: number | null
  coverImageUrl: string | null
  category: { name: string; slug: string }
  images: Array<{
    id?: string
    url: string
    alt: string
    role?: 'GALLERY' | 'BEFORE' | 'AFTER'
    sortOrder: number
  }>
}

export type AdminCategory = {
  id: string
  name: string
  slug: string
  sortOrder: number
  _count?: { projects: number }
}

export function PasswordField({
  label,
  ...inputProps
}: { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="admin-password-field">
      <span>{label}</span>
      <span className="admin-password-field__control">
        <input {...inputProps} type={visible ? 'text' : 'password'} />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
              <path d="M9.9 5.2A11 11 0 0112 5c6.5 0 10 7 10 7a16 16 0 01-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7a10.7 10.7 0 004.1-.8" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </span>
    </label>
  )
}

export function AdminShell({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [authError, setAuthError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let active = true
    apiRequest<{ user: AdminUser }>('/api/auth/me')
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser)
      })
      .catch((error: unknown) => {
        if (active) {
          setAuthError(
            error instanceof Error ? error.message : 'Sign-in is required.',
          )
        }
      })
    return () => {
      active = false
    }
  }, [])

  async function signOut() {
    setSigningOut(true)
    setAuthError('')
    try {
      await apiRequest<{ signedOut: boolean }>('/api/auth/logout', {
        method: 'POST',
      })
      window.location.assign('/admin/login')
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Could not sign out.',
      )
      setSigningOut(false)
    }
  }

  if (!user) {
    return (
      <main className="admin-gate">
        <div className="admin-gate__card">
          <span className="eyebrow">Zettos content studio</span>
          <h1>{authError ? 'Sign in required' : 'Checking your session…'}</h1>
          {authError && (
            <>
              <p>{authError}</p>
              <a className="button button--dark" href="/admin/login">
                Go to sign in
              </a>
            </>
          )}
        </div>
      </main>
    )
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/admin">
          <span className="admin-brand__mark">Z</span>
          <span>
            <strong>ZETTOS</strong>
            <small>CONTENT STUDIO</small>
          </span>
        </a>
        <nav className="admin-nav" aria-label="Admin navigation">
          <a href="/admin">Overview</a>
          <a href="/admin/projects">Projects</a>
          <a href="/admin/services">Services</a>
          <a href="/admin/enquiries">Enquiries</a>
        </nav>
        <div className="admin-sidebar__account">
          <span>{user.fullName}</span>
          <small>{user.role.replace('_', ' ')}</small>
          <button type="button" onClick={signOut} disabled={signingOut}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">Zettos Interior Units</span>
            <h1>{title}</h1>
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            View website <SiteIcon name="arrow-up-right" />
          </a>
        </header>
        {authError && <p className="admin-alert">{authError}</p>}
        {children}
      </main>
    </div>
  )
}

export function AdminLoginPage() {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setSubmitting(true)
    setError('')
    try {
      await apiRequest<{ user: AdminUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: values.get('email'),
          password: values.get('password'),
        }),
      })
      window.location.assign('/admin')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not sign in.',
      )
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-login">
      <a className="admin-brand" href="/">
        <span className="admin-brand__mark">Z</span>
        <span>
          <strong>ZETTOS</strong>
          <small>CONTENT STUDIO</small>
        </span>
      </a>
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <span className="eyebrow">Private workspace</span>
        <h1>Welcome back.</h1>
        <p>Sign in to manage Zettos website content and project enquiries.</p>
        <label>
          <span>Email address</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
          />
        </label>
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          required
        />
        {error && (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        )}
        <button
          className="button button--dark"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <a className="admin-login__back" href="/admin/reset">
          Forgot your password?
        </a>
        <a className="admin-login__back" href="/">
          Return to website
        </a>
      </form>
    </main>
  )
}

export function AdminNotice({ children }: { children: ReactNode }) {
  return <p className="admin-notice">{children}</p>
}
