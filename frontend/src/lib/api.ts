import type {
  Recipient,
  EmailTemplate,
  Rule,
  EmailSend,
  EmailLog,
} from '../types'

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    throw body
  }

  if (res.status === 204) return undefined as T
  return res.json()
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
