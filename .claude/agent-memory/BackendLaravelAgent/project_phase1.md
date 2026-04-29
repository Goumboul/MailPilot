---
name: Phase 1 - Data Layer
description: What was built in Phase 1 (migrations, models, factories, seeders) and key decisions
type: project
---

Phase 1 is complete. The Laravel backend lives in `/home/lucca/projet_perso/mailpilot/backend/`.

**Database** is SQLite (dev default). MySQL config keys are commented out in `.env` and ready to activate.

**Tables created (in dependency order):**
1. `recipients` — name, email (UNIQUE), metadata JSON
2. `email_templates` — name, subject, body
3. `rules` — name, email_template_id FK, conditions JSON, is_active bool
4. `email_sends` — rule_id FK, recipient_id FK, email_template_id FK, status enum(pending/processing/sent/failed), attempt_count, scheduled_at, sent_at, failed_at, last_error
5. `email_logs` — email_send_id FK, event enum, payload JSON, created_at only (no updated_at)

**Models:** Recipient, EmailTemplate, Rule, EmailSend, EmailLog — all in `app/Models/`.

**EmailLog** has `$timestamps = false` and only `created_at` — migration uses `useCurrent()`.

**Factories:** RecipientFactory (name/email/metadata with mrr/plan/country), EmailTemplateFactory (5 fixed realistic templates, unique), RuleFactory (conditions array, active/inactive states).

**Seeder:** Creates 15 recipients, 4 email templates, 3 rules with explicit realistic conditions.

**Why:** Clean Phase 1 foundation for the rules engine and async dispatch in later phases.
**How to apply:** Phase 2 should build the rules engine and EmailSend dispatch on top of this schema without altering the tables.
