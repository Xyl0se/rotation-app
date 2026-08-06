# Sprint 92B Acceptance — Server-Side Rotation Generation & Orchestration

## Overview

Validate that rotation generation runs server-side using shared domain logic, that the automated workflow (generate → activate → export) executes atomically and idempotently, and that failures never corrupt the previous export.

---

## 1. Shared Domain Module

### 1.1 Pure domain logic, no UI dependencies

```
GIVEN the shared rotation-plan module
WHEN its source files are inspected
THEN no imports from React, browser APIs, or UI frameworks exist
AND the module exports generateRotationPlan, findReplacementCandidates,
  RotationPlan, RotationPlanItem, RotationRoleQuota, defaultRotationTargetSize
```

### 1.2 Identical behaviour on client and server

```
GIVEN a fixed album list and fixed random seed
WHEN generateRotationPlan(albums, options) is called in the client test suite
AND the same call is made in the server test suite
THEN both produce identical RotationPlan output
  (same albumIds, same roles, same reasons, same order)
```

### 1.3 Shared module is importable by server

```
GIVEN the server TypeScript build
WHEN tsc --noEmit runs in server/
THEN no "module not found" or "cannot resolve" errors occur
  for imports from the shared rotation-plan module
```

---

## 2. RotationGenerationService

### 2.1 Generates a rotation from eligible albums

```
GIVEN 50 eligible albums in the library
  (categories: new, growing, comfort-food, classic)
AND rotation settings with targetSize = 10
WHEN rotationGenerationService.createNextRotation() is called
THEN it returns a RotationPlan with status = "active"
AND plan.items.length equals targetSize
AND all items reference existing, eligible albums
```

### 2.2 Excludes archived and on-hold albums

```
GIVEN 5 archived albums and 5 on-hold albums in the library
WHEN rotationGenerationService.createNextRotation() is called
THEN no archived or on-hold album appears in the generated plan
```

### 2.3 Archives the previous active rotation

```
GIVEN an active rotation plan exists
WHEN rotationGenerationService.createNextRotation() is called
THEN the previous plan's status becomes "archived"
AND archivedAt is set to the current timestamp
```

### 2.4 Focus album is null after automated activation

```
GIVEN an active rotation with focusAlbumId = "abc123"
WHEN a new automated rotation is generated and activated
THEN the new active plan's focusAlbumId is null
```

### 2.5 Drafts are cleaned up on activation

```
GIVEN an existing draft rotation
WHEN rotationGenerationService.createNextRotation() activates a new plan
THEN the old draft is removed from the database
```

### 2.6 Respects rotation settings from the database

```
GIVEN rotation settings with custom role quotas
  (e.g. 3 new, 4 growing, 3 classic)
WHEN rotationGenerationService.createNextRotation() is called
THEN the generated plan's items reflect the configured quotas
```

---

## 3. Headless Export Orchestration

### 3.1 Atomic successful export

```
GIVEN a valid active rotation plan with confirmed bindings
WHEN automatedExportService.runHeadlessExport(planId) is called
THEN the export lock is acquired
AND staging completes successfully
AND the export is applied
AND the export lock is released
AND the returned result contains:
  exportPath, archivePath (or null), diff, fileCount, totalSizeBytes
```

### 3.2 Failed staging rolls back and preserves previous export

```
GIVEN a rotation plan where one binding points to a missing file
WHEN automatedExportService.runHeadlessExport(planId) is called
THEN staging fails
AND the export lock is released
AND no previous export directory is modified
AND the staging directory is cleaned up
AND the thrown error contains "EXPORT_NOT_READY" or the original staging error
```

### 3.3 Failed apply rolls back staging

```
GIVEN a staging that completes successfully
AND an apply step that fails (simulated filesystem error)
WHEN the error is caught
THEN the staging directory is rolled back
AND the export lock is released
AND the previous export remains untouched
```

### 3.4 Lock is always released on error

```
GIVEN any failure scenario during headless export
WHEN the error propagates
THEN the export lock is released
AND a subsequent manual or automated export can acquire the lock
```

### 3.5 Cannot run headless export without active rotation

```
GIVEN no active rotation plan exists
WHEN automatedExportService.runHeadlessExport("any-id") is called
THEN it throws an error indicating no active rotation
```

### 3.6 Cannot run headless export with missing/unconfirmed bindings

```
GIVEN an active rotation with missing or unconfirmed bindings
WHEN automatedExportService.runHeadlessExport(planId) is called
THEN it throws "EXPORT_NOT_READY"
AND the lock is immediately released
```

---

## 4. Weekly Rotation Job Orchestration

### 4.1 Full successful workflow

```
GIVEN automation is enabled
AND auto_export_enabled = true
AND the weekly-rotation job triggers for week "2026-W30"
WHEN the job handler executes
THEN:
  1. A "started" entry is inserted into automation_job_log
  2. A new rotation is generated and activated
  3. The rotation is automatically exported
  4. The job log entry is updated to "completed"
  5. The returned status is { status: "completed", planId: <uuid> }
```

### 4.2 Workflow without auto-export

```
GIVEN automation is enabled
AND auto_export_enabled = false
WHEN the weekly-rotation job triggers
THEN a new rotation is generated and activated
BUT no export operation is initiated
AND the job log still shows "completed"
```

### 4.3 Idempotency — duplicate week skipped

```
GIVEN a completed job log entry for week "2026-W30"
WHEN the weekly-rotation job triggers again for "2026-W30"
THEN it returns { status: "skipped", reason: "already-executed" }
AND no new rotation is generated
AND no export is attempted
```

### 4.4 Failed generation logs and marks job failed

```
GIVEN a database error during album fetching
WHEN the weekly-rotation job triggers
THEN the job log entry is updated to "failed"
AND error_message contains the error details
AND no export is attempted
```

### 4.5 Failed export after successful generation

```
GIVEN generation succeeds
AND export fails (e.g. missing binding)
WHEN the job handler runs
THEN the new rotation remains active
AND the job log shows "failed"
AND error_message references the export failure
```

### 4.6 Manual trigger executes the same workflow

```
GIVEN authenticated request with write token
WHEN POST /automation/jobs/weekly-rotation/run
THEN the full workflow executes
AND returns 202 Accepted with the job result
```

---

## 5. API Behaviour

### 5.1 GET /automation/jobs/weekly-rotation/status

```
GIVEN the weekly-rotation job has never run
WHEN GET /automation/jobs/weekly-rotation/status
THEN 200 with:
  nextRun: <ISO timestamp of next scheduled trigger>
  lastRun: null
  currentWeekRotation: false

GIVEN a rotation was generated for the current week
WHEN the endpoint is called
THEN currentWeekRotation: true
AND lastRun.status equals "completed"
```

### 5.2 Manual trigger idempotency

```
GIVEN the current week already has a completed rotation
WHEN POST /automation/jobs/weekly-rotation/run
THEN 409 Conflict with body:
  { status: "skipped", reason: "already-executed" }
```

### 5.3 Manual trigger without write token rejected

```
GIVEN a request without write token
WHEN POST /automation/jobs/weekly-rotation/run
THEN 403 Forbidden
```

---

## 6. Album Eligibility Consistency

### 6.1 Same filtering as client

```
GIVEN a library with albums in all categories
WHEN the server eligibility filter is applied
AND the client eligibility filter is applied
THEN both produce the same subset of albums
```

### 6.2 Albums without roles excluded

```
GIVEN an album with role = null or undefined
WHEN rotationGenerationService.createNextRotation() is called
THEN that album is never selected
```

---

## 7. Error Handling & Resilience

### 7.1 Database unavailable during generation

```
GIVEN the album repository throws a connection error
WHEN the weekly rotation job runs
THEN the error is caught
AND the job log shows "failed"
AND the previous active rotation remains unchanged
```

### 7.2 Export lock held by another operation

```
GIVEN a manual export is currently in progress (lock held)
WHEN the automated weekly job attempts export
THEN it catches the lock error
AND the job log shows "failed"
AND the rotation generation is still successful (if export is optional)
```

### 7.3 Empty eligible album list

```
GIVEN no eligible albums exist
WHEN rotationGenerationService.createNextRotation() is called
THEN it throws a clear error
AND the job log shows "failed"
```

---

## 8. Non-Goals Verified

| Non-Goal | Verification |
|----------|--------------|
| Email briefing | No email templates, no SMTP calls |
| Client UI changes | No frontend code modified |
| AI-generated commentary | No LLM or AI logic |
| Retry logic | Failed jobs are logged but not retried automatically |
| Multiple scheduled rotations | Only one weekly-rotation job exists |
| Manual generation UI removal | Existing client UI untouched |