# Rotation Roadmap

> Rotation is not a tool for managing a music collection.
>
> Rotation accompanies the relationship between person and album.

Version: v0.26.1-dev

---

## Current Focus: Stabilization

**New features are frozen until Sprint 76.2 and the Sprint 76.1 NAS release gate are completed.**

Rotation has undergone a massive architectural expansion (Sprints 58–76): server persistence, Docker deployment, album file binding, the export engine, and full Library-Bindings Integration. The system is functional but not yet battle-tested under real-world NAS conditions.

The next sprints are dedicated exclusively to **hardening, bugfixing, and operational reliability**. No new product features will be added.

---

## Product Guideline

The library documents relationships. It is not evaluated.

Album roles have no target sizes. There is no optimal role distribution. There is no "perfect collection".

The Player Rotation is a consciously curated selection from the library. Reflection supports decisions. Explainability explains decisions. The Dashboard creates attention.

Not optimization.

All future developments are oriented toward these principles.

---

## Current Product State

- **Collection:** Album discovery, MusicBrainz, Album Coach, Role model, Timeline, Listening History, Archive, Rediscovery
- **Library:** Editor, Role Explorer, Library Perspectives, Cover Cache, Persistence
- **Rotation:** Focus Album, Player Rotation, Rotation Review, RotationPlan
- **Dashboard:** Reflection, Insights, Role overview
- **Infrastructure:** Repository Pattern, Storage Adapter, Migration Registry, Defensive Loading, required CI quality gates

---

## Active & Upcoming Sprints

| Sprint | Goal | Target | Status |
|--------|------|--------|--------|
| [Sprint 76.2](./sprints/Sprint-76.2.md) | Album-to-Syncthing Export Recovery | v0.26.2-dev | In progress; NAS verification pending |
| [Sprint 76.1](./sprints/Sprint-76.1.md) | Pre-Release Integrity & Hardening Supersprint | v0.26.1-dev | Implementation complete; NAS verification pending |
| [Sprint 61](./sprints/Sprint-61.md) | Search & Discovery | v0.27.0-dev | Backlog |
| [Sprint 68B](./sprints/Sprint-68B.md) | Fuzzy Matching | v0.27.0-dev | Backlog |

## Completed Sprints

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

---

## Backlog

| Sprint | Goal | Target | Status |
|--------|------|--------|--------|
| [Sprint 61](./sprints/Sprint-61.md) | Search & Discovery | v0.27.0-dev | Backlog |
| [Sprint 68B](./sprints/Sprint-68B.md) | Fuzzy Matching | v0.27.0-dev | Backlog |

### Phase IX — Search & Discovery

[Phase IX details](./sprints/Phase-IX.md)

Frozen until Sprint 76.2 and the Sprint 76.1 NAS release gate are completed. Includes Search & Discovery and Fuzzy Matching.

### Phase X — Platform & Companion

[Phase X details](./sprints/Phase-X.md)

Future vision only. PWA, mobile, offline-first, listening patterns, explainability 2.0.

---

## Long-term Vision

Rotation should never feel like a database.

Rotation should never feel like Spotify.

Rotation should never feel like a statistics tool.

Rotation should feel like a conversation about music.

An album is not a file.

An album is a story.

Rotation helps consciously accompany these stories over many years.
