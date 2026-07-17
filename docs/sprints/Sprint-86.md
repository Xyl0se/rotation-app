# Sprint 86 — Deeper Insights

**Status:** Planned — product direction approved; follows Reflection/Journal evidence

**Target version:** Future minor version

**Type:** Semi-deterministic longitudinal interpretation

## Goal

Turn Insights into a richer, calm interpretation of the user's relationship with
music while keeping every statement traceable to server-owned facts and avoiding
scores, judgment, or opaque recommendations.

## Workstream 86A — Insight Evidence Model

- Derive bounded evidence from roles, listening recency/frequency, Rotation presence,
  Focus history, archive movement, release years, acquisition/life-phase metadata,
  completed Reflections, and optional Journal entries.
- Define stable insight codes, minimum sample sizes, confidence bands, and suppression
  rules for sparse or contradictory evidence.
- Keep the neutral role overview as a permanent first-class section.

## Workstream 86B — Narrative Families

- Add localized observations for discovery versus familiarity, dormant versus active
  Library areas, Rotation variety, rediscovery, long-term role movement, listening
  eras, recurring artists, and personal-history themes where evidence exists.
- Show the supporting facts behind each narrative on demand.
- Prefer a small rotating set of meaningful observations over a dense dashboard.

## Workstream 86C — Longitudinal Comparison

- Compare bounded periods such as current versus previous Rotation cycles or recent
  versus earlier listening windows.
- Explain change in plain language without prescribing an optimal role distribution.
- Handle empty, young, imported, and partially documented Libraries honestly.

## Workstream 86D — Optional AI Boundary

- Keep evidence selection and eligibility deterministic.
- Treat any later AI integration only as an optional wording/synthesis layer over a
  sanitized evidence packet, never as the source of facts or automatic mutations.
- Require explicit configuration, local-first disclosure, timeouts, cost/privacy
  documentation, deterministic fallback copy, and no album history in prompts unless
  the user knowingly enables it.
- Do not implement an AI provider in the first delivery of this sprint.

## Definition of Done

- [ ] Every insight exposes its evidence and stable rule family.
- [ ] Role overview remains neutral and always available.
- [ ] Sparse data produces honest empty/building states, not invented narratives.
- [ ] DE/EN output is complete and deterministic fallback is always available.
- [ ] Performance remains bounded for a 10,000-Album Library.
- [ ] No insight changes an Album, role, Rotation, or archive state automatically.

