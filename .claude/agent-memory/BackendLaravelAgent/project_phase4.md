---
name: Phase 4 - Rules Engine and Trigger Endpoint
description: RuleEvaluator service, RuleController@trigger endpoint, Phase 3 files restored to disk
type: project
---

Phase 4 is complete. The rules engine and trigger endpoint are fully functional.

**New files created:**
- `app/Services/RuleEvaluator.php` — evaluates a Rule against a Recipient; resolves `name`, `email`, and any unrecognised field as `metadata[field]` or `metadata->field` prefix; operators: =, !=, >, <, contains; all conditions AND logic; logs malformed conditions
- `app/Services/TemplateRenderer.php` — replaces {{variable}} tokens using name/email + metadata (restored from Phase 3)
- `app/Mail/SendEmail.php` — Mailable; calls `$this->subject()` in constructor, stores body as `$renderedBody` to avoid parent property conflict (restored from Phase 3)
- `app/Jobs/SendEmailJob.php` — ShouldQueue, $tries=3, $backoff=[60,300,900]; idempotency guard (skip if status=sent); sets processing on start; logs to email_logs using `event`/`payload` columns (restored + fixed from Phase 3)
- `database/migrations/2026_04_29_000006_update_email_sends_for_async.php` — makes `rule_id` nullable; adds `processing` enum value for MySQL; uses `->change()` for SQLite

**Modified files:**
- `app/Http/Controllers/Api/RuleController.php` — added `trigger()` method
- `routes/api.php` — added `POST api/rules/{rule}/trigger`

**Trigger endpoint logic:**
1. Pre-loads existing rule+recipient combos with `pluck('recipient_id')->flip()` (O(1) lookup, avoids N+1)
2. Chunks recipients by 500
3. Per recipient: evaluate → check idempotency → create EmailSend → dispatch SendEmailJob
4. Wraps each recipient in try/catch — one failure doesn't abort the whole run
5. Logs trigger action with Log::info

**Key decisions:**
- `already_sent` counts recipients who already have an EmailSend for this rule (any status, not just sent)
- Unrecognised field names fall through to metadata lookup (no prefix needed; `metadata->` prefix also works)
- `email_logs` uses `event` (enum: queued/attempted/sent/failed/retry_scheduled) + `payload` (JSON), not status/message
- `rule_id` is now nullable on `email_sends` (ad-hoc sends without a rule)

**Verified end-to-end:**
- Trigger on 25 recipients with `plan=pro` → matched 4, enqueued 4
- Second trigger call → matched 4, already_sent 4, enqueued 0 (idempotency confirmed)
- `queue:work` processed all 4 → status=sent, attempt_count=1, sent_at populated

**Why:** The rules engine is the intelligence layer of the platform. Phase 5 (scheduler) can call trigger periodically via Laravel Scheduler.
**How to apply:** To schedule rules, call `RuleController@trigger` logic from a scheduled command or dispatch a TriggerRuleJob per active rule.
