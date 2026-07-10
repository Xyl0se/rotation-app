# ADR 006: Identity Refresh — Design System als verbindliche Grundlage

## Status

Akzeptiert

## Kontext

Rotation wuchs organisch. Farben, Abstaende, Schatten und Radien entstanden situativ. Die Oberflaeche fuehlte sich an wie zusammengewachsener Code, nicht wie ein durchgestaltetes Produkt.

Sprint 46.5 sollte Rotation erstmals eine eigenstaendige visuelle Identitaet geben.

## Entscheidung

Rotation erhaelt ein verbindliches Design System. Alle bestehenden und neuen Komponenten muessen sich an dessen Regeln orientieren.

Das Design System definiert:
- Farbpalette (warm, reduziert, nicht bunt)
- Typografische Hierarchie (lesbar, nicht dekorativ)
- Spacing-System (rhythmisch, nicht willkuerlich)
- Komponentenregeln (Buttons, Cards, Dialoge, Formulare)
- Motion Guidelines (dezent, nicht auffaellig)

Die Umsetzung ist keine pixelgenaue Nachbildung, sondern eine konsequente Uebersetzung der Prinzipien in Code.

## Konsequenzen

- `docs/DESIGN_SYSTEM.md` ist waehrend der gesamten Entwicklung verbindliche Grundlage.
- Farben stammen ausschliesslich aus dem Design System.
- Buttons, Cards, Dialoge und Formulare besitzen eine einheitliche Formsprache.
- Animationen sind dezent und einheitlich.
- Neue Features duerfen nicht mit ad-hoc-Styles arbeiten.
