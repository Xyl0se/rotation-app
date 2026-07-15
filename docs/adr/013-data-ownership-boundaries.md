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
| Browser Library repository | `localStorage` | Last-known-good cache | Must never overwrite verified server data implicitly |
| Pending Library/cover operations | `localStorage` plus cover blob in IndexedDB | Durable synchronization state | Replayed idempotently; not a second canonical Library |
| Downloaded cover cache | IndexedDB | Reconstructable cache | May be deleted without losing canonical cover ownership |
| Listening History | `localStorage` | Canonical user data, temporarily browser-owned | Not covered by server backup; server migration required in a dedicated follow-up |
| RotationPlan and Focus Album | `localStorage` | Canonical user data, temporarily browser-owned | Not covered by server backup; server migration required in a dedicated follow-up |
| Language, onboarding, dismissed prompts | `localStorage` | Device-local preference | Intentionally not synchronized |
| Write token | `localStorage` | Device-local credential | Must not be included in product data exports or logs |

The server is authoritative only for domains that already have a server repository and migration path. Browser-owned canonical data must not be called server-backed until an explicit schema, API, migration, conflict policy, and backup/restore test exist.

## Synchronization Rules

- Server Library data replaces the browser Library cache only after a successful validated response.
- A failed or unexpectedly empty response cannot erase a non-empty last-known-good cache.
- Offline/failed mutations are stored as durable, coalesced operations and replayed serially.
- Operation IDs prevent completion of an older request from removing a newer queued change.
- Cover blobs stay in IndexedDB while pending and are uploaded from there on reconnect.
- A migration marker is written only after server read-back verifies all migrated album IDs.

## Consequences

- Self-hosting documentation must distinguish SQLite backup from full data-directory backup and browser-local data.
- A second browser currently shares the Library but not Listening History, RotationPlan, Focus Album, or device preferences.
- Moving the remaining browser-owned canonical data requires a separate sprint/ADR. It must cover schema design, referential integrity, legacy import, multi-device conflict behavior, and restore testing.
- Browser cache loss is acceptable for reconstructable data but not for temporarily browser-owned canonical data.

## Follow-up

Create a dedicated “Canonical Listening & Rotation Persistence” sprint before multi-device or PWA work. It must migrate Listening History, RotationPlan, and Focus Album to server ownership without silently discarding legacy browser data.
