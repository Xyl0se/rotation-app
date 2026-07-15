# NAS Redeploy Acceptance Test

**Purpose:** Manual release-gate test for Rotation `v0.26.1-dev` on the existing NAS after the previous local database was intentionally deleted.

**Scenario:** The Portainer stack is stopped. The old SQLite database is no longer available. The stack will be redeployed through the Portainer stack interface and must initialize a clean installation using the existing host directories.

> This procedure proves clean installation, permissions, core workflows, persistence across restart, export behavior, backup, and restore. It cannot prove an in-place upgrade of the deleted `v0.26.0` database. Record that release-gate item as **not executable because the source database was intentionally removed**, not as a successful upgrade.

---

## Test Record

Fill this in before starting:

| Field | Value |
|---|---|
| Date |07/15/2026 |
| Tester |User |
| NAS model / DSM version |DS218+ / DSM 7.3.2-86009 Update 4 |
| Portainer version |2.39.5 LTS |
| Git commit | `a69106f` or newer: |
| API image tag/digest | |
| Web image tag/digest | |
| Data host path | `/volume1/docker/rotation` or: |
| Music host path | `/volume1/music` or: |
| Rotation URL | `http://<nas-ip>:3000` or: |

Final result:

- [ ] Passed
- [ ] Passed with documented observations
- [ ] Failed

---

## 1. Safety and Preconditions

- [ ] The old Portainer stack is stopped.
- [ ] No `rotation-api` or `rotation-web` container from the previous deployment is running.
- [ ] The deleted database is intentionally not required for this test.
- [ ] Any remaining data that must be preserved has been backed up separately.
- [ ] The music library remains present and must not be modified by Rotation.

Check for old containers in Portainer or over SSH:

```bash
docker ps -a --filter name=rotation
```

Expected: no running old Rotation containers. Stopped containers may be replaced by the redeploy.

### Record the initial data-directory state

```bash
sudo find /volume1/docker/rotation -maxdepth 3 -mindepth 1 -print
```

Observed initial contents:

```text

```

---

## 2. Host Permissions

Rotation runs unprivileged as numeric UID/GID `1026:100`.

Prepare the writable host directory:

```bash
sudo mkdir -p /volume1/docker/rotation
sudo chown -R 1026:100 /volume1/docker/rotation
sudo chmod -R u+rwX /volume1/docker/rotation
```

Verify numeric ownership:

```bash
ls -ldn /volume1/docker/rotation
```

Expected owner/group:

```text
1026 100
```

- [ ] Data-directory ownership is `1026:100`.
- [ ] UID 1026 has read/write/execute access to the data directory.
- [ ] The configured music directory exists and is readable.
- [ ] The music mount in the Portainer stack is read-only (`:ro`).

Observed permissions:

```text

```

---

## 3. Portainer Stack Configuration

Before redeploying, verify these environment variables in the stack interface:

```dotenv
ROTATION_HOST_DATA_PATH=/volume1/docker/rotation
ROTATION_HOST_MUSIC_PATH=/volume1/music
ROTATION_WRITE_TOKEN=<long-random-secret>
```

Adjust the paths to the actual NAS locations if necessary.

- [ ] `ROTATION_HOST_DATA_PATH` points to the prepared writable directory.
- [ ] `ROTATION_HOST_MUSIC_PATH` points to the real music library.
- [ ] `ROTATION_WRITE_TOKEN` is present and non-blank.
- [ ] `ROTATION_WRITE_TOKEN` is not `dev-token`.
- [ ] The token is not the literal text `$(openssl rand -hex 32)`.
- [ ] The API image is `ghcr.io/xyl0se/rotation-app-api:latest` or the intended tested SHA tag.
- [ ] The web image is `ghcr.io/xyl0se/rotation-app-web:latest` or the intended tested SHA tag.
- [ ] The API service runs as `1026:100` according to the Compose definition.

For the strongest reproducibility, use the SHA image tags produced for the tested commit instead of `latest` and record them above.

---

## 4. Redeploy Through Portainer

In Portainer:

1. Open **Stacks** → the Rotation stack.
2. Confirm the Compose definition and environment variables.
3. Enable **Re-pull image** if Portainer offers the option.
4. Select **Update the stack** / **Deploy the stack**.
5. Wait until both services have started.

- [ ] Portainer pulled the intended images.
- [ ] `rotation-api` started without a restart loop.
- [ ] `rotation-web` started without a restart loop.
- [ ] Both containers report `healthy`.

Record container image IDs/digests:

```bash
docker inspect rotation-api --format '{{.Image}}'
docker inspect rotation-web --format '{{.Image}}'
```

```text
API:
Web:
```

---

## 5. Startup Logs and Clean Directory Creation

Inspect the API logs:

```bash
docker logs --tail=200 rotation-api
```

The logs must not contain:

- `permission denied`
- `Config validation failed`
- `not readable and writable`
- SQLite migration errors
- an endless restart cycle

- [ ] Configuration validation succeeded.
- [ ] SQLite initialized successfully.
- [ ] Database migrations completed without an error.
- [ ] Backup scheduler initialized as configured.
- [ ] No sensitive write token appears in the logs.

Verify the generated host structure:

```bash
sudo find /volume1/docker/rotation -maxdepth 3 -mindepth 1 -print
```

Expected minimum structure:

```text
/volume1/docker/rotation/data
/volume1/docker/rotation/data/rotation.db
/volume1/docker/rotation/data/backups
/volume1/docker/rotation/data/covers
/volume1/docker/rotation/exports
/volume1/docker/rotation/exports/archive
/volume1/docker/rotation/exports/current-rotation
/volume1/docker/rotation/staging-exports
```

- [ ] `rotation.db` was created.
- [ ] Backup directory was created.
- [ ] Cover directory was created.
- [ ] Staging directory was created.
- [ ] Archive directory was created.
- [ ] Current Rotation export directory was created.
- [ ] Generated writable content is owned by `1026:100`.

Record deviations:

```text

```

---

## 6. HTTP Health Checks

Run from a machine that can reach the NAS:

```bash
curl -fsS http://<nas-ip>:3000/health
curl -fsS http://<nas-ip>:3000/api/health
```

- [ ] Frontend health endpoint returns successfully.
- [ ] API health endpoint returns successfully.
- [ ] Database status is healthy.
- [ ] Music directory is reported readable.
- [ ] Data/workspace directory is reported writable.
- [ ] Syncthing export directory is reported writable.

Paste the API health response:

```json

```

---

## 7. Browser Onboarding and Authentication

Use a new private window or a fresh browser profile so the clean-install behavior is not masked by old browser storage.

- [ ] Rotation loads without a blank page or console crash.
- [ ] The welcome/onboarding page appears.
- [ ] Onboarding can be completed.
- [ ] The initially empty Library is shown correctly.
- [ ] The UI distinguishes a reachable server from offline/cache mode.
- [ ] The production write token can be entered through the application UI.

Authentication negative test:

1. Temporarily enter an incorrect write token.
2. Attempt a write operation such as creating an album.

- [ ] The server rejects the incorrect token.
- [ ] The UI displays a useful error.
- [ ] No unauthorized album is persisted.

Restore the correct token before continuing.

---

## 8. Album and Cover CRUD

Create a clearly identifiable test album, for example:

```text
Title: Rotation NAS Acceptance Test
Artist: Test Artist
Year: 2026
```

- [ ] Album creation succeeds.
- [ ] The album appears in the Library.
- [ ] Reloading the page preserves the album.
- [ ] Editing title/year succeeds and survives another reload.
- [ ] A custom cover upload succeeds.
- [ ] The cover survives a page reload.
- [ ] A server-side cover file and metadata file exist under `data/covers`.

Record the album ID if visible in API responses or logs:

```text

```

Optional API verification:

```bash
curl -fsS http://<nas-ip>:3000/api/albums
```

---

## 9. Scan and Binding

- [ ] Start a music-library scan.
- [ ] Scan progress is visible and completes.
- [ ] No write occurs inside the original music directory.
- [ ] Proposed or existing bindings are displayed.
- [ ] Confirm a proposed binding or manually link one Library album.
- [ ] The confirmed binding remains after a page reload.
- [ ] The Library album shows the expected binding state.

If the deliberately created test album has no real folder, use a real existing album for the binding test.

Record the tested relative music path:

```text

```

---

## 10. Rotation Export and Syncthing Source

Create a Player Rotation containing at least one album with a confirmed binding.

- [ ] Export preview succeeds.
- [ ] Staging succeeds.
- [ ] Apply succeeds.
- [ ] The expected album directory appears under `exports/current-rotation`.
- [ ] The exported files are copies; the original music library remains unchanged.
- [ ] No temporary `next-rotation` directory remains after a successful apply.
- [ ] No unexpected staging directory remains after completion.

Inspect on the NAS:

```bash
sudo find /volume1/docker/rotation/exports/current-rotation -maxdepth 3 -print
sudo find /volume1/docker/rotation/staging-exports -maxdepth 2 -print
```

If Syncthing is configured:

- [ ] Syncthing detects the changed `current-rotation` folder.
- [ ] The target device receives the expected album files.

---

## 11. Manual Backup

Trigger a backup with the configured token:

```bash
curl -fsS \
  -H 'X-Rotation-Write-Token: <your-token>' \
  -X POST \
  http://<nas-ip>:3000/api/backups/run
```

- [ ] The API reports a successful backup.
- [ ] A backup file appears under `data/backups`.
- [ ] The backup file is non-empty.
- [ ] Backup status/history reports the successful run.

Inspect:

```bash
ls -lh /volume1/docker/rotation/data/backups
curl -fsS http://<nas-ip>:3000/api/backups/status
curl -fsS http://<nas-ip>:3000/api/backups/history
```

Record backup filename:

```text

```

---

## 12. Container Restart and Persistence

Restart through Portainer or SSH:

```bash
docker restart rotation-api rotation-web
```

Wait for both containers to become healthy.

- [ ] Both containers become healthy after restart.
- [ ] The test album still exists.
- [ ] The custom cover still loads.
- [ ] The binding remains confirmed.
- [ ] The current export remains present.
- [ ] Backup history remains present.
- [ ] No migration, permission, or recovery error appears in startup logs.

---

## 13. Backup Restore Test

Do not overwrite the only known-good database without retaining a copy.

1. Stop the API container:

```bash
docker stop rotation-api
```

2. Preserve the current database:

```bash
sudo cp \
  /volume1/docker/rotation/data/rotation.db \
  /volume1/docker/rotation/data/rotation-before-restore-test.db
```

3. Select the backup created in section 11 and copy it into place:

```bash
sudo cp \
  /volume1/docker/rotation/data/backups/<backup-file>.db \
  /volume1/docker/rotation/data/rotation.db
sudo chown 1026:100 /volume1/docker/rotation/data/rotation.db
```

4. Start the API again:

```bash
docker start rotation-api
```

- [ ] API becomes healthy after restore.
- [ ] The Library content represented by the backup is present.
- [ ] Bindings represented by the backup are present.
- [ ] No SQLite integrity or migration error appears.

If the restore test fails, stop the API and restore `rotation-before-restore-test.db` before continuing.

---

## 14. Delete Test Data

After the restore test, remove the deliberately created acceptance-test album through the UI.

- [ ] Album deletion succeeds.
- [ ] The deleted album remains absent after reload.
- [ ] Its server cover is removed when applicable.
- [ ] Binding behavior matches the documented lifecycle.
- [ ] A failed server deletion is not silently presented as a successful permanent deletion.

Keep the generated backup until the complete acceptance test is signed off.

---

## 15. Final Log Review

```bash
docker logs --since=60m rotation-api
docker logs --since=60m rotation-web
```

- [ ] No unexpected unhandled exception occurred.
- [ ] No repeated retry/restart storm occurred.
- [ ] No path traversal or permission error occurred.
- [ ] No token or other secret was logged.
- [ ] Expected authentication failures are distinguishable from server faults.

Observations:

```text

```

---

## 16. Sprint 76.1 Release-Gate Mapping

If every applicable section above passes, this document proves:

- Clean documented installation with correct permissions
- UID/GID, paths, token, backup, and healthcheck behavior
- Manual NAS onboarding, album CRUD, cover upload, binding, scan, export, backup, restart, and restore

It does **not** prove:

- Upgrade of the deleted `v0.26.0` data volume
- Legacy import from that deleted database
- The separate obsolete-file/reference audit

Recommended Sprint-document result after a successful run:

```markdown
- [x] A clean documented installation starts successfully with correct permissions.
- [ ] An existing v0.26.0 data volume upgrades without data loss. — Not executable: source database intentionally deleted before acceptance test.
- [x] A manual NAS smoke test covers onboarding, album CRUD, cover upload, binding, scan, export, backup, restart, and restore.
```

Do not mark the upgrade test as passed. Add a dated waiver or follow-up decision if the release is allowed to proceed without reconstructing a representative v0.26.0 fixture.

---

## Sign-off

| Role | Name | Date | Result |
|---|---|---|---|
| Tester | | | |
| Release approval | | | |

Open defects / follow-ups:

```text

```
