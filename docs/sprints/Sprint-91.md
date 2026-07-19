# Sprint 91 — Unified TypeScript Toolchain

**Status:** Planned — after the current Dependabot triage

**Target version:** Future maintenance release

**Type:** Build-tool consistency and runtime-contract hardening

## Goal

Align the Root/Web and Server projects on one supported TypeScript 6 compiler line and
one Node 22 type contract before considering a coordinated TypeScript 7 or Node 26
migration.

## Scope

- Pin both projects to the same TypeScript 6 minor range and regenerate both lockfiles
  deliberately in one reviewed change.
- Align Root and Server `@types/node` with the actual Node 22 CI and container runtime.
- Preserve the existing frontend Bundler/no-emit and server NodeNext/emit boundaries.
- Review compiler diagnostics before changing `tsconfig`; do not weaken strictness or
  hide new errors to make the upgrade pass.
- Keep TypeScript 7 and Node 26 ignored in routine Dependabot updates until their
  compiler, runtime, container, and type migrations can be evaluated together.
- Document how the two separately installed packages remain version-synchronized during
  monthly dependency maintenance.

## Verification

- Clean installs resolve the same TypeScript 6 version in Root and Server.
- Frontend type-check/build and Server type-check/emit pass without new suppressions.
- Lint, all automated tests, Markdown validation, and both Compose configurations pass.
- The development container smoke verifies web/API health and the trusted proxy write
  boundary with Node 22.
- Package manifests, lockfiles, CI configuration, Dockerfiles, and versioning docs agree
  on the supported compiler and runtime contract.

## Definition of Done

- [ ] Root and Server resolve the same TypeScript 6 compiler version.
- [ ] Root and Server Node types match the supported Node 22 runtime major.
- [ ] No strictness or safety option is weakened for compatibility.
- [ ] Both production builds and the complete validation suite pass.
- [ ] Container smoke and Compose validation remain green.
- [ ] The future TypeScript 7/Node 26 migration boundary is documented.

## Non-goals

- TypeScript 7 adoption
- Node 26 runtime or container adoption
- Monorepo/workspace restructuring
- Product behavior or application version changes
