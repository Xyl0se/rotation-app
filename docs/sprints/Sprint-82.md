# Sprint 82 — Rotation Lifecycle & Release Readiness

**Status:** In progress — lifecycle foundation and cover hardening underway

**Target version:** Release candidate; final release number decided in Workstream 82D

**Type:** Product lifecycle, safety, and release engineering

---

## Goal

Turn Rotation generation, acceptance, listening, and export into one coherent,
traceable lifecycle and prepare the application for its first deliberately versioned
release. The sprint favors durable history and safe transitions over adding a new
recommendation engine.

## Product Decision

An accepted Rotation is a historical document. Creating a later Rotation must not
erase the composition, settings snapshot, acceptance time, or export relationship of
the earlier one. Only one Rotation is active, but any number may be archived.

## Workstream 82A — Rotation History

- Extend the server model from `draft/active` replacement to an explicit lifecycle:
  `draft`, `active`, and `archived`.
- Archive the previous active Rotation transactionally when a new draft is accepted.
- Preserve ordered items, role/reason, target size, quota snapshot, creation time,
  acceptance time, archival time, and linked successful export where available.
- Add paginated, newest-first history APIs and a read-only History view.
- Allow an archived Rotation to be used as the starting composition for a new draft;
  never reactivate or mutate the historical record itself.
- Keep historical Album identity readable after Library deletion through an immutable
  title/artist snapshot or an explicitly documented tombstone representation.

## Workstream 82B — Safe Rotation Handover

- Before “Mitnehmen”, show a localized comparison against the current active Rotation:
  entering Albums, leaving Albums, unchanged Albums, and role distribution before and
  after.
- Show total size versus configured maximum, unmet role quotas, missing/unconfirmed
  Bindings, and estimated export size before acceptance.
- Block acceptance only for conditions that make the workflow unsafe, such as invalid
  server state. Present smaller-than-target Rotations as transparent information, not
  an error.
- Keep draft editing, acceptance, export preview, and export execution as distinct
  confirmed steps with understandable retry behavior.
- Link the accepted Rotation ID to the export preview and resulting export operation
  so history can answer which selection was delivered.

## Workstream 82C — Bounded Undo & Audit Trail

- Introduce a compact server-side domain-event/audit record for selected consequential
  actions: role change, Archive decision, Binding reassignment, draft item removal or
  replacement, and Rotation acceptance.
- Provide an explicit “Undo last change” only where a safe inverse can be guaranteed.
- Use optimistic UI nowhere: show success only after server confirmation.
- Bound Undo by a clear condition rather than an arbitrary hidden timer—for example,
  until a later conflicting mutation or export makes the inverse unsafe.
- Never implement filesystem rollback through Undo. Export rollback remains the
  existing operational archive/recovery workflow.
- Display what will be restored before confirming Undo and record the compensating
  action in the audit trail.

## Workstream 82D — Release & Operational Readiness

- Reconcile the version in root/API packages, UI, Docker metadata, documentation, and
  Changelog; choose the first-release number explicitly and document the rationale.
- Produce immutable, matching API/Web image tags and GitHub Release notes.
- Test migrations from the oldest supported production database through migration 7
  and all Sprint-82 migrations without data loss.
- Verify backup/restore for Rotation history, active/draft state, settings, audit/Undo
  records, Listening Events, and export linkage.
- Add actionable failure states for migration failure, invalid Rotation settings,
  history loading, handover conflict, and unavailable API.
- Document deployment, post-release smoke test, previous-image rollback, database
  restore boundary, and release acceptance evidence.
- Complete visual acceptance of Sprint 81 on desktop and a narrow browser viewport.

## Workstream 82E — Legacy Cleanup & Production-Code Hygiene

- Inventory every browser-era compatibility path and classify it as `required
  migration`, `temporary release bridge`, or `obsolete`. Document the decision before
  deleting code.
- Remove the one-time browser Rotation/Listening import UI, API, repository methods,
  local-storage repositories, storage keys, and migration adapters once production
  evidence confirms that supported installations have completed that bridge.
- Evaluate the Album batch-import endpoint separately: retain it only if it remains a
  documented backup/onboarding workflow. Do not delete a useful data-portability path
  merely because it contains “import” in its name.
- Preserve historical SQLite migrations required to open supported databases. Cleanup
  means removing unreachable runtime compatibility code, not rewriting applied
  migration history.
- Move fixtures, fake Albums, demo constants, and test-only helpers out of production
  bundles. Prove that production startup never seeds or silently substitutes sample
  data.
- Find and remove unused exports, components, hooks, repository factories, assets,
  dependencies, CSS selectors, and obsolete documentation links using compiler/lint
  evidence plus repository-wide reference checks.
- Collapse duplicate client/server domain definitions only where a shared contract
  reduces drift without coupling browser code to server infrastructure.
- Keep cleanup commits behavior-preserving and covered by characterization tests;
  avoid combining speculative architectural rewrites with deletion.

## Workstream 82F — Measured Performance & Test Gate

- Establish reproducible baselines before optimizing: initial Home/API load, Library
  filtering and pagination, Rotation generation, history pagination, scan, export
  preview, and memory/bundle size on representative data.
- Define proportionate budgets for the actual NAS and browser target instead of using
  generic “industry standard” numbers. Record dataset size, hardware, cold/warm state,
  and measurement method.
- Inspect SQLite query plans and add indexes only for demonstrated hot queries. Prevent
  unbounded list endpoints and avoid loading Rotation history, audit history, or full
  Listening history into initial Home state.
- Profile render/recalculation paths before adding memoization or virtualization.
  Optimize only measured regressions and preserve readable domain code.
- Audit synchronous filesystem work on request paths. Move or bound operations only
  where measurements show event-loop blocking; retain the existing durable job model
  for long exports.
- Add regression checks for selected budgets where stable automation is possible;
  document NAS measurements where CI timing would be misleading.

- Add route-level tests for history pagination, one-active invariant, transactional
  handover, immutable archived records, export linkage, and conflict responses.
- Add UI regression tests for comparison, warnings, blocked acceptance, retry,
  history, and safe/unsafe Undo states in DE and EN.
- Verify the lifecycle with a representative Library and at least 50 historical
  Rotations without loading all history into the initial Home response.
- Run one production NAS acceptance from draft through acceptance, export, next
  Rotation, history inspection, backup/restore, and rollback documentation.

## Workstream 82G — Reliable Cover Resolution

- Resolve and download discovered covers through the API instead of relying on a
  browser hotlink as the durable display source.
- Validate HTTP status, redirect target, bounded size, supported content type, and
  image signature before storing a cover in the server cover directory.
- Retry only temporary failures (`429` and bounded `5xx`/network failures) with a
  small backoff; do not permanently negative-cache a transient provider outage.
- If the chosen MusicBrainz Release has no usable front cover, try a bounded ordered
  set of matching Releases and the Release Group where available. Prefer no cover to
  a confidently wrong cover.
- Persist and expose safe resolution states (`cached`, `not-found`,
  `temporarily-unavailable`, `invalid-image`) for diagnostics and manual retry without
  leaking third-party response bodies.
- Add “Find cover again” to Album editing and retain the current cover until a valid
  replacement is confirmed.
- Route Discover preview, Library, Role Explorer, Focus, Rotation, and Coach through
  the same resilient `AlbumCover` behavior; remove direct external `<img>` paths.
- Cover provider failures must not block Album capture or role assignment.

## Definition of Done

- [ ] Accepting a draft archives the previous active Rotation and leaves exactly one
  active Rotation without deleting history.
- [ ] Historical Rotations remain read-only, understandable, and paginated.
- [ ] The handover comparison exposes changes, quota gaps, Binding readiness, and
  export implications before acceptance.
- [ ] Every offered Undo is server-confirmed, auditable, and demonstrably safe.
- [ ] Rotation and export history are linked by stable identifiers.
- [ ] All versions and immutable container tags agree.
- [ ] Every legacy/import path has an explicit keep/remove decision; obsolete browser
  bridges, dead code, production test data, unused assets, and unused dependencies are
  removed without breaking supported database upgrades or portability workflows.
- [ ] Performance baselines and budgets are recorded, relevant endpoints are bounded,
  and demonstrated hot paths meet the agreed NAS/browser targets without speculative
  optimization.
- [ ] Valid covers are cached server-side, bounded fallbacks are attempted, temporary
  errors remain retryable, every Album surface uses consistent fallback behavior, and
  manual re-resolution is tested in DE and EN.
- [ ] Migration, backup/restore, rollback, route, UI, and NAS release gates pass.
- [ ] Sprint 81 visual acceptance is recorded and Sprint 81 is archived.

## Non-Goals

- Mobile/PWA/native applications
- User accounts or multi-user collaboration
- Unlimited event sourcing or arbitrary time travel
- Restoring deleted or overwritten music files through application Undo
- Listening notes or a Reflection Inbox (Sprints 83 and 84)
- Device profiles without demonstrated multiple-target demand
- Rewriting historical migrations or deleting portability features solely to reduce
  line count
- Broad framework replacement, premature caching, or optimization without a measured
  baseline

## Current Implementation Slice

- Migration 8 introduces immutable archived Rotations, ordered Album title/artist
  snapshots, one-active enforcement, and a bounded history index.
- Accepting a new Rotation now archives the previous active selection while removing
  obsolete drafts; archived Album items survive later Library deletion or role cleanup.
- `GET /rotation-state/history` exposes bounded offset pagination and the product shell
  includes a localized read-only History page.
- “Mitnehmen” now requires an explicit localized handover confirmation showing
  entering, leaving, unchanged, and target-size counts.
- Export preview/staging require the exact active Rotation ID and ordered Album set;
  persisted export operations retain that Rotation ID through apply.
- New Album capture now asks the API to download the discovered cover from an explicit
  provider allowlist, validates type/size/signature, retries temporary failures, and
  stores only confirmed images. Direct Role Explorer and Discover hotlinks now use the
  common `AlbumCover` fallback path.
- The confirmed one-time browser Rotation/Listening import UI, endpoint, client API,
  and repository runtime path have been removed; historical SQLite migrations and the
  Album portability import remain intact.
- Album editing now offers manual cover re-resolution without replacing a working
  cover until a valid server download succeeds.
- Detailed Binding/export-size handover evidence, Audit/Undo, remaining dead-code
  cleanup, performance evidence, Release work, provider candidate fallback, and
  production acceptance remain open.
