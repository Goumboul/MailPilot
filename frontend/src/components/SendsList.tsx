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
  const total = sends.length

  const items = [
    { label: 'Sent', count: sent, color: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Pending', count: pending, color: 'text-amber-400', dot: 'bg-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Failed', count: failed, color: 'text-red-400', dot: 'bg-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-3 rounded-xl ${item.bg} ring-1 ring-zinc-800 px-4 py-3`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${item.dot} shrink-0`} />
          <span className={`text-xl font-bold tabular-nums ${item.color}`}>{item.count}</span>
          <span className="text-sm text-zinc-500">{item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-3 rounded-xl bg-zinc-900 ring-1 ring-zinc-800 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-600 shrink-0" />
        <span className="text-xl font-bold tabular-nums text-zinc-300">{total}</span>
        <span className="text-sm text-zinc-500">Total</span>
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
          <h1 className="text-2xl font-bold text-zinc-100">Email Sends</h1>
          <p className="mt-1 text-sm text-zinc-500">
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
          const colorMap: Record<string, { tab: string; badge: string }> = {
            all: {
              tab: active ? 'bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
              badge: active ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800 text-zinc-500',
            },
            pending: {
              tab: active ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
              badge: active ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-500',
            },
            sent: {
              tab: active ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
              badge: active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-500',
            },
            failed: {
              tab: active ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
              badge: active ? 'bg-red-500/20 text-red-300' : 'bg-zinc-800 text-zinc-500',
            },
          }
          const styles = colorMap[f.key] ?? colorMap.all
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-150 ${styles.tab}`}
            >
              {f.label}
              <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums ${styles.badge}`}>
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
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    void openLogs(send)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 ring-1 ring-inset ring-indigo-500/20 hover:ring-indigo-500/40 transition-all duration-150"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  View Logs
                </button>
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
