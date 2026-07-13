# Sprint 74A — Backup Service Core

**Status:** ✅ Completed

**Parent:** [Sprint 74](./Sprint-74.md)

---

## Goal

The backup service can create, verify, list, rotate, and restore SQLite backups.

## Decisions

- No manual API trigger (out of scope per product decision).
- No backup on server startup.
- Retention: keep 7 files (not 7 days).

## Tasks

- [ ] Extend `server/src/application/config.ts`:
  - `ROTATION_BACKUP_RETENTION_DAYS` → rename to `ROTATION_BACKUP_RETENTION_COUNT` (default: 7)
  - `ROTATION_BACKUP_CRON` (default: `"0 3 * * *"`)
  - `ROTATION_BACKUP_ENABLED` (default: `"true"`)
- [ ] Create `server/src/application/backupService.ts`:
  - `createBackup(dbPath, backupDir)` — WAL checkpoint, copy, integrity_check
  - `listBackups(backupDir)` — sorted chronologically by filename
  - `rotateBackups(backupDir, retentionCount)` — delete oldest beyond retention
  - `restoreBackup(backupPath, dbPath)` — safety checks, copy back
- [ ] Create `server/src/application/backupService.test.ts`:
  - Backup creation succeeds
  - Backup file passes integrity_check
  - Rotation keeps exactly N newest
  - Restore overwrites target
  - Error cases: missing DB, unreadable backup, full disk

## Risks

- `fs.copyFile` on large DBs blocks the event loop → acceptable for nightly cron
- `integrity_check` on large DBs may be slow → run once per backup, not per rotation

## Definition of Done

- [ ] Config validates new env vars
- [ ] `createBackup` produces a `.db` file passing `PRAGMA integrity_check`
- [ ] `rotateBackups` keeps exactly `retentionCount` files
- [ ] `restoreBackup` refuses to overwrite a currently open DB (safety)
- [ ] All functions have unit tests
