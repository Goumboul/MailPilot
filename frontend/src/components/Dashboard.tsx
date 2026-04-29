import { useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { StatusBadge } from './common/Badge'
import { APIErrorAlert } from './common/APIErrorAlert'
import type { EmailSend, Recipient, EmailTemplate, Rule } from '../types'

interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-100 tabular-nums">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

interface DashboardProps {
  onNavigate: (page: 'recipients' | 'templates' | 'rules' | 'sends') => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [sends, setSends] = useState<EmailSend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.recipients.list(),
      api.templates.list(),
      api.rules.list(),
      api.sends.list(),
    ])
      .then(([r, t, ru, s]) => {
        setRecipients(r)
        setTemplates(t)
        setRules(ru)
        setSends(s)
      })
      .catch((err) => setError(err?.message ?? 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const recentSends = [...sends]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  const activeRules = rules.filter((r) => r.is_active).length
  const failedSends = sends.filter((s) => s.status === 'failed').length
  const sentSends = sends.filter((s) => s.status === 'sent').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <svg className="h-5 w-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl">
        <APIErrorAlert error={error} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Recipients"
          value={recipients.length}
          color="bg-blue-600/10"
          icon={
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Email Templates"
          value={templates.length}
          color="bg-violet-600/10"
          icon={
            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Active Rules"
          value={`${activeRules} / ${rules.length}`}
          color="bg-emerald-600/10"
          icon={
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Emails Sent"
          value={sentSends}
          color="bg-indigo-600/10"
          icon={
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
        />
      </div>

      {/* Secondary stats row */}
      {failedSends > 0 && (
        <div className="rounded-xl bg-red-500/5 ring-1 ring-red-500/20 px-5 py-3 flex items-center gap-3">
          <svg className="h-4 w-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-red-400">
            <span className="font-semibold">{failedSends} failed send{failedSends !== 1 ? 's' : ''}</span>
            {' '}— check the Email Sends page for details.
          </p>
          <button
            onClick={() => onNavigate('sends')}
            className="ml-auto text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
          >
            View
          </button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent sends */}
        <div className="col-span-2 rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-100">Recent Email Sends</h2>
            <button
              onClick={() => onNavigate('sends')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {recentSends.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-600">No sends yet.</p>
            ) : (
              recentSends.map((send) => (
                <div key={send.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate">
                      {send.recipient?.name ?? `Recipient #${send.recipient_id}`}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {send.email_template?.name ?? `Template #${send.email_template_id}`}
                    </p>
                  </div>
                  <StatusBadge status={send.status} />
                  <span className="text-xs text-zinc-600 shrink-0">{formatDate(send.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-5">
            <h2 className="text-sm font-semibold text-zinc-100 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {(
                [
                  { label: 'Add Recipient', page: 'recipients' as const, color: 'text-blue-400' },
                  { label: 'New Template', page: 'templates' as const, color: 'text-violet-400' },
                  { label: 'Create Rule', page: 'rules' as const, color: 'text-emerald-400' },
                  { label: 'View Logs', page: 'sends' as const, color: 'text-indigo-400' },
                ] as const
              ).map((action) => (
                <button
                  key={action.page}
                  onClick={() => onNavigate(action.page)}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-left"
                >
                  <span className={`h-1.5 w-1.5 rounded-full bg-current ${action.color}`} />
                  <span className={action.color}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-100">Send Summary</h2>
            {[
              { label: 'Pending', count: sends.filter((s) => s.status === 'pending').length, color: 'bg-yellow-400' },
              { label: 'Sent', count: sentSends, color: 'bg-emerald-400' },
              { label: 'Failed', count: failedSends, color: 'bg-red-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span className="text-zinc-400">{item.label}</span>
                </div>
                <span className="font-medium tabular-nums text-zinc-300">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
