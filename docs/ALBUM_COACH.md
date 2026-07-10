# Album Coach

Der Album Coach bestimmt die aktuelle Beziehung zu einem Album.

Er ersetzt eine direkte Rollenauswahl durch kurze Ja/Nein-Fragen. Dadurch fuehlt sich die Einordnung weniger wie Verwaltung und mehr wie Reflexion an.

## Entscheidungsbaum

1. Noch nicht mindestens dreimal bewusst gehoert: `new`
2. Wuerde nicht vermisst: `archive`
3. Automatisches Wohlfuehlalbum: `comfort-food`
4. Ueberrascht oder fordert noch heraus: `growing`
5. Keine klare Empfehlung: `archive`
6. Wird regelmaessig gehoert: `classic`
7. Wird bewundert, aber selten gehoert: `admire`

## Rollen

- `new`: Das Album will erst kennengelernt werden.
- `growing`: Das Album veraendert sich mit weiteren Durchlaeufen.
- `comfort-food`: Das Album ist vertraut und verlaesslich.
- `classic`: Das Album hat dauerhaft gepraegt.
- `admire`: Das Album wird anerkannt, ohne oft gehoert zu werden.
- `archive`: Das Album ruht im Moment.

## Beispiel

Kid A

✓ mindestens dreimal gehört

✓ würde ich vermissen

✗ kein Comfort Album

✓ überrascht mich immer noch

➡️ Growing

## Beispiel

Rumours

✓ mindestens dreimal gehört

✓ würde ich vermissen

✓ Comfort Album

➡️ Comfort Food
