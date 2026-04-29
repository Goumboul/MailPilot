import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { formatDateShort } from '../lib/utils'
import { Table } from './common/Table'
import { Button } from './common/Button'
import { Modal } from './common/Modal'
import { Field, Input, Textarea } from './common/Form'
import type { EmailTemplate } from '../types'

interface PreviewModalProps {
  template: EmailTemplate | null
  onClose: () => void
}

function PreviewModal({ template, onClose }: PreviewModalProps) {
  if (!template) return null
  return (
    <Modal open={!!template} onClose={onClose} title="Template Preview" size="xl">
      <div className="space-y-4">
        <div className="rounded-lg bg-zinc-800/50 px-4 py-3 ring-1 ring-zinc-700">
          <p className="text-xs text-zinc-500 mb-1">Subject</p>
          <p className="text-sm font-medium text-zinc-100">{template.subject}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 px-4 py-3 ring-1 ring-zinc-700">
          <p className="text-xs text-zinc-500 mb-2">Body</p>
          <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
            {template.body}
          </pre>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800 pt-3">
          <span>Template: <span className="text-zinc-400 font-medium">{template.name}</span></span>
          <span>Created {formatDateShort(template.created_at)}</span>
        </div>
      </div>
    </Modal>
  )
}

interface TemplateForm {
  name: string
  subject: string
  body: string
}

const emptyForm: TemplateForm = { name: '', subject: '', body: '' }

export function TemplatesList() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<EmailTemplate | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<TemplateForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<TemplateForm>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    api.templates
      .list()
      .then(setTemplates)
      .catch((err) => setError(err?.message ?? 'Failed to load templates'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async () => {
    const errors: Partial<TemplateForm> = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.subject.trim()) errors.subject = 'Subject is required'
    if (!form.body.trim()) errors.body = 'Body is required'
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    setSaving(true)
    setSaveError(null)
    try {
      const created = await api.templates.create({
        name: form.name.trim(),
        subject: form.subject.trim(),
        body: form.body.trim(),
      })
      setTemplates((prev) => [created, ...prev])
      setShowCreate(false)
      setForm(emptyForm)
      setFormErrors({})
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> }
      if (e?.errors) {
        const mapped: Partial<TemplateForm> = {}
        if (e.errors.name) mapped.name = e.errors.name[0]
        if (e.errors.subject) mapped.subject = e.errors.subject[0]
        if (e.errors.body) mapped.body = e.errors.body[0]
        setFormErrors(mapped)
      } else {
        setSaveError(e?.message ?? 'Failed to save template')
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Email Templates</h2>
          <p className="text-sm text-zinc-500">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Template
        </Button>
      </div>

      <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
        <Table
          loading={loading}
          data={templates}
          emptyMessage="No templates yet. Create one to get started."
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (t) => (
                <span className="font-medium text-zinc-100">{t.name}</span>
              ),
            },
            {
              key: 'subject',
              header: 'Subject',
              render: (t) => (
                <span className="text-zinc-400 text-sm">{t.subject}</span>
              ),
            },
            {
              key: 'body_preview',
              header: 'Preview',
              render: (t) => (
                <span className="text-zinc-600 text-xs line-clamp-1 max-w-xs">
                  {t.body.slice(0, 80)}{t.body.length > 80 ? '…' : ''}
                </span>
              ),
            },
            {
              key: 'created_at',
              header: 'Created',
              render: (t) => (
                <span className="text-zinc-500 text-xs">{formatDateShort(t.created_at)}</span>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (t) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setPreview(t) }}
                >
                  Preview
                </Button>
              ),
            },
          ]}
        />
      </div>

      <PreviewModal template={preview} onClose={() => setPreview(null)} />

      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setForm(emptyForm); setFormErrors({}); setSaveError(null) }}
        title="New Email Template"
        size="xl"
      >
        <div className="space-y-4">
          <Field label="Template Name" required error={formErrors.name}>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Welcome email"
              error={!!formErrors.name}
            />
          </Field>
          <Field label="Subject" required error={formErrors.subject}>
            <Input
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Welcome to MailPilot, {{name}}!"
              error={!!formErrors.subject}
            />
          </Field>
          <Field
            label="Body"
            required
            error={formErrors.body}
            hint="Use {{variable}} syntax for personalization"
          >
            <Textarea
              rows={8}
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              placeholder={`Hi {{name}},\n\nWelcome aboard!\n\nBest,\nThe MailPilot Team`}
              error={!!formErrors.body}
            />
          </Field>

          {saveError && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{saveError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => { setShowCreate(false); setForm(emptyForm); setFormErrors({}); setSaveError(null) }}
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={handleCreate}>
              Create Template
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
