# Sprint 92A — Scheduler & Automation Settings

**Status:** Future

**Target version:** Future minor (not scheduled)

**Type:** Infrastructure & persistence foundation

## Goal

Establish the server-side infrastructure for automated, recurring jobs. This includes a generic but deliberately minimal `JobScheduler`, persistent automation settings, a job-locking mechanism for idempotency, and the foundational API that later sprints will consume.

## Scope

### 1. Generic JobScheduler

A thin abstraction over `node-cron` (already a server dependency) that supports:

- Registering named jobs with a cron expression and an async handler
- Starting and stopping the scheduler
- Replanning a job at runtime without restarting the server
- Executing a job manually on demand

The scheduler must **not** grow into a complex framework. It is a wrapper that adds logging, error handling, and runtime reconfiguration.

### 2. Automation Settings Persistence

Introduce a new SQLite table `automation_settings` with a singleton row:

| Column | Type | Notes |
|--------|------|-------|
| `enabled` | INTEGER (0/1) | Master switch |
| `weekday` | INTEGER (0–6) | 0 = Sunday |
| `time` | TEXT (HH:MM) | Local time in configured timezone |
| `timezone` | TEXT | Default `Europe/Berlin` |
| `email_recipient` | TEXT | Nullable |
| `email_enabled` | INTEGER (0/1) | |
| `auto_export_enabled` | INTEGER (0/1) | |
| `grace_period_minutes` | INTEGER | Max minutes after a missed trigger to still run catch-up. Default 240. |
| `updated_at` | TEXT (ISO) | |

Repository and service layer for CRUD operations.

### 3. Job Lock / Idempotency Table

`automation_job_log`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT (UUID) | |
| `job_type` | TEXT | e.g. `weekly-rotation` |
| `week_identifier` | TEXT | ISO week (e.g. `2026-W30`) for idempotency |
| `triggered_at` | TEXT (ISO) | |
| `status` | TEXT | `started` / `completed` / `failed` |
| `error_message` | TEXT | Nullable |
| `created_at` | TEXT (ISO) | |

A unique constraint on `(job_type, week_identifier)` guarantees at most one execution per calendar week.

### 4. API Routes

- `GET /automation/settings` — Read current settings
- `PUT /automation/settings` — Update settings; triggers live replanning if the scheduler is running
- `POST /automation/jobs/:type/run` — Manual trigger (for debugging)
- `GET /automation/jobs/:type/status` — Next scheduled run, last run, lock status

### 5. Timezone Handling

All scheduling calculations use the configured timezone (default `Europe/Berlin`). The scheduler must correctly handle DST transitions. The cron expression is derived from `weekday` + `time` + `timezone`.

### 6. Catch-up / Grace Period

If the server was offline at the scheduled time, the scheduler evaluates on startup whether the last missed trigger falls within the configured grace period. If yes, it executes the job immediately (once). If no, it skips to the next scheduled occurrence.

### 7. Integration Points

- The scheduler is instantiated in `server/src/index.ts` alongside `backupScheduler`.
- It consumes the automation settings service.
- It exposes a manual trigger endpoint protected by `requireWriteTokenForMutations`.

## Non-Goals

- Rotation generation logic (92B)
- Export orchestration (92B)
- Email sending (92C)
- Client UI (92D / 92E)
- Adaptive scheduling or multiple concurrent job types beyond `weekly-rotation`

## Technical Decisions

### Why a singleton settings row?

Automation is a global system behaviour, not per-user. A singleton simplifies the domain model and avoids migration complexity.

### Why `week_identifier` instead of a raw timestamp?

It makes the idempotency intent explicit: one job per calendar week. A timestamp-based lock would be harder to reason about across DST boundaries.

### Why 240 minutes default grace period?

Covers typical NAS overnight shutdowns or brief maintenance windows without being so long that a Monday-morning start-up would accidentally trigger Sunday evening’s job.

## Definition of Done

- [ ] `automation_settings` and `automation_job_log` tables created via migration
- [ ] Repository and service layers exist and are covered by unit tests
- [ ] `JobScheduler` abstraction wraps `node-cron`, supports register/start/stop/replan/manual-run
- [ ] Updating settings via API immediately recalculates the next cron trigger without server restart
- [ ] Timezone-aware scheduling works correctly across DST transitions
- [ ] Grace-period catch-up logic is implemented and tested
- [ ] Unique constraint on `(job_type, week_identifier)` prevents duplicate weekly runs
- [ ] Manual trigger endpoint exists and is write-token protected
- [ ] All new code passes lint and type-check
- [ ] Integration tests verify API contract and scheduler behaviour
