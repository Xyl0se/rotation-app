# ADR 019 — Bounded Whole-Album Playback

## Status

Accepted — direct-play feasibility remains an explicit Sprint-89 production gate

## Date

2026-07-20

## Context

Rotation has so far stopped at describing, selecting, and recording the relationship
between a person and an Album. ADR 012 therefore correctly stated that the shipped
application was not a music player. Confirmed Bindings, the read-only music mount, safe
local metadata extraction, and Album Detail now make a narrower capability possible:
listen to one deliberately chosen Album in its canonical order without introducing the
decision density of a Track player.

This capability completes the attention loop already expressed by Focus Album, Player
Rotation, Listening Events, and the Listening Journal. It is not permission to add
Track search, arbitrary queues, playlists, shuffle, repeat, or transport-style Track
navigation.

Media delivery introduces a hostile file and network boundary. Source files may have
malformed metadata, ambiguous order, unsupported codecs, large payloads, or interrupted
readers. Physical NAS paths and private tag text must not become public API identifiers
or operational telemetry.

## Decision

- Rotation may offer one bounded Whole Album Session. The product unit remains the
  Album, beginning with its first canonical Track and advancing in manifest order.
- Playback foundation is server-owned. Only confirmed Bindings may produce manifests
  and media, and every file resolution passes through the existing music `PathGuard`.
- Public media identity is an opaque Album-scoped Track identifier. Clients never send,
  receive, or reconstruct physical source paths.
- The original music tree remains mounted read-only. Playback never edits tags or art
  and never creates temporary data beside source files.
- The existing `music-metadata` adapter is the one local parsing stack for artwork and
  playback evidence. Parsing is sequential and bounded; parser output is untrusted.
- Direct same-origin byte delivery is the preferred architecture. It must pass the
  Sprint-89 production inventory, Browser/NAS, range, abort, and resource gates before
  Sprint 90 is approved.
- Unsupported media may be reported calmly. Transcoding is not implied by this ADR and
  requires a separate explicit product and operations decision.
- Rotation's interface is cooperative rather than DRM-like. Product controls can omit
  seek and Track navigation, but the system does not attempt to prevent a technically
  sophisticated user from accessing HTTP or browser facilities.

## State ownership boundary

Playback position, pause state, active Track, and recovery data are ephemeral
browser-local session state. They are not canonical Listening History and are not
synchronized between browsers or devices.

Loading, starting, pausing, retrying, stopping, or recovering media never creates a
Listening Event. Sprint 90 may add one idempotent completion handshake whose only
successful domain effect is exactly one canonical Listening Event after the final Track
ends naturally in the approved sequence. Partial Sessions remain private operational
state and are not persisted as behavioural telemetry.

## Amendment to ADR 012

This ADR supersedes only ADR 012's statements that Rotation must never stream directly
from the original library and is categorically not a player. The shipped product
described by ADR 012 remains historical fact; the new exception is deliberately limited
to a Whole Album Session.

ADR 012's two-layer privilege boundary, confirmed Binding model, PathGuard, separated
read-only/read-write mounts, export pipeline, Write Token, and Syncthing separation
remain binding. Playback does not weaken or replace any export or data-ownership rule.

## Initial gates and limits

Before implementing the public manifest and media endpoints:

- inspect at most 25 confirmed Bindings, two directory levels below an Album, 100
  supported files per Album, and 500 files per explicit production inventory run;
- report only aggregated format, codec, size, tagging, ordering, duration, and resource
  evidence—never paths, filenames, titles, artists, or image/audio bytes;
- establish representative MP3, M4A, FLAC, multi-disc, compilation, Unicode, missing-tag,
  malformed, and large-file evidence;
- record actual desktop Browser/NAS results and at least one relevant mobile browser
  when available;
- stop before Sprint 89B if direct delivery has no credible, bounded path.

The 2 GiB per-file inventory ceiling is a sampling guard, not a buffering allowance.
Media delivery must stream with backpressure and tighter request-level resource limits.

## Consequences

- Rotation can pursue playback without adopting streaming-service interaction patterns.
- The Album manifest becomes the authority for sequence and media identity.
- Real NAS acceptance remains mandatory because fixtures cannot establish codec support,
  transition quality, reverse-proxy behaviour, or production storage latency.
- A valid outcome of Sprint 89 is still a no-go for Sprint 90 or a decision to leave
  specific Tracks unsupported.
- General Track playback, playlist management, and automatic transcoding remain outside
  the approved architecture.

## Related documentation

- [ADR 002 — Albums, Not Songs](./002-albums-not-songs.md)
- [ADR 012 — Self-hosted music platform](./012-self-hosted-music-platform.md)
- [ADR 013 — Data Ownership Boundaries](./013-data-ownership-boundaries.md)
- [ADR 017 — Bounded Local Cover Extraction](./017-local-cover-extraction.md)
- [Sprint 89](../sprints/Sprint-89.md)
- [Sprint 89 NAS acceptance](../acceptance/SPRINT-89-PLAYBACK-ACCEPTANCE.md)
