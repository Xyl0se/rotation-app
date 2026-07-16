# Sprint 82 — Rotation Lifecycle & Release Readiness

**Status:** In progress — Workstreams 82A–82C, 82E and 82G completed; NAS gates pending

**Target version:** `v0.29.0-rc.1`; stable `v0.29.0` follows only after NAS acceptance

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

## Workstream 82A — Rotation History — ✅ abgeschlossen

- [x] Extend the server model from `draft/active` replacement to an explicit lifecycle:
  `draft`, `active`, and `archived`.
- [x] Archive the previous active Rotation transactionally when a new draft is accepted.
- [x] Preserve ordered items, role/reason, target size, quota snapshot, creation time,
  acceptance time, archival time, and linked successful export where available.
- [x] Add paginated, newest-first history APIs and a read-only History view.
- [x] Allow an archived Rotation to be used as the starting composition for a new draft;
  never reactivate or mutate the historical record itself.
- [x] Keep historical Album identity readable after Library deletion through an immutable
  title/artist snapshot or an explicitly documented tombstone representation.

## Workstream 82B — Safe Rotation Handover — ✅ abgeschlossen

- [x] Before “Mitnehmen”, show a localized comparison against the current active Rotation:
  entering Albums, leaving Albums, unchanged Albums, and role distribution before and
  after.
- [x] Show total size versus configured maximum, unmet role quotas, missing/unconfirmed
  Bindings, and estimated export size before acceptance.
- [x] Block acceptance only for conditions that make the workflow unsafe, such as invalid
  server state. Present smaller-than-target Rotations as transparent information, not
  an error.
- [x] Keep draft editing, acceptance, export preview, and export execution as distinct
  confirmed steps with understandable retry behavior.
- [x] Link the accepted Rotation ID to the export preview and resulting export operation
  so history can answer which selection was delivered.

## Workstream 82C — Bounded Undo & Audit Trail — ✅ abgeschlossen

- [x] Introduce a compact server-side domain-event/audit record for selected consequential
  actions: role change, Archive decision, Binding reassignment, draft item removal or
  replacement, and Rotation acceptance. Role/Archive decisions are implemented.
- [x] Provide an explicit “Undo last change” only where a safe inverse can be guaranteed.
- [x] Use optimistic UI nowhere: show success only after server confirmation.
- [x] Bound Undo by a clear condition rather than an arbitrary hidden timer—for example,
  until a later conflicting mutation or export makes the inverse unsafe.
- [x] Never implement filesystem rollback through Undo. Export rollback remains the
  existing operational archive/recovery workflow.
- [x] Display what will be restored before confirming Undo and record the compensating
  action in the audit trail.

## Workstream 82D — Release & Operational Readiness — 🟡 implementation complete, NAS gate pending

- [x] Reconcile the version in root/API packages, UI, Docker metadata, documentation, and
  Changelog; choose the first-release number explicitly and document the rationale.
- [x] Produce immutable, matching API/Web image tags and GitHub Release notes.
- [x] Test migrations from the oldest supported production database through migration 7
  and all Sprint-82 migrations without data loss.
- [x] Verify backup/restore for Rotation history, active/draft state, settings, audit/Undo
  records, Listening Events, and export linkage.
- [x] Add actionable failure states for migration failure, invalid Rotation settings,
  history loading, handover conflict, and unavailable API.
- [x] Document deployment, post-release smoke test, previous-image rollback, database
  restore boundary, and release acceptance evidence.
- [ ] Complete visual acceptance of Sprint 81 on desktop and a narrow browser viewport
  using `docs/SPRINT-82-RELEASE-ACCEPTANCE.md` after the images are published.

## Workstream 82E — Legacy Cleanup & Production-Code Hygiene — ✅ abgeschlossen

- [x] Inventory every browser-era compatibility path and classify it as `required
  migration`, `temporary release bridge`, or `obsolete`. Document the decision before
  deleting code.
- [x] Remove the one-time browser Rotation/Listening import UI, API, repository methods,
  local-storage repositories, storage keys, and migration adapters once production
  evidence confirms that supported installations have completed that bridge.
- [x] Evaluate the Album batch-import endpoint separately: retain it only if it remains a
  documented backup/onboarding workflow. Do not delete a useful data-portability path
  merely because it contains “import” in its name.
- [x] Preserve historical SQLite migrations required to open supported databases. Cleanup
  means removing unreachable runtime compatibility code, not rewriting applied
  migration history.
- [x] Move fixtures, fake Albums, demo constants, and test-only helpers out of production
  bundles. Prove that production startup never seeds or silently substitutes sample
  data.
- [x] Find and remove unused exports, components, hooks, repository factories, assets,
  dependencies, CSS selectors, and obsolete documentation links using compiler/lint
  evidence plus repository-wide reference checks.
- [x] Collapse duplicate client/server domain definitions only where a shared contract
  reduces drift without coupling browser code to server infrastructure.
- [x] Keep cleanup commits behavior-preserving and covered by characterization tests;
  avoid combining speculative architectural rewrites with deletion.

## Workstream 82F — Measured Performance & Test Gate — 🟡 implementation complete, NAS observations pending

- [x] Establish reproducible baselines before optimizing: initial Home/API load, Library
  filtering and pagination, Rotation generation, history pagination, scan, export
  preview, and memory/bundle size on representative data.
- [x] Define proportionate budgets for the actual NAS and browser target instead of using
  generic “industry standard” numbers. Record dataset size, hardware, cold/warm state,
  and measurement method.
- [x] Inspect SQLite query plans and add indexes only for demonstrated hot queries. Prevent
  unbounded list endpoints and avoid loading Rotation history, audit history, or full
  Listening history into initial Home state. History and audit endpoints are bounded;
  query-plan evidence remains open.
- [x] Profile render/recalculation paths before adding memoization or virtualization.
  Optimize only measured regressions and preserve readable domain code.
- [x] Audit synchronous filesystem work on request paths. Move or bound operations only
  where measurements show event-loop blocking; retain the existing durable job model
  for long exports.
- [x] Add regression checks for selected budgets where stable automation is possible;
  document NAS measurements where CI timing would be misleading.

- [x] Add route-level tests for history pagination, one-active invariant, transactional
  handover, immutable archived records, export linkage, and conflict responses.
- [x] Add UI regression tests for comparison, warnings, blocked acceptance, retry,
  history, and safe/unsafe Undo states in DE and EN.
- [x] Verify the lifecycle with a representative Library and at least 50 historical
  Rotations without loading all history into the initial Home response.
- [ ] Run one production NAS acceptance from draft through acceptance, export, next
  Rotation, history inspection, backup/restore, and rollback documentation.

## Workstream 82G — Reliable Cover Resolution — ✅ abgeschlossen

- [x] Resolve and download discovered covers through the API instead of relying on a
  browser hotlink as the durable display source.
- [x] Validate HTTP status, redirect target, bounded size, supported content type, and
  image signature before storing a cover in the server cover directory.
- [x] Retry only temporary failures (`429` and bounded `5xx`/network failures) with a
  small backoff; do not permanently negative-cache a transient provider outage.
- [x] If the chosen MusicBrainz Release has no usable front cover, try a bounded ordered
  set of matching Releases and the Release Group where available. Prefer no cover to
  a confidently wrong cover.
- [x] Treat filesystem punctuation substitutions as search hints: keep an exact `_`
  match intact, then try bounded colon, dash, space, and punctuation-independent title
  variants before declaring metadata unavailable. Adopt the confirmed MusicBrainz title.
- [x] Persist and expose safe resolution states (`cached`, `not-found`,
  `temporarily-unavailable`, `invalid-image`) for diagnostics and manual retry without
  leaking third-party response bodies.
- [x] Add “Find cover again” to Album editing and retain the current cover until a valid
  replacement is confirmed.
- [x] Route Discover preview, Library, Role Explorer, Focus, Rotation, and Coach through
  the same resilient `AlbumCover` behavior; remove direct external `<img>` paths.
- [x] Cover provider failures must not block Album capture or role assignment.

## Release-candidate corrections

- [x] Generate each new Rotation through weighted random sampling instead of a stable
  listen-count/title sort. Prefer less-heard and long-unheard Albums without making the
  result deterministic, and reduce immediate repetition from the active Rotation.
- [x] Treat role quotas as the preferred first-pass composition. If a role cannot fill
  its quota, fill remaining capacity from other eligible roles up to the configured
  target; never include Admired, Archive, or roleless Albums.

## Definition of Done

- [x] Accepting a draft archives the previous active Rotation and leaves exactly one
  active Rotation without deleting history.
- [x] Historical Rotations remain read-only, understandable, and paginated.
- [x] The handover comparison exposes changes, quota gaps, Binding readiness, and
  export implications before acceptance.
- [x] Every offered Undo is server-confirmed, auditable, and demonstrably safe.
- [x] Rotation and export history are linked by stable identifiers.
- [x] All versions and immutable container tags agree.
- [x] Every legacy/import path has an explicit keep/remove decision; obsolete browser
  bridges, dead code, production test data, unused assets, and unused dependencies are
  removed without breaking supported database upgrades or portability workflows.
- [x] Performance baselines and budgets are recorded, relevant endpoints are bounded,
  and demonstrated hot paths meet the agreed NAS/browser targets without speculative
  optimization.
- [x] Valid covers are cached server-side, bounded fallbacks are attempted, temporary
  errors remain retryable, every Album surface uses consistent fallback behavior, and
  manual re-resolution is tested in DE and EN.
- [ ] Migration, backup/restore, rollback, route, UI, and NAS release gates pass. Automated
  migration, backup/restore, route, UI, and build gates pass; production NAS evidence is pending.
- [ ] Sprint 81 visual acceptance is recorded and Sprint 81 is archived. The desktop and
  390 px checklist is prepared for the published candidate.

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
- Successful export operations are shown on their originating historical Rotation,
  including date, file count, and size. An archived selection can be copied into a new
  draft without mutating the historical record; Albums no longer present or no longer
  eligible are omitted safely.
- “Mitnehmen” now requires a server-confirmed localized handover comparison showing
  entering, leaving, unchanged, before/after role distribution, quota gaps, target
  size, Binding readiness, and estimated export size. Missing Bindings remain an
  export blocker without preventing acceptance; an unavailable or inconsistent
  server/filesystem preview prevents an unsafe handover.
- Export preview/staging require the exact active Rotation ID and ordered Album set;
  persisted export operations retain that Rotation ID through apply.
- Consequential role/Archive decisions, Binding reassignments, draft removals and
  replacements, and Rotation acceptance now produce compact server-side audit events.
  Undo remains deliberately limited to role decisions whose current Album state still
  matches the recorded change. The Settings UI previews the localized restoration,
  asks for confirmation, waits for the server, and records a compensating event.
- Root and API packages, README, Changelog, Versioning, Roadmap, production Compose,
  curated release notes, and GitHub tag-release automation now agree on
  `v0.29.0-rc.1`. The supported schema-7 upgrade through migrations 8–11 and complete
  lifecycle backup/restore are automated; the production NAS/visual checklist and
  explicit database/image rollback boundary live in `SPRINT-82-RELEASE-ACCEPTANCE.md`.
- New Album capture now asks the API to try up to three ordered matching MusicBrainz
  Releases and their Release Group, download the first valid image from an explicit
  provider allowlist, validate type/size/signature, and retry temporary failures.
  Safe resolution diagnostics and candidates are retained for manual retry while an
  existing valid cover remains untouched. Every Album surface uses the common
  `AlbumCover` path without assigning third-party URLs directly to image elements.
- Capture metadata search tolerates NAS/filesystem substitutions such as `_` for `:`
  without blindly rewriting genuine underscores; the original query always has priority.
- The confirmed one-time browser Rotation/Listening import UI, endpoint, client API,
  and repository runtime path have been removed; historical SQLite migrations and the
  Album portability import remain intact.
- Album editing now offers manual cover re-resolution without replacing a working
  cover until a valid server download succeeds.
- Production NAS performance/release acceptance and the Sprint 81 visual gate remain open.
