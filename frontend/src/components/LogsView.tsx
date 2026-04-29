import { Modal } from './common/Modal'
import { formatDate } from '../lib/utils'
import type { EmailLog, EmailSend, LogEvent } from '../types'

/* ------------------------------------------------------------------ */
/*  Event icon + colour                                                  */
/* ------------------------------------------------------------------ */

const EVENT_META: Record<
  LogEvent,
  { icon: React.ReactNode; dot: string; label: string; detail: string }
> = {
  queued: {
    label: 'Queued',
    detail: 'Send added to the processing queue.',
    dot: 'bg-slate-400',
    icon: (
      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  attempted: {
    label: 'Attempted',
    detail: 'Delivery was attempted.',
    dot: 'bg-blue-400',
    icon: (
      <svg className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  sent: {
    label: 'Sent',
    detail: 'Email delivered successfully.',
    dot: 'bg-emerald-400',
    icon: (
      <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
  },
  failed: {
    label: 'Failed',
    detail: 'Delivery failed.',
    dot: 'bg-red-400',
    icon: (
      <svg className="h-3.5 w-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  retry_scheduled: {
    label: 'Retry Scheduled',
    detail: 'A retry has been scheduled.',
    dot: 'bg-orange-400',
    icon: (
      <svg className="h-3.5 w-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
}

/* ------------------------------------------------------------------ */
/*  Single timeline event row                                           */
/* ------------------------------------------------------------------ */

function TimelineEvent({ log, isLast }: { log: EmailLog; isLast: boolean }) {
  const meta = EVENT_META[log.event]
  const payload = log.payload ?? {}
  const hasPayload = Object.keys(payload).length > 0

  return (
    <div className="relative flex gap-4">
      {/* Vertical connector */}
      {!isLast && (
        <div className="absolute left-[13px] top-7 bottom-0 w-px bg-zinc-800" />
      )}

      {/* Icon bubble */}
      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-zinc-700">
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-200">{meta.label}</span>
          <span className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          </span>
          <span className="ml-auto text-xs text-zinc-500 tabular-nums">
            {formatDate(log.created_at)}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-zinc-500">{meta.detail}</p>

        {hasPayload && (
          <div className="mt-2 space-y-1">
            {Object.entries(payload).map(([k, v]) => (
              <div key={k} className="flex items-start gap-2 text-xs">
                <span className="shrink-0 font-mono text-zinc-600">{k}:</span>
                <span
                  className={`font-mono break-all ${
                    k === 'error' || k === 'message'
                      ? 'text-red-400'
                      : k.includes('next') || k.includes('retry')
                      ? 'text-orange-400'
                      : 'text-zinc-300'
                  }`}
                >
                  {String(v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  LogsView modal                                                      */
/* ------------------------------------------------------------------ */

interface LogsViewProps {
  send: EmailSend | null
  logs: EmailLog[]
  loading: boolean
  error: string | null
  onClose: () => void
}

export function LogsView({ send, logs, loading, error, onClose }: LogsViewProps) {
  if (!send) return null

  const finalStatus = logs.findLast?.((l) => l.event === 'sent' || l.event === 'failed')

  return (
    <Modal open={!!send} onClose={onClose} title={`Delivery Timeline — Send #${send.id}`} size="xl">
      {/* Send meta */}
      <div className="mb-5 grid grid-cols-2 gap-3 rounded-lg bg-zinc-800/40 p-4 ring-1 ring-zinc-800 text-sm">
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Recipient</p>
          <p className="font-medium text-zinc-100">{send.recipient?.name ?? `#${send.recipient_id}`}</p>
          {send.recipient?.email && (
            <p className="text-xs text-zinc-500">{send.recipient.email}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Template</p>
          <p className="font-medium text-zinc-100">{send.email_template?.name ?? `#${send.email_template_id}`}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Attempts</p>
          <p className="font-mono text-zinc-300">{send.attempt_count}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Final outcome</p>
          {finalStatus ? (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                finalStatus.event === 'sent'
                  ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 ring-red-500/20'
              }`}
            >
              {EVENT_META[finalStatus.event].label}
            </span>
          ) : (
            <span className="text-xs text-zinc-500">In progress</span>
          )}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading timeline...
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400 ring-1 ring-red-500/20">
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-600">
          No events recorded for this send yet.
        </div>
      ) : (
        <div className="pt-2">
          {logs.map((log, i) => (
            <TimelineEvent key={log.id} log={log} isLast={i === logs.length - 1} />
          ))}
        </div>
      )}
    </Modal>
  )
}
