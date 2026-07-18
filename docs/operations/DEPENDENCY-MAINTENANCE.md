# Dependency Maintenance

This runbook is the maintainer's decision guide for Dependabot alerts and pull
requests (PRs). It deliberately favors understandable, reversible updates over a
perfectly current dependency graph.

## What Dependabot is showing

- A **Dependabot alert** reports a known vulnerability in the dependency graph. It
  does not itself change the repository.
- A **security update PR** proposes a version that addresses an alert. Treat its
  severity and exposure as the priority signal, not the size of the version number.
- A **version update PR** is routine maintenance without an identified project alert.
- A **runtime/production dependency** ships in or directly affects the running Web or
  API application. A **development dependency** is used to build, lint, type-check, or
  test it. Both can affect supply-chain safety, but runtime changes need stronger
  production evidence.
- `package-lock.json` records the exact resolved direct and transitive dependency
  graph. A dependency PR normally changes it; unrelated application or documentation
  changes are a reason to stop and inspect the PR.
- Patch (`x.y.Z`) and minor (`x.Y.z`) releases are routine candidates. A major
  (`X.y.z`) release is a migration even when CI happens to pass.

An open PR is only a proposal on a separate branch. Rotation and Portainer do not
change until the PR is merged into `main`, both `latest` images have been published,
and the stack is redeployed.

## Five-minute triage

```text
Known security alert?
├─ yes → read severity, affected surface, patched version and exploit conditions
│        ├─ project is exposed/affected → isolate and test promptly
│        └─ not affected → document why, then schedule or dismiss the alert
└─ no → version maintenance
         ├─ major version → dedicated migration; never incidental merge
         ├─ runtime or Docker base → full validation + container/NAS smoke
         ├─ GitHub Action → validate workflow + successful image publication
         └─ development patch/minor → full validation; merge only a coherent group
```

Choose one explicit outcome:

1. **Merge** only after all evidence for its class is green.
2. **Test** on the Dependabot branch when the change is coherent but not yet proven.
3. **Defer** a sound but currently unnecessary migration; record why.
4. **Close/recreate** a stale, conflicted, or badly grouped PR.
5. **Isolate** a major or behavior-changing package in its own sprint/PR.

Never resolve a red check by removing the check, weakening assertions, or combining
unrelated upgrades.

## Required evidence

| Update class | Minimum evidence before merge |
|---|---|
| npm development patch/minor | Review manifest/lockfile diff; `npm run validate`; green `validate.yml` |
| npm runtime patch/minor | Above, plus API/Web container smoke and affected route/flow check |
| Security update | Above for its dependency class; verify alert resolution and inspect exposure assumptions |
| GitHub Action | Review upstream release notes and permissions; green validation plus both publish workflows |
| Docker base image | Build both relevant architectures/images; health check; NAS start/restart and persistence smoke |
| Any major version | Dedicated migration plan, upstream migration guide, focused regressions, complete validation, container smoke, and NAS acceptance |

For production-affecting updates, record the current commit and image digest before
redeployment. Roll back by redeploying the previously recorded digest/commit according
to [Self-hosting](./SELFHOST.md) and [Versioning](./VERSIONING.md). Rotation's moving
`latest` channel makes this record essential; `latest` itself is not a rollback point.

## Reviewing a PR in GitHub

1. Read the title and classify security/version, ecosystem, runtime/tooling, and
   patch/minor/major.
2. Open **Files changed**. Expect only the relevant manifest, lockfile, Dockerfile, or
   workflow references. For a group, verify every member belongs to the same risk
   class.
3. Read upstream release and migration notes. Pay special attention to changed Node
   requirements, removed options, database/native-module support, and action
   permissions.
4. Inspect all checks. A green summary is necessary, not sufficient for runtime,
   Docker, Action, or major updates.
5. Capture the additional evidence from the table above.
6. Prefer **Squash and merge** so the dependency update remains one reversible commit.
7. After merge, verify the `main` validation and the two matching image publication
   jobs before any Portainer redeploy.

There is no automatic merge policy for Rotation.

## Stale or conflicted branches

Dependabot normally rebases its own branches. On the PR, comment:

- `@dependabot rebase` to rebase a still-valid proposal onto current `main`.
- `@dependabot recreate` to discard the bot branch and generate it again from the
  current manifest and lockfile.

Do not add manual commits to a Dependabot branch unless intentionally taking ownership
of the migration. Prefer recreating a routine PR. If a group contains an unwanted
major update, close it and let the corrected configuration produce coherent groups;
do not partially merge the generated lockfile.

An ignore command is appropriate only with a documented compatibility or product
reason. Prefer a visible rule in `.github/dependabot.yml` over an unexplained
repository-side ignore state.

## Rotation configuration policy

- Routine version checks run monthly in `Europe/Berlin` to match maintainer capacity.
- Frontend and API npm updates are separated into production and development groups.
- Only patch/minor updates are grouped. Major updates remain individual and therefore
  unmistakable migration candidates.
- GitHub Actions, Web Docker, and API Docker remain separate ecosystems.
- Open-PR limits bound maintenance noise.
- Security alerts and security update behavior are controlled separately in GitHub's
  repository security settings; the monthly version schedule must not be interpreted
  as permission to defer an applicable vulnerability.

## Inventory at Sprint 85 (2026-07-18)

The walkthrough used the eight real open Dependabot PRs as examples:

| PR | Finding | Decision |
|---|---|---|
| [#9](https://github.com/Xyl0se/rotation-app/pull/9) frontend group | Mixes small tooling updates with TypeScript 7 and Node 26 types | Do not merge; recreate under the split policy and isolate majors |
| [#8](https://github.com/Xyl0se/rotation-app/pull/8) server group | Mixes Helmet/tsx updates with Zod 4, TypeScript 7, Vitest 4 and Node 26 types | Do not merge; recreate and treat each major as a migration |
| [#7](https://github.com/Xyl0se/rotation-app/pull/7) build-push action | Major Action update with runner/runtime requirements | Dedicated Actions maintenance test |
| [#6](https://github.com/Xyl0se/rotation-app/pull/6) login action | Major Action update | Dedicated Actions maintenance test |
| [#5](https://github.com/Xyl0se/rotation-app/pull/5) setup-node | Multi-major Action jump | Dedicated migration; verify Node selection/cache behavior |
| [#3](https://github.com/Xyl0se/rotation-app/pull/3) setup-buildx action | Major Action update and removed options | Dedicated Actions maintenance test |
| [#2](https://github.com/Xyl0se/rotation-app/pull/2) API Node image | Node 22 to 26 runtime jump | Defer to a coordinated API/Web Node migration |
| [#1](https://github.com/Xyl0se/rotation-app/pull/1) Web Node image | Node 22 to 26 build jump | Defer to the same coordinated Node migration |

None of these PRs is approved merely by Sprint 85. Closing, recreating, or merging a
GitHub PR remains an explicit maintainer action. The new configuration affects future
Dependabot runs; existing bot branches may need to be closed/recreated.

## Monthly maintenance checklist

- [ ] Review security alerts first.
- [ ] Classify every new PR by ecosystem, dependency type, and SemVer level.
- [ ] Reject mixed-risk groups and isolate majors.
- [ ] Capture the required local, CI, container, and NAS evidence.
- [ ] Record a rollback commit/image digest for production-affecting changes.
- [ ] Merge one coherent update at a time and observe `main` before continuing.
- [ ] Close obsolete proposals and record intentional deferrals.
