# ADR 016 — Deterministic Insight Evidence

## Status

Accepted

## Date

2026-07-18

## Context

Insights should help the maintainer notice change in a long-running relationship with
music. Client-side ratios over the current Album snapshot cannot reliably represent
historical roles, archived Rotations, or large Libraries, and opaque interpretation
would undermine the product's reflective tone and privacy boundary.

## Decision

- Insight evidence is selected and evaluated deterministically on the server from
  canonical SQLite data.
- Every narrative exposes a stable code, bounded period, minimum sample rule, evidence
  level, and supporting factual metrics.
- Historical Listening Events use the Role valid at listening time when Role History
  provides it. Current Roles are not projected backwards.
- Free Journal notes and Album Story memory prose are excluded from Insight queries.
  Structured tags and enumerated Story fields may be used by an explicitly documented
  rule family.
- Sparse or contradictory evidence suppresses a narrative and produces an honest
  building state where useful.
- Insight responses are read-only projections and cannot mutate domain state.
- When more narratives qualify than the bounded response permits, equal-priority
  candidates use a deterministic calendar-week seed. Selection is stable on reload
  and across browsers without persisting derived Insight state.
- A future AI integration may only provide optional wording over a sanitized evidence
  packet after explicit opt-in. It cannot select facts, determine eligibility, read
  private prose by default, or perform mutations. Deterministic copy remains mandatory.

## Consequences

- The API, not the browser's currently loaded page, is the source of Insight truth.
- Narrative rules and translations remain testable with a fixed clock.
- New families require explicit evidence, privacy, minimum-sample, and suppression
  decisions.
- The system can explain every displayed statement without exposing personal notes.
- AI integration is unnecessary for correct operation and can be omitted indefinitely.

## Related documentation

- [Insights Page](../product/INSIGHTS_PAGE.md)
- [Sprint 86](../sprints/done/Sprint-86.md)
- [ADR 013 — Data Ownership Boundaries](./013-data-ownership-boundaries.md)
