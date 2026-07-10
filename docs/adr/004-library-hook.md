# 004 - Library State

## Entscheidung

Die Bibliothekslogik lebt in einem eigenen React Hook (`useLibrary`).

## Begründung

- HomePage bleibt auf Darstellung fokussiert.
- Storage kann später leicht ersetzt werden (z. B. IndexedDB oder Cloud).
- Alle Bibliotheksoperationen liegen an einer Stelle.

## Konsequenz

Neue Funktionen wie Löschen, Bearbeiten oder Suchen werden im Hook ergänzt.

## Status

Beschlossen, aber noch nicht umgesetzt.

Aktuell liegen Laden, Speichern und Mutationen in `HomePage.tsx`. `src/hooks/useLibrary.ts` existiert, ist aber leer.
