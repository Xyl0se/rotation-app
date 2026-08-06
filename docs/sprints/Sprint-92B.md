# Sprint 92B — Server-Side Rotation Generation & Orchestration

**Status:** Future

**Target version:** Future minor (not scheduled)

**Type:** Domain port & automation orchestration

**Depends on:** 92A

## Goal

Make rotation generation executable server-side by porting the existing client domain logic into a shared module, then orchestrating the full automated workflow: generate → activate → export (atomically). The Weekly Rotation Job becomes the heart of the automation.

## Scope

### 1. Shared Domain Module

The client-side `generateRotationPlan` logic (`src/domain/rotation-plan/generateRotationPlan.ts` and its dependencies) must become usable by the server without duplication.

Approach:

- Extract rotation-plan domain code into a location that both client and server can import.
- If bundler / TypeScript module resolution conflicts prevent a true shared package, the logic is duplicated into `server/src/domain/rotation-plan/` and kept in sync via the existing test suites (both must pass with identical inputs).
- The shared module contains **no React, no UI, no browser APIs** — pure domain logic.

Shared exports:

- `generateRotationPlan(albums, options) → RotationPlan`
- `findReplacementCandidates(removedItem, plan, albums, limit)` (if used by generation)
- `RotationPlan`, `RotationPlanItem`, `RotationRoleQuota` types
- `defaultRotationTargetSize`

### 2. Server-Side Rotation Generation Service

`RotationGenerationService` encapsulates the server-side workflow:

```
createNextRotation(): RotationPlan
```

Steps:

1. Fetch all eligible albums from `AlbumRepository` (exclude `archived`, `on-hold`, or other non-rotation categories as defined by existing client logic).
2. Fetch current `RotationSettings` from `RotationStateRepository`.
3. Call `generateRotationPlan(eligibleAlbums, settings)`.
4. Promote the draft to active:
   - Archive the current active plan (if any).
   - Save the new plan with `status: "active"`.
   - Set `focusAlbumId` to `null` initially.

This mirrors the manual workflow the user currently performs in the UI, but fully automated.

### 3. Headless Export Orchestration

The existing `ExportService` requires a three-step manual flow: `createPreview` → `runStage` → `runApply`. For automation, a **single atomic operation** is required:

```
runHeadlessExport(rotationPlanId): ExportApplyResult
```

Behaviour:

1. Acquire the export lock.
2. Create the preview internally (skip the API round-trip).
3. If the preview is not exportable (`canExport === false`), release the lock and throw `EXPORT_NOT_READY`.
4. Stage the export asynchronously.
5. Wait for staging to complete.
6. Apply the export.
7. Return the result.

If **any** step fails, the lock is released and the previous export remains untouched. The staging directory is rolled back.

Integration with `ExportService`:

- Either extend `ExportService` with `runHeadlessExport`, or
- Create an `AutomatedExportService` that wraps `ExportService` and coordinates the steps.

### 4. Weekly Rotation Job

`WeeklyRotationJob` is registered with the `JobScheduler` from 92A. Its handler:

```typescript
async function executeWeeklyRotation() {
  const weekId = getCurrentISOWeek(); // e.g. "2026-W30"

  // 1. Idempotency check (via automation_job_log)
  if (jobLog.exists("weekly-rotation", weekId)) {
    log.info("Weekly rotation already executed for", weekId);
    return { status: "skipped", reason: "already-executed" };
  }

  // 2. Acquire lock (insert "started" row)
  jobLog.start("weekly-rotation", weekId);

  try {
    // 3. Generate and activate rotation
    const plan = rotationGenerationService.createNextRotation();

    // 4. Optional: auto-export
    if (automationSettings.autoExportEnabled) {
      const exportResult = await automatedExportService.runHeadlessExport(plan.id);
      log.info("Automated export completed", { exportPath: exportResult.exportPath });
    }

    // 5. Mark job as completed
    jobLog.complete("weekly-rotation", weekId);
    return { status: "completed", planId: plan.id };

  } catch (err) {
    jobLog.fail("weekly-rotation", weekId, err);
    log.error("Weekly rotation failed", {}, err);
    throw err; // Let scheduler handle retries (future sprint)
  }
}
```

### 5. Album Eligibility for Automated Generation

The server must apply the same filtering rules the client uses:

- Exclude albums with `category === "archived"` or `"on-hold"` (if applicable).
- Exclude albums without a valid role.
- Respect any future constraints defined in the rotation-plan domain.

The eligibility logic lives in the shared domain module so both client and server stay consistent.

### 6. API Extension

- `POST /automation/jobs/weekly-rotation/run` — Manual trigger (already defined in 92A, but now executes real logic).
- `GET /automation/jobs/weekly-rotation/status` — Returns last run result, next scheduled time, and whether a rotation exists for the current week.

### 7. Rotation Ownership & State Transitions

Per [ADR 014](../adr/014-server-owned-rotation-state.md), the server owns rotation state. This sprint reinforces that:

- The automated workflow never creates a draft. It generates and immediately activates.
- The `focusAlbumId` is left `null` after automated activation. The user can set it later via the existing UI.
- Listen events and journal entries are unaffected.

## Non-Goals

- Email briefing (92C)
- Client UI changes (92D / 92E)
- AI-generated commentary
- Retry logic for failed jobs (beyond logging; retry is a future sprint)
- Multiple scheduled rotations
- Manual rotation generation UI removal (92E)

## Technical Decisions

### Why a headless export instead of reusing the existing stage/apply API?

The existing API is designed for interactive user confirmation. Automation requires unconditional, atomic execution. A headless path keeps the interactive path intact while adding the automated path.

### Why generate-and-activate in one step?

To eliminate the intermediate "draft" state in the automated flow. A draft implies human review, which contradicts the goal of a fully automatic workflow. The user can still review the rotation after activation.

### Why leave focusAlbumId null?

Auto-selecting a focus album would require additional heuristics. Leaving it null defers the choice to the user and avoids surprising behaviour.

## Definition of Done

- [ ] Shared domain module exists and both client and server tests pass
- [ ] `RotationGenerationService` generates and activates rotations server-side
- [ ] `AutomatedExportService` (or equivalent) performs atomic stage+apply
- [ ] `WeeklyRotationJob` orchestrates generation → optional export → job logging
- [ ] Idempotency prevents duplicate rotation generation per calendar week
- [ ] Previous export is preserved if automated export fails
- [ ] Manual trigger endpoint executes the full workflow
- [ ] All new code passes lint and type-check
- [ ] Unit tests for generation service and export orchestration
- [ ] Integration tests for the full weekly-rotation job (with mocked time)
