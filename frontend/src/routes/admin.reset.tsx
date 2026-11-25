import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PasswordField } from '../components/admin'
import { apiRequest } from '../lib/api'

export const Route = createFileRoute('/admin/reset')({
  component: AdminPasswordResetPage,
})

function AdminPasswordResetPage() {
  const [token, setToken] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '')
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      if (token) {
        const password = String(values.get('password'))
        if (password !== String(values.get('confirmPassword'))) {
          throw new Error('The passwords do not match.')
        }
        await apiRequest<{ passwordUpdated: boolean }>(
          '/api/auth/password-reset/complete',
          {
            method: 'POST',
            body: JSON.stringify({ token, password }),
          },
        )
        setNotice('Your password has been updated. You can now sign in.')
        setCompleted(true)
      } else {
        await apiRequest<{ message: string }>('/api/auth/password-reset', {
          method: 'POST',
          body: JSON.stringify({ email: values.get('email') }),
        })
        setNotice(
          'If an active admin account matches that email, reset instructions will be sent.',
        )
        form.reset()
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not update your password.',
      )
    } finally {
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
      <form className="admin-login__card" onSubmit={submit}>
        <span className="eyebrow">Account access</span>
        {completed ? (
          <>
            <h1>Password updated.</h1>
            <p>{notice}</p>
            <a className="button button--dark" href="/admin/login">
              Go to sign in
            </a>
          </>
        ) : (
          <>
        <h1>{token ? 'Choose a new password.' : 'Reset your password.'}</h1>
        <p>
          {token
            ? 'Use at least 8 characters with uppercase, lowercase and a number.'
            : 'Enter your admin email and we will send a one-time reset link if the account is active.'}
        </p>
        {token ? (
          <>
            <PasswordField
              label="New password"
              name="password"
              minLength={8}
              maxLength={200}
              autoComplete="new-password"
              required
            />
            <PasswordField
              label="Confirm new password"
              name="confirmPassword"
              minLength={8}
              maxLength={200}
              autoComplete="new-password"
              required
            />
          </>
        ) : (
          <label>
            <span>Email address</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
        )}
        {error && (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        )}
        {notice && <p className="admin-success">{notice}</p>}
        <button
          className="button button--dark"
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? 'Please wait…'
            : token
              ? 'Update password'
              : 'Send reset link'}
        </button>
        <a className="admin-login__back" href="/admin/login">
          Return to sign in
        </a>
          </>
        )}
      </form>
    </main>
  )
}
