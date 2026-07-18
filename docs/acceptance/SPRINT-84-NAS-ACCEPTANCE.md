# Sprint 84 — Listening Journal NAS Acceptance

**Result:** Accepted on 2026-07-18 — all checks passed

## Purpose

Verify that personal listening notes remain optional, private, server-owned, and
attached to the correct immutable Listening Event.

## Preconditions

- [x] GitHub API and Web builds are green and Portainer pulled both `latest` images.
- [x] The API log reports migration 13 without errors.
- [x] A current database backup exists.
- [x] One Album is available for a disposable Listening Event.

## A. Optional capture

- [x] Click **Gehört** and confirm the Listening Event is saved immediately.
- [x] Dismiss the journal overlay through its backdrop or Cancel and confirm no note
  is required and no scrolling is necessary.
- [x] Record another listen, use the optional overlay, and save Unicode text.
- [x] Confirm mood and context tags are optional and translated in DE/EN.

## B. Edit and deletion semantics

- [x] Open the note from the Focus Album Timeline and edit it.
- [x] Open the Album editing dialog and find the same journal entry there.
- [x] Remove the note and confirm the Listening Event and listen count remain intact.
- [x] Confirm no duplicate event is created by repeated saves.

## C. Persistence and failure

- [x] Open a second browser and confirm the same note and tags are visible.
- [x] Restart Web and API containers and confirm the journal remains present.
- [x] Stop the API while editing, attempt to save, and confirm the typed text remains.
- [x] Restart the API and save the retained draft successfully.

## D. Timeline and Reflection

- [x] Confirm Timeline ordering remains newest first.
- [x] Confirm the role at listening time is labelled as derived from role history.
- [x] Confirm a later role does not appear retroactively on an older listen.
- [x] For an eligible Reflection Inbox item, confirm recent notes appear read-only.
- [x] Confirm the Coach does not interpret or automatically classify note text.

## E. Privacy and recovery

- [x] Search API operational logs for a distinctive test sentence and confirm it is absent.
- [x] Confirm the audit trail records create/update/delete without the note body.
- [x] Create and restore a backup according to the established NAS procedure.
- [x] Confirm the exact Unicode note and tags return after restore.

## Acceptance

- [x] Listening still feels like a one-click action.
- [x] Journaling feels optional and lightweight.
- [x] No note, Listening Event, role, Rotation, Binding, or Export data was corrupted.
- [x] Any deviations are documented before Sprint 84 is closed.
