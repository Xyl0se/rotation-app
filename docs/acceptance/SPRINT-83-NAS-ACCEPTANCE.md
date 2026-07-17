# Sprint 83 — NAS Acceptance Test

## Purpose

Verify that the Reflection Inbox remains calm, deterministic, server-owned, and
persistent in the production NAS deployment. This test does not require clearing the
Library, browser storage, or the production database.

## Preconditions

- GitHub API and Web image builds are green.
- Portainer has pulled both `latest` images and recreated both containers.
- The API log reports a successful start without migration errors.
- A current database backup exists before the test.
- At least one Album can safely be used for role/listening test data.

## A. Migration and basic availability

- [ ] Open **Insights** and locate the Reflection Inbox.
- [ ] Confirm that the page has no red counter, urgency language, or inbox-zero prompt.
- [ ] Confirm that existing Library, Rotation, Export, and Bindings data are unchanged.
- [ ] Check the API log: no error mentions migration 12 or `reflection_inbox_items`.

## B. Candidate creation and idempotency

- [ ] Use or prepare a `Newly Discovered` Album with at least three listening sessions.
- [ ] Reload Insights twice.
- [ ] Confirm that exactly one Inbox item exists for this Album.
- [ ] Confirm that its explanation contains the Album, listening count, and time in role.
- [ ] Restart the API container and reload Insights.
- [ ] Confirm that the same logical item exists only once.

## C. Snooze and cross-browser persistence

- [ ] Choose **Later · 30 days** on one item.
- [ ] Confirm that it disappears without changing the Album role.
- [ ] Open Rotation in a second browser or private window.
- [ ] Confirm that the item is also absent there.
- [ ] Restart Web and API containers and confirm that it remains snoozed.

## D. Dismissal and new evidence

- [ ] On a suitable item choose **Do not ask again for this evidence**.
- [ ] Reload Insights and confirm that the same evidence does not return.
- [ ] Record materially new listening evidence for the Album.
- [ ] Confirm that no immediate noisy recurrence appears; recurrence is intentionally delayed.

## E. Explicit reflection workflow

- [ ] Select **Reflect now** for a non-archived Album.
- [ ] Confirm that the Album Coach opens with the correct Album.
- [ ] Cancel the Coach and confirm that neither role nor Inbox item changed.
- [ ] Open it again, complete the Coach, and confirm the role change.
- [ ] Confirm that the Inbox item disappears only after the server saved the Album.
- [ ] For an archived candidate, confirm that the Archive Return workflow opens instead.

## F. Stale candidates and event updates

- [ ] Change the role of an Album with an open item from the Library edit workflow.
- [ ] Return to Insights and confirm that the obsolete item is gone.
- [ ] Delete only a disposable test Album with an open item.
- [ ] Confirm that no stale Inbox item remains.
- [ ] Record a listening session and confirm that Insights reflects newly eligible evidence without an API restart.

## G. Language, responsive layout, and accessibility

- [ ] Verify the Inbox in German and English.
- [ ] Verify desktop and narrow/mobile browser widths.
- [ ] Navigate all Inbox actions using Tab and activate them using the keyboard.
- [ ] Confirm that buttons remain readable and usable by touch without overlap.
- [ ] Temporarily stop the API and confirm an unavailable state with a Retry action.
- [ ] Restart the API and confirm Retry restores the Inbox.

## H. Backup and restore

- [ ] Create a manual backup while one item is snoozed or dismissed.
- [ ] Record the item state and snooze date.
- [ ] Restore only according to the established NAS backup procedure.
- [ ] Confirm that the item state and date are restored in a second browser.

## Acceptance

- [ ] All safety and persistence checks pass.
- [ ] No automatic Album role change occurred.
- [ ] The Inbox feels optional and non-judgmental in production use.
- [ ] Any deviations are documented before Sprint 83 is closed.
