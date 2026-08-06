# Sprint 92A Acceptance — Scheduler & Automation Settings

## Overview

Validate that the server-side scheduling infrastructure, automation settings persistence, and job-locking mechanism work correctly and can be consumed by subsequent sprints.

---

## 1. Database Schema

### 1.1 automation_settings table exists

```
GIVEN a fresh database
WHEN the server starts
THEN the automation_settings table exists with columns:
  enabled, weekday, time, timezone, email_recipient,
  email_enabled, auto_export_enabled, grace_period_minutes, updated_at
```

### 1.2 automation_settings singleton

```
GIVEN an empty automation_settings table
WHEN the settings repository is first queried
THEN a default row is automatically inserted with:
  enabled = 0
  weekday = 0
  time = "20:00"
  timezone = "Europe/Berlin"
  email_recipient = NULL
  email_enabled = 0
  auto_export_enabled = 0
  grace_period_minutes = 240
```

### 1.3 automation_job_log table exists

```
GIVEN a fresh database
WHEN the server starts
THEN the automation_job_log table exists with columns:
  id, job_type, week_identifier, triggered_at, status,
  error_message, created_at
AND a unique constraint on (job_type, week_identifier) is enforced
```

---

## 2. Settings Repository

### 2.1 CRUD operations

```
GIVEN the default automation settings
WHEN findSettings() is called
THEN it returns the default values

WHEN saveSettings({ enabled: 1, weekday: 1, time: "08:30" }) is called
AND findSettings() is called again
THEN it returns the updated values
AND updated_at reflects the modification time
```

### 2.2 Partial updates preserve unspecified fields

```
GIVEN settings with email_recipient = "user@example.com"
WHEN saveSettings({ enabled: 1 }) is called
AND findSettings() is called
THEN email_recipient still equals "user@example.com"
```

---

## 3. JobScheduler Abstraction

### 3.1 Register and start a job

```
GIVEN a JobScheduler instance
WHEN a job "test-job" is registered with cron "*/1 * * * *"
AND the scheduler is started
THEN the job handler executes within 70 seconds
```

### 3.2 Stop prevents further execution

```
GIVEN a running JobScheduler with a "*/1 * * * *" job
WHEN stop() is called
AND 70 seconds elapse
THEN the job handler does not execute again
```

### 3.3 Replan changes cron without restart

```
GIVEN a running JobScheduler with a "*/2 * * * *" job
WHEN replan("test-job", "*/1 * * * *") is called
THEN the next execution occurs within 70 seconds of the replan call
```

### 3.4 Manual run executes immediately

```
GIVEN a registered job
WHEN runManual("test-job") is called
THEN the job handler executes within 1 second
AND the return value indicates success
```

### 3.5 Job handler errors are caught and logged

```
GIVEN a job that throws an Error
WHEN the job triggers (manually or via cron)
THEN the scheduler catches the error
AND logs it
AND the scheduler continues operating (subsequent triggers still work)
```

---

## 4. Timezone & DST Handling

### 4.1 Europe/Berlin summer time

```
GIVEN timezone = "Europe/Berlin"
AND a scheduled time of "20:00" on Sunday
DURING Central European Summer Time (CEST, UTC+2)
WHEN the cron evaluates
THEN the trigger occurs at 18:00 UTC
```

### 4.2 Europe/Berlin winter time

```
GIVEN timezone = "Europe/Berlin"
AND a scheduled time of "20:00" on Sunday
DURING Central European Time (CET, UTC+1)
WHEN the cron evaluates
THEN the trigger occurs at 19:00 UTC
```

### 4.3 Cron expression derivation

```
GIVEN weekday = 0 (Sunday), time = "20:30", timezone = "Europe/Berlin"
WHEN the scheduler builds the cron expression
THEN it produces "30 20 * * 0"
AND schedules it in the Europe/Berlin zone
```

---

## 5. Catch-up / Grace Period

### 5.1 Within grace period triggers on startup

```
GIVEN the server was offline during the scheduled trigger
AND the missed trigger is 2 hours ago
AND grace_period_minutes = 240
WHEN the server starts and the scheduler initialises
THEN the job executes once immediately
```

### 5.2 Outside grace period skips to next occurrence

```
GIVEN the server was offline during the scheduled trigger
AND the missed trigger is 6 hours ago
AND grace_period_minutes = 240
WHEN the server starts and the scheduler initialises
THEN the job does NOT execute immediately
AND the next execution is the next scheduled occurrence
```

### 5.3 Grace period of 0 disables catch-up

```
GIVEN grace_period_minutes = 0
AND a missed trigger of 1 minute
WHEN the scheduler initialises
THEN the job does NOT execute immediately
```

---

## 6. Idempotency & Job Locking

### 6.1 Unique constraint prevents duplicate week executions

```
GIVEN a job log entry exists with
  job_type = "weekly-rotation"
  week_identifier = "2026-W30"
WHEN an INSERT with the same (job_type, week_identifier) is attempted
THEN the database throws a unique constraint violation
```

### 6.2 Job lock acquisition and release

```
GIVEN no job log entry for week "2026-W31"
WHEN the weekly rotation job starts
THEN it inserts a row with status = "started"
AND triggered_at is set

WHEN the job completes successfully
THEN the row status is updated to "completed"
```

### 6.3 Failed job remains locked for the week

```
GIVEN a job that fails after inserting the "started" row
WHEN the error is caught
THEN the row status is updated to "failed"
AND error_message is populated
AND a subsequent attempt to start the same week_identifier
  is rejected by the unique constraint
```

---

## 7. API Routes

### 7.1 GET /automation/settings returns current settings

```
GIVEN authenticated request
WHEN GET /automation/settings
THEN 200 with JSON body matching AutomationSettings shape
```

### 7.2 PUT /automation/settings updates and replans

```
GIVEN authenticated request
WHEN PUT /automation/settings with { enabled: true, weekday: 5, time: "18:00" }
THEN 200 with updated settings
AND the scheduler's next trigger is recalculated for Friday 18:00
WITHOUT requiring a server restart
```

### 7.3 PUT validation rejects invalid input

```
GIVEN authenticated request
WHEN PUT /automation/settings with { weekday: 8 }
THEN 400 with validation error
```

### 7.4 POST /automation/jobs/:type/run manual trigger

```
GIVEN authenticated request with write token
WHEN POST /automation/jobs/weekly-rotation/run
THEN 202 Accepted
AND the job handler executes (or 409 if already running / locked)
```

### 7.5 GET /automation/jobs/:type/status

```
GIVEN authenticated request
WHEN GET /automation/jobs/weekly-rotation/status
THEN 200 with:
  nextRun: ISO timestamp | null
  lastRun: { startedAt, status, error? } | null
  lockedWeek: week_identifier | null
```

### 7.6 Unauthorized mutations rejected

```
GIVEN a request without write token
WHEN PUT /automation/settings
OR POST /automation/jobs/weekly-rotation/run
THEN 403 Forbidden
```

---

## 8. Integration with Server Lifecycle

### 8.1 Scheduler starts on server startup

```
GIVEN automation_settings.enabled = 1
WHEN the server starts
THEN the JobScheduler is instantiated
AND the weekly-rotation job is registered with the configured cron
AND the scheduler is started
```

### 8.2 Scheduler remains idle when disabled

```
GIVEN automation_settings.enabled = 0
WHEN the server starts
THEN the JobScheduler is instantiated
BUT no cron task is active
```

---

## 9. Error Handling & Resilience

### 9.1 Invalid cron expression is rejected

```
GIVEN a replan call with an invalid cron string
WHEN replan executes
THEN it throws a clear error
AND the previous schedule remains active
```

### 9.2 Database failure during settings update

```
GIVEN a database connection failure
WHEN PUT /automation/settings is called
THEN 500 with an error message
AND the scheduler's current schedule is unchanged
```

---

## 10. Non-Goals Verified

| Non-Goal | Verification |
|----------|--------------|
| Rotation generation | No rotation generation logic exists in this sprint |
| Export orchestration | No export pipeline interaction |
| Email sending | No SMTP or email templates |
| Client UI | No frontend changes |
| Adaptive scheduling | Only weekly-rotation job type is supported |