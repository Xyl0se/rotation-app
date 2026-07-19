# ADR 017 — Bounded Local Cover Extraction

## Status

Proposed — implementation approved, production NAS measurements pending

## Date

2026-07-19

## Context

Sprint 87 should prefer artwork already stored with a confirmed music-folder Binding.
The music tree is a read-only source, while validated covers continue to be served from
Rotation's writable server cache. Reading embedded artwork introduces a hostile-input
boundary: tags may be malformed, images may be unexpectedly large, and several parallel
parses can exhaust a small NAS.

The current server is Node.js 22+, TypeScript, and native ESM. It already validates a
five-megabyte limit and basic signatures when caching uploaded or remote covers.

## Decision

- Use `music-metadata` as the single read-only adapter for MP3 ID3/APIC, M4A/MP4 `covr`,
  and FLAC PICTURE metadata. Version 11 is native ESM, requires Node.js 18 or newer, is
  MIT licensed, and exposes cover data through one common API.
- Do not use `jsmediatags`. Although BSD-3-Clause licensed and format-capable, its latest
  published release is materially older and its Node integration does not fit the
  server's current ESM architecture as directly.
- Parse files sequentially with duration calculation disabled. At most three bounded,
  deterministic audio candidates will be attempted for one album.
- Accept at most 5 MiB of extracted image data and at most 40 megapixels after the shared
  image validator has checked signature, MIME type, dimensions, and decodeability.
- Accept only JPEG, PNG, and WebP local artwork. GIF remains supported by the historical
  cache API but is not a Sprint-87 local source.
- Resolve the confirmed Binding through the existing music `PathGuard`. Never accept a
  music path from a cover API request, follow a symlink, return a source path, or mutate
  an audio or folder-art file.
- Folder candidates are limited to case-insensitive basenames `cover`, `folder`, and
  `front` directly inside the confirmed album directory. Preference is basename order,
  then JPEG, PNG, WebP, then normalized filename order.
- A manual upload or explicitly selected alternative is user intent and is not replaced
  by automatic resolution. Automatic order is folder, embedded, last known-good cache,
  remote provider, placeholder.
- A candidate replaces the cache only after complete validation and an atomic write.
  Failed resolution preserves the last known-good image.

## Initial budgets and rollout gate

| Boundary | Initial budget |
|---|---:|
| Audio candidates per album | 3 |
| Probe samples per invocation | 12 |
| Accepted embedded or folder image | 5 MiB |
| Accepted decoded dimensions | 40 megapixels |
| Resolution concurrency | 1 per process for initial rollout |
| Synchronous Library-card work | 0 |

The 2 GiB audio-file ceiling in the feasibility runner is an operational sampling guard,
not permission to buffer an audio file. Production parsing must use random-access file
I/O and must never load the audio payload as one buffer.

Before this ADR becomes Accepted, the Sprint-87 NAS acceptance record must contain MP3,
M4A, FLAC, missing-art, and corrupt-art measurements from the production filesystem.
The measured peak RSS must remain within 64 MiB above the idle API baseline for one
sequential resolution, and the median metadata parse must remain below 500 ms. A breach
requires tighter selection/budgets or a documented no-go decision; it must not silently
widen the limits.

## Consequences

- Parser output is untrusted input and cannot bypass Rotation's image validator.
- Sequential extraction favors predictable NAS memory over scan throughput.
- The feasibility runner reports format, sizes, timing, and RSS delta but deliberately
  omits paths, tag text, and image bytes.
- Real production measurements remain a release gate because repository fixtures cannot
  reproduce Synology storage latency or the maintainer's actual tag variants.

## Alternatives considered

- `jsmediatags`: rejected for the initial adapter because its currently published package
  is significantly older and less aligned with the server runtime.
- Custom ID3, MP4, and FLAC parsing: rejected because three security-sensitive container
  parsers would substantially increase maintenance and malformed-input risk.
- Shelling out to FFmpeg: rejected because the current API image has no FFmpeg runtime and
  adding an operating-system media tool would widen deployment and security scope.

## Related documentation

- [Sprint 87](../sprints/done/Sprint-87.md)
- [Sprint 87 NAS acceptance](../acceptance/SPRINT-87-NAS-ACCEPTANCE.md)
- [ADR 013 — Data Ownership Boundaries](./013-data-ownership-boundaries.md)
