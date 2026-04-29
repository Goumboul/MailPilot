import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { formatDateShort } from '../lib/utils'
import { Table } from './common/Table'
import { Button } from './common/Button'
import { Modal } from './common/Modal'
import { Field, Input, Select } from './common/Form'
import { ActiveBadge } from './common/Badge'
import type { Rule, EmailTemplate, Condition } from '../types'

const OPERATORS = ['=', '!=', '>', '>=', '<', '<=', 'contains']

function ConditionPills({ conditions }: { conditions: Condition[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {conditions.map((c, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300 ring-1 ring-zinc-700"
        >
          <span className="text-zinc-500">{c.field}</span>
          <span className="text-indigo-400">{c.operator}</span>
          <span className="text-emerald-400">{String(c.value)}</span>
        </span>
      ))}
    </div>
  )
}

const emptyCondition = (): { field: string; operator: string; value: string } => ({
  field: '',
  operator: '=',
  value: '',
})

interface RuleForm {
  name: string
  email_template_id: string
  is_active: boolean
  conditions: { field: string; operator: string; value: string }[]
}

const emptyForm = (): RuleForm => ({
  name: '',
  email_template_id: '',
  is_active: true,
  conditions: [emptyCondition()],
})

export function RulesList() {
  const [rules, setRules] = useState<Rule[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<RuleForm>(emptyForm())
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([api.rules.list(), api.templates.list()])
      .then(([r, t]) => { setRules(r); setTemplates(t) })
      .catch((err) => setError(err?.message ?? 'Failed to load rules'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const addCondition = () =>
    setForm((p) => ({ ...p, conditions: [...p.conditions, emptyCondition()] }))

  const removeCondition = (i: number) =>
    setForm((p) => ({
      ...p,
      conditions: p.conditions.filter((_, idx) => idx !== i),
    }))

  const updateCondition = (
    i: number,
    key: keyof ReturnType<typeof emptyCondition>,
    value: string,
  ) =>
    setForm((p) => {
      const conds = [...p.conditions]
      conds[i] = { ...conds[i], [key]: value }
      return { ...p, conditions: conds }
    })

  const handleCreate = async () => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.email_template_id) errors.email_template_id = 'Template is required'
    form.conditions.forEach((c, i) => {
      if (!c.field.trim()) errors[`cond_${i}_field`] = 'Field required'
      if (!c.value.trim()) errors[`cond_${i}_value`] = 'Value required'
    })
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    setSaving(true)
    setSaveError(null)
    try {
      const created = await api.rules.create({
        name: form.name.trim(),
        email_template_id: Number(form.email_template_id),
        conditions: form.conditions.map((c) => ({ ...c })),
        is_active: form.is_active,
      })
      setRules((prev) => [created, ...prev])
      setShowCreate(false)
      setForm(emptyForm())
      setFormErrors({})
    } catch (err: unknown) {
      const e = err as { message?: string }
      setSaveError(e?.message ?? 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (rule: Rule) => {
    try {
      const updated = await api.rules.update(rule.id, { is_active: !rule.is_active })
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)))
    } catch {
      // silent
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Automation Rules</h2>
          <p className="text-sm text-zinc-500">
            {rules.filter((r) => r.is_active).length} active / {rules.length} total
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Rule
        </Button>
      </div>

      <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
        <Table
          loading={loading}
          data={rules}
          emptyMessage="No rules created yet."
          columns={[
            {
              key: 'name',
              header: 'Rule Name',
              render: (r) => (
                <span className="font-medium text-zinc-100">{r.name}</span>
              ),
            },
            {
              key: 'template',
              header: 'Template',
              render: (r) => (
                <span className="text-zinc-400 text-sm">
                  {r.email_template?.name ?? <span className="text-zinc-600">—</span>}
                </span>
              ),
            },
            {
              key: 'conditions',
              header: 'Conditions',
              render: (r) =>
                r.conditions?.length > 0 ? (
                  <ConditionPills conditions={r.conditions} />
                ) : (
                  <span className="text-zinc-600 text-xs">No conditions</span>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <ActiveBadge active={r.is_active} />,
            },
            {
              key: 'created_at',
              header: 'Created',
              render: (r) => (
                <span className="text-zinc-500 text-xs">{formatDateShort(r.created_at)}</span>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <Button
                  variant={r.is_active ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); toggleActive(r) }}
                >
                  {r.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              ),
            },
          ]}
        />
      </div>

      {/* Create Rule Modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setForm(emptyForm()); setFormErrors({}); setSaveError(null) }}
        title="Create Automation Rule"
        size="xl"
      >
        <div className="space-y-5">
          <Field label="Rule Name" required error={formErrors.name}>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Free plan users"
              error={!!formErrors.name}
            />
          </Field>

          <Field label="Email Template" required error={formErrors.email_template_id}>
            <Select
              value={form.email_template_id}
              onChange={(e) => setForm((p) => ({ ...p, email_template_id: (e.target as HTMLSelectElement).value }))}
              error={!!formErrors.email_template_id}
            >
              <option value="">Select a template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>

          {/* Conditions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">
                Conditions <span className="text-red-400">*</span>
              </label>
              <button
                onClick={addCondition}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                + Add condition
              </button>
            </div>

            <div className="space-y-2">
              {form.conditions.map((cond, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      value={cond.field}
                      onChange={(e) => updateCondition(i, 'field', e.target.value)}
                      placeholder="plan"
                      error={!!formErrors[`cond_${i}_field`]}
                    />
                    {formErrors[`cond_${i}_field`] && (
                      <p className="text-xs text-red-400 mt-1">{formErrors[`cond_${i}_field`]}</p>
                    )}
                  </div>
                  <div className="w-28 shrink-0">
                    <Select
                      value={cond.operator}
                      onChange={(e) => updateCondition(i, 'operator', (e.target as HTMLSelectElement).value)}
                    >
                      {OPERATORS.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input
                      value={cond.value}
                      onChange={(e) => updateCondition(i, 'value', e.target.value)}
                      placeholder="free"
                      error={!!formErrors[`cond_${i}_value`]}
                    />
                    {formErrors[`cond_${i}_value`] && (
                      <p className="text-xs text-red-400 mt-1">{formErrors[`cond_${i}_value`]}</p>
                    )}
                  </div>
                  {form.conditions.length > 1 && (
                    <button
                      onClick={() => removeCondition(i)}
                      className="mt-2 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={form.is_active}
              onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.is_active ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  form.is_active ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-sm text-zinc-300">Active immediately</span>
          </div>

          {saveError && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{saveError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={() => { setShowCreate(false); setForm(emptyForm()); setFormErrors({}); setSaveError(null) }}
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={handleCreate}>
              Create Rule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
