import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { formatDateShort, getMetadataValue } from '../lib/utils'
import { Table } from './common/Table'
import { Button } from './common/Button'
import { Modal } from './common/Modal'
import { Field, Input } from './common/Form'
import type { Recipient } from '../types'

interface MetadataModalProps {
  recipient: Recipient | null
  onClose: () => void
}

function MetadataModal({ recipient, onClose }: MetadataModalProps) {
  if (!recipient) return null
  const meta = recipient.metadata

  return (
    <Modal open={!!recipient} onClose={onClose} title={`Metadata — ${recipient.name}`}>
      {!meta || Object.keys(meta).length === 0 ? (
        <p className="text-sm text-zinc-500">No metadata stored for this recipient.</p>
      ) : (
        <div className="divide-y divide-zinc-800 rounded-lg overflow-hidden ring-1 ring-zinc-800">
          {Object.entries(meta).map(([key, value]) => (
            <div key={key} className="flex items-center px-4 py-2.5 gap-4">
              <span className="text-xs font-mono text-zinc-500 w-28 shrink-0">{key}</span>
              <span className="text-sm text-zinc-200">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

interface AddRecipientForm {
  name: string
  email: string
  plan: string
  country: string
  mrr: string
}

const emptyForm: AddRecipientForm = { name: '', email: '', plan: '', country: '', mrr: '' }

export function RecipientsList() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedMeta, setSelectedMeta] = useState<Recipient | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddRecipientForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AddRecipientForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    api.recipients
      .list()
      .then(setRecipients)
      .catch((err) => setError(err?.message ?? 'Failed to load recipients'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = recipients.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      getMetadataValue(r.metadata, 'plan').toLowerCase().includes(search.toLowerCase()),
  )

  const handleAdd = async () => {
    const errors: typeof formErrors = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email'
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    const metadata: Record<string, unknown> = {}
    if (form.plan) metadata.plan = form.plan
    if (form.country) metadata.country = form.country
    if (form.mrr) metadata.mrr = Number(form.mrr)

    setSaving(true)
    setSaveError(null)
    try {
      const created = await api.recipients.create({
        name: form.name.trim(),
        email: form.email.trim(),
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      })
      setRecipients((prev) => [created, ...prev])
      setShowAdd(false)
      setForm(emptyForm)
      setFormErrors({})
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> }
      if (e?.errors) {
        const mapped: typeof formErrors = {}
        if (e.errors.email) mapped.email = e.errors.email[0]
        if (e.errors.name) mapped.name = e.errors.name[0]
        setFormErrors(mapped)
      } else {
        setSaveError(e?.message ?? 'Failed to save recipient')
      }
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 ring-1 ring-red-500/20 p-5 text-red-400">
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
          <h2 className="text-lg font-semibold text-zinc-100">Recipients</h2>
          <p className="text-sm text-zinc-500">{recipients.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, email, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button onClick={() => setShowAdd(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Recipient
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
        <Table
          loading={loading}
          data={filtered}
          emptyMessage="No recipients match your search."
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => (
                <div>
                  <p className="font-medium text-zinc-100">{r.name}</p>
                  <p className="text-xs text-zinc-500">{r.email}</p>
                </div>
              ),
            },
            {
              key: 'email',
              header: 'Email',
              render: (r) => <span className="text-zinc-400">{r.email}</span>,
              className: 'hidden',
            },
            {
              key: 'plan',
              header: 'Plan',
              render: (r) => {
                const plan = getMetadataValue(r.metadata, 'plan')
                const colors: Record<string, string> = {
                  free: 'text-zinc-400',
                  pro: 'text-indigo-400',
                  enterprise: 'text-yellow-400',
                }
                return (
                  <span className={`text-sm font-medium ${colors[plan] ?? 'text-zinc-400'}`}>
                    {plan}
                  </span>
                )
              },
            },
            {
              key: 'country',
              header: 'Country',
              render: (r) => (
                <span className="text-zinc-400">{getMetadataValue(r.metadata, 'country')}</span>
              ),
            },
            {
              key: 'mrr',
              header: 'MRR',
              render: (r) => {
                const mrr = getMetadataValue(r.metadata, 'mrr')
                return mrr === '—' ? (
                  <span className="text-zinc-600">—</span>
                ) : (
                  <span className="text-zinc-300 font-mono text-xs">${mrr}</span>
                )
              },
            },
            {
              key: 'created_at',
              header: 'Added',
              render: (r) => (
                <span className="text-zinc-500 text-xs">{formatDateShort(r.created_at)}</span>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setSelectedMeta(r) }}
                >
                  Metadata
                </Button>
              ),
            },
          ]}
        />
      </div>

      {/* Metadata Modal */}
      <MetadataModal
        recipient={selectedMeta}
        onClose={() => setSelectedMeta(null)}
      />

      {/* Add Recipient Modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setForm(emptyForm); setFormErrors({}); setSaveError(null) }}
        title="Add Recipient"
      >
        <div className="space-y-4">
          <Field label="Name" required error={formErrors.name}>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Jane Doe"
              error={!!formErrors.name}
            />
          </Field>
          <Field label="Email" required error={formErrors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="jane@company.com"
              error={!!formErrors.email}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan" hint="e.g. free, pro, enterprise">
              <Input
                value={form.plan}
                onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value }))}
                placeholder="free"
              />
            </Field>
            <Field label="Country">
              <Input
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                placeholder="US"
              />
            </Field>
          </div>
          <Field label="MRR (USD)" hint="Monthly recurring revenue">
            <Input
              type="number"
              value={form.mrr}
              onChange={(e) => setForm((p) => ({ ...p, mrr: e.target.value }))}
              placeholder="0"
            />
          </Field>

          {saveError && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{saveError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => { setShowAdd(false); setForm(emptyForm); setFormErrors({}); setSaveError(null) }}
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={handleAdd}>
              Add Recipient
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
