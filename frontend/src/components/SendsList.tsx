import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatDate, formatDateShort } from '../lib/utils'
import { Table } from './common/Table'
import { Button } from './common/Button'
import { Modal } from './common/Modal'
import { LogEventBadge, StatusBadge } from './common/Badge'
import type { EmailLog, EmailSend } from '../types'

function LogsModal({
  send,
  logs,
  loading,
  error,
  onClose,
}: {
  send: EmailSend | null
  logs: EmailLog[]
  loading: boolean
  error: string | null
  onClose: () => void
}) {
  if (!send) return null

  return (
    <Modal open={!!send} onClose={onClose} title={`Logs — Send #${send.id}`} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-zinc-800/40 p-4 ring-1 ring-zinc-800">
          <div>
            <p className="text-xs text-zinc-500">Recipient</p>
            <p className="text-sm text-zinc-100">{send.recipient?.name ?? `Recipient #${send.recipient_id}`}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Template</p>
            <p className="text-sm text-zinc-100">{send.email_template?.name ?? `Template #${send.email_template_id}`}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-zinc-500">Loading logs...</div>
        ) : error ? (
          <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400 ring-1 ring-red-500/20">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-500">No logs for this send yet.</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg bg-zinc-900 p-4 ring-1 ring-zinc-800">
                <div className="flex items-center justify-between gap-3">
                  <LogEventBadge event={log.event} />
                  <span className="text-xs text-zinc-500">{formatDate(log.created_at)}</span>
                </div>
                {log.payload && (
                  <pre className="mt-3 overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-300 ring-1 ring-zinc-800">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

export function SendsList() {
  const [sends, setSends] = useState<EmailSend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSend, setSelectedSend] = useState<EmailSend | null>(null)
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api.sends
      .list()
      .then(setSends)
      .catch((err) => setError(err?.message ?? 'Failed to load email sends'))
      .finally(() => setLoading(false))
  }, [])

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Email Sends</h2>
          <p className="text-sm text-zinc-500">{sends.length} total</p>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
        <Table
          loading={loading}
          data={sends}
          emptyMessage="No email sends yet."
          columns={[
            {
              key: 'recipient',
              header: 'Recipient',
              render: (send) => (
                <div>
                  <p className="font-medium text-zinc-100">{send.recipient?.name ?? `Recipient #${send.recipient_id}`}</p>
                  <p className="text-xs text-zinc-500">{send.recipient?.email ?? 'Unknown email'}</p>
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
              render: (send) => <StatusBadge status={send.status} />,
            },
            {
              key: 'attempts',
              header: 'Attempts',
              render: (send) => <span className="font-mono text-xs text-zinc-400">{send.attempt_count}</span>,
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

      <LogsModal
        send={selectedSend}
        logs={logs}
        loading={logsLoading}
        error={logsError}
        onClose={() => {
          setSelectedSend(null)
          setLogs([])
          setLogsError(null)
        }}
      />
    </div>
  )
}
