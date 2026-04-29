# MailPilot

Rule-based email automation platform with async processing, retry logic, and full observability.

[![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?style=flat-square&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql)](https://www.mysql.com)
[![Queue](https://img.shields.io/badge/Queue-Database%20Driver-blue?style=flat-square)](https://laravel.com/docs/queues)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

## Overview

MailPilot is a production-ready email automation system that demonstrates real-world backend challenges: async processing, retry logic, distributed state management, and observability. It's built as a portfolio project to showcase full-stack architecture decisions and engineering patterns.

**Use case:** Automatically send targeted emails to users based on conditions (plan type, geography, MRR) without blocking requests. Track delivery, handle failures, retry failed jobs, and provide complete audit logs.

## Architecture

### How It Works

```
1. Define Rule
   ├─ Name: "Free plan users"
   ├─ Template: Welcome email with {{variables}}
   └─ Conditions: [{ field: "plan", operator: "=", value: "free" }]

2. Trigger Rule
   ├─ Evaluate conditions against all recipients
   ├─ Match: 47 users with plan=free
   └─ Create 47 EmailSend records (status: pending)

3. Queue Processing
   ├─ SendEmailJob dispatched per send
   ├─ Render variables from recipient metadata
   ├─ Send email via SMTP
   └─ Update status → sent

4. Failure & Retry
   ├─ Exception? Set status=failed, log error
   ├─ Queue retries: 60s → 300s → 900s backoff
   └─ Final failure? Log and mark complete

5. Observability
   ├─ EmailLog: append-only event stream
   ├─ Events: queued, attempted, sent, failed, retry_scheduled
   └─ Dashboard shows full timeline per send
```

### Data Flow Diagram

```
Frontend                          Backend
────────────────────────────────────────────

Dashboard                         API
  ├─ Rules page                  ├─ GET /api/rules
  │  └─ Click [Trigger]          └─ POST /api/rules/{id}/trigger
  │                                   ↓
  ├─ Rules Service               RuleEvaluator
  │  └─ Match recipients          ├─ Evaluate conditions (AND logic)
  │                               ├─ field: "plan", operator: "=", value: "free"
  ├─ Sends page                   └─ Return matching recipients
  │  └─ Watch status change           ↓
  │     pending → sent            Create EmailSend
  │                               └─ status: pending
  ├─ View Logs                        ↓
  │  └─ Timeline of events        Dispatch SendEmailJob
  │                               (database queue driver)
  └─ (auto-refresh)                  ↓
                                  Queue Worker
                                  ├─ Load recipient + template
                                  ├─ Render {{variables}}
                                  ├─ Send via Mail facade
                                  └─ Write status + log
                                      ↓
                                  Success / Failure
                                  ├─ EmailSend: sent/failed
                                  └─ EmailLog: event record
```

## Features

### 1. Rule-Based Automation
- **AND logic conditions**: Combine multiple filters (plan, country, MRR, custom metadata)
- **Simple operators**: `=`, `!=`, `>`, `<`, `contains`
- **Recipient targeting**: Dynamic field resolution (recipient attributes + JSON metadata)
- **No nested groups**: MVP keeps conditions flat for clarity and performance

### 2. Async Processing
- **Non-blocking**: Rule trigger returns immediately, jobs queued for background processing
- **Database queue driver**: No external dependencies (Redis/RabbitMQ)
- **Scalable**: Process hundreds of jobs without blocking the API
- **Idempotent**: Duplicate triggers don't re-send to same recipient

### 3. Retry Logic & Reliability
- **Exponential backoff**: 60s → 300s → 900s between retries
- **3 attempts**: Configurable retry count and delays
- **Final failure tracking**: Failed sends marked and logged for review
- **Error context**: Last error message stored for debugging

### 4. Logging & Observability
- **Event stream**: Append-only `email_logs` table (immutable history)
- **Event types**: `queued`, `attempted`, `sent`, `failed`, `retry_scheduled`
- **Request tracing**: Every send has full event timeline
- **Dashboard visibility**: Real-time status tracking and log viewing

### 5. Dashboard UI
- **Real-time stats**: Total sent, success rate, pending, active rules
- **Rule management**: Create, edit, trigger rules from UI
- **Send tracking**: Filter by status, view recipient + template
- **Log timeline**: Click any send to see full delivery history
- **Clean design**: Dark theme, color-coded status, smooth animations

## Tech Stack

### Backend
- **Framework**: Laravel 13 (PHP 8.3)
- **Database**: MySQL 8.0
- **Queue Driver**: Database (built-in)
- **Mail**: Laravel Mail facade (SMTP/config-driven)
- **API**: REST, JSON, proper HTTP status codes
- **Auth**: None yet (add token-based if needed)

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build**: Vite 8
- **Styling**: Tailwind CSS 4
- **State**: useState (no Redux/Context for MVP)
- **HTTP**: Fetch API with custom error handling

### Database Schema
```
recipients          — contacts with metadata JSON
email_templates     — templates with {{variables}}
rules               — conditions array + template reference
email_sends         — state machine (pending/sent/failed)
email_logs          — append-only event stream
jobs                — Laravel queue (background processing)
```

## Getting Started

### Prerequisites
- PHP 8.3+
- Node.js 18+
- MySQL 8.0+
- Composer

### Installation

**1. Clone and setup**
```bash
git clone <repo>
cd mailpilot
```

**2. Backend setup**
```bash
cd backend

# Install dependencies
composer install

# Copy environment
cp .env.example .env

# Generate key
php artisan key:generate

# Migrate database
php artisan migrate --seed

# Start server
php artisan serve
# http://127.0.0.1:8000
```

**3. Queue worker** (in another terminal)
```bash
cd backend
php artisan queue:work
```

**4. Frontend setup**
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# http://127.0.0.1:4173
```

### First Use

**1. Seed data** (already included in migrations)
```bash
php artisan tinker
> App\Models\Recipient::factory(20)->create()
> $tpl = App\Models\EmailTemplate::factory()->create()
> exit
```

**2. Create a rule**
- Open http://127.0.0.1:4173/rules
- Click "New Rule"
- Name: "Free users"
- Template: (select from list)
- Condition: `plan = free`
- Save

**3. Trigger the rule**
- Click the green "▶ Trigger" button
- See matched count + enqueued jobs
- Modal shows results

**4. Watch processing**
- Go to "Email Sends" page
- See pending jobs with status badge
- Watch status change to `sent` as queue processes

**5. View logs**
- Click "View Logs" on any send
- See timeline: attempted → sent

## Design Decisions

### Why Flat Conditions (Not Nested Groups)

Nested AND/OR groups sound powerful but add complexity:
- **Recursive evaluation**: Hard to test and reason about
- **Complex UI**: Builder becomes difficult
- **MVP scope**: 95% of use cases don't need nested logic

Trade-off: All conditions are AND. If you need OR, create separate rules. Keeps it simple and fast.

### Why Database Queue (Not Redis/RabbitMQ)

External services add ops burden:
- **Setup**: Docker, networking, persistence
- **Ops**: Monitoring, failover, upgrades
- **Cost**: Not worth it for MVP

Database queue is:
- ✅ Zero dependencies (already have MySQL)
- ✅ Reliable (ACID transactions)
- ✅ Observable (query jobs anytime)
- ⚠️ Slower than Redis, but good enough for this scale
- ⚠️ Won't scale to millions of jobs (but that's not today's problem)

When to upgrade: 10k+ jobs/day, measured.

### Why Append-Only Logs (Not Mutable Status Fields)

You could just update `email_sends.status` and skip logs:
```
email_sends.status = sent ✗ (loses history)
email_logs.event = sent ✓ (keeps history)
```

Trade-off: One extra INSERT per state change, but you get:
- ✅ Full audit trail (who changed what when)
- ✅ Retry history visible
- ✅ Debugging: "why did this fail 3 times?"
- ✅ Durable: Can't lose an event

This is how production mailers work (SendGrid, Postmark logs everything).

### Why Reusable Templates (Not In-Rule)

Could embed template in every rule:
```json
{
  "name": "Rule 1",
  "template_body": "Hi {{name}}...",
  "template_subject": "..."
}
```

Instead, we reference templates:
```json
{
  "name": "Rule 1",
  "email_template_id": 5
}
```

Benefits:
- ✅ Reuse templates across rules
- ✅ Update template once, all rules use new version
- ✅ Snapshot safety: old sends keep old template (foreign key)
- ✅ Clean separation of concerns

## Project Structure

```
mailpilot/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Models/            # Eloquent models
│   │   ├── Jobs/              # Queue jobs
│   │   ├── Services/          # Business logic
│   │   ├── Mail/              # Mailable classes
│   │   └── Http/Controllers/  # API endpoints
│   ├── database/
│   │   ├── migrations/        # Schema
│   │   ├── factories/         # Test data
│   │   └── seeders/           # Seed scripts
│   ├── routes/api.php         # REST endpoints
│   └── artisan                # CLI
│
├── frontend/                   # React dashboard
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── lib/api.ts         # API client
│   │   ├── types/             # TypeScript interfaces
│   │   └── App.tsx            # Root component
│   ├── vite.config.ts         # Build config
│   └── package.json
│
├── .github/workflows/          # CI/CD
│   └── backend-ci.yml         # GitHub Actions
│
└── README.md
```

## API Endpoints

### Rules
```
GET    /api/rules               # List all rules
POST   /api/rules               # Create rule
GET    /api/rules/{id}          # Get rule
PUT    /api/rules/{id}          # Update rule
DELETE /api/rules/{id}          # Delete rule
POST   /api/rules/{id}/trigger  # Trigger rule → queue sends
```

### Email Sends
```
GET    /api/email-sends         # List all sends (with status filter)
GET    /api/email-sends/{id}    # Get send details
GET    /api/email-sends/{id}/logs # Get logs for a send
```

### Recipients
```
GET    /api/recipients          # List all
POST   /api/recipients          # Create
GET    /api/recipients/{id}     # Get
PUT    /api/recipients/{id}     # Update
DELETE /api/recipients/{id}     # Delete
```

### Email Templates
```
GET    /api/email-templates     # List all
POST   /api/email-templates     # Create
GET    /api/email-templates/{id}# Get
PUT    /api/email-templates/{id}# Update
DELETE /api/email-templates/{id}# Delete
```

## What This Project Demonstrates

### Backend Engineering
- ✅ **Async patterns**: Non-blocking operations with queue workers
- ✅ **State machines**: EmailSend status transitions with guards
- ✅ **Retry logic**: Exponential backoff, failed job handling
- ✅ **Event sourcing**: Append-only logs for audit trail
- ✅ **Idempotency**: Duplicate triggers don't create duplicate sends
- ✅ **Error handling**: Graceful failures, detailed logging
- ✅ **REST API design**: Proper status codes, consistent responses

### Frontend Engineering
- ✅ **React patterns**: Hooks, state management, side effects
- ✅ **Real-time UX**: Loading states, error handling, auto-refresh
- ✅ **API integration**: Fetch client, error recovery, timeouts
- ✅ **Design systems**: Reusable components, consistent styling
- ✅ **TypeScript**: Type-safe API calls and props

### Database Design
- ✅ **Normalization**: Proper relationships (1:N, FK integrity)
- ✅ **Indexing**: Query optimization (status, created_at)
- ✅ **JSON columns**: Flexible metadata without EAV tables
- ✅ **Snapshot safety**: Immutable payload storage

### DevOps & Observability
- ✅ **Logging**: Structured event logs (not just timestamps)
- ✅ **Monitoring**: Dashboard stats (sent, pending, failed)
- ✅ **Health checks**: API health indicator in UI
- ✅ **Error tracking**: Last error message per failed send
- ✅ **CI/CD**: GitHub Actions for automated testing

## Future Improvements

Not needed for MVP, but interesting follow-ups:
- Authentication (Sanctum tokens)
- Template preview/test send
- Scheduled sends (cron-based)
- Webhook integrations
- Email provider abstraction (SendGrid, Postmark)
- Advanced segmentation (nested rules, A/B testing)
- Analytics dashboard (open rates, click tracking)
- Rate limiting & throttling

## Testing

### Manual Testing
```bash
# Seed fresh data
php artisan migrate:fresh --seed

# Create a rule
php artisan tinker
> $rule = App\Models\Rule::first()

# Trigger via API
curl -X POST http://127.0.0.1:8000/api/rules/1/trigger

# Process queue
php artisan queue:work --stop-when-empty

# Check results
> App\Models\EmailSend::count()
> App\Models\EmailLog::count()
```

### GitHub Actions
Runs on every PR:
- Laravel migrations
- Database seeding
- Test suite (future)

## Development

### Running Locally

```bash
# Terminal 1: Backend
cd backend && php artisan serve

# Terminal 2: Queue
cd backend && php artisan queue:work

# Terminal 3: Frontend
cd frontend && npm run dev
```

### Debugging

**Backend**
```bash
# Tail logs
tail -f backend/storage/logs/laravel.log

# Inspect queue
php artisan queue:work --verbose
```

**Frontend**
```bash
# Console logs
- Open DevTools (F12)
- Check Console tab for [API] logs
- Network tab shows request/response
```

**Database**
```bash
php artisan tinker
> DB::table('email_sends')->where('status', 'failed')->get()
```

## License

MIT License — See [LICENSE](LICENSE) file for details.

---

**Built to demonstrate production-grade system design, not production-ready email service.**
