# Dashboard

Das Dashboard bündelt die wichtigsten Signale der aktuellen Sammlung.

Es ersetzt keine Domänenlogik.

Es bewertet keine Bibliothek.

Es macht Entwicklungen und Zusammenhänge sichtbar und hilft dabei, die Aufmerksamkeit auf die richtigen Alben zu lenken.

---

## Aufgabe

Das Dashboard beantwortet Fragen wie:

- Welche Alben beschäftigen mich gerade?
- Welche Geschichten entwickeln sich in meiner Sammlung?
- Welche Reflection verdient Aufmerksamkeit?
- Welche Rollen sind aktuell vertreten?
- Wie entwickelt sich meine Player-Rotation?

Es beantwortet ausdrücklich **nicht**:

- Welche Rolle ist zu groß?
- Welche Rolle ist zu klein?
- Welche Verteilung wäre optimal?

---

## Bereiche

Das Dashboard besteht aus:

- Reflection — offene Fragen und mögliche Neueinordnungen
- Insights — sprachliche Beobachtungen über Sammlung und Hörverhalten
- Rollenübersicht — neutrale Übersicht über die aktuellen Albumrollen

Langfristig kann das Dashboard zusätzlich Explainability der aktiven Player-Rotation integrieren.

---

## Datenfluss

Die HomePage übergibt:

- `albums`
- `reflectionPrompt`

Das Dashboard nutzt ausschließlich bestehende Domänenfunktionen.

Beispielsweise:

- `evaluateReflection`
- `evaluateInsights`

Weitere Domänen (Explainability der Player-Rotation) können später ergänzt werden.

---

## Rollenübersicht

Die Rollenübersicht dient ausschließlich der Orientierung.

Jede Rolle zeigt:

- Titel
- Beschreibung
- Anzahl der Alben
- optionale Cover-Vorschau

Die Rollenübersicht besitzt:

- keine Zielgrößen
- keine Limits
- keine Fortschrittsbalken
- keine Warnungen
- keine Empfehlungen

Albumrollen beschreiben Beziehungen zu Musik.

Sie besitzen keine optimale Größe.

---

## Produktprinzip

Die Bibliothek wird nicht bewertet.

Das Dashboard beobachtet Entwicklungen.

Es unterstützt Reflection.

Es erklärt Zusammenhänge.

Es optimiert keine Sammlung.

---

## Produktgrenze

Das Dashboard ist kein Analytics Dashboard.

Es gibt:

- keine Charts
- keine KPIs
- keine Scores
- keine Gamification
- keine Rollenoptimierung

Das Dashboard beantwortet ausschließlich:

> Was verdient gerade Aufmerksamkeit?

Nicht:

> Was sollte ich optimieren?