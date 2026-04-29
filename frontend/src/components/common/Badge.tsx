import type { SendStatus, LogEvent } from '../../types'

const STATUS_STYLES: Record<SendStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  sent:    'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  failed:  'bg-red-500/10 text-red-400 ring-red-500/20',
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
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status}
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
