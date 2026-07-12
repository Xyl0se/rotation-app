# Rotation Self-Hosting Guide

> Rotation runs as a multi-service Docker stack on your NAS or home server.
> The stack consists of a React frontend and a Node.js API.
> Syncthing (not part of this stack) syncs the export folder to your MP3 player.
> All album data, listening history, and bindings live in a SQLite database.
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
- SSH or terminal access to your NAS/server

---

## Quick Start: Synology NAS

### 1. Create directories on the NAS

Log in via SSH or use the Synology Terminal:

```bash
sudo mkdir -p /volume1/rotation-data/exports
sudo mkdir -p /volume1/rotation-data/archive
sudo chown -R 1001:1001 /volume1/rotation-data
```

> **Why UID 1001?** The `rotation-api` container runs as an unprivileged user (`node`, UID 1001). The data directory must be writable by this user.

### 2. Create environment file

```bash
cd /volume1/rotation-data

cat > .env << 'EOF'
ROTATION_WRITE_TOKEN=$(openssl rand -hex 32)
EOF
```

Save the token somewhere safe. It is required for all write operations (scan, export, binding confirmation).

### 3. Download compose file

```bash
curl -O https://raw.githubusercontent.com/Xyl0se/rotation-app/main/docker-compose.prod.yml
```

### 4. Start Rotation

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 5. Open in browser

```
http://<synology-ip>:3000
```

---

## Quick Start: Generic Docker Host

```bash
# 1. Create directories
mkdir -p /opt/rotation-data/exports
mkdir -p /opt/rotation-data/archive

# 2. Set permissions for unprivileged container user
chown -R 1001:1001 /opt/rotation-data

# 3. Create .env
export ROTATION_WRITE_TOKEN=$(openssl rand -hex 32)

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

/volume1/rotation-data/
    data/
        rotation.db         ← SQLite database
    exports/
        current-rotation/   ← Active export (Syncthing source)
    archive/
        2025-07-12T10-30-00/  ← Previous exports
    .staging/
        <export-id>/        ← Temporary staging during export
```

### Volume Mounts

| Host path | Container path | Mode | Purpose |
|-----------|---------------|------|---------|
| `/volume1/music` | `/music` | `ro` | Original music library |
| `/volume1/rotation-data` | `/rotation-data` | `rw` | Database, exports, staging, archive |

---

## Available Commands

| Command | Description |
|---|---|
| `docker compose -f docker-compose.prod.yml up -d` | Start Rotation |
| `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d` | Update to latest version |
| `docker compose -f docker-compose.prod.yml down` | Stop Rotation |
| `docker compose -f docker-compose.prod.yml logs -f rotation-api` | Watch API logs |
| `docker compose -f docker-compose.prod.yml logs -f rotation-web` | Watch web logs |

---

## Healthchecks

| Endpoint | Service | Expected |
|----------|---------|----------|
| `http://localhost:3000/health` | Caddy / Frontend | `ok` |
| `http://localhost:3001/health` | API (internal) | `ok` |

Docker checks these automatically every 30 seconds.

---

## Backup

### Database backup

```bash
# While Rotation is running
docker compose -f docker-compose.prod.yml exec rotation-api \
  cp /rotation-data/data/rotation.db /rotation-data/data/rotation-$(date +%Y%m%d).db.bak
```

### Full data backup

```bash
# Stop Rotation first to ensure consistency
docker compose -f docker-compose.prod.yml down
tar czf rotation-backup-$(date +%Y%m%d).tar.gz /volume1/rotation-data
docker compose -f docker-compose.prod.yml up -d
```

### Restore

```bash
# Stop Rotation
docker compose -f docker-compose.prod.yml down

# Restore database
rm /volume1/rotation-data/data/rotation.db
cp rotation-backup-YYYYMMDD.db.bak /volume1/rotation-data/data/rotation.db

# Restart
docker compose -f docker-compose.prod.yml up -d
```

---

## Syncthing Integration

Rotation does not manage Syncthing. If you already run Syncthing on your Synology,
add the export folder as a shared folder.

### Folder to share

| Path | Description |
|------|-------------|
| `/volume1/rotation-data/exports/current-rotation` | Active export (copied from `/music`) |

### Recommended settings

| Setting | Synology (Source) | MP3 Player (Target) |
|---------|-------------------|---------------------|
| Folder type | Send Only | Receive Only |
| Rescan interval | 60s | 60s |
| Ignore deletes | No | No |

### What happens when an album leaves the rotation?

When you apply a new export, albums that are no longer in the Player Rotation
are removed from `current-rotation/`. Syncthing propagates this deletion to the
MP3 player (unless "Ignore deletes" is enabled on the player side).

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

### Write token

All destructive operations (scan, export, binding confirmation) require the `ROTATION_WRITE_TOKEN` header:

```bash
curl -H "X-Write-Token: <your-token>" \
  http://localhost:3000/api/scan
```

Generate a strong token during setup and keep it secret.

---

## Troubleshooting

### Port 3000 already in use

Edit `docker-compose.prod.yml`:

```yaml
ports:
  - "8080:80"
```

### Permission denied on /rotation-data

The container runs as UID 1001. Ensure the host directory is owned by this user:

```bash
chown -R 1001:1001 /volume1/rotation-data
```

Or on Synology DSM, set the folder permissions via File Station → Properties → Permission.

### SPA routes return 404

This should not happen. Check Caddy is running:

```bash
docker compose exec rotation-web cat /etc/caddy/Caddyfile
```

The line `try_files {path} /index.html` must be present.

### API not reachable

Check that the API container is healthy:

```bash
docker compose -f docker-compose.prod.yml ps
```

Both services should show `healthy`.

### Database locked

SQLite WAL mode is enabled. If the container was force-killed, a `-wal` or `-shm` file may remain. This is normally harmless. Restart the container.

---

## Update Process

```bash
cd /volume1/rotation-data
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Database migrations run automatically on startup. Always back up the database before major version updates.

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
