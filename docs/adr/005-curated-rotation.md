# ADR 005: Rotation as Curated Player Selection

## Status

Accepted; generation details amended by
[ADR 015](./015-rotation-generation-policy.md).

## Context

Rotation meant in early product development a single currently highlighted album.

The original product idea is broader:
Rotation should suggest a conscious selection from the library for the music player,
with a focused upper bound and weighted proportions from multiple roles.

## Decision

Rotation henceforth denotes a curated player selection of multiple albums.

Album roles describe the relationship with an album. They are candidate classes for a rotation, but not the rotation itself.

A Focus Album is a single highlighted album in the UI. It replaces the old single-album semantics without immediately removing the existing local data field `isCurrent`.

Listening sessions are album events. They are not bound to whether an album is part of a rotation or the current Focus Album.

The current default is a maximum of 25 Albums: 10 Newly Discovered, 5 Comfort Food,
5 Classic, and 5 Still Growing. These quotas are preferred first-pass proportions;
eligible roles may fill remaining slots. Admired and Archive are not Rotation roles.
The detailed generation policy is defined by [ADR 015](./015-rotation-generation-policy.md).

## Consequences

- UI texts speak of Focus Album when a single album is highlighted.
- `RotationPlan` is the server-owned model for draft, active, and archived rotations.
- Focus Album and Listening Events are also canonical server state.
- Composition settings may change future plans without rewriting historical plans.
