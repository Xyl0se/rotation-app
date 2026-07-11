# ADR 004: Library State

## Status

Accepted

## Decision

The library logic lives in its own React Hook (`useLibrary`).

## Rationale

- HomePage stays focused on presentation.
- Storage can later be easily replaced (e.g. IndexedDB or cloud).
- All library operations are in one place.

## Consequence

New functions like delete, edit, or search are added to the hook.

## Implementation

Implemented in Sprint 47. `src/hooks/useLibrary.ts` provides the full library state management with normalized loading, storage adapter integration, and mutation methods (`addAlbum`, `updateAlbum`, `deleteAlbum`, `archiveAlbum`, `setFocusAlbum`, etc.).
