# Dashboard

## Ziel

Das Dashboard ist der Einstiegspunkt in Rotation.

Es beantwortet nicht die Frage:

> Ist meine Sammlung gut aufgebaut?

Sondern:

> Was verdient heute meine Aufmerksamkeit?

Das Dashboard hilft dabei, Entwicklungen innerhalb der Sammlung wahrzunehmen.

Es bewertet die Bibliothek nicht.

---

# Produktidee

Rotation kennt zwei unterschiedliche Ebenen.

## Bibliothek

Die Bibliothek dokumentiert die persönliche Beziehung zwischen Mensch und Album.

Sie ist vollständig.

Sie besitzt keine Zielgrößen.

Sie wird nicht bewertet.

---

## Dashboard

Das Dashboard beobachtet Entwicklungen innerhalb dieser Bibliothek.

Es macht Zusammenhänge sichtbar.

Es hilft dabei, bewusste Entscheidungen zu treffen.

Das Dashboard erzeugt keine Aufgabenliste.

Es optimiert keine Sammlung.

---

# Bestandteile

Das Dashboard setzt sich aus mehreren eigenständigen Domänen zusammen.

## Reflection

Offene Fragen.

Alben, deren Rolle sich möglicherweise verändert hat.

Einladungen zum Nachdenken.

---

## Insights

Sprachliche Beobachtungen.

Beispiele:

- Deine Sammlung wächst gerade stark.
- Viele Klassiker begleiten dich schon lange.
- Einige Alben entwickeln sich noch.

Insights beschreiben.

Sie bewerten nicht.

---

## Rollenübersicht

Die Rollenübersicht dient ausschließlich der Orientierung.

Sie beantwortet Fragen wie:

- Welche Rollen sind aktuell vertreten?
- Wie verteilt sich meine Sammlung?

Sie beantwortet ausdrücklich nicht:

- Welche Rolle ist zu groß?
- Welche Rolle ist zu klein?
- Welche Rolle sollte wachsen?

Die Rollenübersicht besitzt deshalb:

- keine Zielwerte
- keine Limits
- keine Warnungen
- keine Fortschrittsbalken
- keine Optimierung

---

# Datenfluss

`Dashboard` erhält von der HomePage:

- albums
- reflectionPrompt

Das Dashboard verwendet ausschließlich bestehende Domänen.

Aktuell:

- evaluateReflection
- evaluateInsights

Später zusätzlich:

- Rotation Explainability

Das Dashboard enthält selbst keine Geschäftslogik.

Es komponiert lediglich vorhandene Domänen.

---

# Explainability (zukünftig)

Langfristig erklärt das Dashboard die aktive Player-Rotation.

Beispiele:

- Warum befindet sich dieses Album aktuell in der Rotation?
- Welche Rolle erfüllt es dort?
- Welche Geschichte erzählt diese Auswahl?

Diese Explainability bezieht sich ausschließlich auf die aktive Player-Rotation.

Nicht auf die Bibliothek.

---

# Produktprinzipien

Das Dashboard

- beobachtet
- erklärt
- begleitet

Es

- bewertet nicht
- optimiert nicht
- vergibt keine Scores
- erzeugt keine künstlichen Ziele

---

# Architektur

```
HomePage
│
├── Reflection
├── Insights
├── Rollenübersicht
└── (später)
    └── Rotation Explainability
```

Alle Bereiche bleiben eigenständige Domänen.

Das Dashboard besitzt selbst keine Fachlogik.

Es ist ausschließlich eine Kompositionsschicht.

---

# Nicht Bestandteil

Das Dashboard ist kein Analytics Dashboard.

Es gibt:

- keine KPIs
- keine Charts
- keine Fortschrittsbalken
- keine Rollenlimits
- keine Zielgrößen
- keine Gamification

---

# Langfristige Entwicklung

Das Dashboard entwickelt sich schrittweise.

1. Reflection
2. Insights
3. Neutrale Rollenübersicht
4. Explainability der Player-Rotation

Es entwickelt sich bewusst **nicht** zu einem Werkzeug zur Optimierung der Bibliothek.

Die Bibliothek bleibt Dokumentation.

Die Player-Rotation bleibt kuratierte Auswahl.