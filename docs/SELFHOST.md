# Rotation Self-Hosting Guide

> Rotation runs as a multi-service Docker stack on your NAS or home server.
> The stack consists of a React frontend and a Node.js API.
> Syncthing (not part of this stack) syncs the export folder to your MP3 player.
> The Album Library and bindings live in SQLite; server cover files live in the data directory. Listening History, RotationPlan, and Focus Album remain browser-local until their dedicated server migration.
> The original music library is **never modified** — it is mounted read-only.

---

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
┌──────┴──────┐
│   Caddy     │ ← Reverse Proxy (:3000)
│             │
│  / → SPA    │
│  /api/* →   │ → rotation-api:3001
│  /health    │
└──────┬──────┘
       │
┌──────┴──────┐
│ rotation-api│ ← Node + Express + SQLite
│   (:3001)   │
├─────────────┤
│ /music:ro   │ ← Original library (read-only)
│ /rotation-  │ ← SQLite, exports, staging, archive
│   data:rw   │
└─────────────┘
```

---

## Requirements

- Docker + Docker Compose
- ~500 MB RAM (tested on Synology DS218+ with 2 GB)
- [Portainer](https://docs.portainer.io/) installed on your NAS/server (recommended)
- SSH or terminal access for initial directory setup

---

## Setup via Portainer (Recommended)

This is the recommended deployment method. Portainer pulls the compose file directly from GitHub and can automatically redeploy on updates.

### 1. Create directories on the NAS

Log in via SSH or use the Synology Terminal:

```bash
sudo mkdir -p /volume1/docker/rotation
sudo chown -R 1026:100 /volume1/docker/rotation
```

Rotation runs unprivileged as numeric UID/GID `1026:100`. This identity is required by the supported Synology volume setup and is also used by the container image. The host data directory must have matching ownership.

### 2. Generate the internal proxy token

The token protects direct API mutations inside the Docker network. Caddy injects
it automatically; it is never entered into or stored by the browser.

```bash
openssl rand -hex 32
```

Save the token as Portainer stack configuration. Users do not need to know it.

### 3. Create the stack in Portainer

1. Open Portainer → **Stacks** → **Add stack**
2. Under **Build method**, select **Git repository**
3. Fill in the following:

   | Field | Value |
   |-------|-------|
   | Name | `rotation` |
   | Repository URL | `https://github.com/Xyl0se/rotation-app` |
   | Repository reference | `refs/heads/main` |
   | Compose path | `docker-compose.prod.yml` |
   | Automatic updates | ✅ Enable |
   | Mechanism | Webhook (recommended) or Polling |
   | Fetch interval | `5m` (if using Polling) |

4. Under **Environment variables**, add:

   | Variable | Value |
   |----------|-------|
   | `ROTATION_WRITE_TOKEN` | `<paste-your-token-here>` |
   | `ROTATION_HOST_DATA_PATH` | `/volume1/docker/rotation` |
   | `ROTATION_HOST_MUSIC_PATH` | `/volume1/music` (or the actual absolute music path) |
   | `ROTATION_BACKUP_ENABLED` | `true` (optional) |
   | `ROTATION_BACKUP_CRON` | `0 * * * *` (optional, default: hourly) |
   | `ROTATION_BACKUP_RETENTION_COUNT` | `24` (optional, default: 24 backups) |
   | `ROTATION_CORS_ORIGINS` | Comma-separated direct API origins (optional; empty for normal Caddy deployment) |

5. Click **Deploy the stack**

Portainer will pull the images from GitHub Container Registry and start both services.

### 4. Open in browser

```
http://<synology-ip>:3000
```

### 5. Automatic updates

With Git repository mode enabled, Portainer monitors the repository. When a new version of `docker-compose.prod.yml` is pushed to `main`, Portainer can automatically redeploy the stack.

- **Webhook**: Copy the webhook URL from the stack settings and add it to your GitHub repository as a push webhook. This triggers an immediate redeploy on every push.
- **Polling**: Portainer checks the repository at the configured interval and redeploys if the compose file changed.

---

## Setup via Docker Compose (Alternative)

If you prefer not to use Portainer, you can deploy directly via SSH.

### 1. Create directories

```bash
sudo mkdir -p /volume1/docker/rotation
sudo chown -R 1026:100 /volume1/docker/rotation
```

### 2. Create environment file

```bash
cd /volume1/docker/rotation

token="$(openssl rand -hex 32)"
printf '%s\n' \
  "ROTATION_WRITE_TOKEN=$token" \
  "ROTATION_HOST_DATA_PATH=/volume1/docker/rotation" \
  "ROTATION_HOST_MUSIC_PATH=/volume1/music" > .env
```

### 3. Download compose file

```bash
curl -O https://raw.githubusercontent.com/Xyl0se/rotation-app/main/docker-compose.prod.yml
```

### 4. Start Rotation

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 5. Update

```bash
cd /volume1/docker/rotation
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## Setup: Generic Docker Host

```bash
# 1. Create directories
sudo mkdir -p /opt/rotation

# 2. Set permissions for unprivileged container user
sudo chown -R 1026:100 /opt/rotation

# 3. Create .env
token="$(openssl rand -hex 32)"
printf '%s\n' \
  "ROTATION_WRITE_TOKEN=$token" \
  "ROTATION_HOST_DATA_PATH=/opt/rotation" \
  "ROTATION_HOST_MUSIC_PATH=/absolute/path/to/music" > .env

# 4. Download and start
curl -O https://raw.githubusercontent.com/Xyl0se/rotation-app/main/docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

---

## Directory Structure

### On the host (Synology)

```
/volume1/music/
    Artist/
        Album/
            ...audio files

/volume1/docker/rotation/
    data/
        rotation.db         ← SQLite database
        backups/
            rotation-2026-07-13T20-00-00.db  ← Automatic hourly backups
        covers/
            <album-id>      ← Album cover image
            <album-id>.json ← Cover metadata
    exports/
        current-rotation/   ← Active export (Syncthing source)
        archive/
            2025-07-12T10-30-00/  ← Previous exports
    staging-exports/
        <export-id>/        ← Temporary staging during export
```

### Volume Mounts

| Host path | Container path | Mode | Purpose |
|-----------|---------------|------|---------|
| `${ROTATION_HOST_MUSIC_PATH}` | `/music` | `ro` | Original music library |
| `${ROTATION_HOST_DATA_PATH}` | `/rotation-data` | `rw` | Database, covers, backups, exports, staging, archive |

---

## Update Process

### Via Portainer (Recommended)

1. Open Portainer → **Stacks** → `rotation`
2. Click **Pull and redeploy**
3. Portainer pulls the latest images and restarts the stack

Or, if automatic updates are enabled, the stack redeploys automatically when `docker-compose.prod.yml` changes on `main`.

### Via Docker Compose

```bash
cd /volume1/docker/rotation
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Database migrations run automatically on startup. Always back up the database before major version updates.

---

## Healthchecks

| Endpoint | Service | Expected |
|----------|---------|----------|
| `http://localhost:3000/health` | Caddy / Frontend | `ok` |
| `http://localhost:3000/api/health` | API through Caddy | JSON with `status` |

Docker checks these automatically every 30 seconds.

---

## Backup

### Automatic backups (recommended)

Rotation automatically backs up the SQLite database every hour by default. Backups are stored in `/rotation-data/data/backups/` and older backups are automatically rotated (default: keep 24).

| Setting | Environment Variable | Default |
|---------|---------------------|---------|
| Enabled | `ROTATION_BACKUP_ENABLED` | `true` |
| Schedule | `ROTATION_BACKUP_CRON` | `0 * * * *` (hourly) |
| Retention | `ROTATION_BACKUP_RETENTION_COUNT` | `24` |

> **Note:** Backups are skipped if an export operation is in progress, to avoid copying the database during active transactions.

### Manual backup trigger

```bash
curl -H "X-Rotation-Write-Token: <your-token>" \
  -X POST http://localhost:3000/api/backups/run
```

### Check backup status

```bash
curl http://localhost:3000/api/backups/status
```

### Full data backup

A full server backup covers SQLite, server covers, exports, and operational files. It does not currently include browser-local Listening History, RotationPlan, or Focus Album; use the in-app browser backup for those values until their server migration is implemented.

```bash
# Stop Rotation first to ensure consistency
docker stop rotation-api rotation-web
tar czf rotation-backup-$(date +%Y%m%d).tar.gz "${ROTATION_HOST_DATA_PATH:-/volume1/docker/rotation}"
docker start rotation-api rotation-web
```

### Restore from backup

```bash
# Stop Rotation
docker stop rotation-api rotation-web

# Restore from the most recent automatic backup
data_root="${ROTATION_HOST_DATA_PATH:-/volume1/docker/rotation}"
latest=$(ls -t "$data_root"/data/backups/rotation-*.db | head -1)
cp "$latest" "$data_root/data/rotation.db"

# Restart
docker start rotation-api rotation-web
```

---

## Syncthing Integration

Rotation does not manage Syncthing. If you already run Syncthing on your Synology, add the export folder as a shared folder.

### Folder to share

| Path | Description |
|------|-------------|
| `${ROTATION_HOST_DATA_PATH}/exports/current-rotation` | Active export (copied from `/music`) |

### Recommended settings

| Setting | Synology (Source) | MP3 Player (Target) |
|---------|-------------------|---------------------|
| Folder type | Send Only | Receive Only |
| Rescan interval | 60s | 60s |
| Ignore deletes | No | No |

### What happens when an album leaves the rotation?

When you apply a new export, albums that are no longer in the Player Rotation are removed from `current-rotation/`. Syncthing propagates this deletion to the MP3 player (unless "Ignore deletes" is enabled on the player side).

If you want to keep removed albums on the player, either:
- Enable "Ignore deletes" on the player folder (Receive Only + Ignore deletes)
- Use the `keepRemoved` option during export apply (not yet exposed in UI)

> **Note:** Rotation manages the `current-rotation/` folder contents. Syncthing propagates those changes. Rotation does not control Syncthing.

---

## Security

### What Rotation can do

- Read from `/music` (read-only mount)
- Write to `/rotation-data` (exports, staging, archive, SQLite)
- Accept API requests proxied through Caddy

### What Rotation cannot do

- Modify your original music library
- Access arbitrary paths outside the configured roots
- Run as root inside the container

### Trusted proxy write boundary

Normal browser and same-origin API use goes through Caddy and requires no token setup:

```bash
curl -X POST http://localhost:3000/api/scan
```

The web container overwrites and injects the internal header before proxying to
the private API container. Direct API mutations still require the secret. The API
also rejects cross-site browser mutations by `Origin` and Fetch Metadata headers.

The `dev-token` fallback exists only in `docker-compose.yml` for an isolated local development stack. `docker-compose.prod.yml` has no default and provides the configured secret to both Caddy and API. Never use `dev-token` in a deployed instance.

---

## Troubleshooting

### Port 3000 already in use

Edit the compose file in your fork or use Portainer's **Editor** tab to change:

```yaml
ports:
  - "8080:80"
```

Then redeploy.

### Permission denied on /rotation-data

The container runs as `1026:100`. Ensure the host directory has the same numeric owner:

```bash
chown -R 1026:100 "${ROTATION_HOST_DATA_PATH:-/volume1/docker/rotation}"
```

Or on Synology DSM, set the folder permissions via File Station → Properties → Permission.

### SPA routes return 404

Check Caddy is running. In Portainer, go to **Containers** → `rotation-web` → **Logs**.

Or via SSH:
```bash
docker exec rotation-web cat /etc/caddy/Caddyfile
```

The line `try_files {path} /index.html` must be present.

### API not reachable

Check that the API container is healthy. In Portainer, go to **Containers** and verify `rotation-api` shows `healthy`.

Or via SSH:
```bash
docker ps
```

Both services should show `healthy`.

### Database locked

SQLite WAL mode is enabled. If the container was force-killed, a `-wal` or `-shm` file may remain. This is normally harmless. Restart the container.

### Logs are too verbose or too quiet

Rotation supports two environment variables for log control:

| Variable | Values | Default |
|----------|--------|---------|
| `ROTATION_LOG_LEVEL` | `trace`, `debug`, `info`, `warn`, `error`, `silent` | `info` |
| `ROTATION_LOG_FORMAT` | `pretty` (human-readable), `json` (machine-readable) | `pretty` |

Add them to the compose file or in Portainer:

```yaml
environment:
  - ROTATION_LOG_LEVEL=debug
  - ROTATION_LOG_FORMAT=pretty
```

### Log files are growing too large

Docker Compose log rotation is already configured in the provided compose files (max 10 MB, 5–10 files kept). If you need to clean up manually:

```bash
# Truncate logs for the API container
docker exec rotation-api sh -c "> /proc/1/fd/1"

# Or limit at Docker daemon level (optional)
docker system prune --volumes
```

### Healthcheck shows `degraded`

The `/health` endpoint returns detailed checks. Query it directly:

```bash
curl -s http://localhost:3000/api/health | jq .
```

You will see:

- `db` — SQLite query response time
- `musicReadable` — whether `/music` is accessible
- `dataWritable` — whether `/rotation-data` is writable
- `syncthingWritable` — whether the Syncthing export path is writable
- `lastScan` — ID, status, and finish time of the most recent scan
- `metrics` — basic counters (requests, errors, exports applied)

If any check shows `"status": "fail"`, inspect the `detail` field.

### How to read logs

```bash
# Follow API logs in real time
docker compose -f docker-compose.prod.yml logs -f rotation-api

# View the last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 rotation-api

# Filter for errors only
docker compose -f docker-compose.prod.yml logs -f rotation-api | grep "ERROR"
```

JSON format (`ROTATION_LOG_FORMAT=json`) is useful for log aggregation systems (e.g., Loki, ELK).

---

## Roadmap

| Sprint | Status | Theme |
|---|---|---|
| **58A** | ✅ | Deployment Foundation |
| **58B–D** | ✅ | Server Persistence, Migration, Home Server |
| **59** | ✅ | Story-driven Insights |
| **60** | ✅ | Internationalization & Documentation |
| **61** | ✅ | Search & Discovery |
| **62** | ✅ | Album File Binding & Rotation Export |
| **67** | ✅ | Production Deployment Foundation (this guide) |
| **68A** | ✅ | Binding Verification, Export Preview & Apply |
| **68B** | ⏳ | Fuzzy Matching (backlog) |
| **69A** | ✅ | Export Preview & Staging |
| **69B** | ✅ | Export Apply Hardening |
| **69C** | ✅ | Crash Recovery & Rollback |
| **70** | 🔄 | Operations & Deployment Polish |

---

## Supported Platforms

- Docker Desktop (macOS, Windows, Linux)
- Raspberry Pi (ARM64)
- Synology NAS (DSM 7+, Docker package)
- QNAP, TrueNAS Scale, and other NAS systems with Docker
- Any mini PC or home server capable of running Docker

---

> Rotation is not a tool for managing a music collection.
> Rotation accompanies the relationship between person and album.
