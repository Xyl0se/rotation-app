# ADR 004: Library State

## Status

Amended by [ADR 013](./013-data-ownership-boundaries.md). The hook boundary remains
accepted; the former browser-storage implementation is superseded.

## Decision

The library logic lives in its own React Hook (`useLibrary`).

## Rationale

- HomePage stays focused on presentation.
- Server communication and presentation state remain isolated from the HomePage.
- All library operations are in one place.

## Consequence

New functions like delete, edit, or search are added to the hook.

## Implementation

`src/hooks/useLibrary.ts` loads the canonical Library from the API into ephemeral React
state and exposes server-confirmed, non-optimistic mutations. It does not persist Album
records in browser storage. Rotation and Focus operations use their dedicated
server-owned state hooks.
