# Sprint 79 — Binding Candidate Review

**Status:** Completed — production candidate-quality verification passed 2026-07-16

**Target version:** `v0.27.1-dev`

**Type:** Workflow assistance and binding safety

---

## Goal

Reduce manual binding work when folder and Library metadata differ, while preserving
the rule that uncertain matches are proposals and never silently become confirmed
bindings.

## Context

The matcher already supports exact, case-insensitive, and punctuation/space-normalized
folder names. The remaining gap is ambiguous or genuinely different naming—not the
absence of a matcher.

## Workstream 79A — Evidence Collection

- Capture representative unmatched and ambiguous folder names from production use.
- Define expected candidates before selecting a distance algorithm or threshold.
- Establish precision-oriented fixtures for compilations, editions, punctuation,
  diacritics, artist aliases, and similarly named albums.

## Workstream 79B — Ranked Proposals

- Rank a bounded list of candidates using explicit title, artist, path, and available
  metadata signals.
- Expose the contributing signals and confidence as review information.
- Prefer “no proposal” over a misleading high-confidence match.
- Ensure one physical path cannot be assigned to multiple albums.

## Workstream 79C — Review UX

- Show ranked alternatives on missing/proposed bindings.
- Require a deliberate user confirmation before a binding becomes confirmed.
- Allow manual path selection and easy rejection of suggestions.
- Keep scanning read-only with respect to exported music files.

## Definition of Done

- [x] Representative Unicode, compilation-volume, unrelated, ambiguous, and exact-match cases have regression fixtures.
- [x] Candidate ranking improves those fixtures without weakening exact matches.
- [x] No uncertain candidate is auto-confirmed.
- [x] Ranking reasons are understandable in the Bindings UI in German and English.
- [x] Duplicate-library and stale-scan selection is rejected transactionally.
- [x] The feature can be bypassed through manual Library search or by capturing the scanned folder as a new Album.

## Implemented Architecture

- Unicode-safe title and artist similarity are scored independently; conflicting
  volume numbers receive an explicit penalty.
- At most three precision-oriented candidates are persisted per physical Binding and
  tied to the scan that produced them.
- Candidate selection links and confirms in one SQLite transaction. A candidate from
  an older scan or an Album already bound elsewhere returns `409`.
- Bindings exposes review, selection, rejection, and Capture fallback without ever
  modifying the source music directory.
- Reconcile now confirms only proposals that already have an explicit Library link;
  an arbitrary folder's existence is no longer sufficient.

## Remaining Production Check

A fresh production NAS scan and candidate review passed. Real unmatched folders
produced useful, conservative proposals without uncertain automatic confirmation;
no threshold adjustment was required for acceptance.

## Non-Goals

- Automatic confirmation based only on a similarity threshold
- Mutating or renaming the source music folder
- Machine-learning infrastructure
- Track-level matching
