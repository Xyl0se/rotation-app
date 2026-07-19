# Architecture Decision Records

ADRs preserve durable decisions. They are not current feature manuals; use the
[product documentation](../product/) for behavior and the
[operations documentation](../operations/) for runbooks.

## Status Vocabulary

- **Proposed** — decision under evaluation; its explicit gate is not yet complete.
- **Accepted** — current and binding.
- **Amended** — current, with a later ADR refining part of the decision.
- **Superseded** — replaced; retained only as historical context.
- **Deprecated** — still supported, but must not be selected for new work.

## Index

| ADR | Decision | Status |
|---|---|---|
| [001](./001-product-name.md) | Product name | Accepted |
| [002](./002-albums-not-songs.md) | Albums, not songs | Accepted |
| [003](./003-local-first.md) | Browser-local persistence | Superseded by 013/014 |
| [004](./004-library-hook.md) | Library hook boundary | Amended by 013 |
| [005](./005-curated-rotation.md) | Curated player Rotation | Amended by 015 |
| [006](./006-identity-refresh.md) | Identity refresh | Accepted |
| [007](./007-role-explorer.md) | Role Explorer | Accepted |
| [008](./008-library-perspectives.md) | Library perspectives | Accepted |
| [009](./009-schema-versioning.md) | Browser schema migrations | Superseded by 014 |
| [010](./010-defensive-persistence.md) | Browser persistence defenses | Superseded by 014 |
| 011 | Never assigned | — |
| [012](./012-self-hosted-music-platform.md) | Self-hosted platform | Amended by 013/014 |
| [013](./013-data-ownership-boundaries.md) | Data ownership boundaries | Amended by 014 |
| [014](./014-server-owned-rotation-state.md) | Server-owned Rotation state | Accepted |
| [015](./015-rotation-generation-policy.md) | Rotation generation policy | Accepted |
| [016](./016-deterministic-insight-evidence.md) | Deterministic Insight evidence and AI boundary | Accepted |
| [017](./017-local-cover-extraction.md) | Bounded local cover extraction | Proposed — NAS gate pending |

ADR 011 was never assigned. The gap is retained deliberately so historical numbering
is never reused or made ambiguous.
