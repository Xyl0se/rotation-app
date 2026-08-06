# Sprint 92 — Automated Weekly Rotation (Masterplan)

**Status:** Future

**Target version:** Future minor (not scheduled)

**Type:** Cross-cutting product feature

## Vision

Rotation becomes a proactive companion. Every Monday begins with a fresh, curated selection — no manual steps required. The software disappears into the background while the music moves into the foreground.

## Scheduling decision

Sprint 92 is intentionally deferred. It requires operational prerequisites that
are not yet available, especially a dependable SMTP service and a production
decision for automated export and scheduled server operation. The existing
working-tree implementation is exploratory work, not a release candidate.

Before this sprint is resumed, revalidate its design against the then-current
deployment environment, SMTP configuration, and user preference for automatic
export. Sprint 93 may be implemented first because it is independent of the
automation workflow.

---

## Subsprints

| Sub | Title | Focus | Depends on |
|-----|-------|-------|------------|
| 92A | Scheduler & Automation Settings | Generic JobScheduler, SQLite persistence, timezone-aware cron, idempotency, catch-up | — |
| 92B | Server-Side Rotation Generation & Orchestration | Shared domain module, headless export, WeeklyRotationJob | 92A |
| 92C | Email Service & Weekly Briefing | SMTP transport, WeeklyBriefingService, HTML/plain-text templates, error notifications | 92B |
| 92D | Client: Automation Settings UI | Settings form, status display, manual trigger button, validation, responsive layout | 92A |
| 92E | Client: UI-Anpassungen für vollautomatischen Workflow | Remove manual generation CTA, automation status indicator, updated empty-state, onboarding hint | 92A, 92B, 92C, 92D |

---

## Execution Order

```
92A ──► 92B ──► 92C
  │               │
  ▼               ▼
92D ◄─────────────┘
  │
  ▼
92E
```

- **92A** is the foundation and must be completed first.
- **92B** builds on 92A and adds the core business logic.
- **92C** extends 92B with email notifications.
- **92D** (client settings UI) depends on 92A APIs and can be developed in parallel with 92B/92C once 92A is stable.
- **92E** (workflow redesign) must wait for all previous subsprints to ensure the server-side automation and settings UI are functional.

---

## Architektur-Prinzipien (aus User-Feedback)

1. **Shared Domain Code** — `generateRotationPlan` wird in ein gemeinsames Modul ausgelagert, das Client und Server nutzen.
2. **Schlanker generischer JobScheduler** — Registrieren, starten, stoppen, replan. Kein Framework-Overhead.
3. **Live-Replanung** — Settings-Update triggert sofortige Neuberechnung des Cron-Triggers ohne Serverneustart.
4. **Zeitzone** — Alle Berechnungen in `Europe/Berlin` mit korrekter Sommer-/Winterzeit.
5. **Idempotenz & Job Locking** — Pro Kalenderwoche maximal eine Ausführung via `(job_type, week_identifier)` Unique Constraint.
6. **Catch-up bei verpassten Jobs** — Grace Period (Standard 240 Minuten); innerhalb der Frist wird nachgeholt, außerhalb wird übersprungen.
7. **Atomarer Export** — Stage → Validate → Apply als ununterbrechbare Sequenz; Rollback bei Fehler.
8. **WeeklyBriefingService getrennt von EmailService** — Inhalt und Transport sind entkoppelt.
9. **Highlight-Kategorien klar definiert** — Fachliche Spezifikation mit Schwellenwerten (z.B. Long Time No Listen > 730 Tage).
10. **Tests von Anfang an** — Unit- und Integrationstests für Scheduler, Zeitlogik, Idempotenz, Export, E-Mail und Catch-up.

---

## Produktentscheidung

> Die Automatisierung wird der **Standard-Workflow**. Die manuelle Rotationserzeugung verschwindet bewusst aus dem normalen Workflow und ist höchstens noch als Wartungs-/Debug-Funktion in den Settings verfügbar.

Dies ist Sprint 92E umgesetzt.

---

## Dateien

| Typ | Datei |
|-----|-------|
| Sprint | [Sprint-92A.md](Sprint-92A.md) |
| Sprint | [Sprint-92B.md](Sprint-92B.md) |
| Sprint | [Sprint-92C.md](Sprint-92C.md) |
| Sprint | [Sprint-92D.md](Sprint-92D.md) |
| Sprint | [Sprint-92E.md](Sprint-92E.md) |
| Acceptance | [../acceptance/SPRINT-92A-SCHEDULER-SETTINGS-ACCEPTANCE.md](../acceptance/SPRINT-92A-SCHEDULER-SETTINGS-ACCEPTANCE.md) |
| Acceptance | [../acceptance/SPRINT-92B-ROTATION-ORCHESTRATION-ACCEPTANCE.md](../acceptance/SPRINT-92B-ROTATION-ORCHESTRATION-ACCEPTANCE.md) |
| Acceptance | [../acceptance/SPRINT-92C-EMAIL-BRIEFING-ACCEPTANCE.md](../acceptance/SPRINT-92C-EMAIL-BRIEFING-ACCEPTANCE.md) |
| Acceptance | [../acceptance/SPRINT-92D-CLIENT-SETTINGS-ACCEPTANCE.md](../acceptance/SPRINT-92D-CLIENT-SETTINGS-ACCEPTANCE.md) |
| Acceptance | [../acceptance/SPRINT-92E-CLIENT-WORKFLOW-ACCEPTANCE.md](../acceptance/SPRINT-92E-CLIENT-WORKFLOW-ACCEPTANCE.md) |
