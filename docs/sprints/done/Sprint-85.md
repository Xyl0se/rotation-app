# Sprint 85 — Dependency Stewardship

**Status:** Implemented ✅ — maintainer walkthrough and PR disposition remain operational actions

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

## Implementation

### 85A — Maintainer walkthrough and real inventory

**Status:** Complete ✅

The core terminology, five-way decision model, and eight real open Dependabot PRs are
covered in the dependency-maintenance runbook. The inventory demonstrates why mixed
major/minor groups are unsafe and records a recommended disposition without merging or
closing external PRs implicitly.

### 85B — Risk-based evidence gates

**Status:** Complete ✅

The runbook defines distinct evidence for development, runtime, security, GitHub
Actions, Docker, and major-version updates, including the existing validation,
publication, NAS smoke, and digest-based rollback paths.

### 85C — Bounded Dependabot configuration

**Status:** Complete ✅

Routine checks now run monthly. Frontend and API npm groups separate production from
development dependencies and group only patch/minor updates. Actions and Docker remain
separate, open PR counts are bounded, and majors remain visible individual migrations.
Automatic merging remains disabled.

### 85D — Recovery and recurring operation

**Status:** Complete ✅

The runbook documents rebase/recreate commands, conflict ownership, visible ignore
rules, monthly triage, merge evidence, image publication, and rollback discipline.

Operational reference:
[Dependency Maintenance](../../operations/DEPENDENCY-MAINTENANCE.md).

## Definition of Done

- [x] Maintainer walkthrough is completed using current real PR examples.
- [x] A concise dependency-maintenance runbook exists under `docs/operations/`.
- [x] Update groups and cadence reflect the project's actual maintenance capacity.
- [x] No major-version update is merged as an incidental cleanup.

## Non-Goals

- Automatic merging
- Bulk major upgrades
- Product feature work
