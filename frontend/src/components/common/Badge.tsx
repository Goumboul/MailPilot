import type { SendStatus, LogEvent } from '../../types'

const STATUS_STYLES: Record<SendStatus, { badge: string; dot: string; label: string }> = {
  pending: { badge: 'bg-amber-500/10 text-amber-400 ring-amber-500/20', dot: 'bg-amber-400', label: 'Pending' },
  sent:    { badge: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20', dot: 'bg-emerald-400', label: 'Sent' },
  failed:  { badge: 'bg-red-500/10 text-red-400 ring-red-500/20', dot: 'bg-red-400', label: 'Failed' },
}

const LOG_EVENT_STYLES: Record<LogEvent, string> = {
  queued:           'bg-slate-500/10 text-slate-400 ring-slate-500/20',
  attempted:        'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  sent:             'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  failed:           'bg-red-500/10 text-red-400 ring-red-500/20',
  retry_scheduled:  'bg-orange-500/10 text-orange-400 ring-orange-500/20',
}

interface StatusBadgeProps {
  status: SendStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} shrink-0`} />
      {s.label}
    </span>
  )
}

interface LogEventBadgeProps {
  event: LogEvent
}

export function LogEventBadge({ event }: LogEventBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${LOG_EVENT_STYLES[event]}`}
    >
      {event.replace('_', ' ')}
    </span>
  )
}

interface ActiveBadgeProps {
  active: boolean
}

export function ActiveBadge({ active }: ActiveBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        active
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          : 'bg-slate-500/10 text-slate-400 ring-slate-500/20'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}
