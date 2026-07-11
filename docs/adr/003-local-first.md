# ADR 003: Local First

## Status

Accepted (superseded by Sprint 58 — see `ARCHITECTURE.md`)

## Decision

Rotation stores the current product core locally in the browser.

## Rationale

Early product value emerges without user account, server, or synchronization. Local-first keeps the application light, private, and quickly testable.

## Consequence

`localStorage` is currently the persistent source for:

- Onboarding status
- Album library

Later migrations to IndexedDB, export/import, or cloud sync must respect the local library and keep it migratable.

> **Update Sprint 58:** The deployment foundation uses Docker with Caddy as a static web server. The app remains local-first in the browser — there is still no server-side backend or database.
