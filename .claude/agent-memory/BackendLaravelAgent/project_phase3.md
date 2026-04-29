---
name: Phase 3 - Async Email Sending System
description: Jobs, Mailable, TemplateRenderer, EmailSend API, full queue pipeline built in Phase 3
type: project
---

Phase 3 is complete. The async email dispatch pipeline is fully functional.

**New files created:**
- `app/Jobs/SendEmailJob.php` — ShouldQueue, $tries=3, $backoff=[60,300,900], idempotency guard (skip if status=sent), handle() with TemplateRenderer injection, failed() hook for final failure logging
- `app/Mail/SendEmail.php` — Mailable using html(); $subject property conflict with parent resolved by calling $this->subject() in constructor and storing body as $renderedBody
- `app/Services/TemplateRenderer.php` — replaces {{variable}} tokens from recipient name/email + metadata
- `app/Http/Controllers/Api/EmailSendController.php` — index, store (dispatches job), show, logs (GET /email-sends/{id}/logs), destroy
- `app/Http/Requests/StoreEmailSendRequest.php`
- `app/Http/Resources/EmailSendResource.php`, `EmailLogResource.php`

**Phase 2 files also created (were in memory but not on disk):**
- Controllers: `Api/RecipientController.php`, `Api/EmailTemplateController.php`, `Api/RuleController.php`
- Requests: Store/Update for Recipient, EmailTemplate, Rule
- Resources: RecipientResource, EmailTemplateResource, RuleResource
- `routes/api.php` — 20 routes total
- `bootstrap/app.php` updated to register `api: routes/api.php`

**Migrations added:**
- `2026_04_29_000006_add_processing_status_to_email_sends.php` — adds 'processing' enum value (no-op for SQLite, ALTER for MySQL)
- `2026_04_29_000007_make_rule_id_nullable_on_email_sends.php` — rule_id is nullable (ad-hoc sends without a rule)

**Key decisions:**
- Idempotency guard checks `status === 'sent'` (not `!== 'pending'`), so retries can proceed after a failed attempt
- Job sets `status = 'processing'` at the start of each attempt, then `sent` or `failed`
- `SendEmail` mailable calls `$this->subject()` in constructor instead of promoted property to avoid conflict with `Illuminate\Mail\Mailable::$subject`
- `rule_id` is nullable at DB level — email sends can be created ad-hoc without a rule
- `MAIL_MAILER=log` in dev — emails appear in `storage/logs/laravel.log`
- `QUEUE_CONNECTION=database` — jobs stored in `jobs` table, process with `php artisan queue:work`

**Why:** Phase 3 is the core of the platform. Demonstrates async processing, retry backoff, and structured logging.
**How to apply:** Phase 4 (rules engine / scheduler) should build on top of this by creating EmailSend records and dispatching SendEmailJob for each matching recipient.
