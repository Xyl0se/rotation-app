# Sprint 76.1 — Pre-Release Integrity & Hardening Supersprint

**Status:** Implementation Complete — manual NAS release-gate verification pending.

**Target version:** `v0.26.1-dev`

**Type:** Supersprint (security, persistence, operations, quality, documentation)

---

## Context

Sprints 58–76 established the product foundation: browser repositories, server-side album storage, bindings, export, backups, diagnostics, and the self-hosted Docker stack.

A post-Sprint-76 audit found that several completed concepts are not yet aligned end to end. Most importantly, the application currently has two competing persistence models:

- the browser still loads the Library from `localStorage` and treats it as the practical source of truth;
- the server exposes an SQLite-backed album API and is documented as the source of truth;
- client/server write failures are mostly silent;
- the client and server do not currently preserve the same album ID during creation;
- write-token protection is applied to only part of the mutating API surface.

The production build succeeds, but the repository-wide test and lint commands are not green. Deployment documentation and runtime configuration also disagree in several places.

This supersprint closes these integrity gaps before feature development resumes or a first stable release is considered.

---

## Goal

Rotation has one explicit, tested persistence contract and a secure, reproducible self-hosting baseline.

After this sprint:

- SQLite is the authoritative store for the server-backed Library and cover files;
- `localStorage` is an explicit offline cache/fallback, not a competing silent source of truth;
- album identity is stable across browser, API, bindings, covers, and exports;
- every mutating API operation is protected and validated;
- users are informed when synchronization fails;
- production installation instructions match the actual containers;
- tests, lint, builds, and container checks gate image publishing;
- current documentation describes implemented behavior rather than planned behavior.

---

## Non-Goals

- No new product feature.
- No search, discovery, fuzzy matching, PWA, or companion work.
- No redesign of the role model, Album Coach, Reflection Engine, or Rotation algorithm.
- No multi-user account system. The existing single-installation write-token model remains the security boundary.
- No promise of general offline-first conflict resolution. The sprint implements a deterministic fallback and synchronization contract for the current single-user product.
- Listening History and RotationPlan are not moved to SQLite silently. Their long-term ownership must be documented and, if server migration is approved, scheduled separately with an explicit migration design.

---

## Baseline / Known Findings

The following findings define the minimum scope of Sprint 76.1:

1. `useLibrary` initializes from the browser repository and does not fetch the server Library.
2. `fetchAlbums()` and `importAlbums()` exist but are not part of initial application loading.
3. `POST /albums` generates a new server UUID while the client retains its own UUID.
4. Client mutations swallow server errors and provide no rollback, queue status, or durable reconciliation.
5. `navigator.onLine` is treated as backend connectivity even when the Rotation API is unavailable.
6. Album, cover, and binding mutations are not consistently protected by the write token.
7. Cover paths are derived from an unvalidated route parameter.
8. API payloads rely mainly on TypeScript assertions rather than runtime validation.
9. `npm test` completes all assertions but exits unsuccessfully because retry tests create unhandled Promise rejections.
10. `npm run lint` currently reports repository errors and also inspects generated server output.
11. Image publishing has no test/lint quality gate.
12. Production UID/GID, filesystem paths, token setup, versions, test counts, and persistence claims differ across code and documentation.
13. repositories/adapters are recreated during render and migrations run in the render path.
14. Listening History, RotationPlan, Focus Album, and selected UI state remain browser-local despite broader SQLite claims in the self-hosting guide.

---

## Workstream 76.1A — API Security Boundary

**Implementation status:** Complete ✅ (2026-07-15). Central mutation protection, explicit CORS allowlisting, guarded cover paths, image-signature validation, sanitized API errors, focused unit tests, and a complete route-level HTTP integration matrix are implemented. All 18 mutating endpoints are tested with missing, invalid, and valid tokens.

### Write Protection

- Define a route-level matrix of read-only and mutating endpoints.
- Require `X-Rotation-Write-Token` for every state-changing operation:
  - `POST`, `PUT`, and `DELETE` under `/albums`;
  - cover upload and deletion under `/covers`;
  - binding confirmation, linking, unlinking, verification, reconciliation, and deletion;
  - scan, export, and backup mutations already protected today.
- Keep safe read operations accessible without a token unless sensitive diagnostics justify protection.
- Ensure the frontend explicitly requests write authorization for every protected call.
- Use a constant-time token comparison where practical and never log token values.
- Return one consistent error envelope and status for missing/invalid credentials.

### CORS and Proxy Boundary

- Remove permissive reflected CORS in the normal same-origin Caddy deployment.
- If direct API development access still requires CORS, configure an explicit allowlist through validated configuration.
- Document that the public entry point is Caddy and that the API container should not publish its port to the host in production.

### Cover Path Safety

- Validate album IDs before any filesystem operation. Prefer the canonical UUID format already used by the domain.
- Resolve and verify every cover/meta path remains inside `${ROTATION_DATA_DIR}/covers`.
- Reject traversal sequences, encoded separators, null bytes, absolute paths, and malformed IDs.
- Validate actual image signatures where feasible; a trusted `Content-Type` header alone is insufficient.
- Avoid partial updates: cover data and metadata must either both be replaced successfully or the previous cover must remain usable.

### Security Tests

- Add integration tests proving every mutating route returns `403` without a valid token.
- Add positive tests for valid-token writes.
- Add traversal tests for encoded and decoded malicious cover IDs.
- Add tests for invalid MIME type, mismatched content, oversized uploads, and malformed JSON.
- Confirm error responses do not expose host paths, stack traces, tokens, or database details.

---

## Workstream 76.1B — Canonical Library Persistence

**Implementation status:** Complete ✅ (2026-07-15). The server preserves client-generated album IDs, treats repeated equivalent creates idempotently, and imports batches transactionally. The frontend uses server-first bootstrap with last-known-good cache fallback, verified one-time migration, durable/coalesced pending album and cover operations, serialized replay, visible sync state with manual retry, and operation IDs that prevent stale completions from removing newer changes. HTTP/SQLite identity tests cover create, repeat, collision, update, delete, transactional rollback, and canonical ID forwarding through covers, bindings, and exports.

### Persistence Contract

Adopt and document the following contract:

```text
SQLite/API = authoritative Library and server cover store
Browser repository = last-known-good cache and offline fallback
IndexedDB = cover cache, not canonical cover ownership
```

The application must not silently merge divergent Library states. Reconciliation rules must be deterministic and observable.

### Initial Load State Machine

Implement an explicit initial-loading flow:

1. Load the last-known-good browser cache for fallback purposes.
2. Probe/fetch the Rotation API, not merely `navigator.onLine`.
3. If the server returns albums, use the server result and refresh the cache.
4. If the server is reachable and empty while a local legacy Library exists, offer or perform the documented one-time import according to a tested migration marker.
5. If the API is unavailable, use the cache and show an offline/degraded state.
6. Never replace a non-empty local Library with an empty view merely because a request failed.

Expose separate state for:

- browser network availability;
- API reachability;
- initial loading;
- cache fallback;
- pending/failed synchronization;
- last successful server synchronization.

### Stable Album Identity

- Choose one creation contract and apply it consistently:
  - recommended: accept the client-generated UUID after strict validation; or
  - alternatively: return the server-generated UUID and atomically replace all client references before exposing the album.
- Preserve album IDs across Library, role history, listen events, focus album, RotationPlan, bindings, covers, import, and export.
- Reject ID collisions that attempt to overwrite an unrelated album.
- Add an integration test covering create → update → bind → cover upload → delete with the same ID.

### Mutation Semantics

- Replace silent `.catch(() => {})` behavior with a visible mutation state.
- Define optimistic update behavior per operation:
  - rollback on rejected creates/updates/deletes; or
  - persist a durable pending operation and retry deterministically.
- Never report success until the authoritative write has succeeded or is explicitly marked pending offline.
- Make retries idempotent; repeated create/import requests must not duplicate albums.
- Prevent out-of-order updates from overwriting newer client state.
- Surface actionable error messages through the existing Toast/Connection systems.

### Legacy Migration

- Add an idempotent migration marker distinct from the general browser schema version.
- Make import transactional: either the complete valid batch is committed or the response clearly identifies rejected items without corrupting existing albums.
- Keep the local cache until a server read-back verifies the migrated data.
- Document recovery if migration is interrupted.
- Add tests for empty server, existing server data, repeated migration, partial invalid data, request interruption, and browser refresh during migration.

---

## Workstream 76.1C — Runtime Validation and Data Integrity

**Implementation status:** Complete ✅ (2026-07-15). Shared Zod schemas validate album create/update/import, binding mutations, export requests, and cover IDs with structured field-level `400` errors. SQLite migrations are explicitly versioned and transactional, defensively normalize legacy data, enforce album/domain constraints, and add `bindings.library_album_id → albums.id ON DELETE SET NULL`. Batch imports are transactional, `created_at` is stable on update, and ADR 013 defines current ownership plus the required follow-up for Listening History, RotationPlan, and Focus Album.

### Shared Schemas

- Introduce runtime schemas for album create, update, import, binding mutations, export requests, and cover metadata.
- Reuse Zod already present in the server rather than maintaining unchecked casts.
- Validate and normalize:
  - UUIDs;
  - non-empty title and artist with reasonable length limits;
  - year representation;
  - canonical role IDs;
  - role-history source, role, and timestamps;
  - non-negative integer listen counts;
  - valid `lastListened` values;
  - cover override discriminants and URLs;
  - Album Story enums, text limits, and timestamps;
  - array sizes and duplicate album IDs.
- Return structured `400` responses with field-level issues.

### Database Integrity

- Add missing relational constraints where the desired lifecycle is clear.
- Decide and test binding behavior when a Library album is deleted.
- Preserve `created_at` during upsert; only `updated_at` should change.
- Add schema migration tracking for SQLite rather than relying only on unconditional `CREATE TABLE IF NOT EXISTS` statements.
- Wrap multi-record imports and related writes in transactions.
- Add startup migration tests from every supported schema version.

### Ownership of Remaining Browser Data

- Inventory Listening History, RotationPlan, Focus Album, onboarding, language, dismissals, and cover cache.
- Classify each item as canonical user data, reconstructable cache, or device-local preference.
- Correct documentation immediately.
- Create a follow-up ADR/sprint proposal for canonical user data that should move to SQLite; do not silently change ownership without migration and backup coverage.

---

## Workstream 76.1D — Frontend Lifecycle and Error Handling

**Implementation status:** Complete ✅ (2026-07-15). Storage initialization and browser migrations run once before application rendering, while repositories are memoized for stable hook dependencies. Browser connectivity and API reachability are modeled separately through a cancellable three-second `/api/health` probe with reconnect and periodic checks. Retry reporting tracks concurrent requests independently. Library writes use the durable queue from 76.1B, cache-only failures remain explicitly non-critical, API/cache/retry states are visible, and lifecycle/connectivity/UI tests cover success, failure, timeout, cancellation, reconnect, and parallel retries.

### Stable Dependencies

- Create the storage adapter and repositories once, outside render or through stable memoized initialization.
- Run storage migrations once during application bootstrap, before dependent repositories load.
- Ensure repository-dependent effects do not rerun merely because an object was recreated.
- Review all persistence effects for unnecessary writes and render cascades.

### Connectivity

- Separate `navigator.onLine` from API health.
- Add a lightweight backend reachability check with bounded timeout.
- Avoid retry storms when the browser is online but the API is down.
- Cancel timeouts and in-flight requests on completion/unmount.
- Ensure retry reporting is safe when several concurrent requests are active.

### User-Visible Failures

- Replace persistence-related empty catch blocks with logging plus user feedback appropriate to severity.
- Keep cache-only failures non-blocking, but distinguish them from authoritative write failures.
- Ensure album deletion does not disappear locally while server deletion failed unless explicitly queued.
- Add UI tests for loading, server fallback, failed mutation, retry, recovery, and migration states.

---

## Workstream 76.1E — Quality Gates and Delivery

**Implementation status:** Complete ✅ (2026-07-15). Frontend and server now have explicit jsdom/Node Vitest boundaries, dedicated lint and test scripts, an aggregate local validation command, and clean generated-output exclusions. Existing lint findings were resolved without broad rule suppression. The reusable GitHub Actions validation workflow installs both packages reproducibly, runs lint/tests/builds, validates both Compose files, and performs container health smoke checks. Both image workflows require that gate before publishing SHA/`latest` tags; dependency and Actions updates are managed weekly through Dependabot and the documented review policy.

### Tests

- Fix retry tests so rejection handlers are attached before advancing fake timers.
- Split frontend and server Vitest configurations by environment:
  - frontend: `jsdom`;
  - server: Node.
- Provide explicit root scripts such as `test:frontend`, `test:server`, and an aggregate `test`.
- Ensure tests leave no unhandled rejections, open handles, timers, temporary files, or generated artifacts.
- Add API integration coverage for authentication, validation, persistence, migration, and identity stability.

### Lint and Build

- Exclude generated output (`dist`, `server/dist`) from linting.
- Use server-specific Node globals and frontend-specific browser globals.
- Resolve all current lint errors; do not broadly disable rules to obtain a green result.
- Review React effect warnings individually and refactor state derivation/loading where appropriate.
- Add a server lint script and a single aggregate root command.

### CI / Image Publishing

- Introduce a required validation workflow running:
  - dependency installation via `npm ci` for both packages;
  - frontend and server lint;
  - frontend and server tests;
  - frontend and server TypeScript builds;
  - `docker compose config` validation;
  - minimal container health/smoke checks where practical.
- Make image publication depend on successful validation.
- Pin third-party GitHub Actions to reviewed commit SHAs or document the chosen update policy.
- Keep immutable SHA image tags and define how a tested SHA is promoted to `latest`/version tags.
- Add Dependabot or an equivalent documented dependency-update process.

---

## Workstream 76.1F — Deployment and Documentation Reconciliation

**Implementation status:** Complete ✅ (2026-07-15). Production deployment uses the established unprivileged `1026:100` Synology volume contract, configurable host mounts, mandatory non-blank production token interpolation, and startup creation/read-write verification for every runtime directory. Clean-directory and SQLite upgrade behavior are covered automatically; final published-image/NAS upgrade validation remains explicitly tracked in the release gate. README, architecture, product, self-hosting, roadmap, versioning, changelog, data-ownership, and historical sprint documentation have been reconciled, and application/package versions now share `v0.26.1-dev` without a hard-coded UI version.

### Container Runtime

- Choose and document one supported UID/GID strategy.
- Align `server/Dockerfile`, `docker-compose.prod.yml`, directory ownership commands, and Synology examples.
- Use and document the established `1026:100` runtime identity required by the supported Synology volume setup; generic hosts must provide matching numeric ownership.
- Verify the API can create the database, WAL files, backups, covers, staging, archives, and exports under the documented permissions.
- Test a clean installation and an upgrade using the published images.

### Setup Corrections

- Fix `.env` creation so the generated token value, not a literal command substitution, is stored.
- Fail fast with a clear message when the production write token is missing or blank.
- Document development-only defaults such as `dev-token` and ensure they cannot accidentally become production guidance.
- Reconcile generic-host instructions with the fixed host paths in the production Compose file.
- Verify backup paths and the documented cover directory match `ROTATION_DATA_DIR` exactly.

### Documentation Source of Truth

- Update `README.md`, `ARCHITECTURE.md`, `PRODUCT.md`, `SELFHOST.md`, `ROADMAP.md`, `VERSIONING.md`, and `CHANGELOG.md` against the implemented system.
- Clearly distinguish:
  - authoritative server data;
  - browser cache/fallback data;
  - device-local preferences;
  - planned future migrations.
- Correct package/app/server version drift and remove hard-coded UI version strings.
- Replace volatile test-count claims with either generated counts or non-numeric quality statements.
- Review completed sprint documents as historical records: add correction notes where acceptance criteria were later found incomplete rather than rewriting history silently.
- Remove obsolete/redundant assets and generated artifacts only after proving they are unreferenced.

---

## Implementation Sequence

The workstreams are ordered to minimize data and deployment risk:

1. **76.1A — Security Boundary**: close unauthenticated writes and filesystem traversal first.
2. **76.1B — Persistence Contract**: make server loading, identity, and mutation semantics deterministic.
3. **76.1C — Validation & Integrity**: enforce the contract at API and database boundaries.
4. **76.1D — Frontend Lifecycle**: stabilize initialization, connectivity, and feedback around the new contract.
5. **76.1E — Quality Gates**: make the verified behavior mandatory for every published image.
6. **76.1F — Deployment & Docs**: validate clean install/upgrade and reconcile all documentation with the final implementation.

Each workstream should be delivered in reviewable commits or pull requests. Security tests and migration tests must accompany the corresponding implementation, not be deferred to the end.

---

## Architecture Changes

- Explicit server-authoritative Library repository with browser cache/fallback adapter.
- API reachability state separated from browser network state.
- Stable album identity contract shared across client and server.
- Runtime request schemas at every mutating API boundary.
- Consistent write-token middleware for all mutations.
- Guarded cover storage paths and verified image uploads.
- Versioned SQLite migrations and transactional imports.
- Separate frontend/server quality configurations and a required CI validation stage.
- Documented data-ownership matrix for server, browser cache, IndexedDB, and device-local preferences.

---

## Affected Components

### Frontend

- `src/App.tsx`
- `src/pages/HomePage.tsx`
- `src/hooks/useLibrary.ts`
- `src/hooks/useListenEvents.ts`
- `src/hooks/useRotationPlan.ts`
- `src/contexts/ConnectionContext.tsx`
- `src/repositories/*`
- `src/services/api/apiClient.ts`
- `src/services/api/albumsService.ts`
- `src/services/api/bindingsService.ts`
- `src/services/api/coversService.ts`
- `src/services/api/retryFetch.ts`
- `src/services/api/writeToken.ts`
- persistence, connection, and UI tests

### Server

- `server/src/index.ts`
- `server/src/application/config.ts`
- `server/src/application/coverService.ts`
- `server/src/routes/albums.ts`
- `server/src/routes/bindings.ts`
- `server/src/routes/covers.ts`
- `server/src/routes/middleware/writeToken.ts`
- `server/src/infrastructure/filesystem/*`
- `server/src/infrastructure/persistence/sqlite/*`
- new request schemas and API integration tests

### Tooling and Operations

- root and server `package.json`
- ESLint and Vitest configurations
- frontend and server Dockerfiles
- development and production Compose files
- Caddy configuration
- GitHub Actions workflows
- ignore files and generated artifacts

### Documentation

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/PRODUCT.md`
- `docs/SELFHOST.md`
- `docs/ROADMAP.md`
- `docs/VERSIONING.md`
- `docs/CHANGELOG.md`
- relevant ADRs and completed-sprint correction notes

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Existing local Library is overwritten by an empty/new server | Never discard cache before successful server read and verified migration; test empty-server bootstrap. |
| Client/server ID repair breaks bindings, covers, events, or RotationPlan | Define identity contract first; provide migration/reconciliation tests across all references. |
| Adding token protection breaks existing UI flows | Inventory every mutation and update client calls in the same change; add route matrix integration tests. |
| Offline work creates conflicting edits | Keep scope single-user; use deterministic pending operations or explicit rollback and surface unresolved state. |
| Stricter validation rejects legacy records | Normalize through a documented migration path and report rejected fields; never silently delete source data. |
| SQLite migration fails on an existing NAS | Back up before migration, use transactions, test all supported previous schemas, and abort startup safely. |
| UID/GID alignment breaks an existing Synology install | Document upgrade permissions and test both clean install and existing-volume upgrade. |
| Security hardening blocks external development origins | Provide an explicit development allowlist; production remains same-origin. |
| Supersprint becomes too broad to review | Deliver A–F sequentially with independent acceptance checks while retaining one final release gate. |

---

## Definition of Done

### Security

- [x] Every mutating endpoint rejects requests without a valid write token.
- [x] Every frontend mutation sends the token through the central API client.
- [x] Production CORS is same-origin or explicitly allowlisted.
- [x] Cover IDs and resolved paths cannot escape the cover directory.
- [x] Cover content and request size are validated.
- [x] Security integration tests cover unauthorized and malicious requests.

### Persistence and Identity

- [x] Initial Library loading uses the API when reachable and the browser cache only as documented fallback.
- [x] Empty-server migration from `localStorage` is idempotent and verified by read-back.
- [x] One album keeps the same ID through create, update, binding, cover, export, and delete flows.
- [x] Server write failures are visible and cannot silently leave client/server states divergent.
- [x] Retry/queue or rollback semantics are documented and tested for every Library mutation.
- [x] Existing user data survives upgrade and interrupted migration scenarios.

### Validation and Database

- [x] All mutating request bodies and parameters are runtime validated.
- [x] Invalid domain values return structured `400` responses and are not persisted.
- [x] Imports and schema migrations are transactional.
- [x] SQLite has explicit migration/version tracking with upgrade tests.
- [x] `created_at` remains stable across updates.
- [x] Album deletion and binding lifecycle behavior are explicitly defined and tested.

### Frontend Reliability

- [x] Storage adapters and repositories have stable lifetimes.
- [x] Browser migrations do not execute on every render.
- [x] Browser online state and API reachability are represented separately.
- [x] Persistence failures produce useful UI feedback and diagnostics.
- [x] No persistence-related empty catch block remains without an explicit, documented rationale.

### Quality and Delivery

- [x] Root frontend tests pass with no unhandled errors.
- [x] Server tests pass in a Node environment.
- [x] Root and server lint commands pass with zero errors.
- [x] Frontend and server production builds pass.
- [x] Generated output is excluded from lint and source control as intended.
- [x] CI runs lint, tests, builds, Compose validation, and smoke checks before image publishing.
- [x] Published version/latest images originate from a commit that passed the complete validation workflow.

### Operations and Documentation

- [ ] A clean documented installation starts successfully with correct permissions.
- [ ] An existing v0.26.0 data volume upgrades without data loss.
- [x] UID/GID, paths, token generation, backups, and healthchecks match runtime behavior.
- [x] Documentation contains an explicit data-ownership matrix.
- [x] Version strings are consistent across packages, UI, roadmap, and changelog.
- [x] Historical sprint discrepancies are recorded transparently.
- [ ] All obsolete files removed during cleanup are proven unreferenced.

### Release Gate

- [x] No critical or high-severity finding from the post-Sprint-76 audit remains unresolved or undocumented with an approved follow-up.
- [ ] A manual NAS smoke test covers onboarding, legacy import, album CRUD, cover upload, binding, scan, export, backup, restart, and restore.
- [x] Feature development remains frozen until the complete Sprint 76.1 Definition of Done is met.
