# ADR 013 — Data Ownership Boundaries

**Status:** Accepted; amended by [ADR 014](./014-server-owned-rotation-state.md)

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
| Listening History | SQLite/API | Canonical server data | Included in SQLite backups |
| Listening Journal | SQLite/API | Optional 1:1 extension of a Listening Event | Included in SQLite backups; note bodies excluded from operational logs and audit metadata |
| RotationPlan and Focus Album | SQLite/API | Canonical server data | Included in SQLite backups |
| Language, onboarding, dismissed prompts | `localStorage` | Device-local preference | Intentionally not synchronized |
| Internal write token | API and Caddy environment | Deployment secret for trusted proxy authentication | Must not reach browser storage, product exports, or logs |

The server is authoritative for all durable domain data. Browser storage is limited to
device-local preferences and reconstructable caches; it is not a canonical domain store.

## Library Rules

- SQLite/API is the only persistent Album Library.
- Albums enter the React view only after a successful server read or confirmed mutation.
- Failed mutations leave the last confirmed in-memory view unchanged and remain retryable from the UI.
- Library writes are unavailable while the API is unreachable; no offline mutation queue exists.
- Binding Capture creates the Album and Binding link in one server transaction.
- IndexedDB cover content is a reconstructable display cache, never evidence that an Album exists.
- Obsolete `rotation-library`, migration-marker, and pending-operation keys are removed at startup.

## Consequences

- Self-hosting documentation distinguishes SQLite backup from full data-directory backup
  and intentionally device-local preferences.
- A second browser reads the same Library, Listening History, RotationPlan, and Focus
  Album, but retains its own device preferences.
- Browser cache loss is acceptable because canonical domain data remains on the server.

## Follow-up

[Sprint 80 — Canonical Listening & Rotation Persistence](../sprints/done/Sprint-80.md)
completed this follow-up and established ADR 014.
