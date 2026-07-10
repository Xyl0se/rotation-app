# Archiv Workflow

Archivieren bedeutet in Rotation nicht loeschen.

Ein Album im Archiv bleibt Teil der Sammlung, ruht aber ausserhalb einer aktiven Player-Auswahl.

## Ins Archiv gehen

Bevor ein Album ins Archiv gelegt wird, laeuft ein Klassiker-Schutz.

Der Schutz stellt drei Fragen:

1. Wuerde ich dieses Album jemandem aktiv empfehlen?
2. Habe ich es in den letzten 12 Monaten wirklich gehoert?
3. Sage ich haeufiger "Das muesste ich mal wieder hoeren", als dass ich es tue?

Moegliche Ergebnisse:

- `archive`: Das Album darf ruhen.
- `classic`: Das Album ist zu wichtig fuer einen reinen Archivplatz.
- `admire`: Das Album wird bewundert, ohne sofort Teil einer Player-Auswahl zu sein.

Jede Entscheidung schreibt einen `roleHistory`-Eintrag mit `source: "archive"`.

Wenn das Fokusalbum ins Archiv geht, wird das Legacy-Feld `isCurrent` auf `false` gesetzt.

## Rueckkehr aus dem Archiv

Die Rueckkehr ist Teil des Reflection Workflows.

Wenn ein Album mindestens 180 Tage im Archiv liegt, kann die Reflection Engine einen Wiederentdeckungsimpuls anzeigen.

Der Archive Return Coach fragt:

1. Habe ich es in den letzten 6 Monaten bewusst gehoert?
2. Erinnere ich mich spontan an einen Song, ein Riff, eine Textzeile oder einen besonderen Moment?
3. Wuerde ich widersprechen, wenn jemand das Album durchschnittlich nennt?
4. Warum habe ich es damals gekauft?
5. Passt es zu meiner aktuellen Lebensphase oder Hoerstimmung?
6. Suche ich heute eher Vertrautheit oder Entdeckung?

Moegliche Ergebnisse:

- `archive`: Das Album bleibt im Archiv.
- `classic`: Das Album kehrt als Klassiker zurueck.
- `growing`: Das Album kehrt als Wiederentdeckung zurueck.

Rueckkehrentscheidungen schreiben `roleHistory` mit `source: "reflection"`.

## Produktprinzip

Rotation darf Fragen stellen.

Rotation darf nie automatisch ein Album zurueckholen oder weglegen.
