# UX

Ein Nutzer soll nie mehr als eine Entscheidung gleichzeitig treffen muessen.

## Grundsatz

Rotation soll sich wie ein ruhiges Gespraech ueber Musik anfuehlen.

Der Nutzer soll nicht das Gefuehl haben, eine Datenbank zu pflegen. Jede Interaktion fragt deshalb nach einer konkreten, kleinen Entscheidung.

## Aktueller Hauptfluss

1. Willkommen bestaetigen.
2. Neues Album entdecken.
3. Albumtitel eingeben.
4. Artist eingeben.
5. Metadaten suchen oder ueberspringen.
6. Album Coach starten.
7. Coach-Fragen beantworten.
8. Vorgeschlagene Rolle uebernehmen.
9. Album erscheint in der Bibliothek.
10. Rotation kann spaeter einen Reflexionsimpuls anzeigen.

## Bibliothek

Die Bibliothek zeigt Albumcards mit Cover oder generiertem Initialen-Cover. Jede Card bietet zwei direkte Aktionen:

- Album im Archiv ablegen oder eine Wiederentdeckung pruefen.
- Album als Fokusalbum markieren.
- Hoersession mit "Gehört" erfassen.

Archivierte Alben bleiben sichtbar, wirken aber ruhiger. Sie verschwinden nicht aus der Sammlung.

## Library Maintenance

Album Cards bieten zwei Pflegewerkzeuge:

- Stift unten links: Metadaten bearbeiten.
- Papierkorb unten rechts: Album endgueltig loeschen.

Bearbeiten korrigiert Titel, Artist und Jahr. Die Rolle wird nicht im Bearbeiten-Dialog geaendert.

Loeschen fragt immer nach einer Bestaetigung. Archivieren bleibt der bevorzugte Weg, wenn ein Album nur ruhen soll.

## Hoersessions

Hoeren ist ein Ereignis auf einem Album, kein Rotationsstatus.

Jede Album Card bietet deshalb einen direkten "Gehört"-Button. Er erhoeht die Hoersessions und setzt das letzte Hoerdatum, unabhaengig davon, ob das Album gerade Fokusalbum ist.

Der Button ist bewusst klein und ruhig. Er soll eine schnelle Notiz ermoeglichen, keine neue Entscheidung erzwingen.

## Fokusalbum

Das Fokusalbum wird oberhalb der Bibliothek hervorgehoben. Der Nutzer kann auch dort eine Hoersession mit "Gehört" erfassen. Dadurch steigen die Hoersessions und das letzte Hoerdatum wird aktualisiert.

Das Fokusalbum ist nicht die Rotation. Es ist nur ein einzelnes Album, das gerade Aufmerksamkeit bekommt.

Die Album Timeline ist vom Fokusalbum aus als aufklappbare Historie erreichbar. Ein
direkter Bearbeiten-Zugang öffnet den bestehenden Albumdialog.

Die Timeline soll nicht wie eine Statistik wirken. Sie ist eine ruhige Chronik.

## Startseite

Die Startseite konzentriert sich auf drei Ebenen:

- Fokusalbum
- Player-Rotation
- Bibliothek

Reflexion, Insights und Rollenübersicht unterbrechen diesen Hauptfluss nicht.

## Player-Rotation

Die Player-Rotation steht unterhalb des Fokusalbums und oberhalb der Bibliothek.

Sie zeigt die konkrete Auswahl, die mit auf den MP3-Player koennte:

- Anzahl der vorgeschlagenen Alben
- Rollen-Zusammenfassung als kurze Chips
- kompakte Album-Tiles mit Cover, Rolle und Auswahlgrund
- Button fuer einen neuen Vorschlag

Die Tiles sind kleiner als Bibliothekscards. Sie dienen dem schnellen Scannen, nicht der Pflege der Sammlung.

Ein Vorschlag kann geprüft, verändert und anschließend bewusst übernommen werden.

## Reflection

Reflection lebt auf der eigenen Insights-Seite. Wenn kein Album Anlass fuer eine
erneute Frage gibt, zeigt sie dort einen ruhigen Status.

Wenn ein Impuls vorhanden ist, fragt sie konkret nach einem Album.

Aktuelle Ausloeser:

- Neu entdeckt und mindestens dreimal gehoert.
- Waechst noch und schon laenger in dieser Rolle.
- Comfort Food und laenger nicht gehoert.
- Archiv und schon laenger ruhend.

Der Nutzer kann den Coach erneut starten. Bei archivierten Alben startet ein Wiederentdeckungs-Coach. Rotation aendert nie automatisch die Rolle.

## Insights

Insights, Reflection und die neutrale Rollenübersicht teilen sich eine eigene
Insights-Seite.

Sie sollen nicht wie Analytics wirken. Rotation formuliert kurze Beobachtungen darueber, welche Hoerphase die Sammlung gerade andeutet.

Zahlen koennen intern helfen, stehen aber nicht im Vordergrund.

## Archiv

Archivieren ist kein Loeschen.

Bevor ein Album ins Archiv geht, prueft ein kurzer Klassiker-Schutz:

- Wuerde ich es aktiv empfehlen?
- Habe ich es in den letzten 12 Monaten gehoert?
- Sage ich haeufiger "Das muesste ich mal wieder hoeren", als dass ich es tue?

Das Ergebnis kann Archiv, Klassiker oder Bewunderung sein.

Wenn ein Album lange im Archiv ruht, kann Reflection fragen, ob es ein Kandidat fuer Wiederentdeckung ist. Der Rueckkehr-Coach kann es im Archiv lassen oder als Klassiker beziehungsweise "Waechst noch" zurueckholen.

## Rotation-Balance

Die Balance zeigt eine Momentaufnahme der Rollenverteilung. Sie ist kein Analyse-Tool, sondern ein sanfter Spiegel:

- Wie viele Alben liegen in welcher Rolle?
- Welche Rollen haben eine empfohlene Obergrenze?
- Gibt es gerade eine Rolle, die zu voll wirkt?

Empfehlungen bleiben weich formuliert. Sie schlagen eine erneute Einordnung vor, statt eine Korrektur zu verlangen.

## Sprache

Bevorzugt:

- Neues Album entdecken
- Gehört
- Fokusalbum
- Rotation vorschlagen
- Neue Rotation vorschlagen
- Im Archiv ablegen
- Album bearbeiten
- Ja, loeschen

Vermeiden:

- Datensatz anlegen
- Loeschen, wenn eigentlich Archivieren gemeint ist
- Kategorie setzen
- Tracking
