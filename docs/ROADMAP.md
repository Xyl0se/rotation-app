# Rotation Roadmap

> Rotation is not a tool for managing a music collection.
>
> Rotation accompanies the relationship between person and album.

Version: v0.26.1-dev

---

## Roadmap Decision Point

Rotation has reached its first complete intended workflow in code:

```text
capture album → Library → music-folder binding → curated rotation
→ export → Syncthing folder
```

The immediate task is not another feature. It is to prove this workflow on the NAS,
close the stabilization supersprints, and publish a coherent release. If production
export succeeds, Sprint 77 is the release-closure gate. If it fails, the reproduced
export defect is the first Sprint 77 work item.

After that gate, product work resumes in a deliberately narrow order: find albums,
reduce binding friction, then close the remaining browser-owned data gap.

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
| Now | [76.1](./sprints/Sprint-76.1.md), [76.2](./sprints/Sprint-76.2.md), [76.3](./sprints/Sprint-76.3.md) | Implemented stabilization work | v0.26.2-dev | Awaiting final NAS evidence |
| 1 | [Sprint 77](./sprints/Sprint-77.md) | Production acceptance and release closure | v0.26.2 | Required release gate |
| 2 | [Sprint 78](./sprints/Sprint-78.md) | Library findability | v0.27.0-dev | Implementation complete; production UX verification pending |
| 3 | [Sprint 79](./sprints/Sprint-79.md) | Safe ranked binding candidates | v0.27.1-dev | Revalidate from real unmatched folders |
| 4 | [Sprint 80](./sprints/Sprint-80.md) | Server-owned listening and rotation data | v0.28.0-dev | Required before multi-device/PWA |

Sprint numbers express the present recommended order, not a promise to implement
features without re-evaluating production evidence after each sprint.

## Backlog Audit

| Previous item | Assessment | Disposition |
|---------------|------------|-------------|
| Sprint 77 “Cleanup” | Useful but too vague to verify | Rewritten as the concrete release-closure gate |
| Misnumbered “Sprint 61” Search & Discovery note | Identifier was already used by Server Persistence; scope partly duplicated delivered perspectives | Remaining scope moved to Sprint 78; number retired |
| Sprint 68B Fuzzy Matching | Partly obsolete; conservative normalized matching already exists | Remaining review/ranking problem moved to Sprint 79 |
| Cross-browser Library synchronization | Obsolete as a feature request; the Library is already server-authoritative | No separate sprint |
| Listening/Rotation persistence | Still useful because canonical data remains browser-local and outside server backups | Sprint 80, after core UX work |
| PWA/iOS/Android/offline-first | Premature without a proven device use case and server-owned domain data | Vision only; no committed sprint |
| Asynchronous scan engine | Potentially useful only for measured slow/large NAS libraries | Conditional backlog |
| Weekly Reflection, listening patterns, Explainability 2.0 | Product-aligned but not currently blocking the core workflow | Discovery backlog after Sprint 80 |

The misnumbered [Search & Discovery note](./sprints/Sprint-61.md) and historical
[Sprint 68B](./sprints/Sprint-68B.md) remain as superseded pointers so older
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
- **Listening patterns and weekly reflection:** Triggered by enough durable listening
  history to evaluate whether the observations remain useful and non-judgmental.
- **Explainability 2.0:** Triggered by user confusion that current rotation reasons and
  review UI do not resolve.

See [Phase IX](./sprints/Phase-IX.md) for the next product phase and
[Phase X](./sprints/Phase-X.md) for conditional platform/companion directions.

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

## Long-term Vision

Rotation should never feel like a database, Spotify, or a statistics tool.

Rotation should feel like a conversation about music.

An album is not a file. An album is a story. Rotation helps consciously accompany
these stories over many years.
