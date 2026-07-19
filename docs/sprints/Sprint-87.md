# Sprint 87 — Local-First Cover Sources

> Personal-history follow-up: [Sprint 87.1 — Acquisition Context](./Sprint-87.1.md)
> extends the structured reasons why an Album entered the collection.

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

## Workstream 87C — Persistent and Atomic Resolution

**Implementation status:** Complete in code ✅ — production migration acceptance pending

- Migration 14 stores one durable resolution record per Album with current source and
  cache status, last attempt and successful resolution timestamps, sanitized failure
  code, non-reversible source fingerprint, byte size, MIME type, and dimensions.
- No music-folder path, filename, parser message, or image payload is persisted in the
  resolution table or returned by its API projection.
- A failed retry records its attempt and failure without erasing the last successful
  source metadata or changing an available last known-good cover from `cached`.
- Replacement candidates are fully validated and written to temporary files first.
  The previous cover and file metadata remain recoverable until the replacement and
  SQLite state have committed; a persistence failure restores both.
- Explicit uploads and deliberately selected alternatives remain authoritative and
  automatic local-first resolution never replaces them.
- Legacy JSON cover metadata remains a compatibility fallback for pre-migration files;
  SQLite is authoritative after the next resolution attempt.

## Workstream 87D — Scan, Capture, and Retry

**Implementation status:** Complete in code ✅ — production NAS acceptance pending

- Resolve local covers during explicit scan/capture or a bounded background job, not
  synchronously during Card rendering.
- Persist source type and sanitized failure reason for manual diagnostics.
- Let “Find cover again” retry local sources before remote providers.
- Keep MusicBrainz metadata lookup independent from cover extraction and downloads;
  remote candidates are handed to the server only after the Album exists.
- Queue post-create, Binding Capture, and manual-confirmation resolution in a bounded
  in-process queue of at most 25 pending Albums and process it sequentially.
- Persist the bounded remote candidate set with resolution state. Explicit retries send
  no provider ordering from the browser and reuse the server-owned candidates.
- Keep explicit scans synchronous for their bounded summary while interactive Create
  and Capture responses do not wait for music parsing or remote-provider retries.

## Workstream 87E — Diagnostics and Frontend

**Implementation status:** Implemented in code ✅ — production NAS acceptance pending

- Keep all Album rendering on the same-origin cached cover endpoint.
- Expose only bounded resolution state, timestamps, source type, sanitized failure,
  cache presence, candidate count, and safe image properties.
- Name the diagnostic timestamps explicitly as last attempt and last success while
  retaining the previous response aliases during rolling API/web deployments.
- Report only a tri-state indication of whether a local candidate was found; never
  expose its filename, directory, parser output, provider response, or image bytes.
- Let the retry result explain cached success, missing local artwork, invalid artwork,
  and a temporarily unavailable remote provider in German and English.
- Invalidate the browser display cache after an explicit resolution attempt.

## Workstream 87F — Tests and Rollout

**Implementation status:** Complete in code ✅ — NAS edge-case and rollout evidence
remains pending

- Cover migration, repository, restart persistence, rollback, validation, resolver
  priority, bounded batch, Binding integration, and API sanitization have automated tests.
- Folder JPEG/PNG/WebP, embedded MP3, missing and corrupt local art, source-file
  immutability, size/decode budgets, and last-known-good rollback are regression tested.
- Persisted Album rendering is regression-tested to use only the same-origin server
  cache. A deliberate URL import is downloaded once and persisted as an alternative;
  cache misses render a placeholder instead of contacting a provider from Album cards.
- Deploy matching API and Web images from one green commit, record their immutable
  digests and a current data-directory backup, then execute section E of the NAS record.
- Roll back API, Web, and the pre-deployment data backup together according to the
  [versioning runbook](../operations/VERSIONING.md); do not run an older API against a
  database already migrated by a newer image.
- Complete the remaining production cases in the Sprint-87 NAS acceptance record before
  declaring the sprint done.

## Definition of Done

- [x] Confirmed local artwork is preferred over remote lookup.
- [x] Music folders remain read-only and no embedded media is modified.
- [x] Malformed or huge images cannot exhaust API memory or replace a valid cover.
- [x] Cached rendering remains one same-origin path across all Album surfaces.
- [ ] MP3, M4A, FLAC, folder-image, missing-art, and corrupt-art fixtures are covered.
- [x] NAS scan and cache performance are measured before rollout.
