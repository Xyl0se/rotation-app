# Sprint 87 — Local-First Cover Sources

**Status:** In progress — feasibility runner ready; production NAS measurements required

**Target version:** Future minor or focused maintenance release

**Type:** Media metadata extraction and cover-source resilience

## Goal

Prefer artwork already owned with the music files and use MusicBrainz/Cover Art
Archive only as a fallback, without mutating the read-only music folder or slowing
normal Library reads.

## Workstream 87A — Source Inventory and Safety

- [ADR 017](../adr/017-local-cover-extraction.md) records the initial parser decision,
  safety budgets, source order, and manual-override boundary. The bounded runner is
  available as `npm --prefix server run spike:artwork -- <explicit files>`.
- The deployed application exposes the same bounded check through the expanded Diagnostics
  panel; it selects samples from confirmed Bindings and requires no container shell.
- Complete and accept
  [the Sprint-87 NAS record](../acceptance/SPRINT-87-NAS-ACCEPTANCE.md) before production
  extraction is connected to scan, capture, or retry flows.
- Measure real NAS formats and naming: embedded MP3/M4A/FLAC artwork plus bounded
  folder files such as `cover`, `folder`, or `front` in JPEG/PNG/WebP form.
- Confirm required parsers, licenses, memory limits, malformed-tag behavior, and NAS
  performance before selecting a dependency.
- Preserve `/music` as read-only and never expose arbitrary source paths to the browser.

**Gate exception (2026-07-19):** Implementation of 87B was explicitly authorized before
the missing-art, corrupt-art, and folder-art production observations were complete. Those
checks remain visible in the NAS record and are not silently treated as passed.

## Workstream 87B — Ordered Resolution

**Implementation status:** Complete in code ✅ — production acceptance follows with 87C

Use a deterministic preference order:

1. validated folder artwork belonging to the confirmed Binding;
2. validated embedded artwork from a bounded representative audio file;
3. existing server-cached remote artwork;
4. MusicBrainz/Cover Art Archive resolution;
5. placeholder.

- Validate signature, MIME type, dimensions, byte size, and decodeability.
- Copy/normalize accepted artwork into the existing server cover cache.
- Keep the last known-good cover until a replacement has been fully validated.

## Workstream 87C — Scan and Diagnostics

- Resolve local covers during explicit scan/capture or a bounded background job, not
  synchronously during Card rendering.
- Persist source type and sanitized failure reason for manual diagnostics.
- Let “Find cover again” retry local sources before remote providers.

## Definition of Done

- [ ] Confirmed local artwork is preferred over remote lookup.
- [ ] Music folders remain read-only and no embedded media is modified.
- [ ] Malformed or huge images cannot exhaust API memory or replace a valid cover.
- [ ] Cached rendering remains one same-origin path across all Album surfaces.
- [ ] MP3, M4A, FLAC, folder-image, missing-art, and corrupt-art fixtures are covered.
- [ ] NAS scan and cache performance are measured before rollout.
