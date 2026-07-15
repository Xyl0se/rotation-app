# Sprint 79 — Binding Candidate Review

**Status:** Planned — validate priority from production scan results after Sprint 77

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

- [ ] Real unmatched examples have regression fixtures.
- [ ] Candidate ranking improves those fixtures without weakening exact matches.
- [ ] No uncertain candidate is auto-confirmed.
- [ ] Ranking reasons are understandable in the Bindings UI.
- [ ] Duplicate-path and stale-scan edge cases are covered.
- [ ] The feature can be bypassed through manual binding selection.

## Non-Goals

- Automatic confirmation based only on a similarity threshold
- Mutating or renaming the source music folder
- Machine-learning infrastructure
- Track-level matching
