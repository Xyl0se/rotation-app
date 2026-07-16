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
- [x] Passed with documented observations
- [ ] Failed

Acceptance approved on 2026-07-16. The intentionally deleted `v0.26.0`
database made the in-place upgrade scenario non-executable; all applicable
clean-install and end-to-end NAS checks passed.

---

## 1. Safety and Preconditions

- [X] The old Portainer stack is stopped.
- [X] No `rotation-api` or `rotation-web` container from the previous deployment is running.
- [X] The deleted database is intentionally not required for this test.
- [X] Any remaining data that must be preserved has been backed up separately.
- [X] The music library remains present and must not be modified by Rotation.

Check for old containers in Portainer or over SSH:

```bash
docker ps -a --filter name=rotation
```

Expected: no running old Rotation containers. Stopped containers may be replaced by the redeploy.
Observed: no running old containers from Rotation.

### Record the initial data-directory state

```bash
sudo find /volume1/docker/rotation -maxdepth 3 -mindepth 1 -print
```

Observed initial contents:

```text
/volume1/docker/rotation/data
/volume1/docker/rotation/data/backups
/volume1/docker/rotation/data/covers
/volume1/docker/rotation/exports
/volume1/docker/rotation/exports/current-rotation
/volume1/docker/rotation/archive
/volume1/docker/rotation/.env
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

- [x] Data-directory ownership is `1026:100`.
- [x] UID 1026 has read/write/execute access to the data directory.
- [x] The configured music directory exists and is readable.
- [x] The music mount in the Portainer stack is read-only (`:ro`).

Observed permissions:

```text
drwxrwxrwx+ 1 1026 100 44 Jul 15 15:27 /volume1/docker/rotation
```

---

## 3. Portainer Stack Configuration

Before redeploying, verify these environment variables in the stack interface:

```dotenv
ROTATION_HOST_DATA_PATH=/volume1/docker/rotation
ROTATION_HOST_MUSIC_PATH=/volume1/music
ROTATION_WRITE_TOKEN=<long-random-internal-proxy-secret>
```

Adjust the paths to the actual NAS locations if necessary.

- [x] `ROTATION_HOST_DATA_PATH` points to the prepared writable directory.
- [x] `ROTATION_HOST_MUSIC_PATH` points to the real music library.
- [x] `ROTATION_WRITE_TOKEN` is present and non-blank.
- [x] `ROTATION_WRITE_TOKEN` is not `dev-token`.
- [x] The token is not the literal text `$(openssl rand -hex 32)`.
- [x] The API image is `ghcr.io/xyl0se/rotation-app-api:latest` or the intended tested SHA tag.
- [x] The web image is `ghcr.io/xyl0se/rotation-app-web:latest` or the intended tested SHA tag.
- [x] The API service runs as `1026:100` according to the Compose definition.

For the strongest reproducibility, use the SHA image tags produced for the tested commit instead of `latest` and record them above.

---

## 4. Redeploy Through Portainer

In Portainer:

1. Open **Stacks** → the Rotation stack.
2. Confirm the Compose definition and environment variables.
3. Enable **Re-pull image** if Portainer offers the option.
4. Select **Update the stack** / **Deploy the stack**.
5. Wait until both services have started.

- [x] Portainer pulled the intended images.
- [x] `rotation-api` started without a restart loop.
- [x] `rotation-web` started without a restart loop.
- [x] Both containers report `healthy`.

Record container image IDs/digests:

```bash
docker inspect rotation-api --format '{{.Image}}'
docker inspect rotation-web --format '{{.Image}}'
```

```text
API: sha256:cac08c873a98fca118b67417bfeb20ac623bf724941e55b1f5433a46a66d364a
Web: sha256:58b20b9cdef61518f1d7bd986e86b712ff7ba519ccf77e6a945c69797fcf6c4f
```

---

## 5. Startup Logs and Clean Directory Creation

Inspect the API logs:

```bash
docker logs --tail=200 rotation-api
```

Result:
[15:44:50.936] INFO  [backup-scheduler] Backup scheduler started {"cronExpression":"0 * * * *"}
[15:44:50.963] INFO  [startup] Rotation API listening {"port":3001}
[15:44:50.963] INFO  [startup] Music path {"path":"/"}
[15:44:50.963] INFO  [startup] Workspace path {"path":"/"}
[15:44:50.964] INFO  [startup] Syncthing root {"path":"/exports/current-rotation"}
[15:44:50.964] INFO  [startup] Backups enabled {"enabled":true,"retention":24,"cron":"0 * * * *"}


The logs must not contain:

- `permission denied`
- `Config validation failed`
- `not readable and writable`
- SQLite migration errors
- an endless restart cycle

- [x] Configuration validation succeeded.
- [x] SQLite initialized successfully.
- [x] Database migrations completed without an error.
- [x] Backup scheduler initialized as configured.
- [x] No sensitive write token appears in the logs.

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

Actual structure:
```text
/volume1/docker/rotation/data
/volume1/docker/rotation/data/backups
/volume1/docker/rotation/data/covers
/volume1/docker/rotation/data/rotation.db
/volume1/docker/rotation/data/rotation.db-wal
/volume1/docker/rotation/data/rotation.db-shm
/volume1/docker/rotation/exports
/volume1/docker/rotation/exports/current-rotation
/volume1/docker/rotation/exports/archive
/volume1/docker/rotation/archive
/volume1/docker/rotation/.env
/volume1/docker/rotation/staging-exports
````


- [x] `rotation.db` was created.
- [x] Backup directory was created.
- [x] Cover directory was created.
- [x] Staging directory was created.
- [x] Archive directory was created.
- [x] Current Rotation export directory was created.
- [x] Generated writable content is owned by `1026:100`.

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

- [x] Frontend health endpoint returns successfully.
- [x] API health endpoint returns successfully.
- [x] Database status is healthy.
- [x] Music directory is reported readable.
- [x] Data/workspace directory is reported writable.
- [x] Syncthing export directory is reported writable.

Paste the API health response:

```json
mreeh@Mac ~ % curl -fsS http://192.168.1.100:3000/health
ok%                                                                             mreeh@Mac ~ % curl -fsS http://192.168.1.100:3000/api/health
{"status":"ok","checks":{"db":{"status":"ok","responseMs":0},"musicReadable":{"status":"ok"},"dataWritable":{"status":"ok"},"syncthingWritable":{"status":"ok"}},"lastScan":{"id":"472de42d-6827-42d5-bcbe-5bb359c2c6b1","status":"completed","finishedAt":"2026-07-15T15:48:46.618Z","albumFoldersFound":26},"metrics":{}}%    mreeh@Mac ~ %
```

---

## 7. Browser Onboarding and Authentication

Use a new private window or a fresh browser profile so the clean-install behavior is not masked by old browser storage.

- [x] Rotation loads without a blank page or console crash.
- [x] The welcome/onboarding page appears.
- [x] Onboarding can be completed.
- [x] The initially empty Library is shown correctly.
- [x] The UI distinguishes a reachable server from offline/cache mode.
- [x] No write-token input or secret is exposed in the application UI or browser storage.

Trusted-proxy authentication test:

1. Perform a write through the normal web URL without browser token setup.
2. Attempt a direct API mutation without the internal token, if the API is temporarily reachable for diagnostics.
3. Send a proxied mutation with a deliberately foreign `Origin` header.

- [x] Same-origin writes through Caddy succeed without browser configuration.
- [x] A direct mutation without the internal token is rejected.
- [x] A cross-site mutation is rejected.
- [x] Clearing browser storage does not affect write access.

Do not expose the internal token to the browser during this test.

---

## 8. Album and Cover CRUD

Create a clearly identifiable test album, for example:

```text
Title: Rotation NAS Acceptance Test
Artist: Test Artist
Year: 2026
```

- [x] Album creation succeeds.
- [x] The album appears in the Library.
- [x] Reloading the page preserves the album.
- [x] Editing title/year succeeds and survives another reload.
- [x] A custom cover upload succeeds.
- [x] The cover survives a page reload.
- [x] A server-side cover file and metadata file exist under `data/covers`.

Record the album ID if visible in API responses or logs:

```text
762afc5e-5408-4d9d-b48a-237874d7ec34
```

Optional API verification:

```bash
curl -fsS http://<nas-ip>:3000/api/albums
```

---

## 9. Scan and Binding

- [x] Start a music-library scan.
- [x] Scan progress is visible and completes.
- [x] No write occurs inside the original music directory.
- [x] Proposed or existing bindings are displayed.
- [x] Confirm a proposed binding or manually link one Library album.
- [x] The confirmed binding remains after a page reload.
- [x] The Library album shows the expected binding state.

If the deliberately created test album has no real folder, use a real existing album for the binding test.

Record the tested relative music path:

```text

```

---

## 10. Rotation Export and Syncthing Source

Create a Player Rotation containing at least one album with a confirmed binding.

- [x] Export preview succeeds.
- [x] Staging succeeds.
- [x] Apply succeeds.
- [x] The expected album directory appears under `exports/current-rotation`.
- [x] The exported files are copies; the original music library remains unchanged.
- [x] No temporary `next-rotation` directory remains after a successful apply.
- [x] No unexpected staging directory remains after completion.

Inspect on the NAS:

```bash
sudo find /volume1/docker/rotation/exports/current-rotation -maxdepth 3 -print
sudo find /volume1/docker/rotation/staging-exports -maxdepth 2 -print
```

If Syncthing is configured:

- [x] Syncthing detects the changed `current-rotation` folder.
- [x] `current-rotation/.stfolder` still exists after applying a replacement export.
- [x] An existing `current-rotation/.stignore` still contains its previous rules.
- [x] The target device receives the expected album files.


---

## 11. Manual Backup

Trigger a backup with the configured token:

```bash
curl -fsS \
  -H 'X-Rotation-Write-Token: <your-token>' \
  -X POST \
  http://<nas-ip>:3000/api/backups/run
```

- [x] The API reports a successful backup.
- [x] A backup file appears under `data/backups`.
- [x] The backup file is non-empty.
- [x] Backup status/history reports the successful run.

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

- [x] Both containers become healthy after restart.
- [x] The test album still exists.
- [x] The custom cover still loads.
- [x] The binding remains confirmed.
- [x] The current export remains present.
- [x] Backup history remains present.
- [x] No migration, permission, or recovery error appears in startup logs.

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

- [x] API becomes healthy after restore.
- [x] The Library content represented by the backup is present.
- [x] Bindings represented by the backup are present.
- [x] No SQLite integrity or migration error appears.

If the restore test fails, stop the API and restore `rotation-before-restore-test.db` before continuing.

---

## 14. Delete Test Data

After the restore test, remove the deliberately created acceptance-test album through the UI.

- [x] Album deletion succeeds.
- [x] The deleted album remains absent after reload.
- [x] Its server cover is removed when applicable.
- [x] Binding behavior matches the documented lifecycle.
- [x] A failed server deletion is not silently presented as a successful permanent deletion.

Keep the generated backup until the complete acceptance test is signed off.

---

## 15. Final Log Review

```bash
docker logs --since=60m rotation-api
docker logs --since=60m rotation-web
```

- [x] No unexpected unhandled exception occurred.
- [x] No repeated retry/restart storm occurred.
- [x] No path traversal or permission error occurred.
- [x] No token or other secret was logged.
- [x] Expected authentication failures are distinguishable from server faults.

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
| Tester | User | 2026-07-15 | Passed with documented observation |
| Release approval | User | 2026-07-16 | Approved for release preparation |

Open defects / follow-ups:

```text
In-place upgrade from v0.26.0 was not executable because the source database
had intentionally been deleted before the acceptance run.
```
