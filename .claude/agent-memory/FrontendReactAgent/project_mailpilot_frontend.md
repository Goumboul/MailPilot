---
name: MailPilot frontend overview
description: React/Vite/Tailwind dashboard for email automation — pages, components, API client conventions
type: project
---

Stack: React 18 + TypeScript + Vite + Tailwind CSS (dark zinc palette).
Entry: `frontend/src/App.tsx` — single-page router via `useState<Page>`.

Pages: dashboard, recipients, templates, rules, sends.

## Key components

- `components/common/Button.tsx` — variants: primary, secondary, danger, ghost; sizes: sm, md; `loading` prop shows spinner
- `components/common/Modal.tsx` — sizes: md, lg, xl; closes on Escape/backdrop click
- `components/common/Table.tsx` — generic `<Table data columns loading emptyMessage>`
- `components/common/Badge.tsx` — `StatusBadge`, `LogEventBadge`, `ActiveBadge`
- `components/common/Toast.tsx` — `useToast()` hook + `<ToastContainer>` for top-right toasts (auto-dismiss 3.5s)
- `components/LogsView.tsx` — timeline modal for email send delivery events; used by SendsList

## API client (`src/lib/api.ts`)

`api.rules.trigger(id)` → POST `/rules/{id}/trigger` → `{ matched, already_sent, enqueued }`
`api.sends.logs(id)` → GET `/email-sends/{id}/logs` → `EmailLog[]`

`request<T>(url, options)` wraps fetch with timeout, APIError class, debug logging.
Laravel API resources return `{ data: T }` — use `unwrap()` helper.

## Conventions

- useState only (no Redux/Context)
- All async handlers void-cast at call site: `void handleFoo()`
- Unused params in log helpers prefixed with `_` or removed
- `useCallback` on load functions that are deps of `useEffect`

## Why
The dashboard is a recruiter-facing demo of the full backend system (trigger rules, view delivery timeline, monitor status changes).
