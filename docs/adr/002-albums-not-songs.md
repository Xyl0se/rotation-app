# ADR 002: Albums, Not Songs

## Status

Accepted

## Decision

Rotation knows exclusively albums.

## Rationale

The product views music as a longer relationship. Individual songs would shift attention toward collection size, playlists, and fine-grained tracking.

## Consequence

The central model is `Album`. Features, domain rules, and UI texts should not introduce song entities.

If individual listening moments are documented later, they refer to an album.
