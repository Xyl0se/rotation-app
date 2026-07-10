# Curated Rotation

Rotation meint ab Sprint 43 eine kuratierte Player-Auswahl.

Die App soll nicht nur ein Album hervorheben, sondern aus einer grossen Bibliothek eine bewusste Auswahl vorschlagen:

- Zielgroesse, zuerst typischerweise 30 Alben
- gewichtete Anteile aus mehreren Rollen
- nachvollziehbare Auswahl aus mehr Kandidaten als Plaetzen
- keine automatische Entfernung aus der Bibliothek

## Begriffe

## Bibliothek

Alle Alben, die der Nutzer kennt, entdeckt, archiviert oder wieder befragt.

## Rolle

Die aktuelle Beziehung zu einem Album, zum Beispiel Neu entdeckt, Comfort Food oder Klassiker.

Rollen sind Kandidatenklassen fuer eine Rotation.

## RotationPlan

Das Zielmodell fuer eine konkrete Player-Rotation.

Ein RotationPlan enthaelt:

- Zielgroesse
- Album-IDs
- konkrete Items mit Rolle und Auswahlgrund
- Rollenquoten
- Erstellungszeitpunkt

Sprint 44 erzeugt daraus den ersten sichtbaren Player-Rotation-Vorschlag.

## Generator MVP

`generateRotationPlan(albums)` erzeugt eine erste Auswahl:

- Standardziel sind 30 Alben.
- Archivierte Alben werden ausgeschlossen.
- Rollenquoten bevorzugen Neu entdeckt, Comfort Food, Klassiker, Waechst noch und Bewunderung.
- Wenn Rollen nicht genug Kandidaten haben, werden freie Plaetze robust aufgefuellt.
- Jedes Item merkt, ob es ueber einen Rollenplatz oder Auffuellplatz in die Auswahl kam.

Der Generator ist bewusst einfach und nachvollziehbar.

## RotationPlan Lebenszyklus (Sprint 45)

Jeder `RotationPlan` hat einen Status:

- `draft` – Der Vorschlag wird gerade geprueft und kann noch bearbeitet werden.
- `active` – Der Nutzer hat den Plan uebernommen. Er ist dann fixiert und rein lesend.

Ein Draft kann einzelne Alben enthalten, die der Nutzer entfernt oder durch Alternativen derselben Rolle ersetzt. Erst beim Klick auf "Mitnehmen" wird der Plan auf `active` gesetzt und in `rotation-active-plan` gespeichert.

## Ersatz-Logik

`findReplacementCandidates(removedItem, plan, albums)` sucht die besten Ersatzkandidaten fuer ein entferntes Album:

- Kandidaten muessen dieselbe Rolle haben.
- Bereits im Plan enthaltene Alben werden ausgeschlossen.
- Sortierung nach Listen-Count, dann letzter Hoerzeitpunkt, dann Titel.
- Standardmaessig werden die Top 3 vorgeschlagen.

## Fokusalbum

Ein einzelnes Album, das in der UI hervorgehoben wird.

Das Fokusalbum ersetzt die alte Sprache "Jetzt in Rotation". Es bedeutet nicht, dass dieses Album die Rotation ist.

Technisch nutzt die App dafuer vorerst weiter das Legacy-Feld `isCurrent`.

## Hoersession

Ein Hoerereignis auf einem Album.

Hoersessions koennen auf jeder Album Card erfasst werden. Sie sind nicht daran gebunden, ob ein Album Fokusalbum ist oder spaeter Teil eines RotationPlans wird.

## Sichtbare Player-Rotation

Die HomePage zeigt eine eigene Player-Rotation-Sektion:

- Anzahl der vorgeschlagenen Alben
- Button fuer eine neue Rotation
- Im Draft-Modus: "Mitnehmen"-Button zum Fixieren
- Rollen-Zusammenfassung
- Kompakte Album-Tiles mit Cover, Rolle und Grund
- Im Draft-Modus pro Tile: Entfernen- und Ersetzen-Buttons
- Expandable Drawer mit 3 Cover-Vorschlaegen derselben Rolle

Die aktuelle Player-Rotation wird lokal gespeichert:
- Draft unter `rotation-current-plan`
- Active unter `rotation-active-plan`
