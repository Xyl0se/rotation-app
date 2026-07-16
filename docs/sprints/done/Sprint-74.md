# Sprint 74: Backup System

> Defensive Infrastructure — 21 July – 27 July 2026

---

## Overview

Implement a robust, cron-driven backup system for the SQLite database that runs alongside the export pipeline, respects operational locks, and provides both automatic and manual backup triggers.

---

## Sprint Goal

> Make Rotation resilient: database backups happen automatically, can be triggered manually, and never interfere with an active export operation.

---

## Status

| Subsprint | Theme | Status |
|---|---|---|
| 74A | Backup Service Core | ✅ Completed |
| 74B | Export-Lock Integration & Scheduling | ✅ Completed |
| 74C | Docker & Infrastruktur | ✅ Completed |
| 74D | Dokumentation & Restore | ✅ Completed |
| 74E | Tests & Audit | ✅ Completed |

---

## Subsprints

### 74A — Backup Service Core
- [x] `backupService.ts` — create timestamped SQLite DB copies
- [x] `backupService.test.ts` — 13 tests (create, rotate, skip-corrupt, retention, list, metadata)
- [x] `config.ts` — add `ROTATION_BACKUP_ENABLED`, `ROTATION_BACKUP_CRON`, `ROTATION_BACKUP_RETENTION_COUNT`

### 74B — Export-Lock Integration & Scheduling
- [x] `node-cron` dependency installed
- [x] `backupStatusRepository.ts` — tracks backup runs (cron/manual), results, errors
- [x] `backupScheduler.ts` — cron scheduling with export-lock collision avoidance
- [x] `backups.ts` — REST routes: `GET /backups/status`, `POST /backups/run`, `GET /backups/history`, `GET /backups/list`
- [x] `index.ts` — backup system wired into DI graph and startup

### 74C — Docker & Infrastruktur
- [x] `docker-compose.yml` — added backup env vars and `restart: unless-stopped`
- [x] `docker-compose.prod.yml` — same for production stack
- [x] `Dockerfile` — already includes SQLite, no changes needed
- [x] `connection.ts` — verified `ROTATION_DATA_DIR` used for DB path (backups live in `{data_dir}/backups/`)

### 74D — Dokumentation & Restore
- [x] `SELFHOST.md` — updated with automatic backup docs, env vars, manual trigger, restore procedure
- [x] Directory tree shows `backups/` folder
- [x] Removed legacy manual `cp` commands; replaced with API-triggered backup

### 74E — Tests & Audit
- [x] **72/72 tests pass** (9 test files)
- [x] `backupService.test.ts` — 13 tests
- [x] `crashRecovery.test.ts` — 8 tests
- [x] `exportLockRepository.test.ts` — 7 tests
- [x] `scanService.test.ts` — 5 tests
- [x] `exportEngine.test.ts` — 7 tests
- [x] `exportDiff.test.ts` — 4 tests
- [x] `directoryScanner.test.ts` — 8 tests
- [x] `pathGuard.test.ts` — 13 tests
- [x] `albumMatcher.test.ts` — 7 tests
- [x] TypeScript build: zero errors

---

## Decisions

1. **Hourly backups, 24 retention** — covers a full day of hourly snapshots; reasonable default for a personal music database.
2. **Export-lock collision avoidance** — backups skip when an export is active, preventing potential WAL consistency issues.
3. **Backup on same volume** — backups live in `{ROTATION_DATA_DIR}/backups/`, same Docker volume as the DB; user handles off-site backup separately.
4. **Cron, not systemd timer** — simpler Docker-native scheduling; no host dependency.
5. **Restore remains manual** — automated restore from arbitrary points is too risky for a music database; user copies a backup file and restarts the container.

---

## Files Changed

- `server/src/application/backupService.ts` — new
- `server/src/application/backupService.test.ts` — new
- `server/src/application/backupScheduler.ts` — new
- `server/src/infrastructure/persistence/sqlite/backupStatusRepository.ts` — new
- `server/src/routes/backups.ts` — new
- `server/src/index.ts` — modified (backup DI wiring)
- `server/src/application/config.ts` — modified (3 new env vars)
- `docker-compose.yml` — modified (backup env + restart)
- `docker-compose.prod.yml` — modified (backup env + restart)
- `docs/operations/SELFHOST.md` — modified (backup docs)
- `docs/sprints/Sprint-74A.md` through `Sprint-74E.md` — new

---

## Next Sprint

**Sprint 75: Library Maintenance (Phase XI, Foundation)** — clean up orphaned bindings, identify duplicates, repair missing albums. The backup system from Sprint 74 provides the safety net needed for data-modifying maintenance operations.

---

> "The backup system doesn't protect data — it protects the relationship between person and album."
