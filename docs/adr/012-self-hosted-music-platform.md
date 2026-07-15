# ADR 012 — Rotation als selbstgehostete Musikplattform

## Status

Accepted — weitgehend implementiert (Sprints 58–70). Stabilisierungsphase aktiv.

---

## Kontext

Rotation verlässt die reine Browser-Anwendung und wird zu einer selbstgehosteten Musikplattform auf einer Synology DS218+.

Die Anwendung bleibt bewusst kein Musikplayer. Sie beschreibt weiterhin die Beziehung zwischen Mensch und Album. Neu ist: Sie kennt die tatsächliche Musiksammlung, erzeugt aus einer Player Rotation einen Exportordner, und überlässt die Synchronisation Syncthing.

---

## Entscheidungen

### 1. Zwei-Schichten-Architektur: Browser ↔ Server

**Entscheidung:** Ein schlankes Node.js-Backend (Express) ergänzt das React-Frontend. Die Trennung ist nicht funktional, sondern sicherheits- und privilegienbasiert.

| Schicht | Zuständigkeit |
|---------|---------------|
| Browser | Domain-Logik, UI-Zustand, persönliche Daten |
| Server | Dateisystem-Zugriff, SQLite-Persistenz, Export-Engine |

**Begründung:**
- Der Browser kann nicht sicher auf das NAS-Dateisystem zugreifen
- Ein Server-Prozess kann mit privilegierten Mounts arbeiten, während der Browser sandboxed bleibt
- Die bestehende Domain-Architektur bleibt unverändert — der Server ist ein "Feature-Enabler", kein Business-Logic-Container

### 2. REST statt RPC

**Entscheidung:** HTTP-REST mit JSON als Kommunikationsprotokoll zwischen Frontend und Backend.

**Begründung:**
- Einfaches Caching, Debugging, Load-Balancing
- Standard-Tools (curl, Browser-DevTools) funktionieren out-of-the-box
- Keine Code-Generierung nötig
- Typensicherheit wird durch gemeinsame TypeScript-Typen (Shared-Types) auf Frontend-Seite garantiert

**Endpunkte:**
- `GET/POST /bindings` — Album File Binding CRUD
- `POST /scan` — Verzeichnis-Scan mit fuzzy matching
- `POST /exports/preview` — Export-Vorschau
- `POST /exports/stage` — Staging (Dateien kopieren)
- `POST /exports/apply` — Atomares Apply
- `GET /exports/:id/status` — Fortschritt
- `GET /diagnostics` — Systemzustand
- `GET /config` — Laufzeitkonfiguration

### 3. SQLite als erste Datenbank

**Entscheidung:** SQLite für Bindings, Export-Metadaten, Scan-History.

**Begründung:**
- Kein separater Datenbank-Prozess nötig
- Triviale Backups (eine Datei)
- Docker-freundlich
- Später problemlos zu PostgreSQL migrierbar
- WAL-Mode für gleichzeitige Lesezugriffe während Exports

### 4. Album File Binding als eigenständige Domain

**Entscheidung:** Ein Binding verbindet ein Album (per `albumId`) mit einem relativen Pfad im Musikverzeichnis.

```
Binding {
  albumId: string
  relativePath: string     // z.B. "Radiohead/OK Computer"
  state: "proposed" | "confirmed" | "missing"
  createdAt: string
  confirmedAt?: string
}
```

**Begründung:**
- Keine absoluten Pfade in der Datenbank → Portabilität zwischen Umgebungen
- `relativePath` ist relativ zum konfigurierten `/music`-Root
- Drei Zustände: `proposed` (automatisch gefunden), `confirmed` (vom Nutzer bestätigt), `missing` (Verifikation fehlgeschlagen)
- Die Trennung von "Vorschlag" und "Bestätigung" verhindert automatische Fehlzuordnungen

### 5. Export-Engine: Drei-Phasen-Pipeline

**Entscheidung:** Jeder Export durchläuft Preview → Stage → Apply.

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Preview │ →  │  Stage  │ →  │  Apply  │
└─────────┘    └─────────┘    └─────────┘
```

**Phase 1 — Preview:**
- Bindings auflösen
- Gesamtgröße und Dateianzahl berechnen
- Fehlende / unbestätigte Bindings melden
- Diff gegen aktuellen Export berechnen (`added`/`removed`/`unchanged`)

**Phase 2 — Stage:**
- Dateien in `.staging/<exportId>/` kopieren
- Manifest schreiben (Quell-Pfade, Ziel-Pfade, Prüfsummen, Timestamp)
- Fortschritt über SSE oder Polling verfügbar

**Phase 3 — Apply:**
- Export-Lock erwerben (SQLite-basierte Mutual Exclusion, 15-Min-Timeout)
- Vorherigen Export nach `archive/YYYYMMDD-HHMMSS/` verschieben
- Staging-Ordner atomar nach `exports/current-rotation/` umbenennen
- Manifest archivieren

**Begründung:**
- Der Nutzer sieht vor dem Apply exakt, was passieren wird
- Staging ermöglicht Unterbrechung und Wiederaufnahme
- Atomares Apply verhindert inkonsistente Zustände
- Archivierung ermöglicht Rollback

### 6. PathGuard: Sicherheit durch Konstruktion

**Entscheidung:** Alle Dateisystem-Operationen laufen durch einen `PathGuard`, der Pfade relativ zu konfigurierten Root-Verzeichnissen auflöst und Path-Traversal-Angriffe blockiert.

```typescript
// Erlaubt:
musicGuard.resolve("Radiohead/OK Computer")
workspaceGuard.resolve("exports/current-rotation")

// Verweigert:
musicGuard.resolve("../../../etc/passwd")
```

**Begründung:**
- Kein Code-Pfad kann außerhalb der konfigurierten Verzeichnisse operieren
- Symlinks werden abgelehnt
- Der Originalbibliotheks-Mount ist `ro` — selbst bei einem Bypass kann nicht geschrieben werden

### 7. Docker: Read-Only und Read-Write getrennt

**Entscheidung:** Zwei Volume-Mounts mit unterschiedlichen Berechtigungen.

| Host | Container | Modus | Inhalt |
|------|-----------|-------|--------|
| `/volume1/music` | `/music` | `ro` | Originalbibliothek |
| `/volume1/docker/rotation` | `/rotation-data` | `rw` | SQLite, Exports, Staging, Archive |

**Begründung:**
- Die Originalbibliothek kann physisch nicht verändert werden (Kernel-Level `ro`)
- Selbst ein kompromittierter Container-Prozess kann `/music` nicht beschreiben
- `rotation-data` ist der einzige beschreibbare Bereich

### 8. Syncthing: Rotation erzeugt, Syncthing synchronisiert

**Entscheidung:** Rotation steuert Syncthing nicht. Rotation erzeugt lediglich den Export-Ordner. Syncthing wird separat konfiguriert.

**Begründung:**
- Trennung der Verantwortlichkeiten
- Syncthing ist ein etabliertes, robustes Tool — kein Grund, es nachzubauen
- Der Nutzer behält volle Kontrolle über Synchronisationsregeln
- Rotation bleibt fokussiert auf seine Kernaufgabe: die Beziehung zwischen Mensch und Album

### 9. Write-Token: Destruktive Operationen geschützt

**Entscheidung:** Alle schreibenden Operationen (Scan, Export, Binding-Bestätigung) erfordern einen Write-Token-Header.

**Implementation note (Sprint 76.1):** The canonical header name is `X-Rotation-Write-Token`, and protection now covers all mutating API routes.

**Begründung:**
- Selbst wenn jemand unbefugt auf die Rotation-Oberfläche zugreift, können keine Dateien kopiert oder Ordner verändert werden
- Der Token wird beim Docker-Start via Environment-Variable konfiguriert
- Ein zusätzliches Sicherheitsnetz neben PathGuard und ro-Mounts

---

## Konsequenzen

### Positive

- Originalbibliothek ist physisch geschützt (`ro`-Mount + PathGuard)
- Export ist vollständig reversibel (Archivierung + Manifest)
- Crash-Recovery ist möglich (unvollständige Staging-Operationen werden beim Server-Start erkannt und aufgerollt)
- Die Domain-Architektur (Repository Pattern, reine Domain-Logik) bleibt erhalten
- Single-User-Philosophie ist bewahrt — keine komplexe Authentifizierung nötig

### Negative

- SQLite hat Limits bei sehr großen Bibliotheken (>100k Alben) oder hoher Parallelität
- Keine native Echtzeit-Synchronisation (Scan ist manuell/getriggert)
- Export-Engine kopiert Dateien physisch — bei großen Sammlungen zeitintensiv
- Keine de-duplizierung (jedes Album wird vollständig kopiert, auch wenn es in mehreren Rotationen vorkäme)

---

## Offene Architekturfragen (für die Zukunft)

### A. Soll Rotation jemals direkt aus der Originalbibliothek streamen?

**Empfehlung: Nein.** Das würde Rotation zu einem Musikplayer machen und die Philosophie verletzen. Wenn jedoch Cover-Art oder Metadaten-Tag-Lesen gewünscht wird, sollte dies über einen separaten, read-only Metadaten-Service erfolgen.

### B. Sollte der Export von Kopien auf Symlinks umsteigen?

**Empfehlung: Nein.** Symlinks funktionieren nicht zuverlässig über Syncthing und verschiedene Dateisysteme. Kopien sind robust. Eine optionale Hardlink-Optimierung (wenn Quelle und Ziel auf demselben Volume liegen) könnte jedoch Speicherplatz sparen.

### C. Was passiert bei einer Migration von SQLite zu PostgreSQL?

**Empfehlung:** Die Repository-Interfaces im Backend sind bereits abstrahiert. Eine Migration wäre lokalisiert in `infrastructure/persistence/`. Für einen Single-User-Home-Server ist SQLite jedoch auf Jahre hinaus ausreichend.

### D. Sollte Rotation mehrere Musikverzeichnisse unterstützen?

**Empfehlung:** Nicht in naher Zukunft. Die Einfachheit eines einzigen `/music`-Roots ist ein Feature. Falls nötig, könnte der Nutzer Symlinks im Host-Dateisystem verwenden.

### E. Wie skaliert der Scan bei 10.000+ Alben?

**Empfehlung:** Der aktuelle Scan ist synchron und blockierend. Langfristig sollte er asynchron mit einem Worker-Queue (BullMQ, oder einfach ein SQLite-Job-Table) umgebaut werden. Der Nutzer würde dann "Scan gestartet" sehen und später eine Benachrichtigung erhalten.

---

## Abhängigkeiten

- ADR 003 (Local First) — wird modifiziert: Server-Persistenz ergänzt Browser-Persistenz
- ADR 005 (Curated Rotation) — unverändert, wird durch Export-Engine materialisiert
- ADR 010 (Defensive Persistence) — erweitert um PathGuard und Export-Locking

---

## Links

- `docs/SELFHOST.md` — Betriebsanleitung
- `docs/ROADMAP.md` — Sprint-Planung (Sprint 58–70)
- `docker-compose.prod.yml` — Production Deployment
