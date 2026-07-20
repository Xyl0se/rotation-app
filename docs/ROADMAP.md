# Rotation Roadmap

> Rotation is not a tool for managing a music collection.
>
> Rotation accompanies the relationship between person and album.

Version: v0.30.0 — Sprint 87 release candidate

---

## Roadmap Decision Point

Rotation has reached its first complete intended workflow in code:

```text
capture album → Library → music-folder binding → curated rotation
→ export → Syncthing folder
```

The complete workflow has now been proven on the NAS, including Syncthing delivery,
restart persistence, backup/restore, and server-owned Rotation state. Sprint 81 adds
the product shell and configurable Rotation composition. The next phase closes the
Rotation lifecycle and release gate before adding reflective workflows.

## Product Guideline

The Library documents relationships. It is not evaluated.

Album roles have no target sizes. There is no optimal role distribution and no
“perfect collection”. The Player Rotation is a consciously curated selection from
the Library. Reflection supports decisions. Explainability explains decisions. The
Dashboard creates attention.

Not optimization.

## Current Product State

- **Collection:** Album discovery, MusicBrainz, Album Coach, Role model, Timeline,
  Listening History, Archive, Rediscovery
- **Library:** Server-authoritative albums and stories, editor, Role Explorer,
  perspectives, cover cache
- **Bindings:** Manual scan, Capture, conservative matching proposals, confirmed links
- **Rotation:** Focus Album, Player Rotation, review, RotationPlan
- **Export:** Preview, validation, staging, atomic destination replacement, recovery
- **Operations:** Docker deployment, trusted-proxy write boundary, diagnostics,
  backups, required CI quality gates

## Delivery Sequence

| Order | Sprint | Outcome | Target | Decision |
|------:|--------|---------|--------|----------|
| Done | [Sprint 81](./sprints/done/Sprint-81.md) | Product shell, Settings, and interaction polish | v0.28.1-dev | Done ✅ |
| Done | [Sprint 77](./sprints/done/Sprint-77.md) | Production acceptance and release closure | v0.26.2 | Done ✅ |
| Done | [Sprint 78](./sprints/done/Sprint-78.md) | Library findability | v0.27.0-dev | Done ✅ |
| Done | [Sprint 79](./sprints/done/Sprint-79.md) | Safe ranked binding candidates | v0.27.1-dev | Done ✅ |
| Done | [Sprint 80](./sprints/done/Sprint-80.md) | Server-owned listening and rotation data | v0.28.0-dev | Done ✅ |
| Done | [Sprint 82](./sprints/done/Sprint-82.md) | Rotation lifecycle, cleanup, measured performance, and release readiness | v0.29.0 | Done ✅ |
| Done | [Interface Alignment Pass](./design/INTERFACE-ALIGNMENT-PASS-v0.29.2.md) | Navigation, technical Bindings, Focus layout, and shape consistency | v0.29.2 | Done ✅ |
| Done | [Sprint 83](./sprints/done/Sprint-83.md) | Server-owned Reflection Inbox and dormant-Archive nudges | v0.30.0 | Done ✅; 30-day observation follows |
| Done | [Sprint 83.1](./sprints/done/Sprint-83.1.md) | Compressed Album Coach and Binding intake | v0.30.1 | Done ✅ |
| Done | [Sprint 84](./sprints/done/Sprint-84.md) | Optional Listening Journal | Subsequent minor | Done ✅; NAS acceptance passed |
| Done | [Sprint 85](./sprints/done/Sprint-85.md) | Dependabot and dependency stewardship | Maintenance patch | Implemented ✅; recurring PR triage follows runbook |
| Done | [Sprint 86](./sprints/done/Sprint-86.md) | Deeper deterministic Insights and Memory Prompts | Future minor | Done ✅; 86.1–86.3 accepted on NAS |
| Done | [Sprint 87](./sprints/done/Sprint-87.md) | Local-first artwork with remote fallback | v0.30.0 | Accepted on NAS |
| Done | [Sprint 87.1](./sprints/done/Sprint-87.1.md) | Completion and collection-essential acquisition context | v0.30.0 | Done ✅ |
| Done | [Sprint 88](./sprints/done/Sprint-88.md) | Album Detail with persisted MusicBrainz/Wikipedia source links | Future minor | Done ✅; NAS acceptance passed |
| 8 | [Sprint 89](./sprints/Sprint-89.md) | Safe read-only Playback Foundation and real NAS feasibility | Future major capability | Planned; architecture decision and spike first |
| 9 | [Sprint 90](./sprints/Sprint-90.md) | Persistent Whole Album Session with Play/Pause-only philosophy | Future major capability | Planned; depends on Sprint 89 go decision |
| 10 | [Sprint 91](./sprints/Sprint-91.md) | Unified TypeScript 6 and Node 22 development contract | Maintenance release | Planned; after current Dependabot triage |

Sprint numbers express the present recommended order, not a promise to implement
features without re-evaluating production evidence after each sprint.

## Backlog Audit

| Previous item | Assessment | Disposition |
|---------------|------------|-------------|
| Sprint 77 “Cleanup” | Useful but too vague to verify | Rewritten as the concrete release-closure gate |
| Misnumbered “Sprint 61” Search & Discovery note | Identifier was already used by Server Persistence; scope partly duplicated delivered perspectives | Remaining scope moved to Sprint 78; number retired |
| Sprint 68B Fuzzy Matching | Partly obsolete; conservative normalized matching already exists | Remaining review/ranking problem moved to Sprint 79 |
| Cross-browser Library synchronization | Obsolete as a feature request; the Library is already server-authoritative | No separate sprint |
| Listening/Rotation persistence | Completed: canonical data moved from browser storage into SQLite | Sprint 80 |
| PWA/iOS/Android/offline-first | Premature without a proven device use case and server-owned domain data | Vision only; no committed sprint |
| Asynchronous scan engine | Potentially useful only for measured slow/large NAS libraries | Conditional backlog |
| Weekly Reflection and listening patterns | Product-aligned once durable state exists | Reflection Inbox in Sprint 83; optional Journal in Sprint 84 |

The misnumbered [Search & Discovery note](./sprints/done/Sprint-61.md) and historical
[Sprint 68B](./sprints/done/Sprint-68B.md) remains as a superseded pointer so older
references continue to resolve.

## Conditional Backlog

These items should receive a sprint only when their trigger is observed:

- **Asynchronous scan jobs:** Triggered by measured request timeouts, server blocking,
  or unacceptable scan duration on the target NAS. Prefer a durable job model before
  adding WebSocket/SSE transport.
- **PWA or native companion:** Triggered by a concrete mobile workflow after Sprint 80;
  a mobile wrapper alone is not a product goal.
- **Offline mutation:** Triggered by a real offline use case and only with explicit
  conflict semantics. It is not implied by server persistence.
- **Explainability 2.0:** Triggered by user confusion that current rotation reasons and
  review UI do not resolve.

See [Phase IX](./sprints/Phase-IX.md) for the next product phase and
[Phase X](./sprints/Phase-X.md) for conditional platform/companion directions.
[Phase XI](./sprints/Phase-XI.md) records the unscheduled long-term direction for a
shared household catalog with private user relationships; it reserves no Sprint
numbers.

## Completed Foundation

| Sprint | Goal | Target | Status |
|--------|------|--------|--------|
| [Sprint 71](./sprints/done/Sprint-71.md) | Binding & Scan Robustness | v0.25.2-dev | Done ✅ |
| [Sprint 72](./sprints/done/Sprint-72.md) | Export Safety & Edge Cases | v0.25.2-dev | Done ✅ |
| [Sprint 73](./sprints/done/Sprint-73.md) | Frontend Resilience | v0.25.3-dev | Done ✅ |
| [Sprint 74](./sprints/done/Sprint-74.md) | Backup System | v0.25.4-dev | Done ✅ |
| [Sprint 75](./sprints/done/Sprint-75.md) | Observability & Operations | v0.25.5-dev | Done ✅ |
| [Sprint 75.1](./sprints/done/Sprint-75.1.md) | Server-Side Library & Cover Storage | v0.25.6-dev | Done ✅ |
| [Sprint 75.2](./sprints/done/Sprint-75.2.md) | Library-Bindings Enabler | v0.25.7-dev | Done ✅ |
| [Sprint 75.3](./sprints/done/Sprint-75.3.md) | Library-Bindings UI Bridge | v0.25.8-dev | Done ✅ |
| [Sprint 76](./sprints/done/Sprint-76.md) | Library-Bindings Integration | v0.26.0-dev | Done ✅ |
| [Sprint 76.1](./sprints/done/Sprint-76.1.md) | Pre-Release Integrity & Hardening | v0.26.1-dev | Done ✅ |
| [Sprint 76.2](./sprints/done/Sprint-76.2.md) | Album-to-Syncthing Export Recovery | v0.26.2-dev | Done ✅ |
| [Sprint 76.3](./sprints/done/Sprint-76.3.md) | Trusted Proxy Write Boundary | v0.26.2-dev | Done ✅ |
| [Sprint 77](./sprints/done/Sprint-77.md) | Production Acceptance & Release Closure | v0.26.2 | Done ✅ |
| [Sprint 78](./sprints/done/Sprint-78.md) | Library Findability | v0.27.0-dev | Done ✅ |

## Long-term Vision

Rotation should never feel like a database, Spotify, or a statistics tool.

Rotation should feel like a conversation about music.

An album is not a file. An album is a story. Rotation helps consciously accompany
these stories over many years.
