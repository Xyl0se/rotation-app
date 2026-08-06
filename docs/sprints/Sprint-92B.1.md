# Sprint 92B.1 — Extract Shared Rotation Domain

## Goal

Extract the Rotation Plan domain logic into a shared package that can be consumed by both the client and the server.

This sprint removes the duplicated business logic introduced during Sprint 92B and establishes a single authoritative implementation of the rotation generation algorithm.

The resulting shared package should remain completely platform-independent and contain only pure domain logic.

---

# Problem Statement

Sprint 92B temporarily duplicated the Rotation Plan generation logic because the current project structure prevented sharing code between the client and server.

Although both implementations are behaviorally identical today, duplicated business logic creates long-term maintenance risks:

- Bug fixes must be applied twice.
- New features can diverge between implementations.
- Test suites duplicate identical algorithmic behavior.
- The client and server may slowly evolve different interpretations of the same business rules.

Rotation generation is core business logic and should therefore exist in exactly one place.

---

# User Story

**As a developer**

I want the Rotation generation algorithm to exist only once

so that every future change automatically affects both client and server.

---

# Desired Architecture

Current:

```
Client
 └── generateRotationPlan.ts

Server
 └── generateRotationPlan.ts
```

Target:

```
Client
        \
         \
          Shared Rotation Domain
         /
        /
Server
```

The client and server should depend on the shared package instead of owning independent implementations.

---

# Package Structure

Introduce a new internal workspace package.

```
packages/
    rotation-domain/
        package.json
        tsconfig.json
        src/
            index.ts

            rotationPlan.ts
            generateRotationPlan.ts
            findReplacement.ts

            types.ts
            random.ts (optional)
```

The package is private and is not intended for external publication.

---

# Design Principles

The shared domain must remain completely platform-independent.

It must **not** import:

- React
- Express
- SQLite
- Browser APIs
- Node APIs
- Vite
- Server repositories

The package should consist exclusively of deterministic business logic.

---

# Shared Domain Model

The shared package should define the smallest possible domain model required by the algorithm.

Example:

```ts
RotationCandidate
```

rather than importing either

```ts
ClientAlbum
```

or

```ts
ServerAlbum
```

Both applications should map their own models into the shared representation.

---

# Dependency Injection

Platform-specific behavior should be injected.

Instead of calling:

```ts
Math.random()

crypto.randomUUID()

randomUUID()
```

inside the algorithm,

the algorithm should receive:

```ts
{
    random,
    generateId
}
```

as dependencies.

Example:

```ts
generateRotationPlan(
    input,
    {
        random,
        generateId
    }
)
```

This makes the algorithm deterministic and easily testable.

---

# Client Integration

The client should import

```ts
generateRotationPlan
```

from

```
@rotation/domain
```

instead of maintaining its own implementation.

Any client-specific adapters should remain inside the client project.

---

# Server Integration

The server should also import

```ts
generateRotationPlan
```

from

```
@rotation/domain
```

The server should continue using its own persistence layer and repositories while sharing only the pure business logic.

---

# Testing Strategy

Move the algorithmic tests into the shared package.

The shared package becomes the authoritative location for testing:

- quota handling
- replacement logic
- weighted shuffle
- fill logic
- deterministic generation
- seeded randomness

The client and server should only test their adapters.

Examples:

- ClientAlbum → RotationCandidate
- ServerAlbum → RotationCandidate

Algorithm correctness should never again be tested twice.

---

# Build System

Introduce a lightweight workspace structure.

Recommended:

- npm workspaces

No additional infrastructure such as Turborepo or Nx is required.

The build order should become:

```
rotation-domain

↓

client
server
```

Both applications consume the compiled shared package.

---

# Migration Strategy

The migration should be performed incrementally.

1. Create the shared package.
2. Move pure domain logic.
3. Introduce adapters.
4. Update imports.
5. Verify identical behaviour.
6. Remove duplicated implementations.

No functional behaviour should change.

---

# Non-Goals

This sprint does **not** include:

- Rotation algorithm improvements
- Performance optimizations
- Email functionality
- Export changes
- Scheduler changes
- Database changes
- API changes

---

# Acceptance Criteria

- A new internal package `@rotation/domain` exists.
- The package contains only platform-independent domain logic.
- `generateRotationPlan` exists in exactly one implementation.
- `findReplacement` exists in exactly one implementation.
- Client and server both import the shared package.
- Platform-specific behavior (randomness, UUID generation) is dependency-injected.
- The shared package owns the algorithm test suite.
- Client and server only test their adapters.
- All existing functionality behaves identically after the refactoring.
- Client, server and shared package all build successfully.

---

# Implementation Notes

## Completed Changes

### Workspace Structure
- Added `packages/rotation-domain/` as npm workspace package (`@rotation/domain`)
- Root `package.json`: `workspaces: ["packages/*", "server"]`
- Build order: `rotation-domain` → `client` → `server`

### Shared Package (`packages/rotation-domain/`)
- `src/types.ts`: Minimal domain model (`RotationCandidate`, `RotationPlan`, etc.)
- `src/rotationPlan.ts`: `defaultRotationTargetSize`, `defaultRotationRoleQuotas`
- `src/generateRotationPlan.ts`: Algorithm with DI (`random`, `generateId`)
- `src/findReplacement.ts`: Replacement logic
- `src/index.ts`: Public API exports
- Tests: 36 algorithmic tests (11 generate + 7 findReplacement, run twice for src+dist)

### Client Integration
- `src/adapters/rotationDomain.ts`: `Album → RotationCandidate` mapper with `isRotationEligibleRole` type guard
- `src/adapters/rotationDomain.test.ts`: 6 adapter tests
- `src/hooks/useRotationPlan.ts`: Imports from `@rotation/domain`, injects `Math.random` and `generateUUID`
- `src/domain/rotation-plan/`: Compatibility re-exports (incremental migration)

### Server Integration
- `server/src/adapters/rotationDomain.ts`: Server `Album → RotationCandidate` mapper
- `server/src/adapters/rotationDomain.test.ts`: 6 adapter tests
- `server/src/application/rotationGenerationService.ts`: Uses `@rotation/domain`, augments with `focusAlbumId`, `generationSource`, `automationExecutionKey`
- `server/src/domain/rotation-plan/`: Compatibility re-exports
- `server/src/domain/rotationTypes.ts`: Server-specific `RotationPlan` with persistence fields

### Key Design Decisions
- Server-specific fields (`focusAlbumId`, `generationSource`, `automationExecutionKey`) kept out of shared model
- `RotationEligibleRole` explicitly defined as `Exclude<RoleId, "admire" | "archive">`
- `ESNext` + `Bundler` module resolution chosen for shared package (works with both Vite and Node ESM)
- No `NodeNext` required since package imports no platform APIs

## Verification

| Check | Result |
|-------|--------|
| `@rotation/domain` build | 0 errors |
| Client build (`tsc -b && vite build`) | 0 errors |
| Server build (`tsc`) | 0 errors |
| Domain tests | 36 passed |
| Client tests | 362 passed |
| Server tests | 407 passed |
| **Total** | **805 passed** |

## Remaining Work
- Docker builds verified structurally (both Dockerfiles copy `packages/` via `COPY . .`) but not executed due to unavailable Docker daemon
- After all consumers migrate to direct `@rotation/domain` imports, compatibility re-export directories can be removed

---

# Success Criteria

After this sprint, every future modification to the Rotation generation algorithm should require changing exactly one implementation.

No duplicated business logic should remain between the client and the server.

---

# Future Benefits

This shared domain package establishes the architectural foundation for future server-side features, including:

- Automated Weekly Rotation
- Rotation Preview API
- AI-assisted Rotation Suggestions
- Batch Rotation Simulation
- Future mobile applications
- CLI tools
- Additional backend services

The Rotation algorithm becomes a reusable core domain component rather than an implementation detail of either application.

---

# Architectural Principle

> **Core business logic should have exactly one implementation.**

Platform-specific applications should adapt to the domain—not the other way around.