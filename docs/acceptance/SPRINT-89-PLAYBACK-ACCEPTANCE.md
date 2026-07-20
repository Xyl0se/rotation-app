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

- [ ] Representative MP3 files recorded.
- [ ] Representative M4A files recorded.
- [ ] Representative FLAC files recorded.
- [ ] At least one multi-disc Album recorded.
- [ ] A compilation and an Album with unusual Unicode recorded where available.
- [ ] Missing tags and the required filename-fallback count reviewed.
- [ ] Malformed media fails calmly without terminating the run.
- [ ] An unusually large file remains within the inventory boundary.
- [ ] Report contains no path, filename, artist, Album title, Track title, or media bytes.
- [ ] Source-file hashes or modification times remain unchanged after the run.

Record aggregate production output here; never copy private names or paths:

| Format | Files | Containers/codecs | Largest file | Parse errors | Filename fallback |
|---|---:|---|---:|---:|---:|
| MP3 | pending | pending | pending | pending | pending |
| M4A | pending | pending | pending | pending | pending |
| FLAC | pending | pending | pending | pending | pending |

| Ordering evidence | Count |
|---|---:|
| Albums inspected | pending |
| Multi-disc Albums | pending |
| Compilations | pending |
| Albums with Unicode filenames | pending |
| Ambiguous ordering | pending |

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

- [ ] Confirmed Albums produce deterministic, bounded manifests.
- [ ] Opaque media endpoints expose no source paths and reject wrong Album/Track pairs.
- [ ] `HEAD`, full `GET`, valid Range, malformed Range, and `416` behaviour pass.
- [ ] Aborts close file handles and bounded concurrency does not exhaust API or NAS.
- [ ] Track transition, interruption, restart, backgrounding, and next-Track preload pass.
- [ ] Achieved continuous/live Album transition behaviour is documented without an
      unmeasured gapless claim.
- [ ] Transcoding decision gate is recorded explicitly.
- [ ] Ephemeral session and idempotent completion contracts are defined.
- [ ] No playback-foundation action creates a Listening Event.

## E. Final decision

- [ ] Sprint 90 Whole Album Session: **go / no-go**.
- [ ] Automatic transcoding remains rejected or has a separate approved decision.
