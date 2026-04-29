import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { formatDateShort } from '../lib/utils'
import { Table } from './common/Table'
import { Button } from './common/Button'
import { Modal } from './common/Modal'
import { Field, Input, Select } from './common/Form'
import { ActiveBadge } from './common/Badge'
import { ToastContainer, useToast } from './common/Toast'
import type { Rule, EmailTemplate, Condition } from '../types'

/* ------------------------------------------------------------------ */
/*  Condition pills                                                     */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Trigger result modal                                                */
/* ------------------------------------------------------------------ */

interface TriggerResult {
  matched: number
  already_sent: number
  enqueued: number
}

function TriggerResultModal({
  rule,
  result,
  onClose,
}: {
  rule: Rule | null
  result: TriggerResult | null
  onClose: () => void
}) {
  if (!rule || !result) return null

  return (
    <Modal open={!!rule} onClose={onClose} title="" size="md">
      <div className="space-y-6">
        {/* Success header */}
        <div className="text-center pt-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 mb-3">
            <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-100">Rule Triggered</h3>
          <p className="text-sm text-zinc-500 mt-0.5">{rule.name}</p>
        </div>

        {/* Big numbers */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-zinc-800 ring-1 ring-zinc-700 p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-zinc-100">{result.matched}</p>
            <p className="mt-1 text-xs text-zinc-500 leading-tight">matched</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-emerald-400">{result.enqueued}</p>
            <p className="mt-1 text-xs text-emerald-600 leading-tight">enqueued</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-amber-400">{result.already_sent}</p>
            <p className="mt-1 text-xs text-amber-600 leading-tight">skipped</p>
          </div>
        </div>

        {result.enqueued > 0 && (
          <div className="rounded-lg bg-emerald-500/5 ring-1 ring-emerald-500/15 px-4 py-3 text-center">
            <p className="text-sm text-emerald-400 font-medium">
              {result.enqueued} email{result.enqueued !== 1 ? 's' : ''} added to the delivery queue
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Check the Sends page to monitor status in real time
            </p>
          </div>
        )}

        {result.enqueued === 0 && result.matched > 0 && (
          <p className="text-sm text-zinc-500 text-center">
            All matching recipients have already received this email.
          </p>
        )}

        {result.matched === 0 && (
          <p className="text-sm text-zinc-500 text-center">
            No recipients matched the conditions for this rule.
          </p>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Rule form                                                           */
/* ------------------------------------------------------------------ */

const emptyCondition = () => ({ field: '', operator: '=', value: '' })

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

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export function RulesList() {
  const [rules, setRules] = useState<Rule[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create rule form
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<RuleForm>(emptyForm())
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Trigger state
  const [triggeringId, setTriggeringId] = useState<number | null>(null)
  const [triggerResult, setTriggerResult] = useState<TriggerResult | null>(null)
  const [triggerRule, setTriggerRule] = useState<Rule | null>(null)

  const { toasts, push, dismiss } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([api.rules.list(), api.templates.list()])
      .then(([r, t]) => {
        setRules(r)
        setTemplates(t)
      })
      .catch((err) => setError(err?.message ?? 'Failed to load rules'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  /* ---- Condition helpers ---- */
  const addCondition = () =>
    setForm((p) => ({ ...p, conditions: [...p.conditions, emptyCondition()] }))

  const removeCondition = (i: number) =>
    setForm((p) => ({ ...p, conditions: p.conditions.filter((_, idx) => idx !== i) }))

  const updateCondition = (
    i: number,
    key: 'field' | 'operator' | 'value',
    value: string,
  ) =>
    setForm((p) => {
      const conds = [...p.conditions]
      conds[i] = { ...conds[i], [key]: value }
      return { ...p, conditions: conds }
    })

  /* ---- Create rule ---- */
  const handleCreate = async () => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.email_template_id) errors.email_template_id = 'Template is required'
    form.conditions.forEach((c, i) => {
      if (!c.field.trim()) errors[`cond_${i}_field`] = 'Field required'
      if (!c.value.trim()) errors[`cond_${i}_value`] = 'Value required'
    })
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

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
      push(`Rule "${created.name}" created`)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setSaveError(e?.message ?? 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  /* ---- Toggle active ---- */
  const toggleActive = async (rule: Rule) => {
    try {
      const updated = await api.rules.update(rule.id, { is_active: !rule.is_active })
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)))
    } catch {
      // silent
    }
  }

  /* ---- Trigger rule ---- */
  const handleTrigger = async (rule: Rule) => {
    setTriggeringId(rule.id)
    try {
      const result = await api.rules.trigger(rule.id)
      setTriggerResult(result)
      setTriggerRule(rule)
      push(`Triggered! ${result.matched} matched, ${result.enqueued} enqueued`)
      load()
    } catch (err: unknown) {
      const e = err as { message?: string }
      push(e?.message ?? 'Failed to trigger rule', 'error')
    } finally {
      setTriggeringId(null)
    }
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 ring-1 ring-red-500/20 p-5 text-red-400">
        <p className="font-medium">API Error</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Rules</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Create automation rules to send emails based on recipient conditions &mdash; {rules.filter((r) => r.is_active).length} active / {rules.length} total
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
                render: (r) => <span className="font-medium text-zinc-100">{r.name}</span>,
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
                  <div className="flex items-center gap-2 justify-end">
                    {/* Trigger — hero action */}
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        disabled={!r.is_active || triggeringId !== null}
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleTrigger(r)
                        }}
                        className={`
                          inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold
                          transition-all duration-150 focus-visible:outline focus-visible:outline-2
                          focus-visible:outline-offset-2 focus-visible:outline-emerald-500
                          disabled:opacity-40 disabled:cursor-not-allowed
                          ${r.is_active && triggeringId !== r.id
                            ? 'bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-md hover:shadow-emerald-500/30 active:scale-95 animate-pulse'
                            : 'bg-emerald-600/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/30'
                          }
                          ${triggeringId === r.id ? 'animate-none' : ''}
                        `}
                      >
                        {triggeringId === r.id ? (
                          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                        {triggeringId === r.id ? 'Running...' : 'Trigger'}
                      </button>
                      {r.is_active && triggeringId !== r.id && (
                        <span className="text-[10px] text-emerald-600 font-medium">Try it now</span>
                      )}
                    </div>

                    {/* Toggle active */}
                    <Button
                      variant={r.is_active ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        void toggleActive(r)
                      }}
                    >
                      {r.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Create rule modal */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false)
          setForm(emptyForm())
          setFormErrors({})
          setSaveError(null)
        }}
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
              onChange={(e) =>
                setForm((p) => ({ ...p, email_template_id: (e.target as HTMLSelectElement).value }))
              }
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
                      onChange={(e) =>
                        updateCondition(i, 'operator', (e.target as HTMLSelectElement).value)
                      }
                    >
                      {OPERATORS.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
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
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
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
              onClick={() => {
                setShowCreate(false)
                setForm(emptyForm())
                setFormErrors({})
                setSaveError(null)
              }}
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={handleCreate}>
              Create Rule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Trigger result modal */}
      <TriggerResultModal
        rule={triggerRule}
        result={triggerResult}
        onClose={() => {
          setTriggerRule(null)
          setTriggerResult(null)
        }}
      />
    </>
  )
}
