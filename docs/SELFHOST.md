# Rotation Self-Hosting

> **Hinweis:** Dies ist Sprint 58A — die reine Deployment-Foundation.
> Es gibt noch kein serverseitiges Backend, keine Datenbank und keinen Multi-Device-Sync.
> Alle Daten leben weiterhin im Browser (localStorage / IndexedDB).
> Jeder Browser und jedes Gerät hat seinen eigenen, isolierten Datenbestand.

---

## Voraussetzungen

- [Docker Desktop](https://docs.docker.com/get-docker/)
- Docker Compose (wird mit Docker Desktop mitgeliefert oder separat installiert)

> **macOS mit Homebrew:** Falls `docker compose` nicht erkannt wird:
> ```bash
> brew install docker-compose
> ```
> Anschließend `cliPluginsExtraDirs` in `~/.docker/config.json` hinzufügen:
> ```json
> "cliPluginsExtraDirs": ["/opt/homebrew/lib/docker/cli-plugins"]
> ```

---

## Schnellstart

```bash
# 1. Repository klonen (oder Code entpacken)
cd rotation-app

# 2. (Optional) Port anpassen – falls du vorher unter einem anderen Port gearbeitet hast
# .env bearbeiten und z.B. ROTATION_PORT=5173 setzen

# 3. Container bauen und starten
docker compose up -d

# 4. Im Browser öffnen
open http://localhost:3000
```

Das war's. Rotation läuft jetzt auf dem konfigurierten Port (standardmäßig 3000).

---

## Verfügbare Befehle

| Befehl | Beschreibung |
|---|---|
| `docker compose up -d` | Rotation im Hintergrund starten |
| `docker compose down` | Rotation stoppen |
| `docker compose logs -f` | Logs live ansehen |
| `docker compose pull && docker compose up -d --build` | Neu bauen und starten (nach Update) |

---

## Healthcheck

Rotation meldet sich gesund unter:

```bash
curl http://localhost:3000/health
# → ok
```

Docker prüft diesen Endpunkt automatisch alle 30 Sekunden.

---

## Daten und Persistenz

### Wichtig: Noch kein serverseitiger Speicher

Sprint 58A deployt lediglich die Frontend-Anwendung als statische SPA.
Alle Daten werden weiterhin **im Browser** gespeichert:

- **Alben, Rotation Plans, Stories** → `localStorage`
- **Cover-Cache, Custom Covers** → `IndexedDB`

### Was das bedeutet

- Daten sind **gerätegebunden**. Ein Album, das auf dem Laptop hinzugefügt wird, erscheint **nicht automatisch** auf dem Handy.
- Daten überleben Browser-Reloads und Schließens des Tabs.
- Daten gehen verloren, wenn der Browser-Cache geleert wird.
- Server-Neustarts oder Container-Updates haben **keinen Einfluss** auf die Daten.

### Daten von lokalem Dev-Server übernehmen (Safari/macOS)

Safari isoliert `localStorage` und `IndexedDB` strikt nach **Origin** (Hostname + Port).
Wenn du vorher unter `http://localhost:5173` (Vite Dev Server) gearbeitet hast
und jetzt unter `http://localhost:3000` (Docker) aufrufst, sieht Safari das als
**völlig getrennte Website** – die Daten erscheinen leer.

**Lösung: Port im Docker-Container anpassen**

1. `.env` bearbeiten und den alten Port eintragen:
   ```bash
   ROTATION_PORT=5173
   ```

2. Container neu bauen und starten:
   ```bash
   docker compose up -d --build
   ```

3. Jetzt unter `http://localhost:5173` öffnen – die vorhandenen Safari-Daten
   sind sofort verfügbar.

> **Hinweis:** Das gilt nur, solange Sprint 58A keine serverseitige
> Persistenz hat. Ab Sprint 58B (SQLite + API) wird die Datenhaltung
> unabhängig vom Browser-Port.

### Backup (manuell)

Bis Sprint 58C (Datenmigration) gibt es keinen automatischen Backup-Mechanismus.
Ein manuelles Backup ist über den Browser-Entwicklertools möglich:

1. **localStorage exportieren:**
   ```js
   copy(JSON.stringify(localStorage))
   ```
   In die Konsole einfügen, gibt einen kopierbaren String aus.

2. **IndexedDB exportieren:** Erweitert — empfohlen, bis 58C zu warten.

---

## Architektur

```
┌─────────────┐
│   Browser   │
│  (Client)   │
├─────────────┤
│ localStorage│ ← Alben, Pläne, Events
│  IndexedDB  │ ← Cover-Cache, Custom Covers
└──────┬──────┘
       │ HTTP
┌──────┴──────┐
│    Caddy    │ ← Statischer Webserver
│   (:3000)   │
├─────────────┤
│  index.html │
│   JS/CSS    │
│   Assets    │
└─────────────┘
```

---

## Troubleshooting

### Port 3000 ist bereits belegt

In `docker-compose.yml` den Port anpassen:

```yaml
ports:
  - "8080:80"
```

### Container startet nicht

```bash
docker compose logs
```

Prüfen, ob der Build-Schritt fehlschlägt (TypeScript-Fehler, fehlende Dependencies).

### SPA-Routes geben 404

Dies sollte durch Caddy's `try_files` nicht passieren. Falls doch:

```bash
docker compose exec rotation cat /etc/caddy/Caddyfile
```

Die Zeile `try_files {path} /index.html` muss vorhanden sein.

---

## Roadmap

| Sprint | Thema |
|---|---|
| **58A** | ✅ Deployment Foundation (dieser Stand) |
| 58B | Server Persistence (SQLite + REST API) |
| 58C | Datenmigration (lokale → serverseitige Daten) |
| 58D | Home Server Edition (Backups, Export/Import) |

---

## Unterstützte Plattformen

- Docker Desktop (macOS, Windows, Linux)
- Raspberry Pi (ARM64) — `caddy:2-alpine` und `node:22-alpine` unterstützen ARM64
- NAS-Systeme mit Docker-Support (Synology, QNAP, TrueNAS Scale)
- Jeder Mini-PC oder Server, der Docker ausführen kann
