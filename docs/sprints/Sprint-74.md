# Sprint 74 — Data Integrity & Backup

**Status:** Planned

**Target version:** `v0.25.4-dev`

---

## Goal

Data is safe even in catastrophic failures.

## Architecture Changes

- Automatic SQLite backup (e.g. daily to `/rotation-data/backups/`)
- Backup rotation (keep only last 7 days)

## Affected Components

- `initDatabase` — WAL checkpoint before backup
- New `backupService.ts`
- Docker volume for backups (optional)
- `SELFHOST.md` — backup and restore procedures

## Risks

- Backup during running export = inconsistent DB
- Backup file corruption if disk is full

## Definition of Done

- [ ] Daily automatic backup
- [ ] Backup during export is prevented (lock)
- [ ] Restore from backup is documented and tested
- [ ] DB migrations are reversibly documented
- [ ] Backup rotation: only 7 most recent backups kept
- [ ] Backup integrity is verified (SQLite PRAGMA integrity_check)
