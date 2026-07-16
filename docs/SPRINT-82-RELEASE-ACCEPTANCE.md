# Sprint 82 Release Acceptance — v0.29.0-rc.1

Use this document after both immutable images have been published. Record evidence in
place; do not mark an item green based only on local tests.

## Deployment record

| Field | Evidence |
|---|---|
| Date / tester | |
| NAS / DSM / Portainer | |
| Git commit SHA | |
| API image digest | |
| Web image digest | |
| Pre-deploy backup filename | |

## Pre-deploy

- [ ] Create and integrity-check a database backup.
- [ ] Record current API/Web image digests for rollback.
- [ ] Confirm `docker-compose.prod.yml` references `0.29.0-rc.1` for both services.
- [ ] Confirm data, music, and export mounts retain ownership `1026:100`.

## Deploy and migration smoke test

- [ ] Pull both `0.29.0-rc.1` images and redeploy the stack.
- [ ] API becomes healthy without a migration/startup error.
- [ ] `schema_migrations` contains versions 1–11 and `PRAGMA integrity_check` is `ok`.
- [ ] Existing Library, Bindings, Rotation, Focus, Listening Events, settings, history,
      audit records, and prior export linkage remain readable.

## Lifecycle smoke test

- [ ] Create a draft and verify the handover comparison.
- [ ] Accept it; the earlier active Rotation appears read-only in History.
- [ ] Preview, stage, and apply an export; its Rotation link appears in History.
- [ ] Reload the browser and restart both containers; active/draft state remains correct.
- [ ] Change an Album role, inspect the restoration preview, confirm Undo, and verify the
      compensating audit record.
- [ ] Trigger one controlled error (API temporarily unavailable) and verify the UI gives
      a retryable, non-destructive failure state.

## Backup and restore

- [ ] Create a post-lifecycle backup, stop the API, and restore that backup.
- [ ] Verify Rotation history, active/draft state, settings, audit/Undo, Listening Events,
      and export linkage after restart.

## Sprint 81 visual acceptance

- [ ] Desktop: Header, Settings, Home, Bindings, Export, and History are readable and
      navigation remains usable.
- [ ] Narrow viewport (390 px): no horizontal page overflow; dialogs, Settings controls,
      navigation, Rotation cards, and handover/Undo confirmations remain operable.
- [ ] DE and EN: no untranslated operational or Insights text is visible.

## Performance observations

Record cold/warm values against the budgets in `PERFORMANCE-BASELINE.md`:

| Path | Cold | Warm | Pass / evidence |
|---|---:|---:|---|
| Home usable | | | |
| Library filter/page | | | |
| Rotation generation | | | |
| History page | | | |
| Music-folder scan | | | |
| Export preview | | | |

## Rollback boundary

If deployment or migration fails:

1. Stop API and Web; do not repeatedly restart a failing migration.
2. Save the failing API log and current database as evidence.
3. Restore the pre-deploy database backup. A database opened by schema 11 must not be
   used with an older image.
4. Set both Compose images to the recorded previous matching SHA tags.
5. Redeploy and verify `/health`, Library, active Rotation, and export folder contents.

Filesystem export rollback is deliberately separate: restore music delivery from the
existing export archive/recovery workflow; Audit Undo never modifies music files.

## Decision

- [ ] Accepted for stable `v0.29.0`
- [ ] Rejected; blocker and evidence recorded below

Notes:
