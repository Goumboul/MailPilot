import type {
  Recipient,
  EmailTemplate,
  Rule,
  EmailSend,
  EmailLog,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10)

// Debug logging
const DEBUG = import.meta.env.MODE === 'development'
const log = {
  request: (url: string, method: string = 'GET') => {
    if (DEBUG) console.log(`[API] ${method} ${BASE_URL}/api${url}`)
  },
  response: (_url: string, status: number, ms: number) => {
    if (DEBUG) console.log(`[API] ✓ ${status} in ${ms}ms`)
  },
  error: (_url: string, error: Error) => {
    if (DEBUG) console.error(`[API] ✗ ${error.message}`)
  },
}

class APIError extends Error {
  status: number
  statusText: string

  constructor(status: number, statusText: string, message: string) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.statusText = statusText
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET'
  const start = performance.now()
  const fullUrl = `${BASE_URL}/api${url}`

  log.request(url, method)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.warn(`[API] Timeout triggered after ${API_TIMEOUT}ms for ${method} ${url}`)
    controller.abort()
  }, API_TIMEOUT)

  try {
    const res = await fetch(fullUrl, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      ...options,
      signal: controller.signal,
    })

    const ms = Math.round(performance.now() - start)
    log.response(url, res.status, ms)

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }))
      throw new APIError(res.status, res.statusText, body.message || res.statusText)
    }

    if (res.status === 204) return undefined as T
    return res.json()
  } catch (error) {
    if (error instanceof APIError) {
      log.error(url, error)
      throw error
    }

    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new APIError(
          0,
          'Network Error',
          `Cannot reach API at ${BASE_URL}. Is the Laravel backend running?\n\nError: ${error.message}`,
        )
      }
      throw new APIError(0, 'Network Error', error.message)
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new APIError(
        0,
        'Timeout',
        `Request timeout after ${API_TIMEOUT}ms. The server is not responding. Try increasing VITE_API_TIMEOUT.`,
      )
    }

    log.error(url, error instanceof Error ? error : new Error(String(error)))
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

// Laravel API resources wrap arrays in { data: [] }
function unwrap<T>(res: { data: T }): T {
  return res.data
}

export const api = {
  recipients: {
    list: () => request<{ data: Recipient[] }>('/recipients').then(unwrap),
    get: (id: number) =>
      request<{ data: Recipient }>(`/recipients/${id}`).then(unwrap),
    create: (body: { name: string; email: string; metadata?: Record<string, unknown> }) =>
      request<{ data: Recipient }>('/recipients', {
        method: 'POST',
        body: JSON.stringify(body),
      }).then(unwrap),
    update: (
      id: number,
      body: { name?: string; email?: string; metadata?: Record<string, unknown> },
    ) =>
      request<{ data: Recipient }>(`/recipients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }).then(unwrap),
    destroy: (id: number) => request<void>(`/recipients/${id}`, { method: 'DELETE' }),
  },

  templates: {
    list: () => request<{ data: EmailTemplate[] }>('/email-templates').then(unwrap),
    get: (id: number) =>
      request<{ data: EmailTemplate }>(`/email-templates/${id}`).then(unwrap),
    create: (body: { name: string; subject: string; body: string }) =>
      request<{ data: EmailTemplate }>('/email-templates', {
        method: 'POST',
        body: JSON.stringify(body),
      }).then(unwrap),
    update: (id: number, body: { name?: string; subject?: string; body?: string }) =>
      request<{ data: EmailTemplate }>(`/email-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }).then(unwrap),
    destroy: (id: number) =>
      request<void>(`/email-templates/${id}`, { method: 'DELETE' }),
  },

  rules: {
    list: () => request<{ data: Rule[] }>('/rules').then(unwrap),
    get: (id: number) => request<{ data: Rule }>(`/rules/${id}`).then(unwrap),
    create: (body: {
      name: string
      email_template_id: number
      conditions: { field: string; operator: string; value: string }[]
      is_active?: boolean
    }) =>
      request<{ data: Rule }>('/rules', {
        method: 'POST',
        body: JSON.stringify(body),
      }).then(unwrap),
    update: (id: number, body: Partial<{ name: string; email_template_id: number; conditions: unknown[]; is_active: boolean }>) =>
      request<{ data: Rule }>(`/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }).then(unwrap),
    destroy: (id: number) => request<void>(`/rules/${id}`, { method: 'DELETE' }),
    trigger: (id: number) =>
      request<{ matched: number; already_sent: number; enqueued: number }>(
        `/rules/${id}/trigger`,
        { method: 'POST' },
      ),
  },

  sends: {
    list: () => request<{ data: EmailSend[] }>('/email-sends').then(unwrap),
    get: (id: number) =>
      request<{ data: EmailSend }>(`/email-sends/${id}`).then(unwrap),
    logs: (id: number) =>
      request<{ data: EmailLog[] }>(`/email-sends/${id}/logs`).then(unwrap),
  },

  stats: {
    overview: () =>
      request<{
        recipients: number
        templates: number
        rules: number
        sends: number
      }>('/stats'),
  },
}
