# Rotation v0.29.0

This is Rotation's first deliberately accepted stable release for the existing
single-user NAS deployment.

## Highlights

- Server-owned Rotation, Focus Album, Listening Events, settings, and Library state.
- Immutable Rotation history with linked successful exports and reusable historical
  compositions.
- Safe localized handover before acceptance, including role deltas, quota gaps,
  Binding readiness, and estimated export size.
- Bounded server-confirmed Undo for role and Archive decisions plus a compact audit
  trail for consequential lifecycle actions.
- Resilient, server-cached cover resolution and manual cover retry.
- Asynchronous, recoverable NAS export with atomic Syncthing destination switching.

## Upgrade and compatibility

- Supported database baseline: schema migration 7 (`v0.28.1-dev`).
- Startup automatically migrates schema 7 through lifecycle/audit/performance migrations 8–11.
- Migration and complete lifecycle backup/restore are covered by automated tests.
- Back up `/rotation-data/data/rotation.db` before deploying this candidate.
- Containers continue to run as the established Synology identity `1026:100`.

## Images

- `ghcr.io/xyl0se/rotation-app-api:v0.29.0`
- `ghcr.io/xyl0se/rotation-app-web:v0.29.0`

Both images must use this exact matching tag. SHA tags remain available for diagnosis
and exact rollback.

## Acceptance

Production NAS lifecycle, export, restart, backup/restore, desktop, narrow-viewport,
and DE/EN acceptance passed on 2026-07-16.
