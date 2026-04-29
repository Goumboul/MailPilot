---
name: MailPilot Project Context
description: Core project definition for the Email Automation Platform (MailPilot) — refined architecture, 5-table schema, no campaigns layer
type: project
---

Email Automation Platform called MailPilot. Designed and refined on 2026-04-29.

Stack: Laravel (backend), MySQL (database), React (frontend — to be built later).

## Architecture Decisions (Refined)

- No campaigns table. Rules reference one email_template directly and match multiple recipients.
- Rule conditions are flat (no nested groups): field / operator / value only, evaluated against recipient metadata JSON.
- Email sending is manually triggered (POST /api/rules/{id}/trigger). No auto-evaluation cron.
- email_sends is a state machine: pending → sent | failed.
- email_logs is append-only: every attempt, error, and timestamp is recorded.
- Async via Laravel queues. Retry backoff: [60s, 300s, 900s].

## 5-Table Schema

1. recipients — id, name, email, metadata (JSON), created_at, updated_at
2. email_templates — id, name, subject, body (HTML, supports {{variables}}), created_at, updated_at
3. rules — id, name, email_template_id (FK), conditions (JSON array of {field, operator, value}), is_active, created_at, updated_at
4. email_sends — id, rule_id (FK), recipient_id (FK), email_template_id (FK), status (enum: pending/sent/failed), scheduled_at, sent_at, failed_at, attempt_count, last_error, created_at, updated_at
5. email_logs — id, email_send_id (FK), event (enum: queued/attempted/sent/failed/retried), payload (JSON), created_at

## Model Relationships

- Rule belongsTo EmailTemplate
- Rule hasMany EmailSends
- Recipient hasMany EmailSends
- EmailTemplate hasMany EmailSends
- EmailSend belongsTo Rule, Recipient, EmailTemplate
- EmailSend hasMany EmailLogs

## Sending Flow

1. POST /api/rules/{id}/trigger
2. Rule fetches all recipients
3. Rule conditions evaluated per recipient against metadata JSON
4. Matching recipients get one EmailSend record created (status: pending)
5. SendEmailJob dispatched per EmailSend
6. Job renders template with recipient variables, sends via Mailer
7. On success: EmailSend → sent, EmailLog event: sent
8. On failure: EmailSend → failed, EmailLog event: failed, job retried with backoff [60s, 300s, 900s]

## API Endpoints

POST   /api/recipients
GET    /api/recipients
GET    /api/recipients/{id}
PUT    /api/recipients/{id}
DELETE /api/recipients/{id}

POST   /api/email-templates
GET    /api/email-templates
GET    /api/email-templates/{id}
PUT    /api/email-templates/{id}
DELETE /api/email-templates/{id}

POST   /api/rules
GET    /api/rules
GET    /api/rules/{id}
PUT    /api/rules/{id}
DELETE /api/rules/{id}
POST   /api/rules/{id}/trigger    ← manual trigger

GET    /api/email-sends
GET    /api/email-sends/{id}

GET    /api/email-logs
GET    /api/email-logs/{email_send_id}

## Implementation Order

Phase 1 — Foundation: migrations, models, relationships, factories, seeders
Phase 2 — Core CRUD: recipients, email_templates, rules endpoints
Phase 3 — Sending Engine: SendEmailJob, queue setup, retry backoff, email_sends + email_logs writes
Phase 4 — Trigger Endpoint: POST /api/rules/{id}/trigger, RuleEvaluator service, matching logic
Phase 5 — Monitoring: GET email-sends (with filters), GET email-logs, basic dashboard data
Phase 6 — React Frontend: rule builder, recipient list, send history, log viewer

**Why:** Keeps the MVP understandable in 2 minutes while demonstrating async processing, retry logic, structured logging, and rule evaluation — the four key engineering concepts for recruiter credibility.

**How to apply:** Keep suggestions simple and idiomatic Laravel. Avoid premature abstractions. Prefer working code over elegant patterns.
