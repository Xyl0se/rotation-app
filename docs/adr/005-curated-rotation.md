# ADR 005: Rotation as Curated Player Selection

## Status

Accepted

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
5 Classic, and 5 Still Growing. Role quotas are hard maxima; Admired and Archive are
not Rotation roles.

## Consequences

- UI texts speak of Focus Album when a single album is highlighted.
- `isCurrent` remains for now as a legacy field and is treated semantically as a focus marker.
- A future `RotationPlan` model describes the actual player rotation.
- The Rotation Generator builds later on roles, listening history, and target size.
- Persistence migrations are only implemented when the new rotation model is stable.
