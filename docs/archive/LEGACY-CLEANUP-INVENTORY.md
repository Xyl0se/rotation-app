# Sprint 82E — Legacy and Production-Code Inventory

> Archived audit evidence. The current architecture is documented in
> [ARCHITECTURE.md](../ARCHITECTURE.md) and the [ADR index](../adr/README.md).

This inventory records the decision boundary used for cleanup. “Required migration”
means deletion would prevent a supported installation or backup from opening.

| Path or capability | Classification | Decision |
|---|---|---|
| SQLite migrations 1–11 | Required migration | Retain unchanged; schema 7 is the supported upgrade baseline and migrations 8–11 complete the Sprint 82 lifecycle and bounded query indexes. |
| `POST /albums/import` | Supported portability workflow | Retain and keep transactionally tested. It is the server-side batch restore/onboarding contract, not the retired browser bridge. |
| Server SQLite backup scheduler and restore service | Supported operations | Retain. It owns all canonical Library, Rotation, settings, audit, listening, and export-linkage data. |
| Browser Rotation/Focus/Listening/Library storage keys and migration registry | Obsolete | Removed. Canonical state is server-owned and the production smoke test confirmed the bridge is no longer required. |
| Browser JSON “backup” UI | Obsolete and misleading | Removed. It contained only retired browser keys and could not restore the canonical server database. |
| StorageAdapter/local-memory adapter layer | Obsolete | Removed after its last production consumer and migration tests disappeared. Onboarding retains one explicit browser preference. |
| Browser IndexedDB cover cache | Current compatibility/cache | Retain for now. It still supports custom uploaded cover blobs and resilient presentation; server cover resolution is authoritative for discovered remote covers. |
| Language and onboarding preferences | Current browser preference | Retain. They are UI preferences, not canonical Library or Rotation state. |
| Direct frontend Album batch-import client | Unused surface | Removed. The server portability endpoint remains available for documented operational use. |
| Historical sprint and archived acceptance documents | Historical evidence | Retain. Stale claims are not runtime behavior, and archive links remain useful release evidence. |

## Production-data guarantees

- API startup runs migrations and creates empty tables only; it contains no demo Album,
  Binding, Rotation, Listening Event, or export seed.
- Production startup never substitutes fixture data when SQLite or the API is unavailable.
- Test Albums and filesystem fixtures live only in `*.test.ts(x)` files.
- Root and server compilers enforce unused local/parameter checks; ESLint and repository-
  wide reference searches supplement that evidence for exported files and assets.

## Contract duplication decision

Client and server still define structurally similar Album and Rotation DTOs. They are
not collapsed in this cleanup: sharing them would make the browser import server
infrastructure or require a new package boundary. That architectural change provides
little behavior-preserving value during a release candidate and is therefore deferred
until an actual drift defect justifies a shared contract package.
