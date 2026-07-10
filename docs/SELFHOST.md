# Rotation Self-Hosting

> **Hinweis:** Dies ist Sprint 58A — die reine Deployment-Foundation.
> Es gibt noch kein serverseitiges Backend, keine Datenbank und keinen Multi-Device-Sync.
> Alle Daten leben weiterhin im Browser (localStorage / IndexedDB).
> Jeder Browser und jedes Gerät hat seinen eigenen, isolierten Datenbestand.

---

## Voraussetzungen

- Docker + Docker Compose

---

## Schnellstart: GHCR Image (empfohlen)

Für Headless-Server oder NAS-Systeme (z. B. Synology, Raspberry Pi):

```bash
# 1. docker-compose.prod.yml herunterladen (nur diese eine Datei wird benötigt)
curl -O https://raw.githubusercontent.com/Xyl0se/rotation-app/main/docker-compose.prod.yml

# 2. Container starten — Image wird automatisch von GitHub Container Registry geladen
docker compose -f docker-compose.prod.yml up -d

# 3. Im Browser öffnen
open http://localhost:3000
```

---

## Schnellstart: Lokal bauen

```bash
# 1. Repository klonen (oder Code entpacken)
git clone https://github.com/Xyl0se/rotation-app.git
cd rotation-app

# 2. (Optional) Port anpassen – .env bearbeiten
# 3. Container bauen und starten
docker compose up -d

# 4. Im Browser öffnen
open http://localhost:3000
```

---

## Verfügbare Befehle

| Befehl | Beschreibung |
|---|---|
| `docker compose -f docker-compose.prod.yml up -d` | Rotation auf Server/NAS starten (GHCR Image) |
| `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d` | Update auf neueste Version |
| `docker compose -f docker-compose.prod.yml down` | Rotation stoppen |
| `docker compose up -d` | Lokal bauen und starten |
| `docker compose down` | Lokal stoppen |
| `docker compose logs -f` | Logs live ansehen |

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
| **58A** | ✅ Deployment Foundation |
| **59** | ✅ Home Server Edition — GitHub Container Registry, Auto-Build, Production Compose |
| 60 | Server Persistence (SQLite + REST API) |
| 61 | Datenmigration (lokale → serverseitige Daten) |
| 62 | Multi-Device-Sync |

---

## Unterstützte Plattformen

- Docker Desktop (macOS, Windows, Linux)
- Raspberry Pi (ARM64) — `caddy:2-alpine` und `node:22-alpine` unterstützen ARM64
- NAS-Systeme mit Docker-Support (Synology, QNAP, TrueNAS Scale)
- Jeder Mini-PC oder Server, der Docker ausführen kann
