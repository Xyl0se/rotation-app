# Sprint 84 — Listening Journal NAS Acceptance

## Purpose

Verify that personal listening notes remain optional, private, server-owned, and
attached to the correct immutable Listening Event.

## Preconditions

- [ ] GitHub API and Web builds are green and Portainer pulled both `latest` images.
- [ ] The API log reports migration 13 without errors.
- [ ] A current database backup exists.
- [ ] One Album is available for a disposable Listening Event.

## A. Optional capture

- [ ] Click **Gehört** and confirm the Listening Event is saved immediately.
- [ ] Dismiss **Gedanken hinzufügen** and confirm no note is required.
- [ ] Record another listen, open the optional affordance, and save Unicode text.
- [ ] Confirm mood and context tags are optional and translated in DE/EN.

## B. Edit and deletion semantics

- [ ] Open the note from the Focus Album Timeline and edit it.
- [ ] Open the Album editing dialog and find the same journal entry there.
- [ ] Remove the note and confirm the Listening Event and listen count remain intact.
- [ ] Confirm no duplicate event is created by repeated saves.

## C. Persistence and failure

- [ ] Open a second browser and confirm the same note and tags are visible.
- [ ] Restart Web and API containers and confirm the journal remains present.
- [ ] Stop the API while editing, attempt to save, and confirm the typed text remains.
- [ ] Restart the API and save the retained draft successfully.

## D. Timeline and Reflection

- [ ] Confirm Timeline ordering remains newest first.
- [ ] Confirm the role at listening time is labelled as derived from role history.
- [ ] Confirm a later role does not appear retroactively on an older listen.
- [ ] For an eligible Reflection Inbox item, confirm recent notes appear read-only.
- [ ] Confirm the Coach does not interpret or automatically classify note text.

## E. Privacy and recovery

- [ ] Search API operational logs for a distinctive test sentence and confirm it is absent.
- [ ] Confirm the audit trail records create/update/delete without the note body.
- [ ] Create and restore a backup according to the established NAS procedure.
- [ ] Confirm the exact Unicode note and tags return after restore.

## Acceptance

- [ ] Listening still feels like a one-click action.
- [ ] Journaling feels optional and lightweight.
- [ ] No note, Listening Event, role, Rotation, Binding, or Export data was corrupted.
- [ ] Any deviations are documented before Sprint 84 is closed.
