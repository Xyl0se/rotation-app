# Sprint 85 — Dependency Stewardship

**Status:** Planned — requires maintainer walkthrough before implementation

**Target version:** Maintenance patch after Sprint 84

**Type:** Operational education and dependency hygiene

## Goal

Give the maintainer a safe, repeatable process for reviewing Dependabot pull requests
without blindly merging upgrades or allowing maintenance noise to block releases.

## Scope

- Explain Dependabot alerts, version-update PRs, grouped updates, lockfile changes,
  security severity, and the difference between runtime and development dependencies.
- Document a triage decision tree: close, defer, test, merge, or isolate as a dedicated
  migration.
- Define required CI, Docker smoke, release, and rollback evidence per update class.
- Review and tune `.github/dependabot.yml` grouping and cadence only after the
  walkthrough.
- Document how to recover a stale or conflicted Dependabot branch.

## Definition of Done

- [ ] Maintainer walkthrough is completed using current real PR examples.
- [ ] A concise dependency-maintenance runbook exists under `docs/operations/`.
- [ ] Update groups and cadence reflect the project's actual maintenance capacity.
- [ ] No major-version update is merged as an incidental cleanup.

## Non-Goals

- Automatic merging
- Bulk major upgrades
- Product feature work

