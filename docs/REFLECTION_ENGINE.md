# Reflection Engine

Die Reflection Engine stellt Fragen, wenn ein Album wahrscheinlich neu betrachtet werden sollte.

Sie aendert keine Rolle automatisch. Sie erzeugt nur einen Impuls und kann den Album Coach erneut starten.

## Datenfluss

1. `evaluateReflection(albums)` prueft alle Alben gegen `reflectionRules`.
2. Die HomePage zeigt die `ReflectionCard`.
3. Wenn ein Impuls vorhanden ist, zeigt die Card das erste passende Album.
4. Der Nutzer kann den Album Coach oder bei Archiv-Alben den Archive Return Coach starten.
5. Das Ergebnis setzt `category`.
6. `roleHistory` erhaelt einen Eintrag mit `source: "reflection"`.

## Aktuelle Regeln

- `new-after-listens`: Ein neues Album wurde mindestens dreimal gehoert.
- `growing-for-a-while`: Ein wachsendes Album liegt mindestens 90 Tage in dieser Rolle.
- `comfort-not-recent`: Ein Comfort-Food-Album wurde mindestens 60 Tage nicht gehoert.
- `archive-return-candidate`: Ein Archiv-Album ruht seit mindestens 180 Tagen.

## Wiederholschutz

Wenn die aktuelle Rolle zuletzt durch eine Reflection bestaetigt wurde, erzeugt dieselbe Rolle nicht sofort wieder einen neuen Impuls.

## Produktprinzip

Reflection ist kein Alarm.

Reflection ist eine Einladung, die eigene Beziehung zu einem Album wieder kurz anzuschauen.
