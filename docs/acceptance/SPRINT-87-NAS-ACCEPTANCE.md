# Sprint 87 — Local Cover Feasibility and NAS Acceptance

**Result:** Partially accepted — format, performance, and read-only gates pass; edge-case
evidence remains pending

## Preconditions

- [ ] A current full data-directory backup exists.
- [x] `/music` is mounted read-only in the API container.
- [ ] Samples contain no irreplaceable files; the runner itself performs no writes.
- [ ] Record the idle API RSS before running the probe.

## A. Representative inventory

Select explicit, existing production samples without copying names into this document:

- [x] MP3 with embedded front artwork
- [x] M4A with embedded artwork
- [x] FLAC with embedded artwork
- [ ] supported audio without artwork
- [ ] known malformed or corrupt metadata copy
- [ ] unusually large audio file
- [ ] JPEG, PNG, and WebP folder artwork where present

Open Bindings, expand Diagnostics, and select **Run artwork test**. The API selects one
bounded MP3, M4A, and FLAC sample from confirmed Bindings and processes them sequentially.
No container console is required.

The command-line runner remains available for development environments with a shell:

```sh
npm --prefix server run spike:artwork -- /music/sample-1.mp3 /music/sample-2.m4a /music/sample-3.flac
```

Store the JSON output with private operational evidence, not in Git: command arguments
contain private paths even though the generated JSON does not.

## B. Safety checks

- [x] Confirm file modification times and hashes are unchanged before and after the run.
- [x] Confirm the report contains no path, artist, album, tag text, or image bytes.
- [ ] Confirm unsupported extensions are rejected.
- [ ] Confirm malformed metadata returns `invalid-media` without terminating the run.
- [x] Confirm execution is sequential and no sample exceeds the 5 MiB cover budget.

The repository-owned corrupt-input smoke check is:

```sh
npm --prefix server run spike:artwork -- test-fixtures/artwork/corrupt.mp3
```

## C. Performance gate

| Format | Audio bytes | Cover bytes | Parse ms | RSS delta bytes | Outcome |
|---|---:|---:|---:|---:|---|
| MP3 | not reported | 39.3 KiB | 169.07 | 1.4 MiB | embedded cover found |
| M4A | not reported | 73.2 KiB | 192.41 | 840.0 KiB | embedded cover found |
| FLAC | not reported | 81.3 KiB | 87.64 | 388.0 KiB | embedded cover found |
| Missing art | pending | 0 | pending | pending | pending |
| Corrupt art | pending | pending | pending | pending | pending |

- [x] Median valid metadata parse is below 500 ms: 169.07 ms.
- [x] Peak reported RSS delta is no more than 64 MiB: 1.4 MiB.
- [x] A normal Library read remains unaffected because extraction runs only from the
  explicit Diagnostics action.

Production observation recorded on 2026-07-19. The runner inspected five confirmed
Bindings to select the three format samples. All selected files contained embedded
artwork, and all reported cover payloads remained far below the 5 MiB limit. The
production `/music` mount was verified read-only, and the sampled files remained
unchanged after the probe.

## D. Decision

- [ ] Accept ADR 017 and proceed with the production adapter.
- [ ] Or record a no-go/tighter-budget decision before implementing workstream 87B.
- [ ] Document any real naming variants that require a bounded addition to the allowlist.

## E. Local-first rollout acceptance (87B–87E)

- [ ] Deploy API and Web images from the same green 87E commit.
- [ ] Run an explicit music-folder scan and record the bounded cover-resolution summary.
- [ ] Confirm an Album with folder artwork receives that artwork before embedded or remote art.
- [ ] Confirm an Album without folder artwork receives valid embedded MP3, M4A, or FLAC art.
- [ ] Confirm an existing manual upload remains unchanged after scan and retry.
- [ ] Confirm “Find cover again” retries local sources before the remote provider.
- [ ] Confirm ordinary Library and Cover GET requests trigger no music metadata parsing.
- [ ] Confirm `/music` remains read-only and sampled source-file hashes remain unchanged.
- [ ] Confirm a failed or corrupt replacement leaves the last known-good cached cover visible.
