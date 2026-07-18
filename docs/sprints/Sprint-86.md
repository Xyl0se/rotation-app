# Sprint 86 — Deeper Insights

**Status:** 86.1 accepted ✅ — 86.2 implemented; NAS acceptance pending

**Target version:** Future minor version

**Type:** Deterministic longitudinal interpretation

## Goal

Turn Insights into a richer, calm interpretation of the user's relationship with
music while keeping every statement traceable to server-owned facts and avoiding
scores, judgment, opaque recommendations, or automatic mutations.

## Delivery strategy

Sprint 86 has two deliberately separate deliveries. **86.1** establishes the
canonical server-side evidence system and the least interpretatively sensitive core
narratives. **86.2** may add recurring artists, release eras, structured personal
history, and a refined weekly narrative rotation only after 86.1 has passed NAS review.

## Workstream 86.1 — Evidence Engine and Core Narratives

**Implementation status:** Accepted on NAS ✅

### Evidence contract

- A read-only `GET /insights` endpoint returns `generatedAt`, a neutral Role overview,
  at most four narratives, explicit evidence metrics, bounded periods, evidence level,
  and honest building areas.
- Every narrative has a stable code and family. Evidence levels describe data support,
  never the health or quality of the Library.
- Listening roles are derived from Role History at the time of each Listening Event;
  today's role is not projected backwards.
- Free Journal notes and Album memory text are not read or interpreted.

### Core families

- discovery versus familiarity across the recent and preceding 90-day windows;
- dormant Albums outside the active Rotation;
- listens returning after at least 180 quiet days;
- established Role movement during 180 days;
- membership change between active and previous accepted Rotations.

Each rule has a minimum sample size and suppression behavior. Sparse Libraries show a
single calm building state instead of invented copy.

### Interface

- Insights retains Reflection first and the permanent neutral Role overview.
- Narrative cards use complete deterministic DE/EN copy, show their period, and expose
  supporting counts plus stable rule code under “Why am I seeing this?”.
- At most four observations are shown, ordered by meaningful change rather than by a
  collection score.

### Verification

- Unit coverage fixes time and exercises eligibility, suppression, priority, and
  evidence packets.
- Route coverage proves the endpoint is public/read-only and excludes personal text.
- The representative 10,000-Album gate requires evaluation below 250 ms.
- Production verification follows
  [the Sprint-86.1 NAS acceptance](../acceptance/SPRINT-86.1-NAS-ACCEPTANCE.md).

## Workstream 86.2 — Extended Narrative Families

**Implementation status:** Complete in code ✅ — NAS acceptance pending

- Recurring-artist observations require at least eight recent listens, three for the
  artist, two distinct Albums, and a meaningful share of the listening window.
- Release-decade observations require at least ten Albums with usable years, five
  recent year-backed listens, and a repeated decade signal. Breadth is never scored.
- Personal-history observations require at least eight Albums with structured Story
  fields and three matching recent listens. Only enumerated acquisition reason or
  life phase is read; `memoryNote` and Journal prose remain excluded.
- Equally important eligible narratives are selected by a stable calendar-week seed.
  The same evidence does not jump on reload or between browsers within that week.
- Production verification follows
  [the Sprint-86.2 NAS acceptance](../acceptance/SPRINT-86.2-NAS-ACCEPTANCE.md).

## Optional AI boundary

No AI provider is part of Sprint 86. Facts, eligibility, suppression, and fallback
wording remain deterministic. Any future AI may only rephrase a sanitized evidence
packet after explicit opt-in and can never read private prose by default or mutate
Albums, Roles, Rotations, Reflections, or Archive state. See
[ADR 016](../adr/016-deterministic-insight-evidence.md).

## Definition of Done

### 86.1

- [x] Every core insight exposes evidence and a stable rule family.
- [x] Role overview remains neutral and available from the same canonical response.
- [x] Sparse data produces honest building states, not invented narratives.
- [x] DE/EN output is complete and deterministic fallback is always available.
- [x] Performance remains bounded for a 10,000-Album Library.
- [x] No insight changes an Album, Role, Rotation, Reflection, or Archive state.
- [x] Production NAS acceptance confirms tone, evidence, persistence independence, and performance.

### 86.2

- [x] Extended artist, era, and structured personal-history families are implemented.
- [x] Stable weekly selection is deterministic and covered with fixed-clock tests.
- [ ] Final Sprint 86 NAS acceptance passes.

## Non-goals

- Collection-health scores or target Role distributions
- Charts for their own sake
- Analysis of free Journal/Album Story prose
- Recommendations presented as facts
- AI provider integration
- Any automatic domain mutation
