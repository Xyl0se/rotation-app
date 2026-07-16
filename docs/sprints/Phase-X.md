# Phase X — Durable Companion Foundations

**Status:** Future phase; only Sprint 80 is sufficiently defined to plan

---

## Entry Condition

The core NAS workflow is released and the product has been used long enough to
distinguish real operational needs from speculative platform work.

## Planned Foundation

- [Sprint 80 — Canonical Listening & Rotation Persistence](./done/Sprint-80.md)

Listening History, Focus Album, and RotationPlan currently remain canonical in
browser storage. Moving them to server ownership closes a durability and backup gap.
It is also a prerequisite for any credible second-device or PWA workflow, but does
not itself commit Rotation to those features.

## Conditional Directions

### Asynchronous Scan Jobs

Consider only when real NAS measurements show scans timing out or blocking useful
work. The first design concern is a durable, restart-safe job and progress model.
Streaming transport, SSE, WebSockets, or a separate worker are implementation choices,
not goals by themselves.

### Mobile or PWA Companion

Define a concrete mobile workflow before choosing PWA, iOS, or Android technology.
Offline-first writes require explicit conflict handling and remain out of scope until
there is evidence they are needed.

### Weekly Reflection and Listening Patterns

Explore narrative observations only after listening history is durable enough to
support them. Observations must remain transparent and non-evaluative—for example,
noticing renewed attention to a genre or role changes without scoring the Library.

### Explainability 2.0

Extend rotation reasoning only where production use reveals unanswered “why this
album?” questions. Prefer improving existing explanations over adding a parallel
recommendation system.

## Non-Goals Without a New Decision

- Native prototypes without a validated workflow
- Generic synchronization infrastructure
- Offline mutation queues
- Statistics or optimization of the collection
- Architecture sized speculatively for 10,000+ albums
