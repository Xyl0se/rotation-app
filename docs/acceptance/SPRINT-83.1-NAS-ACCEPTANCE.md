# Sprint 83.1 — NAS Acceptance Test

## Purpose

Verify that Album intake is materially shorter without losing deliberate role choice,
existing-Library matching, or server-side safety.

**Result:** Passed on the production NAS on 2026-07-18. All checks below were
reported green.

## Preconditions

- GitHub API and Web builds are green and Portainer pulled both `latest` images.
- A current database backup exists.
- At least one unresolved folder is available for safe testing.
- One existing Library Album can be matched without creating a duplicate.

## A. Three-stage Coach

- [x] Open the Coach from Capture and confirm the visible journey is Intro, Snapshot,
  Result.
- [x] Confirm all relevant Snapshot controls fit on one page at desktop width.
- [x] Verify insufficient exposure plus “give it a chance” recommends Newly Discovered.
- [x] Verify formative personal evidence recommends Classic.
- [x] Verify familiar active return recommends Comfort Food.
- [x] Verify continuing discovery recommends Still Growing.
- [x] Verify personal value without active return recommends Admired.
- [x] Confirm the Result explains the recommendation.
- [x] Select a different role and confirm only that final role is saved.

## B. Archive distinctions

- [x] Confirm ambiguity alone does not recommend Archive.
- [x] Verify all four Archive reasons are offered and understandable.
- [x] Confirm Archive cannot be saved without selecting a reason.
- [x] Save each reason on disposable test Albums where practical.
- [x] Reload in a second browser and confirm role and reason persist.
- [x] Confirm existing legacy Archive Albums still open without an assigned reason.

## C. Coach entry points

- [x] Run the Coach from Capture.
- [x] Run it from Library editing.
- [x] Run it from a Reflection Inbox item.
- [x] Cancel each flow once and confirm no role mutation occurs.

## D. Unresolved Binding workflow

- [x] Open Bindings with at least one unresolved folder and confirm only unresolved
  cards are shown initially.
- [x] Activate a card by mouse, keyboard, and touch.
- [x] Confirm the resolver offers existing Library candidates and manual search.
- [x] Select an existing Album and confirm the Binding is immediately confirmed.
- [x] Capture a new Album and confirm no additional Binding approval is required.
- [x] Confirm the Album Coach opens after a new Capture.
- [x] Resolve the final unresolved card and confirm the page switches calmly to All.
- [x] Confirm delete and maintenance actions cannot be triggered by an accidental card
  click.

## E. Failure safety

- [x] Interrupt or reject one Capture before completion and confirm no partial Album is
  visible in the Library.
- [x] Confirm the Binding remains unresolved and can be retried.
- [x] Temporarily stop the API and confirm typed/selected UI state does not falsely
  appear saved.

## F. Metadata punctuation

- [x] Resolve or search `Smoke + Mirrors` successfully.
- [x] Verify representative titles containing `_`, `:`, `&`, a typographic dash,
  apostrophe, and accented Unicode.
- [x] Confirm the stored Album title is the selected provider title, not a silent
  filesystem-normalized replacement.

## G. Layout and language

- [x] Verify Coach and Binding resolver in German and English.
- [x] Verify desktop and narrow/mobile widths without clipped controls.
- [x] Confirm visible focus, logical tab order, and sufficiently large touch targets.

## Acceptance

- [x] Processing several unresolved Albums feels materially faster than before.
- [x] No duplicate Library Album or half-confirmed Binding was created.
- [x] No existing Rotation, Reflection, Export, or Library workflow regressed.
- [x] Any deviations are documented before Sprint 83.1 is closed.
