# ADR 007: Role Explorer — Roles as Distinct Areas Within the Library

## Status

Accepted

## Context

The library showed albums as a flat grid. Users could filter by role, but the roles themselves had no own presence. The question "Which albums tell the same story together?" could not be answered.

Sprint 49 was meant to make roles into distinct, explorable areas.

## Decision

Each of the six album roles receives its own overview page in the Role Explorer.

- The Role Explorer shows all roles as a grid with icon, title, description, count, and cover preview.
- Each role has a detail view with its own header, description, and album grid.
- The library receives a view switcher that toggles between "All Albums" and "By Role".
- Album cards can optionally show a role label.
- Each role has an individual empty state instead of a generic placeholder.

## Consequences

- Roles are no longer just filter criteria, but navigable areas.
- `domain/roles/*` contains role-specific logic and messages.
- `components/features/role-explorer` is a distinct feature slice.
- New roles require adjustments in the explorer, the switcher, and the empty states.
