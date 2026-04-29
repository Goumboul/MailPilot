export interface Recipient {
  id: number
  name: string
  email: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface EmailTemplate {
  id: number
  name: string
  subject: string
  body: string
  created_at: string
  updated_at: string
}

export interface Condition {
  field: string
  operator: string
  value: string | number
}

export interface Rule {
  id: number
  name: string
  email_template: EmailTemplate | null
  conditions: Condition[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SendStatus = 'pending' | 'sent' | 'failed'

export interface EmailSend {
  id: number
  rule_id: number
  recipient_id: number
  email_template_id: number
  status: SendStatus
  attempt_count: number
  scheduled_at: string | null
  sent_at: string | null
  failed_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
  recipient?: Recipient
  email_template?: EmailTemplate
  rule?: Rule
}

export type LogEvent = 'queued' | 'attempted' | 'sent' | 'failed' | 'retry_scheduled'

export interface EmailLog {
  id: number
  email_send_id: number
  event: LogEvent
  payload: Record<string, unknown> | null
  created_at: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
}
