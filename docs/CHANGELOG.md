# Changelog

## Unreleased

- **Sprint 86.1 — deterministic deeper Insights**
  - Added a read-only server-side evidence projection with stable narrative codes,
    historical listening Roles, bounded periods, suppression rules, and a neutral Role overview.
  - Added explainable DE/EN narratives for listening balance, dormancy, rediscovery,
    Role movement, and Rotation change, with honest sparse-data states.
  - Excluded free Journal and Album Story prose, formalized the optional AI boundary,
    and added a sub-250 ms 10,000-Album performance gate.

- **Sprint 85 — dependency stewardship**
  - Added a practical Dependabot runbook covering terminology, risk classification,
    evidence gates, stale-branch recovery, rollback, and monthly maintenance.
  - Triaged all eight open Dependabot PRs without merging mixed-risk groups or
    incidental major updates.
  - Changed routine update checks from weekly to monthly, separated npm runtime and
    development groups, grouped only patch/minor updates, and bounded open PR noise.

- **Bindings maintenance correction**
  - Restored an explicit Delete action for unresolved Binding records whose music
    folders were reported missing, without opening the Album resolution dialog.

- **Sprint 84 — optional Listening Journal**
  - Added server-owned notes plus bounded mood/context tags to immutable Listening
    Events, with Timeline, Album editing, Reflection, backup, and privacy-safe audit
    integration.
  - Kept “Listened” as one confirmed action and now opens a freely dismissible journal
    overlay at the current viewport instead of placing an affordance at the top of Home.
  - Styled the journal as a restrained pastel thought cloud and fixed selected mood and
    context controls becoming invisible because of an undefined color token.
  - Passed the complete production NAS acceptance on 2026-07-18, including optional
    capture, persistence, failure recovery, privacy, and backup/restore checks.

- **Single moving deployment channel**
  - Production Compose now always pulls matching API and Web `latest` images.
  - Main-branch publish workflows overwrite only `latest`; version and SHA container
    tags are no longer produced. Git version tags remain source/release-note markers.
  - Updated Portainer guidance to require two green publish jobs for the same commit,
    forced image re-pull/recreation, and pre-deploy digest recording for rollback.

- **Interface alignment pass (`v0.29.2` candidate)**
  - Reordered primary navigation to Home, Insights, Export, Bindings, and Settings.
  - Reworked Bindings as a technical record-shop stockroom with monospace filesystem
    evidence, restrained steel/blue controls, consistent 8px geometry, and responsive
    a responsive two-Card desktop grid analogous to the Library.
  - Replaced remaining Homepage pill tags with compact 8px labels.
  - Split the Focus Album Card into artwork, Album identity, and listening/action
    columns, keeping “Gehört” visible at the upper-right on wide layouts.
  - Relaxed the listening column and separated adjacent Focus metadata tags; compacted
    Binding rows, controls, evidence, and typography after visual density review.

## v0.29.1 — 2026-07-17

- **Homepage design alignment**
  - Restored the original warm editorial palette on Home, standardized ordinary
    Homepage controls, Cards, covers, and containers on an 8px radius, and reduced
    shadows and hover movement without restyling the app's intentional specialist
    pages and dialogs.
  - Reduced Home to Focus Album, Player Rotation, and Library while preserving the
    current Rotation review layout and behavior.
  - Added a dedicated Insights page for localized Reflection, linguistic observations,
    and the neutral role overview; removed the obsolete Dashboard composition.
  - Added an accessible Focus Album edit action that opens the existing Album editor.
  - Replaced the dismissible unbound-Album Homepage banner with an accessible,
    centrally refreshed attention dot on Bindings navigation.
- **Container publication hardening**
  - Normalized API and Web image names to explicit lowercase GHCR paths.
  - Replaced the failing external metadata step with deterministic `latest`, commit
    SHA, and release-tag generation inside the workflow.
  - Updated production Compose to matching immutable `v0.29.1` API and Web images.

## v0.29.0

- **Sprint 82 — Rotation lifecycle and release candidate**
  - Added immutable archived Rotation history, Album identity snapshots, linked successful exports, pagination, and safe reuse of historical compositions as new drafts.
  - Added a server-confirmed handover comparison with membership and role deltas, quota gaps, Binding readiness, target size, and estimated export size.
  - Added a bounded audit trail for role/Archive decisions, Binding reassignment, draft changes, and Rotation acceptance. Safe Undo now previews the exact restoration and records a compensating event.
  - Added SQLite migrations 8–11 with automated supported-v7 upgrade, complete lifecycle backup/restore coverage, and measured indexes for bounded Library, Listening, History, and export-link queries.
  - Added representative 10,000-Album/50-Rotation performance gates, explicit browser/NAS budgets, bounded Album/Binding/Listening endpoints, query-plan assertions, and DE/EN handover plus safe/unsafe Undo regressions.
  - Hardened remote cover resolution through validated server-side caching, bounded retries, ordered MusicBrainz Release/Release Group fallbacks, safe persisted diagnostics, manual re-resolution, and one non-hotlinked rendering path across all Album surfaces.
  - Made Capture metadata lookup tolerate filesystem punctuation substitutions such as `_` for `:` through bounded title variants while preserving genuine underscore matches and adopting confirmed MusicBrainz titles.
  - Fixed acceptance of a server-reloaded draft Rotation by normalizing nullable SQLite lifecycle timestamps and sending an explicit canonical plan payload instead of replaying nullable response-only fields.
  - Made the production Compose image tag configurable and defaulted the active RC acceptance stack to matching `latest` builds, preventing Portainer from silently redeploying immutable pre-fix images; stable releases remain explicitly pinned.
  - Replaced deterministic Rotation selection with weighted random sampling, reduced immediate repetition from the active Rotation, and filled unmet role quotas from other eligible roles up to the configured target size.
  - Passed the production NAS lifecycle, backup/restore, desktop, narrow-viewport, and DE/EN acceptance gates. Stable acceptance explicitly waives manual timing capture because the tester could not record reproducible values; automated performance budgets remain green.
  - Removed the completed one-time browser Rotation/Listening import bridge while retaining supported historical migrations and Album portability.
  - Reconciled root/API versions and production API/Web image tags at `v0.29.0`, added curated GitHub Release automation, immutable production Compose tags, release notes, and a NAS acceptance/rollback runbook.
  - Corrected the immutable GHCR references to retain the leading `v` emitted from the Git release tag, preventing Portainer `manifest unknown` failures.
  - Removed the obsolete browser JSON backup/migration/storage-adapter stack and its dead UI/CSS/translations, while retaining SQLite migrations, server backups, the Album portability endpoint, and current browser preferences. Added an explicit legacy inventory and a no-production-seed regression test.

## v0.26.1-dev

- **Sprint 81 — Product Shell, Settings & Interaction Polish**
  - Added a responsive global Rotation header with a repository-native record/recurrence SVG mark and navigation across Home, Bindings, Export, and Settings.
  - Added a metallic machine-room Settings page with language controls and server-owned total/per-role Rotation composition, validation feedback, confirmed saves, and migration 7 persistence.
  - Made new Rotation generation consume the current server settings while preserving existing plan snapshots.
  - Moved Focus history into an accessible disclosure, compacted the unbound-folder notice, removed the internal Album Coach label, localized Insights and archive questions, and aligned archive dialogs with the reflective Coach design.
  - Fixed accepted Rotations reverting to proposal mode after reload by removing stale draft/previous-active plans transactionally when “Take along” confirms the new canonical active Rotation.

- **Focused 25-Album Rotation correction**
  - Restored Classic as an eligible Rotation role while keeping Admired and Archive excluded.
  - Reduced the default maximum from 30 to 25 Albums with hard caps of 10 Newly Discovered and 5 each for Comfort Food, Classic, and Still Growing.
  - Added migration 6 so existing installations no longer remove Classics from Rotation when their role is updated; newly generated Rotations use the corrected mix.

- **Sprint 80 foundation — Server-owned Rotation state**
  - Accepted ADR 014 and added SQLite schema/repositories for draft/active Rotation Plans, role quotas, Focus Album, Rotation items, and Listening Events.
  - Enforced that Focus is null or belongs to the active Rotation, with server-side random Focus selection restricted to active items.
  - Added canonical Rotation/Listening APIs and an idempotent legacy-import contract.
  - Cut Home and Export over to confirmed server state, added a deliberate browser-data migration with preview counts, and removes legacy keys only after confirmed import.
  - Restricted Focus selection to the active Rotation and made Listening Event creation update the Album's derived listening fields transactionally.
  - Added route-level coverage for canonical reloads, validation, Focus membership, random Focus, listening idempotency, and legacy-import conflicts; added UI failure/retry coverage and verified real SQLite backup/restore of Rotation, Focus, and Listening Events.
  - Passed production NAS acceptance for legacy import, reload and second-browser consistency, Focus membership, listening history, role cleanup, and operational backup/restore.

- **Sprint 79 — Safe Binding Candidate Review**
  - Added Unicode-safe, precision-oriented candidate ranking with separate title/artist signals, volume-conflict penalties, ambiguity detection, and a bounded top-three result.
  - Persisted candidate evidence per scan and added stale-scan and duplicate-Library guards around transactional candidate selection.
  - Added localized candidate review, reasons, selection, rejection, and Capture fallback directly to the Bindings workspace.
  - Restricted Reconcile so folder existence alone can no longer confirm an unlinked proposal.
  - Passed the production candidate-quality review against real unmatched NAS folders without requiring threshold changes.

- **Long-running NAS export resilience and visual refresh**
  - Replaced blocking synchronous staging copies with asynchronous filesystem operations so API health and progress endpoints remain responsive during multi-minute NAS exports.
  - Added per-file staging progress, a 15-minute staging window, resilient non-overlapping status polling, and recovery of already-running or completed jobs after an interrupted browser/proxy response.
  - Made staged status recoverable from SQLite after an API restart and prevented “Retry from current step” from blindly starting a duplicate copy when the original job still exists.
  - Redesigned Export as a responsive pastel travel landscape with sky, clouds, sun, grass, translucent content surfaces, and context-matched progress and action styling.

- **Release-candidate acceptance**
  - Completed the production NAS acceptance path from Album Capture and confirmed Binding through Rotation export and Syncthing delivery.
  - Verified clean deployment as UID/GID `1026:100`, persistence across restart, Syncthing metadata preservation, and SQLite backup/restore.
  - Closed Sprints 77 and 78. The archived acceptance record retains the approved exception that an in-place `v0.26.0` upgrade was not executable after intentional deletion of the source database.

- **Library editor follow-up**
  - Fixed bound-folder visibility in the Album editor by correlating the server Binding with the canonical Library album ID.
  - Added Album Coach reassessment for albums that already have a role and localized the updated editor guidance.
  - Gave the Album editor a darker, subtly blue maintenance-workspace treatment distinct from the Home page.

- **Pre-acceptance intake and Bindings polish**
  - Redesigned the shared Discover/Binding-Capture dialog as a responsive skeuomorphic catalog intake station, with fully localized metadata states and an optional Album Story step for acquisition reason, life phase, and memory note.
  - Redesigned Bindings as a darker warehouse/boilerroom workspace with higher-contrast state badges, clearer hierarchy, generous row/action padding, and responsive button grids.

- **Sprint 78 — Library Findability**
  - Added normalized title, artist, and Album Story search with a `/` keyboard shortcut.
  - Added composable role, missing-role, archive, inclusive year-range, and never-listened filters across All, Roles, and every Library Perspective.
  - Added transparent “Never listened” and “Recently archived” quick views, result counts, reset actions, accessible empty states, responsive DE/EN controls, and a 10,000-album performance fixture.
  - Fixed the “No role assigned” filter for SQLite/API albums whose missing role was represented as `null`; the repository now normalizes missing roles to an omitted property and the filter remains tolerant of older responses.

- **Export repeat-rotation hardening**
  - Verified that an existing `current-rotation` remains fully available during staging and that re-exporting unchanged albums produces one final folder per album.
  - Replaced the second full staging-to-next copy with an atomic workspace rename, halving temporary export I/O while retaining archive-and-swap recovery semantics.
  - Added a structured responsive export list so artist, album, and filesystem path no longer appear as duplicated concatenated text.
  - Preserves Syncthing-owned `.stfolder` and `.stignore` entries across atomic export swaps without retaining unrelated stale files; symbolic metadata entries are rejected.

- **Album Coach decision-tree correction**
  - Reworked mature-album classification so Classic, Comfort Food, and Admiration represent long-term influence, familiar automatic return, and explicit musical esteem instead of hidden fallback priorities.
  - Added an explicit differentiator when Classic and Comfort Food overlap, made Classic reachable for currently resting albums, and removed ineffective early/archive questions.
  - Moved every Album Coach question and description to the DE/EN translation catalog and added German UI path coverage.
  - Added a localized ✨ shortcut on roleless Library cards that opens the Album Coach directly; Sprint 78 now includes a dedicated “No role assigned” filter.

- **Sprint 76.3 — Trusted Proxy Write Boundary**
  - Removed browser write-token storage, token headers, and token UI. Caddy now overwrites and injects the internal deployment secret for same-origin `/api` requests.
  - Added Origin/Fetch Metadata protection for mutations while retaining constant-time protection for direct API access.
  - Fixed false cross-site rejections when HTTPS terminates at a NAS reverse proxy before Caddy's internal HTTP connection; Origin validation now compares the externally stable host while Fetch Metadata still rejects cross-site requests.
  - Treats browser-controlled `Sec-Fetch-Site: same-origin` as authoritative even when a NAS proxy rewrites the forwarded Host, and returns safe rejection diagnostics instead of a generic write-token message.
  - Removed the remaining Origin/Host equality fallback because Synology/NAS proxies may rewrite the Host even when Fetch Metadata is `same-site` or unavailable; explicit `Sec-Fetch-Site: cross-site` requests remain blocked and protected routes still require Caddy's internal token.

- **Sprint 76.1 — Pre-Release Integrity & Hardening Supersprint**
  - Protected every mutating API route, hardened cover paths/uploads, standardized sanitized API failures, and added route-level security coverage.
  - Made SQLite/API authoritative for the Library, added durable offline mutation replay, stable client-generated album identities, transactional imports, runtime request validation, and versioned database migrations.
  - Stabilized frontend repository lifetimes, separated browser connectivity from API health, and made concurrent retry reporting cancellation-safe.
  - Split frontend/server test and lint environments and introduced required CI validation, Compose checks, container smoke checks, gated image publishing, and dependency update automation.
  - Reconciled the required `1026:100` runtime ownership, host paths, write-token setup, backup/cover locations, version reporting, and data-ownership documentation. Startup now verifies all writable runtime directories before serving requests.

## v0.26.0-dev

- **Sprint 76 — Library-Bindings Integration**
  - **AlbumCard Binding-Badge**: Library → Binding Visibility — jedes Album zeigt ein kleines Status-Badge (Bound / Unbound / Missing) mit farbcodiertem Hintergrund. Tooltips zeigen Dateipfad oder fehlenden Ordner an.
  - **BindingsPage Album-Preview & Orphan-Badge**: Binding → Library Visibility — jede Binding-Zeile zeigt Album-Titel/Künstler als Vorschau. Orphan-Bindings erhalten ein „Not in Library"-Badge.
  - **Album Coach Orphan Prompt**: Wenn ein Scan verwaiste Bindings produziert (albumId nicht in der Library), erscheint ein dismissibler, non-intrusiver Coach-Prompt auf der Startseite. Lädt den Nutzer ein, das Album zu erfassen („Jetzt erfassen" / „Später"). Dismiss-Zustand wird in `localStorage` persistiert.
  - **i18n**: Alle neuen UI-Strings in DE/EN übersetzt (`coach.orphanPrompt.*`, `bindings.orphan`).
  - Build clean, 338 Tests grün.

## v0.25.8-dev

- **Sprint 75.3 — Library-Bindings UI Bridge**
  - **AlbumCard Binding-Badge**: Kleines Status-Badge pro Album (Bound / Unbound / Missing) mit farbcodiertem Hintergrund. Tooltips zeigen Dateipfad oder fehlenden Ordner an. i18n DE/EN.
  - **EditAlbumDialog Bound-Folder**: Readonly-Anzeige des gebundenen Ordners im Dialog. Warnung bei fehlendem Ordner. Nutzt `useBindings` + `getBindingForLibraryAlbum`.
  - **Library-Views Binding-Map**: `Library`, `GroupedLibraryView` und `RoleDetail` erhalten je einen `bindingMap` über `useBindings` und übergeben das passende Binding an jeden `AlbumCard`.
  - **BindingsPage Album-Preview & Orphan-Badge**: Pro Binding-Zeile wird Album-Titel/Künstler als Vorschau angezeigt. Orphan-Bindings erhalten ein "Not in Library"-Badge.
  - **HomePage Orphan-Banner**: Gelber Banner auf der Startseite, wenn verwaiste Ordner existieren. Verweist auf die Bindings-Seite.
  - Alle neuen UI-Texte in DE/EN übersetzt. Build clean, 338 Tests grün.

## v0.25.5-dev

- **Sprint 75 — Observability & Operations**
  - **Structured Logging (75A)**: `createLogger()` mit konfigurierbarem Level (`trace`–`error`) und Format (`pretty`/`json`). Pfad-Sanitization und Token-Redaction im Kontext. Alle `console.log`/`console.error` durch Logger ersetzt. 7 Unit-Tests für Format, Filter, Sanitization, Redaction, Stderr.
  - **Metrics (75B)**: In-Memory Metrics-Store (`metrics.ts`) mit automatischem Reset nach 24h. Tracked Requests, Errors, Export-Größe, Scan-Dauer. REST-Endpoint `GET /health` liefert Metriken mit. 5 Unit-Tests.
  - **Erweiterter Healthcheck (75C)**: `/health` prüft jetzt DB-Status, `/music` lesbar, `/rotation-data` beschreibbar, Syncthing-Export-Pfad beschreibbar, letzter Scan (ID, Status, Zeit) und Metriken. Degradierter Status bei fehlenden Pfaden.
  - **Docker & Infrastruktur (75D)**: `ROTATION_LOG_LEVEL` und `ROTATION_LOG_FORMAT` als Env-Variablen. Docker-Log-Rotation in `docker-compose.yml` und `docker-compose.prod.yml` (max 10 MB, 5/10 Dateien).
  - **Dokumentation (75E)**: `SELFHOST.md` erweitert um Troubleshooting-Abschnitte: Log-Level/Format, Log-Rotation, Healthcheck-Details, Log-Lesung mit `docker compose logs`. Sprint-75.md als abgeschlossen markiert.
  - Alle 84 Server-Tests grün, TypeScript-Build zero errors. Keine neuen Dependencies.

## v0.25.4-dev

- **Sprint 74 — Backup System**
  - **Backup Service Core (74A)**: `backupService.ts` erstellt timestamped SQLite-Backups mit `PRAGMA integrity_check`, rotiert automatisch (`rotateBackups`), listet alle Backups (`listBackups`), und bietet eine sichere Restore-Funktion. 13 Unit-Tests (create, rotate, skip-corrupt, retention, list, metadata, restore safety).
  - **Export-Lock Integration & Scheduling (74B)**: `backupScheduler.ts` mit `node-cron` für automatische Backups. Prüft vor jedem Backup den Export-Lock — bei aktivem Export wird übersprungen und geloggt. `backupStatusRepository` trackt alle Backup-Runs mit Ergebnis und Fehlern. REST-Endpunkte: `GET /backups/status`, `POST /backups/run`, `GET /backups/history`, `GET /backups/list`.
  - **Docker & Infrastruktur (74C)**: `docker-compose.yml` und `docker-compose.prod.yml` mit Backup-Env-Variablen (`ROTATION_BACKUP_ENABLED`, `ROTATION_BACKUP_CRON`, `ROTATION_BACKUP_RETENTION_COUNT`) und `restart: unless-stopped`.
  - **Dokumentation & Restore (74D)**: `SELFHOST.md` aktualisiert mit automatischem Backup (stündlich, 24 Retention), Restore-Prozedur, und API-Beispielen für manuellen Backup-Trigger.
  - **Tests & Audit (74E)**: Alle 72 Server-Tests grün (9 Testdateien). TypeScript-Build zero errors. Neue Dependency: `node-cron`.

## v0.25.3-dev

- **Sprint 73 — Frontend Resilience**
  - **API Resilience (73A)**: `retryFetch` mit 10s Timeout, 3 Retries und exponentiellem Backoff (1s → 2s → 4s). Offline-Erkennung via `navigator.onLine`. `ApiError` erweitert um `retryable`. `ConnectionContext` mit `isOnline`, `isRetrying`, `retryCount`. Offline-Indikator in der Nav-Leiste. Unit-Tests für Retry-Logik.
  - **Feedback Systems (73B)**: `ToastContext` mit FIFO-Queue (max 3, Auto-Dismiss 5s), Typen `success/error/info/warning`. `ErrorBoundary` für React-Crashes mit Fallback-UI + Reload-Button. Toasts bei Export-, Binding- und Scan-Operationen.
  - **Export & Bindings Polish (73C)**: Staging-Polling mit 60s Timeout und Fehlerzustand mit Reset-Option. Verify/Reconcile Buttons mit erklärenden Tooltips (DE/EN). `.bindings-actions` mit visuellem Rahmen, Padding und Hintergrund.
  - **Scan Real Progress (73D)**: `POST /scan` gibt `scanId` zurück. `GET /scan/:id/progress` liefert `directoriesScanned`, `directoriesSkipped` und `status`. Frontend pollt alle 2s und zeigt Live-Fortschritt im Button-Label. 60s Safety-Timeout.
  - **Integration & Audit (73E)**: Alle API-Calls geprüft – keine raw `fetch()` außerhalb `apiClient.ts`. Alle Seiten mit Loading- und Error-States. 311 Tests grün, Type-Check clean.

## v0.27.0

- **Sprint 72 — Export Safety & Edge Cases**
  - **Crash Recovery**: Server-Startup erkennt unterbrochene Exports (`next-rotation` ohne `current-rotation`) und stellt sie atomar wieder her. Verwaiste `next-rotation`-Verzeichnisse werden bereinigt.
  - **Staging-Warnings**: Wenn Alben während Stage fehlen, werden sie übersprungen (`skippedSources`) und der Nutzer wird im Frontend gewarnt.
  - **Retry & Continue**: `ExportPage` zeigt eine Warn-Box mit "Wiederholen" und "Trotzdem fortfahren" Buttons, wenn einzelne Alben übersprungen wurden.
  - **Recovery-Banner**: Beim Laden der Export-Seite wird geprüft, ob CrashRecovery einen vorherigen Export wiederhergestellt hat — Banner mit Dismiss-Button.
  - **PathGuard-Härtung**: Tests für Null-Byte-Injection, Symlink-Races, Unicode-Normalisierung (NFC/NFD), Pfad-Traversal.
  - **Atomares Apply**: Export nutzt `next-rotation` als Zwischenziel und `renameSync` für atomare Umschaltung.
  - **i18n**: Alle neuen UI-Texte in DE/EN übersetzt.

- **Sprint 71 — Binding & Scan Robustness**
  - **Directory Scanner**: Graceful Handling nicht erreichbarer Musik-Ordner, Unicode-NFC-Normalisierung für Cross-Platform-Stabilität.
  - **Scan-Service**: Idempotenter Scan mit korrektem Error-Handling.
  - **Binding Repository**: Race-safe Upsert für proposed Bindings.

## v0.26.0

- **Sprint 70A — System Diagnostics Panel**
  - Health-Check Panel im Frontend: DB, Music folder, Workspace, Syncthing, Bindings
  - Expandable Details mit Refresh-Button
  - i18n DE/EN

- **Stabilization Bugfixes**
  - Write-Token Dialog: Token wird persistiert und bei POST/PUT/DELETE automatisch gesendet
  - Scan-Button: Erscheint jetzt auch wenn letzter Scan 0 Bindings produziert hat
  - Docker Volume-Mount: Musik auf `/volume1/rotation/music` korrigiert
  - Synology Permissions: Container-User 1026:100 bekommt Lesezugriff

## v0.25.0-dev

- **Sprint 70 — Operations & Deployment Polish**
  - **GitHub Actions Frontend-Image**: Neuer Workflow `.github/workflows/docker-publish-web.yml` baut und pusht `ghcr.io/xyl0se/rotation-web:latest` bei jedem Push auf `main`.
  - **Syncthing-Dokumentation**: `SELFHOST.md` beschreibt jetzt nur noch den Export-Ordner-Pfad und empfohlene Einstellungen. Kein Docker-Compose-Block für Syncthing mehr — das läuft außerhalb von Rotation.
  - **Löschverhalten dokumentiert**: Abschnitt "What happens when an album leaves the rotation?" erklärt, wie Syncthing deletions propagiert und wie man sie verhindert (Ignore deletes, `keepRemoved`).
  - **Roadmap-Tabelle aktualisiert**: Sprints 69A–69C als abgeschlossen markiert, Sprint 70 als In Progress.

## v0.24.0-dev

- **Sprint 69B — Export Safety & Diff**
  - **Export Lock**: Mutual exclusion via SQLite (acquire/steal-expired/release). Verhindert parallele Exports.
  - **Export Diff Engine**: Berechnet `added` / `removed` / `unchanged` zwischen neuem Export und aktuellem `current-rotation`. Neuer Endpoint `POST /exports/diff`.
  - **Apply mit Diff**: `applyExport` gibt jetzt das vollständige Diff zurück. Archivierung erfolgt atomar via `renameSync`.
  - **Keep-Removed Option**: `applyExport` akzeptiert `keepRemoved` Flag (vorbereitet für UI).
  - **Manifest-Archivierung**: Jeder Apply archiviert den vorherigen Zustand mit Timestamp.
  - **Crash Recovery**: Server-Startup erkennt "staged" Exports, führt Rollback durch, räumt verwaiste Staging-Verzeichnisse auf.
  - **Tests**: `exportLockRepository.test.ts` (7 Tests), `exportDiff.test.ts` (4 Tests). Alle 42 Server-Tests grün.

- **Sprint 68A — Binding Verification, Export Preview & Apply**
  - **Binding Health Check**: `ScanService` prüft bei jedem Scan, ob gebundene Ordner noch existieren. Nicht mehr existierende Bindings werden auf Status `missing` gesetzt.
  - **Compilations-Heuristik**: Ordner mit "VA", "Various", "Compilations", "Soundtrack" werden als Compilation erkannt und nicht automatisch zugeordnet (manuelle Bestätigung erforderlich).
  - **Mehrfache Treffer**: Wenn ein Album-Name mehrfach in der Bibliothek vorkommt, wird kein automatischer Vorschlag gemacht — das UI zeigt alle Kandidaten zur expliziten Auswahl.
  - **Export Preview & Stage & Apply**: Vollständiger 3-Phasen-Export-Flow über `ExportPage.tsx` mit `useExport.ts` Hook. Preview zeigt Bindings, Größe und fehlende Alben. Stage kopiert in `.staging/<exportId>/`. Apply tauscht atomar mit Archivierung.
  - **Navigation**: Header zeigt "Bindings" und "Export" Links mit aktiver Routen-Hervorhebung.
  - **i18n**: Vollständige Übersetzungen für `nav`, `bindings`, `exportPage` in EN/DE.
  - **CORS**: API-Server akzeptiert Browser-Requests über `cors({ origin: true })` für Frontend-Integration.
  - **Build & Tests**: Frontend 28 test files / 275 tests, Server 5 test files / 31 tests — alles grün.
  - Keine neuen Dependencies.

## v0.23.0-dev

- **Sprint 67 — Production Deployment Foundation**
  - **Multi-Service Docker Compose** (`docker-compose.prod.yml`): `rotation-web` (Caddy + statisches SPA) + `rotation-api` (Node + Express + SQLite) als getrennte Services.
  - **Caddy als Reverse Proxy**: `/` → Frontend, `/api/*` → `rotation-api:3001`, `/health` → API-Healthcheck. Single Origin, kein CORS nötig.
  - **Unprivilegierter Container-User**: `USER node` (UID 1001) in `server/Dockerfile` und `Dockerfile` (Frontend). Container laufen nicht als root.
  - **Volume-Mounts**: `/music:ro` (Originalbibliothek, read-only), `/rotation-data:rw` (SQLite, Exports, Staging, Archive).
  - **GitHub Actions**: Neuer Workflow `.github/workflows/docker-publish-api.yml` baut und pusht `ghcr.io/xyl0se/rotation-api:latest` bei jedem Push auf `main`.
  - **`SELFHOST.md`**: Vollständige Synology-Setup-Anleitung mit Verzeichnisstruktur, Permissions (UID 1001), Backup/Restore, Troubleshooting, optionaler Syncthing-Integration.
  - **Security**: Write-Token (`ROTATION_WRITE_TOKEN`) für alle schreibenden Operationen (Scan, Export, Binding-Bestätigung). PathGuard verhindert Directory Traversal.
  - **Healthchecks**: Docker-Healthchecks für beide Services alle 30 Sekunden.

## v0.21.0

- **Sprint 60 — Internationalization (i18n) & Documentation Sprint**
  - **Complete i18n system**: DE/EN locale files (`src/i18n/locales/{de,en}.ts`) with full type safety via `Stringify<>` mapped type.
  - **React Context + Hook**: `I18nContext` provides `locale`, `setLocale`, and `t()` for type-safe translations. `useI18n()` is the primary consumption hook.
  - **Language switcher**: Globe icon in the header toolbar with accessible ARIA label.
  - **All UI components internationalized**: `WelcomePage`, `Header`, `EmptyLibrary`, `Library`, `AlbumCard`, `EditAlbumDialog`, `FocusAlbumCard`, `PlayerRotation`, `RotationTileTooltip`, `AlbumCoach`, `ReflectionCard`, `Dashboard`, `RoleExplorer`, `RoleDetail`, `ArchiveProtectionCoach`, `ArchiveReturnCoach`, `AlbumTimeline`, `DiscoverAlbumDialog`, `MetadataLookupStep`, `BackupControls`, `LibraryViewSwitcher`, and all sub-views.
  - **Persistent language preference**: Saved to `rotation-locale` in `localStorage`; defaults to browser language (`navigator.language`), falls back to English.
  - **Domain strings remaining in German**: Coach questions, archive questions, role explanations, timeline labels, reflection messages, insight descriptions, rotation explanations, and backup error messages are intentionally kept in the domain layer as a known follow-up item. They are not user-facing raw strings in React components.
  - **All product documentation (`/docs`) translated to English**: Core docs (PRODUCT, ARCHITECTURE, DESIGN, DESIGN_SYSTEM), operations docs (SELFHOST, VERSIONING, ROADMAP), and feature docs (ALBUM_COACH, ALBUM_TIMELINE, REFLECTION_ENGINE, ARCHIVE_WORKFLOW, CURATED_ROTATION, INSIGHTS, LIBRARY_MAINTENANCE, DASHBOARD).
  - **No new dependencies** — pure TypeScript/React implementation.
  - **0 TypeScript errors, 244 tests green, Vite build clean**.

## v0.20.0

- **Sprint 59 — Self-Hosting mit GitHub Container Registry**
  - **GitHub Actions Workflow**: Automatischer Docker-Build bei jedem Push auf `main`, pushed zu `ghcr.io/xyl0se/rotation-app:latest`.
  - **Production Compose**: `docker-compose.prod.yml` für Headless-Server mit `restart: unless-stopped` und explizitem Image-Tag.
  - **Bugfix: Weiße Seite über HTTP**: `crypto.randomUUID()` funktioniert im Browser nur in Secure Contexts (HTTPS/localhost). Über LAN-IPs (`192.168.x.x`) über HTTP ist die Funktion undefined. Eigener UUID-Generator (`generateUUID`) als Polyfill implementiert.
  - **Bugfix: Backup-Import bei leerer Bibliothek**: `BackupControls` sind jetzt auch im `EmptyLibrary`-State sichtbar — ein erster Import ist möglich, bevor ein Album hinzugefügt wird.
  - **Docker Image-Name**: Lowercase (`ghcr.io/xyl0se/...`) für GHCR-Kompatibilität.
  - `.env` aus Git entfernt und in `.gitignore` gesichert.
  - Kein Schema-Bump. TypeScript-frei, keine neuen Dependencies.

## v0.19.0-dev

- **Sprint 58 — Backup & Portabilität**
  - **Backup Domain-Logik**: `createBackup()`, `downloadBackup()`, `validateBackup()`, `restoreBackup()` in `src/domain/backup/backup.ts`.
  - **BackupControls Komponente**: Export- und Import-Buttons unterhalb der Library. Export lädt alle `rotation-*` localStorage-Daten als JSON herunter. Import lädt eine Backup-Datei, validiert Schema-Version und Export-Datum, und überschreibt bestehende Daten nach expliziter Bestätigung.
  - **Warn-Dialog beim Import**: Klare Warnung, dass bestehende Daten überschrieben werden. Nach erfolgreichem Import wird die Seite neu geladen.
  - **README aktualisiert**: `npm run dev` entfernt, Docker-Compose als Startbefehl dokumentiert.
  - Kein Schema-Bump. TypeScript-frei, keine neuen Dependencies. Alle 244 Tests grün.

## v0.18.0-dev

- **Sprint 57 — Klassiker- und Archivlogik überarbeitet**
  - **Neuer Album Coach Entscheidungsbaum**: Vollständig deterministisch, acht mögliche Fragen, kein acht Fragen langer Pflichtpfad.
    - `heardThreeTimes === false` → `new`
    - `wouldMissAlbum === false` → `archive`
    - Aktiver Zweig (`stillReturningConsciously === true`): `shapedTasteLongterm === true` → `classic` (Vorrang vor `comfort-food` und `growing`)
    - Ruhender Zweig: `musicallyValued === true` → `admire`; sonst → `archive`
  - **Neue Fragen**: `stillReturningConsciously`, `shapedTasteLongterm`, `musicallyValued`, `memoryOfEarlierPhase` ersetzen `wouldRecommend` und `stillListeningRegularly`.
  - **Partielle Antworten**: `AlbumCoachAnswers = Partial<AlbumCoachAnswerValues>`. Fehlende Antworten werden nicht als `false` interpretiert.
  - **Rollendefinitionen präzisiert**: `classic` = dauerhaft prägend; `admire` = musikalisch geschätzt ohne selbstverständliche Nähe; `archive` = darf ruhen, ohne aus der Geschichte zu verschwinden.
  - **Archivschutz neu**: `wouldRecommend` entfernt. Stattdessen `hasBiographicPlace` als primäres Schutzsignal — persönliche Klassiker können aktuell ruhen und bleiben trotzdem geschützt.
  - **Kein Schema-Bump, keine leere Migration**: Coach-Antworten werden nicht persistiert.
  - Alle 244 Tests grün, TypeScript-Compile sauber.

## v0.17.0-dev

- **Sprint 55 — Album Story Foundation**
  - **AlbumStory Domainmodell**: `AlbumAcquisitionReason`, `AlbumLifePhase`, `AlbumStory` mit optionalen Feldern (Herkunftsgrund, Lebensphase, persönliche Notiz).
  - **Album-Modell erweitert**: `story?: AlbumStory`, defensiv normalisiert in `albumRepository.ts`.
  - **EditAlbumDialog — Story Editor**: Neue Sektion „Albumgeschichte" mit Auswahl für Herkunftsgrund und Lebensphase, optionaler Freitext-Notiz.
  - **FocusAlbumCard — Story Anzeige**: Kompakte Darstellung der Album Story mit Badges (Herkunft, Lebensphase) und persönlicher Notiz als Zitat.
  - **Timeline-Integration**: `createAlbumTimeline()` zeigt Story-Erzeugung und -Aktualisierung als Timeline-Events.
  - Keine Pflichtfelder, keine Bewertung, keine Statistiken. UI-Sprache folgt dem Musikjournal-Gedanken.

- **Sprint 56 — Explainable Rotation**
  - **`explainRotationItem()` Domainfunktion**: Erklärt, warum ein Album Teil der aktiven Player-Rotation ist — basierend auf Rolle, Hörhistorie, Role History und Rotation-Plan-Auswahlgrund.
  - **`RotationTileTooltip`-Komponente**: Hover-gesteuertes Popover über dem Album-Cover jedes Rotation-Tiles. Zeigt Album-Header, Rolle, Begründung, Hörstatistiken und eine kompakte Timeline.
  - **Player-Rotation Tiles entlastet**: Statische Explanation aus den Tiles entfernt; die Kacheln zeigen jetzt nur noch Titel, Künstler und Rolle.
  - **CSS für Tooltip**: Neue Klassen `.rotation-tooltip-wrapper`, `.rotation-tooltip`, `.rotation-tooltip-header`, `.rotation-tooltip-role`, `.rotation-tooltip-explanation`, `.rotation-tooltip-stats`, `.rotation-tooltip-timeline` in `cards.css`.
  - TypeScript-frei, keine neuen Dependencies. Alle 228 Tests grün.

## v0.16.0-dev

- **Dashboard vereinfacht**: Balance-Sektion und Limit-Texte entfernt. RotationDashboard zeigt jetzt nur noch die neutrale `RotationOverview` ohne Empfehlungen.
- **RotationRecommendations entfernt**: Komplette Komponente entfernt. Rotation soll informieren, nicht bewerten.
- **Alte Balance-/Limit-Domänenlogik @deprecated**: `rotationRules`, `evaluateRotation`, `recommendRotation`, `summarizeRotationBalance` und `rotationMessages` als veraltet markiert.
- **Bibliothekskarten horizontaler**: `AlbumCard` zeigt jetzt Cover links, Meta + Hörsession-Button Mitte, Tool-Buttons rechts als vertikale Toolbar.
- **Library Grid 2-Spalten**: Album Cards nutzen halbe Breite pro Karte, zwei nebeneinander auf Desktop (Responsive: einspaltig unter 700 px).
- **Fokusbutton**: Tooltips konsistent auf "Fokus setzen" (AlbumCards und Toolbar).
- **Toolbar**: Neuer Button "Neues Fokusalbum vorschlagen" (Secondary) neben "Neues Album entdecken" — wählt zufällig ein nicht-archiviertes Album als neues Fokusalbum aus.
- **Micro UX**: Aria-Labels für Hörsession-Buttons verbessert, Rotation-Tile Remove-Button mit "Aus der Rotation entfernen", Player-Rotation Beschreibungen entschärft.
- **Toolbar-Icons vereinheitlicht**: Fokus-Button zeigt ★/☆ statt 🎯, Archiv-Button zeigt ⬇/↩ statt Text, Löschen-Button zeigt ✕ statt 🗑. Keine Emojis mehr in der Toolbar.
- **Role-Label auf Textbreite**: `.album-role-label` nur so breit wie der Text (nicht volle Kartenbreite).
- TypeScript-frei, keine neuen Dependencies. Alle 204 Tests grün.

## v0.15.0-dev

- Sprint 51 fuehrt den Cover Editor ein.
- **Cover Override Domainmodell**: `CoverOverride` als discriminated union — `type: "custom"` fuer hochgeladene/gespeicherte Blobs (`upload` / `alternative`) und `type: "url"` fuer direkte externe URLs.
- **AlbumCover Komponente**: Unterstuetzt beide Override-Typen — `url` direkt, `custom` aus IndexedDB laden.
- **EditAlbumDialog Cover-Sektion**: Upload-Button, URL-Input (speichert direkt als `url`-Override), Live-Preview, Reset-Button. Dialog schliesst nach erfolgreicher Aktion.
- **Bugfix**: Aenderung der Cover-URL im Metadaten-Feld setzt jetzt automatisch `coverOverride` zurueck. Vorher ueberschrieb das aktive Override die neue URL – die Aenderung war nach Neuladen der Seite verschwunden.
- **Discover-Flow**: Automatischer Cover-Download als `alternative`-Override bei Metadaten-Lookup.
- **IndexedDB Custom Cover Store**: `saveCustomCover`, `getCustomCover`, `removeCustomCover` APIs.
- **useLibrary erweitert**: `updateAlbumCoverOverride` (Blobs), `setCoverUrlOverride` (URLs), `removeAlbumCoverOverride` Methoden.
- 2 Tests fuer Cover-Override in `useLibrary.test.ts` mit discriminated union Type-Guards (158 Tests gesamt).
- TypeScript-frei, keine neuen Dependencies.

## v0.14.0-dev

- Sprint 50 fuehrt Library Perspectives ein (Sprint 50A: Kuenstler & Jahr, Sprint 50B: Hoersession & Einordnung).
- **Library Group Domain-Modell**: `LibraryGroup<T>` als generisches Gruppierungsmodell.
- **Gruppierung nach Kuenstler**: `groupByArtist()` mit Case-folding und Sortierung (A–Z, N/A am Ende).
- **Gruppierung nach Erscheinungsjahr**: `groupByYear()` mit Jahrseinteilung und "Unbekanntes Jahr"-Gruppe.
- **Gruppierung nach letzter Hoersession**: `groupByLastListened()` mit Zeitkategorien (Heute, Diese Woche, Dieser Monat, Dieses Jahr, Laenger her, Noch nicht gehoert). Bevorzugt `listenEvents` ueber `album.lastListened`.
- **Gruppierung nach letzter Einordnung**: `groupByRoleChange()` mit Zeitkategorien. Nutzt juengsten `roleHistory`-Eintrag pro Album.
- **Gemeinsame Zeitkategorie-Hilfsfunktion**: `categorizeRecency()` mit `RecencyCategory`-Typ und `recencyGroups`-Label-Map fuer konsistente Gruppennamen.
- **GroupedLibraryView**: Wiederverwendbare Gruppen-Komponente mit Header und Album-Card-Grid.
- **LibraryViewSwitcher**: Drei Hauptmodi — Alle, Nach Rolle, Perspektiven — mit Sub-Switcher fuer alle vier Perspektiven.
- **Artist View, Year View, LastListened View, RoleChange View**: Duenne Wrapper ueber `GroupedLibraryView`.
- **Responsive**: Mobile Anpassung fuer Switcher-Layout.
- Keine neuen Dependencies. Alle 151 Tests gruen.

## v0.13.0-dev

- Sprint 49 fuehrt den Role Explorer ein.
- **Neue Domain-Funktionen**: `getAlbumsByRole()`, `getRoleStats()`, `createRoleOverview()` mit 12 Tests.
- **Role Explorer Grid**: Alle 6 Rollen als Karten mit Icon, Titel, Beschreibung, Anzahl und Cover-Vorschau.
- **Individuelle Empty States**: Pro Rolle ein einladender Text statt generischer Platzhalter.
- **Role Detail View**: Erweiterbare Seite pro Rolle mit Header, Beschreibung, Future-Insights-Platzhalter und Album-Grid.
- **Library View Switcher**: Wechsel zwischen „Alle Alben" und „Nach Rolle".
- **Rollen-Label auf Album Cards**: Dezente, farblich abgestufte Labels pro Rolle (optional via `showRoleLabel`).
- Keine neuen Dependencies. Build und alle 108 Tests gruen.

## v0.12.0-dev

- Sprint 48 fuehrt Cover Management ein.
- Cover werden lokal in IndexedDB gecacht (`coverCache.ts`).
- `AlbumCover`-Komponente laedt Cover nur einmal herunter und nutzt Blob-URLs.
- Offline-Nutzung von Covers moeglich (Fallback auf gecachte Version).
- Robuste Fehlerbehandlung: fehlgeschlagener Download faellt auf Original-URL zurueck.
- `getCachedCover`, `cacheCover`, `hasCachedCover`, `clearCoverCache` als Repository-API.
- Tests fuer CoverCache mit In-Memory-IndexedDB-Mock.

## v0.11.0-dev

- Sprint 47 bereitet die Persistenz vor.
- **Breaking**: `isCurrent` auf Album entfernt – Fokusalbum wird per separatem Key gespeichert.
- HomePage von ~1030 auf ~430 Zeilen refactored durch neue Entity-Hooks.
- `useLibrary()` – Repository-Pattern fuer Alben mit normalisiertem Laden.
- `useRotationPlan()` – Rotation-Plan-State isoliert in eigenem Hook.
- `useListenEvents()` – Hoer-Events mit Legacy-Daten-Migration.
- Aktive Schema-Versionierung (`rotation-schema-version`) mit Migrationsframework.
- Automatische Migration `isCurrent` → Fokusalbum-ID beim ersten Start.
- 9 neue Hook-/Repository-Tests hinzugefuegt (81 Tests gesamt).

## v0.10.2-dev

- Sprint 46.6 und 46.7: Domain Quality und Product Polish.
- **Domain Tests**: Reflection Tests, Rotation Generator Tests, Repository Interfaces.
- **AlbumCover-Komponente**: Fallback-Initialen, deterministische Farbe (`stringToHue`), Lazy Loading und `onError`-Handler.
- Album Cover in `AlbumCard`, `FocusAlbumCard`, `PlayerRotationTile` und `ReplacementCandidate` vereinheitlicht.
- Temporaere ASCII-Schreibweisen (`ae`, `oe`, `ue`) in korrekte Unicode-Umlaute korrigiert.
- Konsistente Begrifflichkeiten: Hoersession/Hoersessions, Fokusalbum, Player-Rotation.
- Dashboard-Reihenfolge: Player-Rotation direkt unter dem Header, vor Fokusalbum und Reflection.
- Mobile Breakpoints fuer Dashboard-Header, Timeline und Player-Rotation verifiziert.

## v0.10.1-dev

- Sprint 46.5 fuehrt den Identity Refresh ein.
- Einfuehrung einer konsistenten Farbpalette (Design System als verbindliche Grundlage).
- Einfuehrung einer typografischen Hierarchie.
- Vereinheitlichung aller Karten, Buttons, Dialoge und Formulare.
- Ruhigeres Spacing, konsistente Schatten und Radien.
- Harmonische Animationen und ueberarbeitete Icons.
- Sprachliche Konsistenz der UI.
- Design Tokens fuer Farben, Abstaende und Typografie.

## v0.10.0-dev

- Sprint 46 fuehrt die Listening History ein.
- `ListenEvent` mit `id`, `albumId`, `listenedAt` modelliert.
- `listenEventStore` mit `load`, `add`, `migrateLegacyListenData` implementiert.
- `LISTEN_EVENTS`-Speicher-Key ergaenzt.
- `listenEvents` als globaler State in `HomePage` eingefuehrt.
- `handleLogListen` schreibt jetzt echte Events.
- Legacy-Daten aus `lastListened` + `listenCount` werden beim ersten Start migriert.
- `createAlbumTimeline()` akzeptiert `listenEvents[]` als zweiten Parameter.
- Album Timeline zeigt jetzt einzelne Hoersessions ("Erste", "Letzte", "Session N").
- `FocusAlbumCard` und `AlbumTimeline` mit `listenEvents` prop verbunden.

## v0.9.0-dev

- Sprint 45 fuehrt Rotation Review ein.
- Rotation-Vorschlag als eigene Dashboard-Sektion.
- Alben aus dem Vorschlag entfernen.
- Ersatzvorschlaege aus derselben Rolle per Inline-Drawer.
- "Mitnehmen"-Button setzt Status auf `active`.
- Draft-Status `draft` mit separatem Speicher-Key.
- Active-Status `active` mit separatem Speicher-Key.
- Tile-Actions: Entfernen (✕) und Ersetzen (↻).
- Ersatz-Logik `findReplacementCandidates()`.
- Dokumentation in `CURATED_ROTATION.md` erweitert.

## v0.8.0-dev

- Sprint 44 fuehrt den Rotation Generator MVP ein.
- Player-Rotation wird als eigene Sektion mit kompakten Album-Tiles sichtbar.
- `generateRotationPlan()` erstellt eine erste Auswahl nach Rollenquoten.
- Aktuelle Player-Rotation wird lokal unter `rotation-current-plan` gespeichert.
- `RotationPlan` enthaelt jetzt konkrete Items mit Auswahlgrund.

## v0.7.0-dev

- Sprint 43 richtet Rotation semantisch als kuratierte Player-Auswahl aus.
- Das alte einzelne aktuelle Album heisst jetzt Fokusalbum.
- `FocusAlbumCard` ersetzt die alte `CurrentRotationCard`.
- Ein erstes `RotationPlan`-Domainmodell bereitet den Generator vor.
- ADR 005 dokumentiert Rotation als kuratierte Player-Auswahl.

## v0.6.1-dev

- Hoersessions koennen direkt auf jeder Album Card erfasst werden.
- Hoeren ist nicht mehr an das aktuell markierte Album gekoppelt.
- Package-Version auf `v0.6.1-dev` angehoben.

## v0.6.0-dev

- Sprint 42 fuehrt Dashboard 2.0 ein.
- Dashboard-Zone auf der HomePage.
- Naechste Frage, Insights, Balance der Sammlung.
- Rotation Dashboard als Balance-Baustein.
- HomePage-Komposition vereinfacht.

## v0.5.0-dev

- Sprint 41 fuehrt Insights ein.
- Insights Panel.
- Discovery Phase, Archiv-Schwerpunkt, Comfort-Food-Schwerpunkt, Klassiker-Kern.
- Aufbauzustand fuer kleine Bibliotheken.
- Sprachliche Erkenntnisse statt Statistik-Dashboard.

## v0.4.2-dev

- Sprint 40.6 fuehrt Library Maintenance ein.
- Album bearbeiten.
- Album endgueltig loeschen.
- Loeschen mit Bestaetigungsdialog.
- Papierkorb-Symbol unten rechts auf Album Cards.
- Stift-Symbol unten links auf Album Cards.
- Klare Trennung zwischen Archivieren und Loeschen.

## v0.4.1-dev

- Sprint 40.5: UI Polish.
- Rotation Card Cover-Skalierung stabilisiert.
- Textueberlauf in der Rotation Card verhindert.
- Rotation-Button mit Kontur, Schatten und Active-State gestaltet.
- Discover Dialog mit besserem Spacing und klarerer Typografie.
- Inputs, Step Indicator und Button States poliert.

## v0.4.0-dev

- Sprint 40 fuehrt die Album Timeline ein.
- Timeline fuer das aktuelle Album.
- Rollenwechsel und letzter Hoermoment als Ereignisse.
- Timeline-Domain aus `roleHistory` und `lastListened`.

## v0.3.0-dev

- Living Rotation Baseline festgelegt.
- Archiv Workflow mit Klassiker-Schutz eingefuehrt.
- Archivierte Alben bleiben in der Bibliothek und koennen als Wiederentdeckung geprueft werden.
- Reflection Engine erkennt Archiv-Rueckkehrkandidaten.
- Role History kennt Archiv-Entscheidungen mit Quelle `archive`.
- Reflection Engine mit ersten Regeln eingefuehrt.
- Reflection Card startet den Album Coach fuer erneute Einordnung.
- Reflection-Ergebnisse werden in der Role History mit Quelle `reflection` gespeichert.
- Bestehende lokale Alben werden beim Laden fuer neue Felder normalisiert.
- Rotation-Dashboard zeigt die Verteilung der Albumrollen.
- Rotation-Regeln definieren empfohlene Obergrenzen fuer aktive Rollen.
- Empfehlungen weisen auf zu volle Rollen hin.
- Aktuelles Album kann als "Heute gehoert" markiert werden.
- Metadaten-Lookup ergaenzt Jahr und Cover.
- Dokumentation an aktuellen Code- und Git-Stand angepasst.

## v0.2.0-dev

- Bibliothek wird aus `localStorage` initialisiert.
- Albumrollen, Album Coach und lokale Sammlung bilden den ersten stabilen Produktkern.

## v0.1.0-alpha

- Bibliotheksraster und Album Cards eingefuehrt.
- Discover-Album-Dialog fertiggestellt.

## v0.1.0-alpha.1

- Erste vollstaendige Dialoginteraktion fuer neue Alben.

## v0.0.1

- React Projekt erstellt

## v0.0.2

- Header
- Button
- Empty State

## v0.0.3

- Projektstruktur erweitert
