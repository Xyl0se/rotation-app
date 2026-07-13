# Sprint 74B — Export-Lock-Integration & Scheduling

**Status:** ✅ Completed

**Parent:** [Sprint 74](./Sprint-74.md)

---

## Goal

Backups run automatically on a schedule and respect the export lock.

## Decisions

- No API endpoint for manual trigger.
- If export lock is active, skip the backup and log it.
- Cron starts after server init; stops on SIGTERM.

## Tasks

- [ ] Install `node-cron` in `server/package.json`
- [ ] Wire `backupService` into `server/src/index.ts`:
  - Instantiate after `db`, `exportRepo`, `lockRepo`
  - Start cron if `ROTATION_BACKUP_ENABLED === "true"`
  - Cron expression from config
- [ ] Pre-backup check:
  - Query `exportLockRepository.getCurrent()`
  - If lock active and not expired → skip backup, log "Backup skipped: export in progress"
- [ ] Post-backup:
  - Log result (success / failed / skipped)
  - Run rotation
- [ ] Graceful shutdown:
  - Store cron job reference
  - On `process.on("SIGTERM")` → stop cron, then close server

## Risks

- Cron firing during integration tests → mock or disable via env in test mode
- SIGTERM handler conflicts with existing cleanup → test shutdown sequence

## Definition of Done

- [ ] Cron fires at configured interval
- [ ] Backup is skipped when export lock is active
- [ ] Success/failure/skip is logged
- [ ] Rotation runs after each successful backup
- [ ] Cron stops cleanly on SIGTERM
