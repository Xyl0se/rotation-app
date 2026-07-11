# Rotation Self-Hosting

> **Note:** Sprint 58A deploys the pure deployment foundation.
> There is no server-side backend, no database, and no multi-device sync yet.
> All data continues to live in the browser (localStorage / IndexedDB).
> Every browser and every device has its own isolated data set.

---

## Requirements

- Docker + Docker Compose

---

## Quick Start: GHCR Image (recommended)

For headless servers or NAS systems (e.g. Synology, Raspberry Pi):

```bash
# 1. Download docker-compose.prod.yml (only this single file is needed)
curl -O https://raw.githubusercontent.com/Xyl0se/rotation-app/main/docker-compose.prod.yml

# 2. Start container — image is automatically pulled from GitHub Container Registry
docker compose -f docker-compose.prod.yml up -d

# 3. Open in browser
open http://localhost:3000
```

---

## Quick Start: Build Locally

```bash
# 1. Clone repository (or unpack code)
git clone https://github.com/Xyl0se/rotation-app.git
cd rotation-app

# 2. (Optional) Adjust port — edit .env
# 3. Build and start container
docker compose up -d

# 4. Open in browser
open http://localhost:3000
```

---

## Available Commands

| Command | Description |
|---|---|
| `docker compose -f docker-compose.prod.yml up -d` | Start Rotation on server/NAS (GHCR image) |
| `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d` | Update to latest version |
| `docker compose -f docker-compose.prod.yml down` | Stop Rotation |
| `docker compose up -d` | Build and start locally |
| `docker compose down` | Stop locally |
| `docker compose logs -f` | Watch logs live |

---

## Healthcheck

Rotation reports healthy at:

```bash
curl http://localhost:3000/health
# → ok
```

Docker checks this endpoint automatically every 30 seconds.

---

## Data and Persistence

### Important: No server-side storage yet

Sprint 58A only deploys the frontend application as a static SPA.
All data continues to be stored **in the browser**:

- **Albums, Rotation Plans, Stories** → `localStorage`
- **Cover Cache, Custom Covers** → `IndexedDB`

### What this means

- Data is **device-bound**. An album added on a laptop does **not automatically** appear on a phone.
- Data survives browser reloads and tab closings.
- Data is lost when the browser cache is cleared.
- Server restarts or container updates have **no effect** on data.

### Transferring data from local dev server (Safari/macOS)

Safari isolates `localStorage` and `IndexedDB` strictly by **Origin** (hostname + port).
If you previously worked under `http://localhost:5173` (Vite Dev Server)
and now access under `http://localhost:3000` (Docker), Safari treats this as a
**completely separate website** — the data appears empty.

**Solution: Adjust port in Docker container**

1. Edit `.env` and enter the old port:
   ```bash
   ROTATION_PORT=5173
   ```

2. Rebuild and restart container:
   ```bash
   docker compose up -d --build
   ```

3. Now open under `http://localhost:5173` — existing Safari data
   is immediately available.

> **Note:** This only applies as long as Sprint 58A has no server-side
> persistence. From Sprint 58B (SQLite + API) onward, data storage becomes
> independent of the browser port.

### Backup (manual)

Until Sprint 58C (data migration) there is no automatic backup mechanism.
A manual backup is possible via browser developer tools:

1. **Export localStorage:**
   ```js
   copy(JSON.stringify(localStorage))
   ```
   Paste into console, outputs a copyable string.

2. **Export IndexedDB:** Advanced — recommended to wait until 58C.

---

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Client)   │
├─────────────┤
│ localStorage│ ← Albums, Plans, Events
│  IndexedDB  │ ← Cover Cache, Custom Covers
└──────┬──────┘
       │ HTTP
┌──────┴──────┐
│    Caddy    │ ← Static webserver
│   (:3000)   │
├─────────────┤
│  index.html │
│   JS/CSS    │
│   Assets    │
└─────────────┘
```

---

## Troubleshooting

### Port 3000 already in use

Adjust the port in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"
```

### Container does not start

```bash
docker compose logs
```

Check whether the build step fails (TypeScript errors, missing dependencies).

### SPA routes return 404

This should not happen due to Caddy's `try_files`. If it does:

```bash
docker compose exec rotation cat /etc/caddy/Caddyfile
```

The line `try_files {path} /index.html` must be present.

---

## Roadmap

| Sprint | Theme |
|---|---|
| **58A** | ✅ Deployment Foundation |
| **59** | ✅ Home Server Edition — GitHub Container Registry, Auto-Build, Production Compose |
| **60** | ✅ Internationalization (i18n) & Documentation Sprint |
| 61 | Server Persistence (SQLite + REST API) |
| 62 | Data Migration (local → server-side data) |
| 63 | Multi-Device Sync |

---

## Supported Platforms

- Docker Desktop (macOS, Windows, Linux)
- Raspberry Pi (ARM64) — `caddy:2-alpine` and `node:22-alpine` support ARM64
- NAS systems with Docker support (Synology, QNAP, TrueNAS Scale)
- Any mini PC or server capable of running Docker
