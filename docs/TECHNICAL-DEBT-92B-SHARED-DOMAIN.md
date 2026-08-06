# Technical Debt: Shared Domain Module — Sprint 92B

## Context

Sprint 92B requires `generateRotationPlan` to be shared between client and server. Due to TypeScript module resolution constraints (`server/tsconfig.json` uses `rootDir: "./src"`), imports from the parent `src/` directory are rejected by `tsc`.

## Decision

For Sprint 92B, the rotation-plan domain logic was **duplicated** into `server/src/domain/rotation-plan/`. The server version:

- Uses `node:crypto`'s `randomUUID()` instead of the browser's `crypto.randomUUID()`
- Uses `server/src/domain/albumTypes.ts` instead of `src/types/album.ts`
- Has identical algorithmic behavior (same weighted shuffle, same quota filling, same fill logic)

## Keeping Client and Server in Sync

Both implementations must remain behaviorally identical. The following test strategy ensures this:

1. **Server tests** (`server/src/application/rotationGenerationService.test.ts`) verify determinism with fixed `random` and `generateId` injectables.
2. **Client tests** (`src/domain/rotation-plan/generateRotationPlan.test.ts`) already cover the same algorithmic paths.
3. Any future change to rotation generation must be applied to both files and both test suites must pass.

## Path to True Sharing

The preferred long-term solution is to extract the rotation-plan domain into a proper shared package or workspace:

```
packages/rotation-domain/
  src/
    generateRotationPlan.ts
    findReplacement.ts
    rotationPlan.ts
  package.json
```

Both `client/` and `server/` would declare `packages/rotation-domain` as a dependency. This requires:

- Reconfiguring the monorepo build (e.g., pnpm workspaces, Turborepo, or npm workspaces)
- Ensuring the shared package has no React/browser/Node-specific dependencies
- Updating CI to build the shared package before client and server

This is deferred to a future infrastructure sprint.