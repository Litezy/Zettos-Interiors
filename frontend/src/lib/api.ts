const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

export function isApiConfigured() {
  return Boolean(apiBaseUrl)
}

type ApiSuccess<T> = {
  data: T
}

type ApiFailure = {
  error?: {
    message?: string
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error('The website API URL is not configured.')
  }

  const headers = new Headers(init.headers)
  if (
    init.body &&
    !(typeof FormData !== 'undefined' && init.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })

  if (response.status === 204) return undefined as T

  let payload: ApiSuccess<T> | ApiFailure
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiFailure
  } catch {
    throw new Error('The API returned an unreadable response.')
  }

  if (!response.ok) {
    throw new Error(
      ('error' in payload && payload.error?.message) ||
        `The request failed (${response.status}).`,
    )
  }
  if (!('data' in payload)) {
    throw new Error('The API response did not contain data.')
  }

  return payload.data
}

export async function downloadApiFile(path: string, fileName: string) {
  if (!apiBaseUrl) {
    throw new Error('The website API URL is not configured.')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    let message = `The request failed (${response.status}).`
    try {
      const payload = (await response.json()) as ApiFailure
      message = payload.error?.message ?? message
    } catch {
      throw new Error(message)
    }
    throw new Error(message)
  }

  const blobUrl = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}
