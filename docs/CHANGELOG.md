# Changelog

## v0.19.0-dev

- **Sprint 58 — Backup & Portabilität**
  - **Backup Domain-Logik**: `createBackup()`, `downloadBackup()`, `validateBackup()`, `restoreBackup()` in `src/domain/backup/backup.ts`.
  - **BackupControls Komponente**: Export- und Import-Buttons unterhalb der Library. Export lädt alle `rotation-*` localStorage-Daten als JSON herunter. Import lädt eine Backup-Datei, validiert Schema-Version und Export-Datum, und überschreibt bestehende Daten nach expliziter Bestätigung.
  - **Warn-Dialog beim Import**: Klare Warnung, dass bestehende Daten überschrieben werden. Nach erfolgreichem Import wird die Seite neu geladen.
  - **README aktualisiert**: `npm run dev` entfernt, Docker-Compose als Startbefehl dokumentiert.
  - Kein Schema-Bump. TypeScript-frei, keine neuen Dependencies. Alle 244 Tests grün.

## v0.18.0-dev

- **Sprint 57 — Klassiker- und Archivlogik überarbeitet**
  - **Neuer Album Coach Entscheidungsbaum**: Vollständig deterministisch, acht mögliche Fragen, kein acht Fragen langer Pflichtpfad.
    - `heardThreeTimes === false` → `new`
    - `wouldMissAlbum === false` → `archive`
    - Aktiver Zweig (`stillReturningConsciously === true`): `shapedTasteLongterm === true` → `classic` (Vorrang vor `comfort-food` und `growing`)
    - Ruhender Zweig: `musicallyValued === true` → `admire`; sonst → `archive`
  - **Neue Fragen**: `stillReturningConsciously`, `shapedTasteLongterm`, `musicallyValued`, `memoryOfEarlierPhase` ersetzen `wouldRecommend` und `stillListeningRegularly`.
  - **Partielle Antworten**: `AlbumCoachAnswers = Partial<AlbumCoachAnswerValues>`. Fehlende Antworten werden nicht als `false` interpretiert.
  - **Rollendefinitionen präzisiert**: `classic` = dauerhaft prägend; `admire` = musikalisch geschätzt ohne selbstverständliche Nähe; `archive` = darf ruhen, ohne aus der Geschichte zu verschwinden.
  - **Archivschutz neu**: `wouldRecommend` entfernt. Stattdessen `hasBiographicPlace` als primäres Schutzsignal — persönliche Klassiker können aktuell ruhen und bleiben trotzdem geschützt.
  - **Kein Schema-Bump, keine leere Migration**: Coach-Antworten werden nicht persistiert.
  - Alle 244 Tests grün, TypeScript-Compile sauber.

## v0.17.0-dev

- **Sprint 55 — Album Story Foundation**
  - **AlbumStory Domainmodell**: `AlbumAcquisitionReason`, `AlbumLifePhase`, `AlbumStory` mit optionalen Feldern (Herkunftsgrund, Lebensphase, persönliche Notiz).
  - **Album-Modell erweitert**: `story?: AlbumStory`, defensiv normalisiert in `albumRepository.ts`.
  - **EditAlbumDialog — Story Editor**: Neue Sektion „Albumgeschichte" mit Auswahl für Herkunftsgrund und Lebensphase, optionaler Freitext-Notiz.
  - **FocusAlbumCard — Story Anzeige**: Kompakte Darstellung der Album Story mit Badges (Herkunft, Lebensphase) und persönlicher Notiz als Zitat.
  - **Timeline-Integration**: `createAlbumTimeline()` zeigt Story-Erzeugung und -Aktualisierung als Timeline-Events.
  - Keine Pflichtfelder, keine Bewertung, keine Statistiken. UI-Sprache folgt dem Musikjournal-Gedanken.

- **Sprint 56 — Explainable Rotation**
  - **`explainRotationItem()` Domainfunktion**: Erklärt, warum ein Album Teil der aktiven Player-Rotation ist — basierend auf Rolle, Hörhistorie, Role History und Rotation-Plan-Auswahlgrund.
  - **`RotationTileTooltip`-Komponente**: Hover-gesteuertes Popover über dem Album-Cover jedes Rotation-Tiles. Zeigt Album-Header, Rolle, Begründung, Hörstatistiken und eine kompakte Timeline.
  - **Player-Rotation Tiles entlastet**: Statische Explanation aus den Tiles entfernt; die Kacheln zeigen jetzt nur noch Titel, Künstler und Rolle.
  - **CSS für Tooltip**: Neue Klassen `.rotation-tooltip-wrapper`, `.rotation-tooltip`, `.rotation-tooltip-header`, `.rotation-tooltip-role`, `.rotation-tooltip-explanation`, `.rotation-tooltip-stats`, `.rotation-tooltip-timeline` in `cards.css`.
  - TypeScript-frei, keine neuen Dependencies. Alle 228 Tests grün.

## v0.16.0-dev

- **Dashboard vereinfacht**: Balance-Sektion und Limit-Texte entfernt. RotationDashboard zeigt jetzt nur noch die neutrale `RotationOverview` ohne Empfehlungen.
- **RotationRecommendations entfernt**: Komplette Komponente entfernt. Rotation soll informieren, nicht bewerten.
- **Alte Balance-/Limit-Domänenlogik @deprecated**: `rotationRules`, `evaluateRotation`, `recommendRotation`, `summarizeRotationBalance` und `rotationMessages` als veraltet markiert.
- **Bibliothekskarten horizontaler**: `AlbumCard` zeigt jetzt Cover links, Meta + Hörsession-Button Mitte, Tool-Buttons rechts als vertikale Toolbar.
- **Library Grid 2-Spalten**: Album Cards nutzen halbe Breite pro Karte, zwei nebeneinander auf Desktop (Responsive: einspaltig unter 700 px).
- **Fokusbutton**: Tooltips konsistent auf "Fokus setzen" (AlbumCards und Toolbar).
- **Toolbar**: Neuer Button "Neues Fokusalbum vorschlagen" (Secondary) neben "Neues Album entdecken" — wählt zufällig ein nicht-archiviertes Album als neues Fokusalbum aus.
- **Micro UX**: Aria-Labels für Hörsession-Buttons verbessert, Rotation-Tile Remove-Button mit "Aus der Rotation entfernen", Player-Rotation Beschreibungen entschärft.
- **Toolbar-Icons vereinheitlicht**: Fokus-Button zeigt ★/☆ statt 🎯, Archiv-Button zeigt ⬇/↩ statt Text, Löschen-Button zeigt ✕ statt 🗑. Keine Emojis mehr in der Toolbar.
- **Role-Label auf Textbreite**: `.album-role-label` nur so breit wie der Text (nicht volle Kartenbreite).
- TypeScript-frei, keine neuen Dependencies. Alle 204 Tests grün.

## v0.15.0-dev

- Sprint 51 fuehrt den Cover Editor ein.
- **Cover Override Domainmodell**: `CoverOverride` als discriminated union — `type: "custom"` fuer hochgeladene/gespeicherte Blobs (`upload` / `alternative`) und `type: "url"` fuer direkte externe URLs.
- **AlbumCover Komponente**: Unterstuetzt beide Override-Typen — `url` direkt, `custom` aus IndexedDB laden.
- **EditAlbumDialog Cover-Sektion**: Upload-Button, URL-Input (speichert direkt als `url`-Override), Live-Preview, Reset-Button. Dialog schliesst nach erfolgreicher Aktion.
- **Bugfix**: Aenderung der Cover-URL im Metadaten-Feld setzt jetzt automatisch `coverOverride` zurueck. Vorher ueberschrieb das aktive Override die neue URL – die Aenderung war nach Neuladen der Seite verschwunden.
- **Discover-Flow**: Automatischer Cover-Download als `alternative`-Override bei Metadaten-Lookup.
- **IndexedDB Custom Cover Store**: `saveCustomCover`, `getCustomCover`, `removeCustomCover` APIs.
- **useLibrary erweitert**: `updateAlbumCoverOverride` (Blobs), `setCoverUrlOverride` (URLs), `removeAlbumCoverOverride` Methoden.
- 2 Tests fuer Cover-Override in `useLibrary.test.ts` mit discriminated union Type-Guards (158 Tests gesamt).
- TypeScript-frei, keine neuen Dependencies.

## v0.14.0-dev

- Sprint 50 fuehrt Library Perspectives ein (Sprint 50A: Kuenstler & Jahr, Sprint 50B: Hoersession & Einordnung).
- **Library Group Domain-Modell**: `LibraryGroup<T>` als generisches Gruppierungsmodell.
- **Gruppierung nach Kuenstler**: `groupByArtist()` mit Case-folding und Sortierung (A–Z, N/A am Ende).
- **Gruppierung nach Erscheinungsjahr**: `groupByYear()` mit Jahrseinteilung und "Unbekanntes Jahr"-Gruppe.
- **Gruppierung nach letzter Hoersession**: `groupByLastListened()` mit Zeitkategorien (Heute, Diese Woche, Dieser Monat, Dieses Jahr, Laenger her, Noch nicht gehoert). Bevorzugt `listenEvents` ueber `album.lastListened`.
- **Gruppierung nach letzter Einordnung**: `groupByRoleChange()` mit Zeitkategorien. Nutzt juengsten `roleHistory`-Eintrag pro Album.
- **Gemeinsame Zeitkategorie-Hilfsfunktion**: `categorizeRecency()` mit `RecencyCategory`-Typ und `recencyGroups`-Label-Map fuer konsistente Gruppennamen.
- **GroupedLibraryView**: Wiederverwendbare Gruppen-Komponente mit Header und Album-Card-Grid.
- **LibraryViewSwitcher**: Drei Hauptmodi — Alle, Nach Rolle, Perspektiven — mit Sub-Switcher fuer alle vier Perspektiven.
- **Artist View, Year View, LastListened View, RoleChange View**: Duenne Wrapper ueber `GroupedLibraryView`.
- **Responsive**: Mobile Anpassung fuer Switcher-Layout.
- Keine neuen Dependencies. Alle 151 Tests gruen.

## v0.13.0-dev

- Sprint 49 fuehrt den Role Explorer ein.
- **Neue Domain-Funktionen**: `getAlbumsByRole()`, `getRoleStats()`, `createRoleOverview()` mit 12 Tests.
- **Role Explorer Grid**: Alle 6 Rollen als Karten mit Icon, Titel, Beschreibung, Anzahl und Cover-Vorschau.
- **Individuelle Empty States**: Pro Rolle ein einladender Text statt generischer Platzhalter.
- **Role Detail View**: Erweiterbare Seite pro Rolle mit Header, Beschreibung, Future-Insights-Platzhalter und Album-Grid.
- **Library View Switcher**: Wechsel zwischen „Alle Alben" und „Nach Rolle".
- **Rollen-Label auf Album Cards**: Dezente, farblich abgestufte Labels pro Rolle (optional via `showRoleLabel`).
- Keine neuen Dependencies. Build und alle 108 Tests gruen.

## v0.12.0-dev

- Sprint 48 fuehrt Cover Management ein.
- Cover werden lokal in IndexedDB gecacht (`coverCache.ts`).
- `AlbumCover`-Komponente laedt Cover nur einmal herunter und nutzt Blob-URLs.
- Offline-Nutzung von Covers moeglich (Fallback auf gecachte Version).
- Robuste Fehlerbehandlung: fehlgeschlagener Download faellt auf Original-URL zurueck.
- `getCachedCover`, `cacheCover`, `hasCachedCover`, `clearCoverCache` als Repository-API.
- Tests fuer CoverCache mit In-Memory-IndexedDB-Mock.

## v0.11.0-dev

- Sprint 47 bereitet die Persistenz vor.
- **Breaking**: `isCurrent` auf Album entfernt – Fokusalbum wird per separatem Key gespeichert.
- HomePage von ~1030 auf ~430 Zeilen refactored durch neue Entity-Hooks.
- `useLibrary()` – Repository-Pattern fuer Alben mit normalisiertem Laden.
- `useRotationPlan()` – Rotation-Plan-State isoliert in eigenem Hook.
- `useListenEvents()` – Hoer-Events mit Legacy-Daten-Migration.
- Aktive Schema-Versionierung (`rotation-schema-version`) mit Migrationsframework.
- Automatische Migration `isCurrent` → Fokusalbum-ID beim ersten Start.
- 9 neue Hook-/Repository-Tests hinzugefuegt (81 Tests gesamt).

## v0.10.2-dev

- Sprint 46.6 und 46.7: Domain Quality und Product Polish.
- **Domain Tests**: Reflection Tests, Rotation Generator Tests, Repository Interfaces.
- **AlbumCover-Komponente**: Fallback-Initialen, deterministische Farbe (`stringToHue`), Lazy Loading und `onError`-Handler.
- Album Cover in `AlbumCard`, `FocusAlbumCard`, `PlayerRotationTile` und `ReplacementCandidate` vereinheitlicht.
- Temporaere ASCII-Schreibweisen (`ae`, `oe`, `ue`) in korrekte Unicode-Umlaute korrigiert.
- Konsistente Begrifflichkeiten: Hoersession/Hoersessions, Fokusalbum, Player-Rotation.
- Dashboard-Reihenfolge: Player-Rotation direkt unter dem Header, vor Fokusalbum und Reflection.
- Mobile Breakpoints fuer Dashboard-Header, Timeline und Player-Rotation verifiziert.

## v0.10.1-dev

- Sprint 46.5 fuehrt den Identity Refresh ein.
- Einfuehrung einer konsistenten Farbpalette (Design System als verbindliche Grundlage).
- Einfuehrung einer typografischen Hierarchie.
- Vereinheitlichung aller Karten, Buttons, Dialoge und Formulare.
- Ruhigeres Spacing, konsistente Schatten und Radien.
- Harmonische Animationen und ueberarbeitete Icons.
- Sprachliche Konsistenz der UI.
- Design Tokens fuer Farben, Abstaende und Typografie.

## v0.10.0-dev

- Sprint 46 fuehrt die Listening History ein.
- `ListenEvent` mit `id`, `albumId`, `listenedAt` modelliert.
- `listenEventStore` mit `load`, `add`, `migrateLegacyListenData` implementiert.
- `LISTEN_EVENTS`-Speicher-Key ergaenzt.
- `listenEvents` als globaler State in `HomePage` eingefuehrt.
- `handleLogListen` schreibt jetzt echte Events.
- Legacy-Daten aus `lastListened` + `listenCount` werden beim ersten Start migriert.
- `createAlbumTimeline()` akzeptiert `listenEvents[]` als zweiten Parameter.
- Album Timeline zeigt jetzt einzelne Hoersessions ("Erste", "Letzte", "Session N").
- `FocusAlbumCard` und `AlbumTimeline` mit `listenEvents` prop verbunden.

## v0.9.0-dev

- Sprint 45 fuehrt Rotation Review ein.
- Rotation-Vorschlag als eigene Dashboard-Sektion.
- Alben aus dem Vorschlag entfernen.
- Ersatzvorschlaege aus derselben Rolle per Inline-Drawer.
- "Mitnehmen"-Button setzt Status auf `active`.
- Draft-Status `draft` mit separatem Speicher-Key.
- Active-Status `active` mit separatem Speicher-Key.
- Tile-Actions: Entfernen (✕) und Ersetzen (↻).
- Ersatz-Logik `findReplacementCandidates()`.
- Dokumentation in `CURATED_ROTATION.md` erweitert.

## v0.8.0-dev

- Sprint 44 fuehrt den Rotation Generator MVP ein.
- Player-Rotation wird als eigene Sektion mit kompakten Album-Tiles sichtbar.
- `generateRotationPlan()` erstellt eine erste Auswahl nach Rollenquoten.
- Aktuelle Player-Rotation wird lokal unter `rotation-current-plan` gespeichert.
- `RotationPlan` enthaelt jetzt konkrete Items mit Auswahlgrund.

## v0.7.0-dev

- Sprint 43 richtet Rotation semantisch als kuratierte Player-Auswahl aus.
- Das alte einzelne aktuelle Album heisst jetzt Fokusalbum.
- `FocusAlbumCard` ersetzt die alte `CurrentRotationCard`.
- Ein erstes `RotationPlan`-Domainmodell bereitet den Generator vor.
- ADR 005 dokumentiert Rotation als kuratierte Player-Auswahl.

## v0.6.1-dev

- Hoersessions koennen direkt auf jeder Album Card erfasst werden.
- Hoeren ist nicht mehr an das aktuell markierte Album gekoppelt.
- Package-Version auf `v0.6.1-dev` angehoben.

## v0.6.0-dev

- Sprint 42 fuehrt Dashboard 2.0 ein.
- Dashboard-Zone auf der HomePage.
- Naechste Frage, Insights, Balance der Sammlung.
- Rotation Dashboard als Balance-Baustein.
- HomePage-Komposition vereinfacht.

## v0.5.0-dev

- Sprint 41 fuehrt Insights ein.
- Insights Panel.
- Discovery Phase, Archiv-Schwerpunkt, Comfort-Food-Schwerpunkt, Klassiker-Kern.
- Aufbauzustand fuer kleine Bibliotheken.
- Sprachliche Erkenntnisse statt Statistik-Dashboard.

## v0.4.2-dev

- Sprint 40.6 fuehrt Library Maintenance ein.
- Album bearbeiten.
- Album endgueltig loeschen.
- Loeschen mit Bestaetigungsdialog.
- Papierkorb-Symbol unten rechts auf Album Cards.
- Stift-Symbol unten links auf Album Cards.
- Klare Trennung zwischen Archivieren und Loeschen.

## v0.4.1-dev

- Sprint 40.5: UI Polish.
- Rotation Card Cover-Skalierung stabilisiert.
- Textueberlauf in der Rotation Card verhindert.
- Rotation-Button mit Kontur, Schatten und Active-State gestaltet.
- Discover Dialog mit besserem Spacing und klarerer Typografie.
- Inputs, Step Indicator und Button States poliert.

## v0.4.0-dev

- Sprint 40 fuehrt die Album Timeline ein.
- Timeline fuer das aktuelle Album.
- Rollenwechsel und letzter Hoermoment als Ereignisse.
- Timeline-Domain aus `roleHistory` und `lastListened`.

## v0.3.0-dev

- Living Rotation Baseline festgelegt.
- Archiv Workflow mit Klassiker-Schutz eingefuehrt.
- Archivierte Alben bleiben in der Bibliothek und koennen als Wiederentdeckung geprueft werden.
- Reflection Engine erkennt Archiv-Rueckkehrkandidaten.
- Role History kennt Archiv-Entscheidungen mit Quelle `archive`.
- Reflection Engine mit ersten Regeln eingefuehrt.
- Reflection Card startet den Album Coach fuer erneute Einordnung.
- Reflection-Ergebnisse werden in der Role History mit Quelle `reflection` gespeichert.
- Bestehende lokale Alben werden beim Laden fuer neue Felder normalisiert.
- Rotation-Dashboard zeigt die Verteilung der Albumrollen.
- Rotation-Regeln definieren empfohlene Obergrenzen fuer aktive Rollen.
- Empfehlungen weisen auf zu volle Rollen hin.
- Aktuelles Album kann als "Heute gehoert" markiert werden.
- Metadaten-Lookup ergaenzt Jahr und Cover.
- Dokumentation an aktuellen Code- und Git-Stand angepasst.

## v0.2.0-dev

- Bibliothek wird aus `localStorage` initialisiert.
- Albumrollen, Album Coach und lokale Sammlung bilden den ersten stabilen Produktkern.

## v0.1.0-alpha

- Bibliotheksraster und Album Cards eingefuehrt.
- Discover-Album-Dialog fertiggestellt.

## v0.1.0-alpha.1

- Erste vollstaendige Dialoginteraktion fuer neue Alben.

## v0.0.1

- React Projekt erstellt

## v0.0.2

- Header
- Button
- Empty State

## v0.0.3

- Projektstruktur erweitert
