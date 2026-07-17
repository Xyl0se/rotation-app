# Sprint 83 — Reflection Inbox

**Status:** Planned — approved; begins after the v0.29.x design pass

**Target version:** Next minor development version after the Sprint-82 release

**Type:** Attention workflow and reflective decision support

---

## Goal

Turn scattered reflection prompts into one calm, server-owned Inbox that helps the
user revisit Albums at meaningful moments without scoring the Library or creating an
obligation to clear notifications.

## Product Decision

The Reflection Inbox is not an engagement feed. Items are transparent consequences
of documented rules, can be postponed or dismissed, and never mutate an Album until
the user completes an explicit reflective workflow.

## Workstream 83A — Reflection Candidate Model

- Define stable candidate codes and evidence for the existing reflection rules:
  Newly Discovered after sufficient listens, long-unheard Growing Albums, Comfort Food
  reassessment, Archive rediscovery, and other already accepted role transitions.
- Persist Inbox state server-side: `open`, `snoozed`, `resolved`, or `dismissed`, plus
  evidence snapshot, creation time, due/snooze time, and resolution.
- Make candidate creation idempotent per Album, rule, and evidence window.
- Reopen a resolved/dismissed rule only when materially new evidence satisfies a
  documented recurrence condition.
- Keep listening/role history canonical; Inbox records reference it rather than
  duplicating or rewriting it.
- Treat long-dormant Albums explicitly: never heard, absent from recent Rotations,
  long-unheard, and archived Albums receive different transparent evidence rather
  than one generic inactivity rule.
- Model an internal archive-temperature projection (`warm`/`cold`) from documented
  recency and repeated user decisions. It is not a visible role, never changes the
  Album automatically, and must be recomputable from canonical evidence.

## Workstream 83B — Inbox Experience

- Add a dedicated Reflection area reachable from the global navigation or Home
  attention surface without turning it into a warning badge.
- Present why each Album appears, the relevant dates/counts, and what decisions are
  available in DE and EN.
- Support “Reflect now”, “Later”, and “Do not ask again for this evidence”.
- Reuse the reflective visual language of Album Coach and Archive workflows while
  keeping list scanning compact and readable.
- Provide empty, loading, unavailable, retry, and stale-candidate states.

## Workstream 83C — Workflow Integration

- Launch the appropriate Coach, Archive Return, or reassessment flow directly from an
  Inbox item.
- Resolve the item only after the Album mutation is confirmed by the server.
- Invalidate or resolve obsolete items when an Album role changes, an Album is deleted,
  or newer evidence supersedes the stored snapshot.
- Record resolution in the Sprint-82 audit trail without exposing implementation
  jargon to the user.
- Remove duplicate persistent prompts from Home once their Inbox equivalent exists;
  retain only a calm summary/entry point.

## Workstream 83D — Scheduling Without Noise

- Evaluate candidates on relevant confirmed events and at startup through an
  idempotent bounded job; do not require WebSockets or a separate worker.
- Define explicit snooze presets and maximum one open item per Album by default.
- Sort by meaningful evidence age/urgency, not by an opaque recommendation score.
- Avoid email, push notifications, streaks, red counters, or “inbox zero” language.
- Bound recurrence so a repeatedly declined dormant Album becomes quieter instead of
  increasingly urgent; materially new listening or an explicit return can warm it.

## Definition of Done

- [ ] Every Inbox item has a stable rule code, understandable evidence, and explicit
  state stored on the server.
- [ ] Repeated evaluation does not duplicate items.
- [ ] Reflect, snooze, dismiss, resolve, and stale-state behavior are deterministic.
- [ ] Album changes occur only through an explicit confirmed workflow.
- [ ] Home no longer presents duplicate versions of Inbox prompts.
- [ ] DE/EN, keyboard, touch, loading, retry, and empty states are tested.
- [ ] Backup/restore and second-browser verification cover Inbox state.
- [ ] Production use confirms the Inbox feels optional and non-judgmental.
- [ ] Warm/cold archive state is explainable, internal-only, recomputable, and covered
  by recurrence tests.

## Non-Goals

- Notifications outside the browser
- Gamification, streaks, scores, or mandatory Inbox zero
- Machine-learned recommendations
- User-visible warm/cold archive roles or automatic archive promotion
- Automated role assignment
- Free-form listening notes (Sprint 84)
- General task management
