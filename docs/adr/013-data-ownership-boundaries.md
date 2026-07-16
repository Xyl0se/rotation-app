# ADR 013 — Data Ownership Boundaries

**Status:** Accepted

**Date:** 2026-07-15

## Context

Rotation grew from a browser-local application into a self-hosted client/server system. During that transition, documentation and implementation used “source of truth” inconsistently. Some durable user data is server-backed, some remains browser-local, and some browser stores are only caches.

Without an explicit ownership boundary, an empty server response, browser reset, or second device can be mistaken for authoritative data and cause loss or divergence.

## Decision

Rotation classifies every persisted value as one of four ownership types:

| Data | Current owner | Classification | Backup consequence |
|------|---------------|----------------|--------------------|
| Album Library and Album Story | SQLite/API | Canonical server data | Included in SQLite backups |
| Server cover files and metadata | Server filesystem | Canonical server data | Requires full data-directory backup |
| Bindings, scan runs, export operations/locks, backup status | SQLite/API | Canonical operational data | Included in SQLite backups |
| Current export, staging, and archive directories | Server filesystem | Canonical/reconstructable operational data by directory | Included only in full data-directory backup |
| Library view state | React memory | Ephemeral projection of the API response | Rebuilt from SQLite/API after reload |
| Downloaded cover cache | IndexedDB | Reconstructable cache | May be deleted without losing canonical cover ownership |
| Listening History | `localStorage` | Canonical user data, temporarily browser-owned | Not covered by server backup; server migration required in a dedicated follow-up |
| RotationPlan and Focus Album | `localStorage` | Canonical user data, temporarily browser-owned | Not covered by server backup; server migration required in a dedicated follow-up |
| Language, onboarding, dismissed prompts | `localStorage` | Device-local preference | Intentionally not synchronized |
| Internal write token | API and Caddy environment | Deployment secret for trusted proxy authentication | Must not reach browser storage, product exports, or logs |

The server is authoritative only for domains that already have a server repository and migration path. Browser-owned canonical data must not be called server-backed until an explicit schema, API, migration, conflict policy, and backup/restore test exist.

## Library Rules

- SQLite/API is the only persistent Album Library.
- Albums enter the React view only after a successful server read or confirmed mutation.
- Failed mutations leave the last confirmed in-memory view unchanged and remain retryable from the UI.
- Library writes are unavailable while the API is unreachable; no offline mutation queue exists.
- Binding Capture creates the Album and Binding link in one server transaction.
- IndexedDB cover content is a reconstructable display cache, never evidence that an Album exists.
- Obsolete `rotation-library`, migration-marker, and pending-operation keys are removed at startup.

## Consequences

- Self-hosting documentation must distinguish SQLite backup from full data-directory backup and browser-local data.
- A second browser reads the same server Library but not Listening History, RotationPlan, Focus Album, or device preferences.
- Moving the remaining browser-owned canonical data requires a separate sprint/ADR. It must cover schema design, referential integrity, legacy import, multi-device conflict behavior, and restore testing.
- Browser cache loss is acceptable for reconstructable data but not for temporarily browser-owned canonical data.

## Follow-up

[Sprint 80 — Canonical Listening & Rotation Persistence](../sprints/done/Sprint-80.md)
must be completed before multi-device or PWA work. It migrates Listening History,
RotationPlan, and Focus Album to server ownership without silently discarding legacy
browser data.
