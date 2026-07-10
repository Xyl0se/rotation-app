# ADR 005: Rotation als kuratierte Player-Auswahl

## Status

Akzeptiert

## Kontext

Rotation bedeutete im fruehen Produktverlauf zeitweise ein einzelnes aktuell hervorgehobenes Album.

Die urspruengliche Produktidee ist breiter:
Rotation soll aus der Bibliothek eine bewusste Auswahl fuer den MP3-Player vorschlagen, zum Beispiel 30 Alben mit gewichteten Anteilen aus mehreren Rollen.

## Entscheidung

Rotation bezeichnet kuenftig eine kuratierte Player-Auswahl mehrerer Alben.

Albumrollen beschreiben die Beziehung zu einem Album. Sie sind Kandidatenklassen fuer eine Rotation, aber nicht selbst die Rotation.

Ein Fokusalbum ist ein einzelnes hervorgehobenes Album in der UI. Es ersetzt die alte Ein-Album-Semantik, ohne das bestehende lokale Datenfeld `isCurrent` sofort zu entfernen.

Hoersessions sind Album-Ereignisse. Sie sind nicht daran gebunden, ob ein Album Teil einer Rotation oder das aktuelle Fokusalbum ist.

## Konsequenzen

- UI-Texte sprechen von Fokusalbum, wenn ein einzelnes Album hervorgehoben wird.
- `isCurrent` bleibt vorerst als Legacy-Feld bestehen und wird semantisch als Fokusmarkierung behandelt.
- Ein zukuenftiges `RotationPlan`-Modell beschreibt die eigentliche Player-Rotation.
- Der Rotation Generator baut spaeter auf Rollen, Hoerhistorie und Zielgroesse auf.
- Persistenzmigrationen werden erst umgesetzt, wenn das neue Rotationsmodell stabil ist.
