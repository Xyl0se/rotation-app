# Sprint 76.2 — Album-to-Syncthing Export Recovery

**Status:** In progress — export identity, Capture lifecycle, diagnostics, and automated vertical export regression implemented; NAS verification pending.

**Target version:** `v0.26.2-dev`

**Type:** Focused bugfix and vertical integration sprint

**Source:** [`NAS-REDEPLOY-ACCEPTANCE-TEST.md`](../archive/NAS-REDEPLOY-ACCEPTANCE-TEST.md), manual test on Synology DS218+ / DSM 7.3.2.

---

## Scope Decision

Sprint 76.2 is exclusively about restoring the existing single-browser export workflow:

```text
Create Album
    → bind Album to an existing music folder
    → add Album to Player Rotation
    → preview export
    → stage export
    → apply export
    → find copied Album files in exports/current-rotation
    → let Syncthing synchronize that directory
```

Cross-browser or multi-device synchronization is **not** part of the current product scope. It is a new feature and must not be implemented in this sprint.

The observation that another fresh browser affected synchronization remains useful diagnostic evidence, but Sprint 76.2 must reproduce and fix export in one browser/profile first. No multi-client conflict policy, live synchronization, cross-browser cache invalidation, or automatic multi-device convergence will be introduced.

---

## Context

The NAS redeploy successfully proved:

- production image deployment and `1026:100` permissions;
- SQLite/WAL and runtime-directory creation;
- healthchecks and write-token protection;
- Album creation, editing, reload persistence, and custom cover storage;
- music scanning and binding persistence.

The acceptance test could not complete the core export workflow. Export displayed opaque IDs as missing bindings and did not identify a usable Album for transfer, even though Album CRUD, scanning, and binding had worked earlier.

The primary release blocker is therefore not cross-browser synchronization. It is the broken identity/data flow between Library Album, Binding, Player Rotation, and Export.

---

## Goal

A user can capture a new Album, associate it with a real folder from the read-only music library, include it in the Player Rotation, and apply an export that copies the correct files into the Syncthing source directory.

Every step must preserve and expose one canonical Album identity. Failures must identify the affected Album by title and artist and explain the action needed to continue.

---

## Non-Goals

- Cross-browser Library synchronization
- Live updates between browser profiles
- Multi-device conflict resolution
- User accounts or sessions
- Server persistence for RotationPlan, Focus Album, or Listening History
- Redesign of the recommendation/rotation algorithm
- Syncthing process management by Rotation
- Cleanup of unrelated legacy files or components

Browser-local RotationPlan remains an accepted architecture boundary for this sprint. It only needs to reference server-backed Albums correctly within the browser that created the plan.

---

## Confirmed Defects

### DEF-76.2-01 — Export Cannot Correlate Rotation Items and Bindings

**Severity:** Release blocker

**Observed:** Export shows a collection of opaque IDs as missing bindings and does not identify an Album that can be copied, despite a confirmed binding being available during the acceptance flow.

**Expected:** Every RotationPlan item resolves to exactly one Library Album UUID and, when available, exactly one confirmed Binding. Export preview shows the Album title, artist, source folder, and binding state.

### DEF-76.2-02 — Capture from Binding Does Not Open

**Severity:** High

**Observed:** The `Capture` action on the Bindings page does not open its dialog.

**Expected:** Capture opens with binding-derived title/artist data and can create a Library Album and link that Binding without duplicate or mismatched IDs.

### DEF-76.2-03 — Export Has No Actionable Missing-Binding Diagnostics

**Severity:** High

**Observed:** Raw IDs are presented without enough context to repair the Rotation.

**Expected:** Missing or stale references identify title/artist where possible and distinguish:

- Album is not in the Library;
- Album exists but has no Binding;
- Binding is proposed but unconfirmed;
- Binding points to a missing source folder;
- RotationPlan contains a stale/deleted Album reference.

### DEF-76.2-04 — Startup Path Logging Is Misleading

**Severity:** Medium, non-blocking unless it reveals a real configuration fault

The NAS logs showed `/` for Music and Workspace and `/exports/current-rotation` for the Syncthing root, although scan and healthchecks succeeded. This is likely a logger-sanitization issue, but it must be diagnosed so export failures can be investigated reliably.

---

## Workstream 76.2A — Single-Browser End-to-End Reproduction

### Required Scenario

Use one fresh browser profile and one clean/test server database:

1. Complete onboarding and configure the valid token.
2. Create one Album whose real folder exists under `/music`.
3. Run scan or manually create the Binding.
4. Confirm the Binding.
5. Add that exact Album to a Player Rotation.
6. Open Export and request preview.
7. Stage and apply.
8. Verify the copied directory under `exports/current-rotation`.

### Tasks

- Automate the complete scenario across frontend domain/hooks and real API routes.
- Record the identifiers at each boundary:
  - Library `album.id`;
  - `binding.album_id` and `binding.library_album_id`;
  - RotationPlan item Album ID;
  - preview/stage request Album IDs;
  - export manifest Album IDs and source paths.
- Identify the first boundary where the canonical Library UUID is replaced, omitted, or interpreted as a filesystem Album ID.
- Capture the exact API responses used by Export.
- Add a failing regression test before changing the contract.

### Acceptance Criteria

- The current defect is reproducible without a second browser.
- The test proves which identity boundary is broken.
- The reproduction uses a real confirmed Binding and a real temporary source folder.
- No fix is based only on UI text or assumptions about the cross-browser observation.

---

## Workstream 76.2B — Canonical Export Identity Contract

### Tasks

- Define the identifier meanings explicitly:
  - Library Album identity: stable UUID;
  - filesystem Album identity/path: scan-relative folder identifier;
  - Binding link: maps filesystem identity to `library_album_id` UUID;
  - RotationPlan item: references Library UUID;
  - export input: Library UUIDs, resolved through confirmed Bindings.
- Audit all creation and mapping points for RotationPlan items.
- Audit Binding DTOs and frontend binding maps for accidental use of `binding.albumId` where `binding.libraryAlbumId` is required.
- Resolve export inputs server-side through the confirmed Binding linked by Library UUID.
- Reject ambiguous, missing, proposed, or stale mappings before copying files.
- Preserve stable UUIDs across reload and edit.
- Do not silently translate by title/artist or array position.

### Acceptance Criteria

- One canonical Library UUID is visible from Album creation through export manifest.
- A confirmed Binding resolves that UUID to the correct read-only source folder.
- Filesystem IDs and Library UUIDs are not interchangeable in types, DTO names, or API schemas.
- Duplicate titles/artists cannot cause an incorrect match.
- A deleted or stale Album cannot resolve to a different Binding.
- Contract tests cover create → bind → plan → preview → stage → apply.

---

## Workstream 76.2C — Binding Capture Repair

### Tasks

- Trace the `Capture` click handler, dialog open state, selected Binding, and prefill lifecycle.
- Remove state/effect ordering that prevents the dialog from opening.
- Implement the intended sequence:
  1. select Binding;
  2. open Capture dialog;
  3. prefill detected title/artist;
  4. create Album with stable UUID;
  5. link Binding using the new `libraryAlbumId`;
  6. refresh Binding and Library views.
- Make create and link independently retryable.
- Prevent double-clicks and retries from creating duplicate Albums.
- Keep the selected Binding visible if linking fails after Album creation.

### Acceptance Criteria

- Capture opens immediately from an orphan/proposed Binding.
- Prefill is correct and editable.
- Successful Capture creates one Album and one link.
- Create-success/link-failure can be retried without duplicate creation.
- Reload preserves the resulting Album and confirmed link.
- Component and route integration tests cover open, cancel, success, partial failure, and retry.

---

## Workstream 76.2D — Actionable Export Preview and Safe Apply

### Tasks

- Replace raw-ID-only output with Album title, artist, Library UUID, Binding state, and relative source path.
- Categorize every unresolved plan item.
- Allow preview to show mixed valid/invalid entries without hiding valid Albums.
- Define whether stage is all-or-nothing or explicitly permits reviewed skips; do not skip silently.
- Ensure stage copies only from the guarded `/music` root.
- Ensure apply atomically updates `exports/current-rotation` and leaves no stale `next-rotation` directory.
- Verify the manifest and diff use the same canonical Album UUID as preview.
- Keep original music read-only.

### Acceptance Criteria

- The user can see exactly why an Album cannot be exported.
- At least one confirmed bound Album completes preview, stage, and apply.
- Invalid entries never cause a different Album to be copied.
- The resulting directory and manifest identify the expected Album.
- Original files remain unchanged.
- Repeated preview/apply is deterministic and crash recovery remains intact.

---

## Workstream 76.2E — Export Diagnostics and Path Logging

### Tasks

- Determine whether `/` log values come from config loading or path sanitization.
- Log meaningful container paths or explicit labels without revealing host paths.
- Add a correlation/export ID to preview, stage, and apply logs.
- Log sanitized counts and failure categories:
  - requested Albums;
  - resolved confirmed Bindings;
  - missing/stale/proposed Bindings;
  - copied/skipped files;
  - final target directory.
- Never log tokens, cover bytes, or full personal Library payloads.

### Acceptance Criteria

- A failed export can be diagnosed from UI plus API logs.
- Startup logs no longer misleadingly collapse valid configured paths to `/`.
- Health, diagnostics, and logs agree on music/workspace/export availability.

---

## Workstream 76.2F — NAS Export Acceptance

### Tasks

- Deploy published images from the successful fixing commit.
- Resume the NAS acceptance test using a single browser profile.
- Repeat Album CRUD and Binding only as needed to establish a clean export fixture.
- Complete:
  - Player Rotation creation;
  - export preview;
  - stage and apply;
  - filesystem inspection;
  - Syncthing observation;
  - manual backup;
  - restart/persistence;
  - backup restore;
  - cleanup and log review.
- Record image digests, Album UUID, Binding IDs/path, export ID, and resulting target path.

### Acceptance Criteria

- One newly captured and confirmed bound Album reaches the Syncthing source directory.
- The copied directory contains the expected files.
- Syncthing detects the result when configured.
- Export survives container restart.
- Backup and restore preserve the Album and Binding state.
- The acceptance document ends in `Passed` or `Passed with documented observations`.

---

## Workstream 76.2G — Server-Authoritative Library

**Status:** Implemented; NAS verification pending.

### Delivered

- Removed persistent browser Library storage, automatic migration, and pending
  Library mutation queues.
- `GET/POST/PUT/DELETE /albums` is the only Library read/write contract.
- React state changes only after the server confirms a mutation; failed writes
  retain the last confirmed state and expose a reloadable error.
- Focus Album, RotationPlan, Listening History, and device preferences remain
  browser-local by explicit scope decision.
- Legacy Library, migration-marker, and pending-operation keys are cleared on
  startup without touching Focus or Rotation state.
- Local JSON backup no longer includes Library data; SQLite backups remain the
  canonical Library backup.
- Binding Capture now creates the Album and links its Binding atomically in one
  SQLite transaction and supports idempotent retries.

### Acceptance Criteria

- [x] Reload reconstructs the Library exclusively from `GET /albums`.
- [x] No Album or pending Album mutation is written to `localStorage`.
- [x] Failed creates/updates/deletes do not introduce optimistic Library state.
- [x] Capture commits Album and Binding link together or rolls both back.
- [x] Legacy Library cleanup preserves Focus Album and RotationPlan.
- [ ] NAS Capture, reload, Rotation, and Export complete with the server-only Library.

---

## Cross-Browser Observation

The synchronization warning observed after using a second fresh browser is retained as a product observation, but it is not a Sprint 76.2 acceptance criterion.

For the current product:

- simultaneous or alternating browser profiles are unsupported;
- users should perform the acceptance workflow in one browser profile;
- no promise of automatic cross-browser cache convergence is made;
- a future multi-device sprint must define ownership, conflicts, invalidation, authentication, and UX before implementing that feature.

If the same synchronization failure occurs in the single-browser reproduction, it becomes an in-scope local recovery bug. Only that single-browser failure should be fixed here.

---

## Required Test Coverage

### Frontend

- Album creation produces the UUID stored in RotationPlan.
- Binding lookup uses `libraryAlbumId`, not filesystem `albumId`, for Library correlation.
- Capture dialog open/prefill/success/partial failure/retry.
- Export preview renders valid and invalid items with useful labels.
- Single-browser reload preserves Album, Binding view, RotationPlan, and export readiness.

### Server

- Album UUID → confirmed Binding → relative source path resolution.
- Preview/stage/apply with bound, unbound, proposed, missing-source, and stale UUIDs.
- Duplicate title/artist Albums remain distinct.
- Path guards and read-only source assumptions remain enforced.
- Manifest/diff identity stability and repeated apply.

### Route-Level Integration

- Create Album.
- Link/confirm Binding to its Library UUID.
- Preview using that UUID.
- Stage and poll completion.
- Apply and inspect the generated manifest/files.
- Restart repositories/database and verify identity stability.

---

## Affected Components

### Frontend

- `src/pages/BindingsPage.tsx`
- `src/components/features/discover-album/DiscoverAlbumDialog.tsx`
- `src/hooks/useBindings.ts`
- `src/hooks/useRotationPlan.ts`
- `src/pages/ExportPage.tsx`
- `src/services/api/bindingsService.ts`
- `src/services/api/albumsService.ts`
- `src/services/api/exportService.ts`
- related component/hook tests

### Server

- `server/src/routes/bindings.ts`
- `server/src/routes/exports.ts`
- `server/src/application/exportService.ts`
- `server/src/domain/export/*`
- `server/src/infrastructure/persistence/sqlite/bindingRepository.ts`
- `server/src/infrastructure/logger/logger.ts`
- route and filesystem integration tests

### Operations and Documentation

- `docs/archive/NAS-REDEPLOY-ACCEPTANCE-TEST.md`
- `docs/sprints/Sprint-76.1.md`
- `docs/ROADMAP.md`
- `docs/CHANGELOG.md`

---

## Risks

- Confusing filesystem Album IDs with Library UUIDs can copy the wrong directory.
- Automatic title/artist matching would be unsafe for duplicates and compilations.
- Capture retries can create duplicates if create/link are not independently idempotent.
- Relaxing preview validation can defer dangerous errors until file copying.
- Export fixes must not weaken PathGuard, atomic apply, rollback, or read-only music guarantees.
- Browser-local RotationPlan must not be silently advertised as cross-device data.

---

## Definition of Done

### Core Vertical Workflow

- [x] A new Album can be created in one browser profile.
- [x] The Album can be linked to a real music folder through a confirmed Binding.
- [x] The same canonical Library UUID is stored in the Player Rotation.
- [x] Export preview resolves the UUID to the correct Binding and source path.
- [x] Stage copies the expected files.
- [x] Apply places them under `exports/current-rotation`.
- [ ] Syncthing detects the applied directory when configured.

### Capture and Diagnostics

- [ ] Binding Capture opens and completes reliably.
- [ ] Partial Capture failures are retryable without duplicate Albums.
- [x] Export errors identify Albums by title/artist and categorized binding state.
- [x] Startup/export path diagnostics are accurate and privacy-safe.

### Safety and Quality

- [ ] Original music remains unchanged and read-only.
- [x] Stale, ambiguous, or missing references cannot copy another Album.
- [x] Preview, stage, apply, manifest, diff, rollback, and recovery use one identity contract.
- [ ] Frontend/server lint, tests, builds, Compose validation, and container smoke checks pass.
- [ ] Published web/API images originate from the successful validation commit.
- [ ] The single-browser NAS acceptance test completes through backup, restart, restore, and cleanup.
- [ ] Feature development remains frozen until the export workflow and Sprint 76.1 NAS gate are complete.

---

## Delivery Order

1. **76.2A — Reproduce the single-browser vertical workflow.**
2. **76.2B — Repair canonical UUID/Binding/export resolution.**
3. **76.2C — Repair Binding Capture.**
4. **76.2D — Make preview and apply actionable and safe.**
5. **76.2E — Improve export/path diagnostics.**
6. **76.2F — Publish and finish NAS export acceptance.**

---

## Implementation Progress — 2026-07-15

- Fixed the release-blocking identity mismatch: export resolution is keyed by
  `binding.library_album_id` (Library UUID), never by the filesystem-oriented
  `binding.album_id`.
- Added a real-filesystem service regression covering Library UUID → confirmed
  Binding → preview → stage → apply → manifest and a negative stale/unlinked case.
- Fixed macOS canonical-root handling in `PathGuard`; guarded temporary roots no
  longer fail because `/var` resolves to `/private/var`.
- Stabilized Binding Capture prefill effects when the parent recreates an
  equivalent prefill object and added a component regression test.
- Added an always-available manual music-folder scan action to the Bindings page;
  it reports progress, prevents parallel scans, refreshes newly discovered
  Bindings automatically, and is covered by a page-level regression test.
- Replaced the browser Library cache/synchronization queue with a server-only
  Library hook and made Binding Capture an atomic, idempotent server operation.
- Made manual music scans token-free (the music volume remains read-only), while
  retaining server-side scan-run and proposed-Binding persistence.
- Restored role onboarding: Capture now proceeds directly into Album Coach, and
  roleless existing Albums expose a manual Coach action in the edit dialog.
- Added structured preview issues for missing Library Albums, missing Bindings,
  and unconfirmed Bindings, enriched with title/artist where available.
- Replaced misleading `/` path logs with privacy-safe root labels and added
  export-ID/count logging for preview, stage, and apply.
- Full validation passed locally: 280 frontend tests, 194 server tests, lint,
  frontend production build, and server TypeScript build.

Still open: container/Compose smoke validation, image publication, and the single-browser NAS acceptance run through
Syncthing, restart, backup, and restore.
