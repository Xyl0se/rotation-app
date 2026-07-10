# Rotation Produktnotiz

Rotation hilft Menschen dabei, ihre Beziehung zu Alben über viele Jahre bewusst zu pflegen.

Rotation soll sich nie wie Dateneingabe anfühlen.

Rotation soll sich wie ein Gespräch über Musik anfühlen.

---

## Produktprinzipien

Rotation bewertet keine Musiksammlung.

Albumrollen besitzen keine Zielgrößen und keine optimale Verteilung.

Die Bibliothek dokumentiert Beziehungen zu Musik.

Die Player-Rotation ist eine bewusste Auswahl aus dieser Bibliothek.

Empfehlungen beziehen sich ausschließlich auf die aktive Player-Rotation oder auf die Reflexion einzelner Alben – niemals auf die Größe einer Rolle innerhalb der Bibliothek.

---

## Aktueller Produktstand

Rotation ist eine lokale React-Anwendung für eine bewusste Albumsammlung.

Der Nutzer durchläuft zuerst eine kurze Willkommen-Seite. Danach lebt die Anwendung auf der HomePage: Sammlung, Fokusalbum, Dashboard, Player-Rotation und der Dialog zum Entdecken eines neuen Albums.

Der Begriff Rotation meint wieder die ursprüngliche Vision: eine kuratierte Player-Auswahl mehrerer Alben. Das einzelne hervorgehobene Album heißt Fokusalbum.

---

## Kernfunktionen

- Neues Album entdecken: Titel und Artist werden manuell eingegeben.
- Metadaten nachschlagen: MusicBrainz liefert Release-Daten, Cover Art Archive liefert das Frontcover.
- Album Coach: Ein kurzer Entscheidungsbaum ordnet das Album einer Rolle zu.
- Bibliothek: Alben werden als Cards angezeigt und können bewusst ins Archiv gelegt werden.
- Library Maintenance: Titel, Artist, Jahr und Cover-Override können bearbeitet werden. Alben können nach Bestätigung endgültig gelöscht werden.
- Library Perspectives: Die Bibliothek kann nach Künstler, Jahr, letzter Hörsession oder letzter Rollenänderung gruppiert werden.
- Fokusalbum: Genau ein Album kann für Aufmerksamkeit hervorgehoben werden.
- Hörsession erfassen: Auf jeder Album Card kann ein Hörereignis erfasst werden. Dadurch werden `listenCount` und `lastListened` aktualisiert, unabhängig davon, ob das Album Fokusalbum ist.
- Listening History: Hörsessions werden als echte Ereignisse modelliert und können in der Album-Timeline angezeigt werden.
- Player-Rotation: Rotation kann eine kuratierte Auswahl für den MP3-Player erzeugen und sichtbar anzeigen. Die Player-Rotation entsteht aus der Bibliothek, bewertet diese jedoch nicht.
- Rotation Review: Der Nutzer kann vorgeschlagene Rotationen bewusst annehmen, entfernen oder ersetzen.
- Curated Rotation Model: `RotationPlan` beschreibt eine Player-Auswahl aus mehreren Alben.
- Role History: Rollenwechsel werden mit Zeitpunkt und Quelle dokumentiert.
- Album Timeline: Ein Album zeigt seine bisher dokumentierte Geschichte.
- Reflection Engine: Rotation stellt bei passenden Alben Fragen, unterstützt bewusste Neueinordnungen und kann den Coach erneut starten. Reflection bewertet niemals die Bibliothek als Ganzes.
- Archiv Workflow: Ein Klassiker-Schutz prüft, ob ein Album wirklich ruhen darf. Archivierte Alben können später als Wiederentdeckungskandidaten auftauchen.
- Role Explorer: Alle sechs Rollen als eigenständige Übersichtsseiten innerhalb der Bibliothek.
- Insights: Rotation formuliert sprachliche Beobachtungen über Hörgewohnheiten und die Entwicklung der Sammlung. Insights bewerten die Sammlung nicht.
- Dashboard: Reflection, Insights und eine neutrale Übersicht über die Bibliothek bilden gemeinsam den Einstieg in Rotation.
- Cover Override System: Nutzer können Cover manuell anpassen — per Upload, externer URL oder als Alternative aus dem Cover Art Archive.

---

## Albumrollen

- Neu entdeckt
- Wächst noch
- Comfort Food
- Klassiker
- Bewunderung
- Archiv

Diese Rollen sind keine starren Kategorien.

Sie beschreiben ausschließlich die aktuelle Beziehung zwischen Mensch und Album.

Es gibt keine empfohlene Anzahl von Alben pro Rolle.

Es existieren keine Zielgrößen oder optimale Verteilungen.

---

## Was Rotation nicht ist

Rotation ist kein Streamingdienst.

Rotation ist kein Statistik-Dashboard.

Rotation ist kein Sammlungsoptimierer.

Rotation bewertet keine Albumrollen.

Rotation versucht nicht, eine gleichmäßig verteilte Bibliothek zu erzeugen.

Rotation vergibt keine Punkte oder Scores für eine Sammlung.

---

## Produktgrenzen

- Rotation kennt nur Alben, keine Songs.
- Rotation ist aktuell local-first und speichert im Browser-`localStorage` und IndexedDB.
- Es gibt noch keine Benutzerkonten, Synchronisierung oder vollständige Hörsession-Historie.
- Der Metadata Lookup ist eine Hilfe, aber keine Voraussetzung für das Speichern eines Albums.
- Rotation versucht nicht, eine „perfekte" Bibliothek zu erzeugen.
- Rotation optimiert keine Rollenverteilung.