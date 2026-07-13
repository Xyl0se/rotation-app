# Sprint 74D — Dokumentation & Restore

**Status:** ✅ Completed

**Parent:** [Sprint 74](./Sprint-74.md)

---

## Goal

Users can restore from backup and understand the backup behavior.

## Tasks

- [ ] Update `docs/SELFHOST.md`:
  - Automatic backups section: daily at 3 AM, 7 files kept
  - Backup location: `/rotation-data/backups/rotation-YYYYMMDD-HHMMSS.db`
  - Restore procedure: stop container → copy backup → start container
  - Migration note: forward migrations run automatically; downgrades are manual
- [ ] Update `docs/CHANGELOG.md` with Sprint 74 features
- [ ] Update `docs/ROADMAP.md` — mark Sprint 74 as In Progress / Done

## Risks

- Users may confuse backup file with live DB → clear naming convention helps
- Restore instructions must not encourage running multiple instances → emphasize stop/start

## Definition of Done

- [ ] `SELFHOST.md` explains automatic backups and restore
- [ ] `CHANGELOG.md` lists Sprint 74 changes
- [ ] `ROADMAP.md` reflects current sprint status
