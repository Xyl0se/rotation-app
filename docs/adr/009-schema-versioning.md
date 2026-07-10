# ADR 009: Schema-Versionierung und Migrationsframework

## Status

Akzeptiert

## Kontext

Rotation speichert Daten im Browser-`localStorage`. Aenderungen am Datenmodell (z. B. Entfernen von `isCurrent`, Einfuehren von `listenEvents`) mussten bisher manuell oder gar nicht behandelt werden. Bestehende Nutzerdaten drohten inkonsistent zu werden.

Sprint 47 sollte eine robuste Grundlage fuer zukuenftige Datenmodell-Aenderungen schaffen.

## Entscheidung

Rotation fuehrt eine Schema-Versionierung mit automatischen Migrationen ein.

- Ein zentraler Key `rotation-schema-version` speichert die aktuelle Schema-Version.
- Beim App-Start wird die gespeicherte Version mit der aktuellen Version verglichen.
- Falls die gespeicherte Version fehlt oder aelter ist, werden registrierte Migrationen sequentiell ausgefuehrt.
- Migrationen sind idempotent und defensiv: sie pruefen, ob die Migration bereits angewendet wurde.
- Das `Album`-Interface kann Breaking Changes erhalten, solange eine Migration bestehende Daten ueberfuehrt.

## Konsequenzen

- `src/config/schemaVersion.ts` definiert die aktuelle Version.
- `src/config/migrations.ts` enthaelt alle registrierten Migrationen.
- Neue Datenmodell-Aenderungen erfordern immer eine Migration und eine Versionserhoehung.
- Migrationen muessen rueckwaertskompatibel sein (kein Datenverlust).
- `ARCHITECTURE.md` dokumentiert das Migrationsframework.
