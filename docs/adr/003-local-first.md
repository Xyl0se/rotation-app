# ADR 003: Local First

## Status

Superseded by [ADR 013](./013-data-ownership-boundaries.md) and
[ADR 014](./014-server-owned-rotation-state.md). Retained as historical context.

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

> **Correction:** This historical decision was replaced by the SQLite/API architecture.
> ADR 013 defines the ownership classes; ADR 014 establishes server ownership for
> Listening History, Rotation Plans, and Focus Album.
