# Rotation v0.29.0-rc.1

This is Rotation's first deliberately versioned release candidate. It is intended for
the existing single-user NAS deployment and is not yet the final stable release.

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
- Startup automatically migrates schema 7 through lifecycle/audit migrations 8–10.
- Migration and complete lifecycle backup/restore are covered by automated tests.
- Back up `/rotation-data/data/rotation.db` before deploying this candidate.
- Containers continue to run as the established Synology identity `1026:100`.

## Images

- `ghcr.io/xyl0se/rotation-app-api:v0.29.0-rc.1`
- `ghcr.io/xyl0se/rotation-app-web:v0.29.0-rc.1`

Both images must use this exact matching tag. SHA tags remain available for diagnosis
and exact rollback.

## Remaining release gate

The candidate becomes eligible for a stable `v0.29.0` only after the documented NAS
smoke test and Sprint 81 desktop/narrow-viewport visual acceptance are recorded.
