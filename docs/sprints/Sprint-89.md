# Sprint 89 — Playback Foundation

**Status:** In Progress — 89A implemented, 89B implemented, 89C implemented, 89D implemented, 89E–89F pending

**Target version:** Future major product capability

**Type:** Read-only media delivery, metadata extraction, security, and NAS validation

**Progress:** Workstream 89A implemented — ADR 019 accepted; production inventory
complete. Workstream 89B implemented — manifest endpoint, cache, and invalidation
deployed. Workstream 89C implemented — safe media delivery with opaque URLs,
Range support, and abort handling. Workstream 89D implemented — browser
playback spike with play/pause/resume, Track transition, bounded preload,
and continuity tests. Workstreams 89E–89F pending production browser validation.

## Goal

Prove that Rotation can safely and reliably play the user's real NAS music files in a
browser before committing to a Player interface. Sprint 89 delivers the read-only
technical foundation for a later Whole Album Session, not a general-purpose Track
player.

The result must work with confirmed Bindings, preserve the music folder as read-only,
hide physical NAS paths, and remain bounded under malformed metadata, unsupported
codecs, large files, and interrupted connections.

## Product boundary

Rotation does not become a playlist manager or an on-demand Track browser. The future
unit of playback is one complete Album in its canonical disc-and-track order.

Sprint 89 creates no permanent bottom Player and no public Track selection UI. Its
purpose is to establish whether the real collection can support the approved product
idea without weakening Rotation's safety or attention philosophy.

## Architecture decision

[ADR 012](../adr/012-self-hosted-music-platform.md) currently states that Rotation is
not a music player. That remains the correct description of the shipped product.

Before implementation begins, Sprint 89 must add a new ADR that explicitly records:

- why a bounded Whole Album Session now belongs to the product;
- which part of ADR 012 it supersedes and which read-only/export boundaries remain;
- why this is not a generic playlist or Track-player capability;
- the ownership boundary between persistent Listening Events and ephemeral playback;
- the accepted limits of a cooperative interface rather than DRM-style enforcement.

## Dependencies and reuse

- [Sprint 87](./done/Sprint-87.md) establishes the safe local metadata parser used for
  embedded cover extraction. Sprint 89 should reuse that bounded parser for disc number,
  Track number, title, duration, and codec/container evidence rather than introduce a
  second media parsing stack.
- [Sprint 88](./done/Sprint-88.md) provides the Album Detail surface from which an
  Album Session can be started, but Playback Foundation remains independently testable.
- Existing Binding confirmation, path guards, same-origin delivery, logging redaction,
  and read-only `/music` mounts remain authoritative.

## Workstream 89A — Production media inventory

- Measure representative production Albums across MP3, M4A, and FLAC, including
  multi-disc Albums, compilations, missing tags, unusual Unicode, and folder artwork.
- Record container, codec, sample rate, bit depth, tagging quality, file size, Track
  count, and Browser/NAS combinations without copying private paths into documentation.
- Determine how often filenames must be used as a bounded fallback for missing Track
  metadata.
- Identify unsupported or ambiguous media before selecting any transcoding strategy.
- Establish explicit go/no-go evidence for direct browser playback.

Implementation note: the privacy-safe inventory is available through **Bindings →
Diagnostics → Run media inventory** so it can run in the shell-less production API
deployment. Results are recorded in
[Sprint 89 Playback Acceptance](../acceptance/SPRINT-89-PLAYBACK-ACCEPTANCE.md).

## Workstream 89B — Canonical playback manifest

Create a server-owned manifest for an Album with a confirmed, existing Binding:

```text
albumId
title
artist
coverPath              same-origin cached artwork only
totalDuration
tracks[]
  opaqueTrackId
  discNumber
  trackNumber
  title
  duration
  mediaType
  playable
```

- Resolve only files below the confirmed Binding directory.
- Sort by validated disc and Track numbers; use a documented natural-filename fallback
  only when tags are absent.
- Exclude artwork, playlists, hidden control files, and unsupported file types.
- Surface incomplete or ambiguous ordering as a diagnostic; never silently invent a
  confident sequence.
- Cache bounded metadata outside the read-only music folder and invalidate it when an
  explicit scan detects relevant file changes.

## Workstream 89C — Safe media delivery

- Add opaque, Album-scoped media URLs; never expose or accept an arbitrary source path.
- Re-resolve every Track through the confirmed Binding and path guard before opening it.
- Support `HEAD`, full `GET`, and one valid byte `Range` request with correct
  `200`, `206`, and `416` behavior.
- Return correct `Content-Type`, `Content-Length`, `Accept-Ranges`, `Content-Range`,
  cache validators, and conservative same-origin security headers.
- Stream with backpressure instead of buffering complete Albums or Tracks in API memory.
- Close file handles on abort and redact source paths from errors, logs, and responses.
- Preserve the music mount as read-only; playback never writes tags, artwork, or
  temporary data beside the source files.

## Workstream 89D — Browser and continuity spike

- Verify direct playback in the production desktop browsers and at least one relevant
  mobile browser if available, without expanding scope into a mobile app.
- Test play, pause, resume, Track-end transition, network interruption, API restart,
  browser backgrounding, and unsupported media.
- Measure the audible transition between adjacent Tracks, especially continuous and
  live Albums.
- Evaluate bounded preload of only the next Track and prove it does not exhaust browser
  or NAS resources.
- Treat true gapless playback as evidence-driven: document the achieved behavior and
  do not promise it unless measured across representative formats.

## Workstream 89E — Transcoding decision gate

Direct delivery is the preferred first implementation. Server-side transcoding is not
introduced merely because one theoretical format may be unsupported.

If production evidence shows meaningful incompatibility, document before approval:

- exact affected formats and Browser/NAS combinations;
- CPU, memory, startup, image-size, temporary-storage, and licensing implications;
- whether on-demand or cached transcoding would preserve the read-only source boundary;
- failure recovery and concurrency limits;
- the simpler option of marking those Tracks unsupported.

FFmpeg or another transcoder requires a separate explicit product and operations
decision after this gate.

## Workstream 89F — Ephemeral session contract

- Define a browser-local active Album Session containing manifest identity, current
  Track, elapsed position, pause state, and start time.
- Keep navigation within Rotation from interrupting playback.
- Do not make cross-browser playback synchronization a requirement.
- Define reload/crash recovery separately from durable Listening History.
- Specify one idempotent completion handshake for Sprint 90; loading or starting media
  must never create a Listening Event.

## Security and operational verification

- Traversal, encoded traversal, symlink escape, stale Binding, wrong Album/Track pair,
  unsupported method, multi-range abuse, malformed range, and oversized-header tests.
- File-descriptor, abort, concurrency, memory, and NAS throughput measurements.
- Fixtures for tagged/untagged MP3, M4A, FLAC, multi-disc, corrupt metadata, corrupt
  audio, Unicode names, empty folders, and unsupported files.
- Container smoke test with the production read-only mount and reverse proxy.
- No media bytes or physical source paths in ordinary logs, metrics, backups, or audit.

## Definition of Done

- [ ] A new ADR approves the bounded Whole Album capability and updates ADR 012's scope.
- [ ] Production media inventory establishes a documented direct-play compatibility
      baseline.
- [ ] Confirmed Albums produce deterministic, bounded playback manifests.
- [ ] Opaque media endpoints stream only files belonging to the requested Album.
- [ ] Byte ranges, aborts, and file-handle cleanup are correct and covered.
- [ ] Real NAS tests measure Track transitions, codec support, and resource use.
- [ ] Unsupported or ambiguously ordered Albums fail calmly without partial invention.
- [ ] No playback action mutates the music folder or creates a Listening Event.
- [ ] A clear go/no-go decision exists for Sprint 90 and for any transcoding proposal.

## Non-goals

- Visible persistent Player controls
- Track selection, queue management, playlists, shuffle, repeat, or search-by-Track
- User-controlled seeking, next, or previous
- Cross-browser session synchronization
- Editing source-file metadata
- Automatic transcoding without a separate approved decision
- Claiming DRM-like prevention of technically sophisticated seeking
