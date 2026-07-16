# Sprint 84 — Listening Journal

**Status:** Planned — approved; begins after Reflection Inbox validation

**Target version:** Subsequent minor development version

**Type:** Listening memory and longitudinal Album relationship

---

## Goal

Enrich a confirmed Listening Event with an optional, lightweight personal note so an
Album's development can be remembered across sessions without turning Rotation into
a social review platform or a quantified listening tracker.

## Product Decision

Logging a listen must remain a one-click action. Journal content is optional and may
be added immediately or later. Empty notes are valid; the application never requires
writing in order to count a Listening Event.

## Workstream 84A — Journal Data Contract

- Extend Listening Events with optional journal fields using a versioned migration:
  short note, optional mood/context tags from a small transparent vocabulary, and
  created/updated timestamps.
- Preserve the immutable identity and original `listenedAt` timestamp of the event.
- Define length limits, Unicode handling, sanitization, deletion semantics, and
  idempotent updates explicitly.
- Keep notes server-owned, included in backup/restore, and visible consistently in a
  second browser.
- Do not derive or change an Album role automatically from journal content.

## Workstream 84B — Capture Flow

- Keep the existing “Listened” action immediate and confirmed.
- After success, offer a dismissible “Add a thought” affordance rather than opening a
  mandatory modal.
- Provide a spacious, highly readable journal sheet with Album cover, date, optional
  note, and optional context/mood selection.
- Support edit and delete for the note while keeping the underlying Listening Event.
- Handle server failure without losing typed text during the current browser session;
  do not introduce a general offline mutation queue.

## Workstream 84C — Album Timeline & Longitudinal View

- Integrate journal entries into the Album timeline in chronological order alongside
  role transitions and Album Story.
- Provide a focused Album journal view for comparing reflections across listens.
- Show role at the time of listening when reliably available from history; label any
  inferred historical context transparently.
- Keep long notes collapsed by default and accessible on keyboard and touch.
- Add search only if it can reuse the existing Library search contract without
  leaking private note text into unrelated logs or diagnostics.

## Workstream 84D — Reflection Integration

- Let relevant Reflection Inbox items reference recent journal entries as user-written
  evidence, never as automated sentiment classification.
- During reassessment, show previous notes read-only and allow the user to decide
  whether their relationship changed.
- Record journal mutations in the audit trail, but exclude note bodies from normal
  operational logs.
- Ensure export and music-folder workflows remain independent of journal data.

## Definition of Done

- [ ] A listen remains recordable with one confirmed action and no required note.
- [ ] Notes can be added, edited, and removed without deleting or duplicating the
  Listening Event.
- [ ] Timeline and journal views show correct chronological and role context.
- [ ] Typed text survives a recoverable failed save within the current UI session.
- [ ] Journal text never appears in structured operational logs or diagnostics.
- [ ] DE/EN, Unicode, length, accessibility, retry, and second-browser cases are tested.
- [ ] Migration and backup/restore preserve Listening Events and notes exactly.
- [ ] Production acceptance confirms the journal remains optional and lightweight.

## Non-Goals

- Public reviews, sharing, likes, or social profiles
- Audio scrobbling or automatic playback detection
- Sentiment analysis, AI summaries, or automatic role prediction
- Track-level diary entries
- Rich-text editing or file attachments
- Mobile/native capture

