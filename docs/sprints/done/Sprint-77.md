# Sprint 77 — Production Acceptance & Release Closure

**Status:** Completed — NAS acceptance approved 2026-07-16

**Target version:** `v0.26.2`

**Type:** Release gate, stabilization, and backlog closure

---

## Goal

Turn the implementation completed in Sprints 76.1–76.3 into a verified,
documented release. This sprint adds no product feature. Its purpose is to prove
the complete NAS workflow and leave the repository in a state from which feature
development can safely resume.

The release-critical path is:

```text
capture album → identify Library album → scan music folder → confirm binding
→ create and accept rotation → preview export → export to Syncthing folder
→ verify files on disk
```

## Workstream 77A — NAS Acceptance Gate

- Execute [`NAS-REDEPLOY-ACCEPTANCE-TEST.md`](../../archive/acceptance-tests/NAS-REDEPLOY-ACCEPTANCE-TEST.md)
  against the production Compose stack.
- Record image tags, configuration, timestamps, and relevant diagnostics.
- Verify the first export, a repeat export, and replacement of an existing export.
- Verify that missing bindings block only the affected albums and identify them by
  useful album metadata.
- Confirm filesystem ownership and access with container UID `1026`.
- Treat every reproducible blocker as release work; defer cosmetic findings unless
  they obscure the workflow.

## Workstream 77B — Regression and Operations Audit

- Run frontend, server, route-integration, container-smoke, and production-build gates.
- Verify backup and restore for SQLite plus the documented full data-directory scope.
- Check restart behavior for scan, binding, and export state.
- Review logs and diagnostics for actionable errors without secrets or misleading
  write-token instructions.
- Triage open Dependabot pull requests; merge only updates that pass the same gates
  and do not widen this sprint into a dependency migration.

## Workstream 77C — Repository and Documentation Cleanup

- Remove only code and documentation proven unreachable, superseded, or inaccurate.
- Correct stale links, version references, Compose examples, and ownership statements.
- Reconcile Sprint 76.1, 76.2, and 76.3 acceptance criteria with NAS evidence.
- Move completed Sprint 76.x documents to `docs/sprints/done/`.
- Keep behavior-preserving cleanup separate from functional fixes where practical.

## Workstream 77D — Release

- Set the coherent release version after the gate passes.
- Update Changelog, Roadmap, deployment documentation, and image-tag examples.
- Publish both API and Web images from a green commit.
- Redeploy the immutable release tag and perform a short post-release smoke test.

## Workstream 77E — Album Intake Station Polish

- Give the shared Discover/Binding-Capture dialog a visually distinct catalog-intake
  identity inspired by record-store drawers and physical album cards.
- Keep text and form controls highly legible, responsive, and keyboard accessible.
- Add an optional Album Story step for acquisition reason, life phase, and memory note.
- Persist the Story through both normal Library creation and atomic Binding Capture.

## Workstream 77F — Bindings Warehouse Polish

- Present Bindings as a distinct technical warehouse/boilerroom without reducing
  readability or making operational states decorative.
- Increase row and action spacing so buttons never touch list boundaries.
- Preserve clear state, orphan, missing-folder, scan, verify, and reconcile feedback.
- Provide a usable stacked action layout on narrow screens.

## Non-Goals

- Library search or new filters
- More permissive automatic binding
- Cross-browser synchronization
- PWA, native apps, or offline writes
- Large-scale refactors without an observed release risk

## Definition of Done

- [x] The complete capture-to-Syncthing workflow succeeds on the NAS.
- [x] Repeat and replacement exports are verified and recoverable.
- [x] Required CI and container smoke gates pass for the accepted build.
- [x] Backup scope and restore behavior are verified and documented.
- [x] No open release-critical finding remains in the acceptance document.
- [x] Sprint 76.1–76.3 evidence is reconciled through the archived NAS record.
- [x] API/Web images are published and smoke-tested by digest on the NAS.
- [x] Roadmap and Changelog describe the release-candidate state accurately.

The archived acceptance record documents one approved exception: an in-place
upgrade from `v0.26.0` could not be executed because the source database had
already been intentionally deleted. This does not block the clean-install release
candidate accepted here.

## Exit Decision

The release gate passed. Sprint 78 was completed and accepted alongside the final
production UX work; Sprint 79 and later remain reorderable based on real production
use. Assigning the final version and publishing immutable release tags are the next
release-management step, not unfinished Sprint 77 feature work.
