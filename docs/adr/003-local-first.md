# 003 - Local First

## Entscheidung

Rotation speichert den aktuellen Produktkern lokal im Browser.

## Begruendung

Der fruehe Produktwert entsteht ohne Benutzerkonto, Server oder Synchronisierung. Local-first haelt die Anwendung leicht, privat und schnell testbar.

## Konsequenz

`localStorage` ist aktuell die persistente Quelle fuer:

- Onboarding-Status
- Album-Bibliothek

Spaetere Migrationen zu IndexedDB, Export/Import oder Cloud-Sync muessen die lokale Bibliothek respektieren und migrierbar halten.
