# ADR 015 — Rotation Generation Policy

## Status

Accepted

## Date

2026-07-16

## Context

The Library documents a relationship with albums and must not be optimized toward a
target distribution. A Player Rotation is different: it is a bounded selection for
focused listening and therefore needs an explicit, configurable composition policy.

Treating role quotas as hard maxima produced unnecessarily short Rotations when one
role had too few candidates. Deterministic ordering also caused repeated generation
to return the same albums even when a larger eligible pool existed.

## Decision

- Only `new`, `comfort-food`, `classic`, and `growing` albums are eligible.
- `admired` and `archive` albums are excluded.
- The default target size is 25 albums.
- The default preferred composition is 10 New, 5 Comfort Food, 5 Classic, and
  5 Still Growing.
- Quotas are a preferred first pass, not global role maxima. Unfilled slots are drawn
  from the remaining eligible pool until the configured target size or the available
  pool is exhausted.
- Candidate selection is randomized without selecting an Album more than once.
- Rotation settings are server-owned. Every persisted Rotation Plan retains its own
  target and quota snapshot so later setting changes do not rewrite history.
- The Focus Album, when set, must be a member of the active Rotation.

## Consequences

- Repeated drafts can differ when the eligible pool is larger than the target.
- A Rotation may contain more albums of a role than its preferred quota when another
  role cannot fill its share.
- A Rotation may contain fewer than the target only when the total eligible pool is
  too small.
- The generator remains explainable: each item records whether it entered through a
  preferred quota or gap filling.
- Product documentation must describe quotas as preferred composition, not hard caps.

## Related Documentation

- [Curated Rotation](../product/CURATED_ROTATION.md)
- [ADR 005 — Rotation as Curated Player Selection](./005-curated-rotation.md)
- [ADR 014 — Server-Owned Rotation State](./014-server-owned-rotation-state.md)
