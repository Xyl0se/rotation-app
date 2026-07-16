# Rotation Documentation

This directory separates current reference documentation from durable architecture
decisions and historical delivery evidence.

## Current Reference

- [Product](./PRODUCT.md) — product purpose, capabilities, and limits
- [Architecture](./ARCHITECTURE.md) — current technical architecture and data ownership
- [Roadmap](./ROADMAP.md) — completed and planned delivery sequence
- [Changelog](./CHANGELOG.md) — version history

## Documentation Areas

- [Architecture decisions](./adr/README.md) — accepted, amended, and superseded ADRs
- [Product features](./product/) — current behavior of individual product domains
- [Design](./design/) — product vision, UX, binding visual system, and the
  [Homepage alignment](./design/HOMEPAGE-ALIGNMENT.md)
- [Operations](./operations/) — self-hosting, releases, quality gates, and performance
- [Releases](./releases/) — version-specific release notes
- [Sprints](./sprints/) — active plans and completed sprint records
- [Archive](./archive/) — completed audits and acceptance evidence

## Document Lifecycle

- **Current reference** describes the application as it behaves now.
- **ADR** records a durable decision, its context, and consequences.
- **Sprint document** defines bounded delivery work; completed sprints move to
  `sprints/done/`.
- **Acceptance evidence and one-time audits** move to `archive/` after completion.
- ADR status uses `Accepted`, `Amended`, `Superseded`, or `Deprecated`. `Superseded`
  means a newer decision replaced the old one; `Deprecated` means a decision still
  exists but should no longer be chosen for new work.

Run `npm run docs:check` after moving or linking Markdown documents.
