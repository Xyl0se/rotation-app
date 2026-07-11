# ADR 009: Schema Versioning and Migration Framework

## Status

Accepted

## Context

Rotation stores data in browser `localStorage`. Changes to the data model (e.g. removing `isCurrent`, introducing `listenEvents`) previously had to be handled manually or not at all. Existing user data risked becoming inconsistent.

Sprint 47 was meant to create a robust foundation for future data model changes.

## Decision

Rotation introduces schema versioning with automatic migrations.

- A central key `rotation-schema-version` stores the current schema version.
- On app start, the stored version is compared to the current version.
- If the stored version is missing or older, registered migrations are executed sequentially.
- Migrations are idempotent and defensive: they check whether the migration has already been applied.
- The `Album` interface can receive breaking changes as long as a migration transfers existing data.

## Consequences

- `src/config/schemaVersion.ts` defines the current version.
- `src/config/migrations.ts` contains all registered migrations.
- New data model changes always require a migration and a version bump.
- Migrations must be backward-compatible (no data loss).
- `ARCHITECTURE.md` documents the migration framework.
