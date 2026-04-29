---
name: Phase 2 - CRUD API
description: REST API endpoints, controllers, form requests, API resources for Recipients, EmailTemplates, Rules
type: project
---

Phase 2 is complete. Full CRUD REST API is live in the `/backend` subdir.

**New files created:**
- `app/Http/Controllers/Api/RecipientController.php`
- `app/Http/Controllers/Api/EmailTemplateController.php`
- `app/Http/Controllers/Api/RuleController.php`
- `app/Http/Requests/StoreRecipientRequest.php` / `UpdateRecipientRequest.php`
- `app/Http/Requests/StoreEmailTemplateRequest.php` / `UpdateEmailTemplateRequest.php`
- `app/Http/Requests/StoreRuleRequest.php` / `UpdateRuleRequest.php`
- `app/Http/Resources/RecipientResource.php`
- `app/Http/Resources/EmailTemplateResource.php`
- `app/Http/Resources/RuleResource.php`
- `routes/api.php` (15 routes via apiResource)

**bootstrap/app.php** was updated to register `routes/api.php` (the file did not exist before — Laravel 11 omits it by default).

**Key decisions:**
- Controllers live in `App\Http\Controllers\Api\` namespace
- `RuleResource` eager-loads `emailTemplate` relation — all Rule endpoints call `load('emailTemplate')`
- `UpdateRecipientRequest` / `UpdateEmailTemplateRequest` resolve the model id from the route binding for `unique` ignore
- `conditions` validated with `min:1` array rule (non-empty array)
- No pagination, no auth — intentional for MVP

**Why:** Simple, clean CRUD layer before adding the rules engine and async dispatch in Phase 3.
**How to apply:** Phase 3 (async dispatch / queue) should build on top of these endpoints without modifying the CRUD layer.
