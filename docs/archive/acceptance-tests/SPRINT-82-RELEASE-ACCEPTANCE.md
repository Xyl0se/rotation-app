# Sprint 82 Release Acceptance — stable v0.29.0

Use this document after both immutable images have been published. Record evidence in
place; do not mark an item green based only on local tests.

## Deployment record

| Field | Evidence |
|---|---|
| Date / tester |07/16/26 User |
| NAS / DSM / Portainer |same as in NAS Acceptance test |
| Git commit SHA | `0b5fcaa` (accepted application build) |
| API image digest |n/a - dont know where to find this information |
| Web image digest |n/a - dont know where to find this information |
| Pre-deploy backup filename |n/a - dont know where to find this information |

## Pre-deploy

- [x] Create and integrity-check a database backup.
- [x] Record current API/Web image digests for rollback.
- [x] Confirm API and Web used matching accepted `latest` images from commit `0b5fcaa`; stable Compose is subsequently pinned to `v0.29.0`.
- [x] Confirm data, music, and export mounts retain ownership `1026:100`.

## Deploy and migration smoke test

- [x] Pull matching accepted API/Web images and redeploy the stack.
- [x] API becomes healthy without a migration/startup error.
- [x] `schema_migrations` contains versions 1–11 and `PRAGMA integrity_check` is `ok`.
- [x] Existing Library, Bindings, Rotation, Focus, Listening Events, settings, history,
      audit records, and prior export linkage remain readable.

## Lifecycle smoke test

- [x] Create a draft and verify the handover comparison. Initial NAS smoke reached the
  comparison successfully; acceptance exposed a nullable lifecycle-payload regression,
  now covered by a load-draft-and-accept route test. The first retest still used the
  immutable pre-fix `v0.29.0-rc.1` images; redeploy verification must use matching
  `latest` images or set `ROTATION_IMAGE_TAG` to the matching fix-build SHA.
- [x] Accept it; the earlier active Rotation appears read-only in History.
- [x] Preview, stage, and apply an export; its Rotation link appears in History.
- [x] Reload the browser and restart both containers; active/draft state remains correct.
- [x] Change an Album role, inspect the restoration preview, confirm Undo, and verify the
      compensating audit record.
- [x] Trigger one controlled error (API temporarily unavailable) and verify the UI gives
      a retryable, non-destructive failure state.

## Backup and restore

- [x] Create a post-lifecycle backup, stop the API, and restore that backup.
- [x] Verify Rotation history, active/draft state, settings, audit/Undo, Listening Events,
      and export linkage after restart.

## Sprint 81 visual acceptance

- [x] Desktop: Header, Settings, Home, Bindings, Export, and History are readable and
      navigation remains usable.
- [x] Narrow viewport (390 px): no horizontal page overflow; dialogs, Settings controls,
      navigation, Rotation cards, and handover/Undo confirmations remain operable.
- [x] DE and EN: no untranslated operational or Insights text is visible.

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
Discover New Album/Album Coach --> now takes a long time to discover album data

### User comment:
It is not possible for me to record these values

Stable-release decision: manual timing capture is explicitly waived because the tester
could not collect reproducible values. This is accepted for the single-user NAS target;
automated representative performance budgets remain green. Slow Discover/Coach metadata
lookup is recorded as a follow-up observation, not a stable-release blocker.

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

- [x] Accepted for stable `v0.29.0`
- [ ] Rejected; blocker and evidence recorded below

Notes:
