import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { StatusBadge } from './common/Badge'
import { StatCard } from './common/StatCard'
import { APIErrorAlert } from './common/APIErrorAlert'
import type { EmailSend, Recipient, EmailTemplate, Rule } from '../types'

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
  const pendingSends = sends.filter((s) => s.status === 'pending').length
  const successRate =
    sends.length > 0
      ? ((sentSends / (sentSends + failedSends || 1)) * 100).toFixed(1)
      : '—'

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
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Email automation at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total Emails Sent */}
        <StatCard
          label="Total Emails Sent"
          value={sentSends}
          subtitle="emails delivered"
          iconBg="bg-indigo-600/15"
          iconColor="text-indigo-400"
          accentColor="bg-indigo-500"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />

        {/* Success Rate */}
        <StatCard
          label="Success Rate"
          value={sentSends + failedSends > 0 ? `${successRate}%` : '—'}
          subtitle="delivery success"
          iconBg="bg-emerald-600/15"
          iconColor="text-emerald-400"
          accentColor="bg-emerald-500"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          }
        />

        {/* Failed Jobs — only shown if > 0, else show pending */}
        {failedSends > 0 ? (
          <StatCard
            label="Failed Jobs"
            value={failedSends}
            subtitle="requires attention"
            iconBg="bg-red-600/15"
            iconColor="text-red-400"
            accentColor="bg-red-500"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          />
        ) : (
          <StatCard
            label="Pending"
            value={pendingSends}
            subtitle="queued for delivery"
            iconBg="bg-amber-600/15"
            iconColor="text-amber-400"
            accentColor="bg-amber-500"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        )}

        {/* Active Rules */}
        <StatCard
          label="Active Rules"
          value={`${activeRules} / ${rules.length}`}
          subtitle="rules enabled"
          iconBg="bg-amber-600/15"
          iconColor="text-amber-400"
          accentColor="bg-amber-500"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
        />
      </div>

      {/* Failed sends alert */}
      {failedSends > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-red-500/5 ring-1 ring-red-500/20 px-5 py-3">
          <svg className="h-4 w-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-red-400">
            <span className="font-semibold">{failedSends} failed send{failedSends !== 1 ? 's' : ''}</span>
            {' '}— review the Email Sends page for details.
          </p>
          <button
            onClick={() => onNavigate('sends')}
            className="ml-auto text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
          >
            View
          </button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent sends */}
        <div className="col-span-2 rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Recent Activity</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Latest email deliveries</p>
            </div>
            <button
              onClick={() => onNavigate('sends')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {recentSends.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-600">No sends yet. Trigger a rule to get started.</p>
            ) : (
              recentSends.map((send) => (
                <div key={send.id} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-800/30 transition-colors">
                  {/* Status dot */}
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    send.status === 'sent' ? 'bg-emerald-400' :
                    send.status === 'failed' ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate">
                      {send.recipient?.name ?? `Recipient #${send.recipient_id}`}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {send.email_template?.name ?? `Template #${send.email_template_id}`}
                    </p>
                  </div>
                  <StatusBadge status={send.status} />
                  <span className="text-xs text-zinc-600 shrink-0 w-20 text-right">{formatDate(send.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-6">
            <h2 className="text-sm font-semibold text-zinc-100 mb-4">Quick Actions</h2>
            <div className="space-y-1.5">
              {(
                [
                  {
                    label: 'Add Recipient',
                    page: 'recipients' as const,
                    color: 'text-blue-400',
                    dot: 'bg-blue-400',
                    desc: 'Import or add contacts',
                  },
                  {
                    label: 'New Template',
                    page: 'templates' as const,
                    color: 'text-violet-400',
                    dot: 'bg-violet-400',
                    desc: 'Compose email content',
                  },
                  {
                    label: 'Create Rule',
                    page: 'rules' as const,
                    color: 'text-emerald-400',
                    dot: 'bg-emerald-400',
                    desc: 'Set up automation',
                  },
                  {
                    label: 'View Logs',
                    page: 'sends' as const,
                    color: 'text-indigo-400',
                    dot: 'bg-indigo-400',
                    desc: 'Monitor deliveries',
                  },
                ] as const
              ).map((action) => (
                <button
                  key={action.page}
                  onClick={() => onNavigate(action.page)}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors group"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${action.dot} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${action.color}`}>{action.label}</p>
                    <p className="text-xs text-zinc-600 group-hover:text-zinc-500 transition-colors">{action.desc}</p>
                  </div>
                  <svg className="h-3.5 w-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Send summary */}
          <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-100">Send Summary</h2>
            {[
              { label: 'Sent', count: sentSends, color: 'bg-emerald-400', text: 'text-emerald-400' },
              { label: 'Pending', count: pendingSends, color: 'bg-amber-400', text: 'text-amber-400' },
              { label: 'Failed', count: failedSends, color: 'bg-red-400', text: 'text-red-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-zinc-400">{item.label}</span>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${item.text}`}>{item.count}</span>
                </div>
                {sends.length > 0 && (
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.round((item.count / sends.length) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
            <div className="pt-1 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span>Total sends</span>
              <span className="font-semibold text-zinc-300 tabular-nums">{sends.length}</span>
            </div>
          </div>

          {/* Coverage */}
          <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-6">
            <h2 className="text-sm font-semibold text-zinc-100 mb-3">Coverage</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Recipients</span>
                <span className="font-semibold text-zinc-300 tabular-nums">{recipients.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Templates</span>
                <span className="font-semibold text-zinc-300 tabular-nums">{templates.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Rules</span>
                <span className="font-semibold text-zinc-300 tabular-nums">{activeRules} / {rules.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
