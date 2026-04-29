import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'
import { formatDateShort } from '../lib/utils'
import { Table } from './common/Table'
import { Button } from './common/Button'
import { StatusBadge } from './common/Badge'
import { LogsView } from './LogsView'
import type { EmailLog, EmailSend, SendStatus } from '../types'

/* ------------------------------------------------------------------ */
/*  Status filter tabs                                                  */
/* ------------------------------------------------------------------ */

type Filter = 'all' | SendStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'sent', label: 'Sent' },
  { key: 'failed', label: 'Failed' },
]

/* ------------------------------------------------------------------ */
/*  Stats bar                                                           */
/* ------------------------------------------------------------------ */

function StatsBar({ sends }: { sends: EmailSend[] }) {
  const pending = sends.filter((s) => s.status === 'pending').length
  const sent = sends.filter((s) => s.status === 'sent').length
  const failed = sends.filter((s) => s.status === 'failed').length

  const items = [
    { label: 'pending', count: pending, color: 'text-yellow-400', dot: 'bg-yellow-400' },
    { label: 'sent', count: sent, color: 'text-emerald-400', dot: 'bg-emerald-400' },
    { label: 'failed', count: failed, color: 'text-red-400', dot: 'bg-red-400' },
  ]

  return (
    <div className="flex items-center gap-4 rounded-xl bg-zinc-900 ring-1 ring-zinc-800 px-5 py-3">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2">
          {i > 0 && <div className="h-4 w-px bg-zinc-800 mr-2" />}
          <span className={`h-2 w-2 rounded-full ${item.dot}`} />
          <span className={`text-sm font-semibold tabular-nums ${item.color}`}>
            {item.count}
          </span>
          <span className="text-sm text-zinc-500">{item.label}</span>
        </div>
      ))}
      <div className="ml-auto h-4 w-px bg-zinc-800" />
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-zinc-300">{sends.length}</span>
        <span className="text-sm text-zinc-500">total</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export function SendsList() {
  const [sends, setSends] = useState<EmailSend[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  // Logs panel
  const [selectedSend, setSelectedSend] = useState<EmailSend | null>(null)
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState<string | null>(null)

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    return api.sends
      .list()
      .then(setSends)
      .catch((err) => setError(err?.message ?? 'Failed to load email sends'))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openLogs = async (send: EmailSend) => {
    setSelectedSend(send)
    setLogs([])
    setLogsError(null)
    setLogsLoading(true)
    try {
      const data = await api.sends.logs(send.id)
      setLogs(data)
    } catch (err) {
      setLogsError((err as { message?: string })?.message ?? 'Failed to load logs')
    } finally {
      setLogsLoading(false)
    }
  }

  const closeLogs = () => {
    setSelectedSend(null)
    setLogs([])
    setLogsError(null)
  }

  const filtered = filter === 'all' ? sends : sends.filter((s) => s.status === filter)

  const countFor = (key: Filter) =>
    key === 'all' ? sends.length : sends.filter((s) => s.status === key).length

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 p-5 text-red-400 ring-1 ring-red-500/20">
        <p className="font-medium">API Error</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Email Sends</h2>
          <p className="text-sm text-zinc-500">
            Queue of all email deliveries triggered by automation rules
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={refreshing}
          onClick={() => void load(true)}
        >
          {!refreshing && (
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
          Refresh
        </Button>
      </div>

      {/* Stats bar */}
      {!loading && <StatsBar sends={sends} />}

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        {FILTERS.map((f) => {
          const active = filter === f.key
          const count = countFor(f.key)
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                active
                  ? 'bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              {f.label}
              <span
                className={`rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums ${
                  active ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
        <Table
          loading={loading}
          data={filtered}
          emptyMessage={
            filter === 'all' ? 'No email sends yet.' : `No ${filter} sends.`
          }
          columns={[
            {
              key: 'recipient',
              header: 'Recipient',
              render: (send) => (
                <div>
                  <p className="font-medium text-zinc-100">
                    {send.recipient?.name ?? `Recipient #${send.recipient_id}`}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {send.recipient?.email ?? ''}
                  </p>
                </div>
              ),
            },
            {
              key: 'template',
              header: 'Template',
              render: (send) => (
                <span className="text-sm text-zinc-400">
                  {send.email_template?.name ?? `Template #${send.email_template_id}`}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (send) => (
                <div className="flex items-center gap-2">
                  <StatusBadge status={send.status} />
                  {send.status === 'failed' && send.last_error && (
                    <span
                      className="max-w-[120px] truncate text-xs text-red-400"
                      title={send.last_error}
                    >
                      {send.last_error}
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'attempts',
              header: 'Attempts',
              render: (send) => (
                <span className="font-mono text-xs text-zinc-400">{send.attempt_count}</span>
              ),
            },
            {
              key: 'created_at',
              header: 'Created',
              render: (send) => (
                <span className="text-xs text-zinc-500">{formatDateShort(send.created_at)}</span>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (send) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    void openLogs(send)
                  }}
                >
                  View Logs
                </Button>
              ),
            },
          ]}
        />
      </div>

      {/* Logs timeline modal */}
      <LogsView
        send={selectedSend}
        logs={logs}
        loading={logsLoading}
        error={logsError}
        onClose={closeLogs}
      />
    </div>
  )
}
