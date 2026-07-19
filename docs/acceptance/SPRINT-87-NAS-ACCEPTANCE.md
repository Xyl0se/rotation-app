# Sprint 87 — Local Cover Feasibility and NAS Acceptance

**Result:** Pending — feasibility runner added; production samples not yet measured

## Preconditions

- [ ] A current full data-directory backup exists.
- [ ] `/music` is mounted read-only in the API container.
- [ ] Samples contain no irreplaceable files; the runner itself performs no writes.
- [ ] Record the idle API RSS before running the probe.

## A. Representative inventory

Select explicit, existing production samples without copying names into this document:

- [ ] MP3 with embedded front artwork
- [ ] M4A with embedded artwork
- [ ] FLAC with embedded artwork
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

- [ ] Confirm file modification times and hashes are unchanged before and after the run.
- [ ] Confirm the report contains no path, artist, album, tag text, or image bytes.
- [ ] Confirm unsupported extensions are rejected.
- [ ] Confirm malformed metadata returns `invalid-media` without terminating the run.
- [ ] Confirm execution is sequential and no sample exceeds the 5 MiB cover budget.

The repository-owned corrupt-input smoke check is:

```sh
npm --prefix server run spike:artwork -- test-fixtures/artwork/corrupt.mp3
```

## C. Performance gate

| Format | Audio bytes | Cover bytes | Parse ms | RSS delta bytes | Outcome |
|---|---:|---:|---:|---:|---|
| MP3 | pending | pending | pending | pending | pending |
| M4A | pending | pending | pending | pending | pending |
| FLAC | pending | pending | pending | pending | pending |
| Missing art | pending | 0 | pending | pending | pending |
| Corrupt art | pending | pending | pending | pending | pending |

- [ ] Median valid metadata parse is below 500 ms.
- [ ] Peak RSS delta is no more than 64 MiB above the idle API baseline.
- [ ] A normal Library read remains unaffected because extraction is not on its request path.

## D. Decision

- [ ] Accept ADR 017 and proceed with the production adapter.
- [ ] Or record a no-go/tighter-budget decision before implementing workstream 87B.
- [ ] Document any real naming variants that require a bounded addition to the allowlist.
