# Sprint 74C — Docker & Infrastruktur

**Status:** ✅ Completed

**Parent:** [Sprint 74](./Sprint-74.md)

---

## Goal

Backups work out of the box in Docker without additional volume mounts.

## Decisions

- Backup directory is a subdirectory of the existing `/rotation-data` volume.
- No new Docker volumes or host mounts needed.

## Tasks

- [ ] Verify `docker-compose.yml`: `/rotation-data` is mounted RW → backups go to `/rotation-data/backups`
- [ ] Verify `docker-compose.prod.yml`: same mount semantics
- [ ] Verify `Dockerfile` / `server/Dockerfile`: no changes needed
- [ ] Add env vars to compose files (optional, for discoverability):
  - `ROTATION_BACKUP_ENABLED=true`
  - `ROTATION_BACKUP_CRON=0 3 * * *`
  - `ROTATION_BACKUP_RETENTION_COUNT=7`
- [ ] Ensure backup directory is created by `backupService` if missing (not by Docker init)

## Risks

- User has custom volume mounts → backup dir must still be inside `/rotation-data`
- Backup files grow unbounded if rotation fails → disk full; mitigated by integrity check + log

## Definition of Done

- [ ] `docker compose up` creates backups inside `/rotation-data/backups` without extra config
- [ ] Prod compose file includes backup env vars
- [ ] No new volumes or mounts required
