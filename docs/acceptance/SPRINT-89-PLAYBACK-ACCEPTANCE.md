# Sprint 89 — Playback Foundation Acceptance

**Result:** Pending — Workstream 89A inventory evidence required before manifest work

## A. Architecture and safety preconditions

- [x] ADR 019 approves only bounded Whole Album Sessions.
- [x] ADR 012 retains confirmed Binding, PathGuard, read-only mount, export, and data
      ownership boundaries.
- [ ] A current full data-directory backup exists.
- [ ] `/music` is mounted read-only in the deployed API container.
- [ ] Source-file hashes or modification times are captured before the inventory run.

## B. Production media inventory (89A)

Deploy matching API and Web images, open **Bindings → Diagnostics**, and select
**Run media inventory**. No container console or shell is required. The explicit action
inspects confirmed Bindings sequentially and returns aggregate evidence only.

- [x] Representative MP3 files recorded.
- [x] Representative M4A files recorded.
- [x] Representative FLAC files recorded.
- [x] At least one multi-disc Album recorded.
- [ ] A compilation and an Album with unusual Unicode recorded where available.
- [x] Missing tags and the required filename-fallback count reviewed.
- [ ] Malformed media fails calmly without terminating the run.
- [x] An unusually large file remains within the inventory boundary.
- [x] Report contains no path, filename, artist, Album title, Track title, or media bytes.
- [ ] Source-file hashes or modification times remain unchanged after the run.

Record aggregate production output here; never copy private names or paths:

| Format | Files | Containers/codecs | Largest file | Parse errors | Filename fallback |
|---|---:|---|---:|---:|---:|
| MP3 | 68 | MPEG / MPEG 1 Layer 3 | 15.2 MiB | 0 | 0 |
| M4A | 113 | M4A/mp42/isom / MPEG-4/AAC | 14.6 MiB | 0 | 0 |
| FLAC | 155 | FLAC / FLAC | 99.4 MiB | 0 | 0 |

| Ordering evidence | Count |
|---|---:|
| Albums inspected | 25 |
| Multi-disc Albums | 3 |
| Compilations | pending |
| Albums with Unicode filenames | pending |
| Ambiguous ordering | 0 |

Production inventory recorded on 2026-07-20: 25 confirmed Bindings yielded 25 Albums
and 336 audio files. Every inspected file contained Track number, title, and duration
metadata. The run reported no parse error, no filename fallback, and no ambiguous Album
ordering. Observed sample rates were 44.1 kHz for all formats and additionally 48 kHz
for FLAC; M4A reported 16-bit depth and FLAC reported 16- and 24-bit depth. MP3 did not
expose a meaningful bit-depth value through the parser.

## C. Direct-play compatibility baseline (89A gate)

Use representative files from the inventory. Record Browser versions only in private
operational evidence if they identify a private environment.

| Browser/NAS combination | MP3 | M4A | FLAC | Decision |
|---|---|---|---|---|
| Production desktop browser 1 | pending | pending | pending | pending |
| Production desktop browser 2, if used | pending | pending | pending | pending |
| Relevant mobile browser, if available | pending | pending | pending | pending |

- [ ] Direct playback has a credible compatibility baseline: **go / no-go**.
- [ ] Unsupported or ambiguous media is identified without proposing automatic
      transcoding.

## D. Manifest, delivery, continuity, and session acceptance (89B–89F)

### D1. Manifest (89B) — Implemented

- [x] Confirmed Albums produce deterministic, bounded manifests via
      `GET /playback/manifest/:albumId`.
- [x] Manifest contains `albumId`, `title`, `artist`, `coverPath`,
      `totalDuration`, and `tracks[]` with `opaqueTrackId`, `discNumber`,
      `trackNumber`, `title`, `duration`, `mediaType`, `playable`.
- [x] Only files below the confirmed Binding directory are resolved.
- [x] Tracks are sorted by validated disc/track numbers; natural-filename
      fallback is used only when tags are absent (documented as
      `filename-fallback-used` diagnostic).
- [x] Artwork, playlists, hidden control files, and unsupported file types
      are excluded by the existing `collectAudioEntries` boundary.
- [x] Incomplete or ambiguous ordering (duplicate positions) surfaces as a
      503 diagnostic; the endpoint never silently invents a sequence.
- [x] Manifests are cached in `playback_manifest_cache` outside the read-only
      music folder and invalidated when an explicit scan detects relevant
      file changes (`scanService.invalidateAll()`) or a binding is confirmed
      (`bindingCaptureService.invalidateManifest()`).
- [x] Response contains no source paths, filenames, or physical identities.

### D2. Safe media delivery (89C) — Pending

- [ ] Opaque media endpoints expose no source paths and reject wrong Album/Track pairs.
- [ ] `HEAD`, full `GET`, valid Range, malformed Range, and `416` behaviour pass.
- [ ] Aborts close file handles and bounded concurrency does not exhaust API or NAS.

### D3. Browser and continuity (89D) — Pending

- [ ] Track transition, interruption, restart, backgrounding, and next-Track preload pass.
- [ ] Achieved continuous/live Album transition behaviour is documented without an
      unmeasured gapless claim.

### D4. Transcoding gate (89E) — Pending

- [ ] Transcoding decision gate is recorded explicitly.

### D5. Session contract (89F) — Pending

- [ ] Ephemeral session and idempotent completion contracts are defined.

### D6. Cross-cutting

- [ ] No playback-foundation action creates a Listening Event.

## E. Final decision

- [ ] Sprint 90 Whole Album Session: **go / no-go**.
- [ ] Automatic transcoding remains rejected or has a separate approved decision.
