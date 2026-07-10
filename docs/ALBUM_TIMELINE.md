# Album Timeline

Die Album Timeline macht sichtbar, was Rotation bereits ueber ein Album weiss.

Sie ist keine Statistik. Sie ist eine kleine Chronik der Beziehung zu einem Album.

## Aktueller Umfang

Sprint 40 zeigt die Timeline fuer das aktuelle Album.

Die Timeline erzeugt Ereignisse aus:

- `roleHistory`
- `lastListened`
- `listenCount`

## Ereignisse

Aktuelle Event-Typen:

- `role-assigned`: Eine Rolle wurde durch Coach, Reflection oder Archiv Workflow gesetzt.
- `listened`: Das Album wurde zuletzt gehoert.

Die Timeline wird neueste zuerst sortiert.

## Bewusste Grenze

Rotation speichert noch keine vollstaendige Hoersession-Historie.

Deshalb zeigt die Timeline aktuell nur den letzten Hoermoment und die Gesamtzahl der dokumentierten Hoersessions.

Eine echte Session-Historie gehoert in einen spaeteren Sprint oder in den Persistenz-Schnitt.
