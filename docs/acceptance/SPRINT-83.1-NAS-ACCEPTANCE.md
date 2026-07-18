# Sprint 83.1 — NAS Acceptance Test

## Purpose

Verify that Album intake is materially shorter without losing deliberate role choice,
existing-Library matching, or server-side safety.

## Preconditions

- GitHub API and Web builds are green and Portainer pulled both `latest` images.
- A current database backup exists.
- At least one unresolved folder is available for safe testing.
- One existing Library Album can be matched without creating a duplicate.

## A. Three-stage Coach

- [ ] Open the Coach from Capture and confirm the visible journey is Intro, Snapshot,
  Result.
- [ ] Confirm all relevant Snapshot controls fit on one page at desktop width.
- [ ] Verify insufficient exposure plus “give it a chance” recommends Newly Discovered.
- [ ] Verify formative personal evidence recommends Classic.
- [ ] Verify familiar active return recommends Comfort Food.
- [ ] Verify continuing discovery recommends Still Growing.
- [ ] Verify personal value without active return recommends Admired.
- [ ] Confirm the Result explains the recommendation.
- [ ] Select a different role and confirm only that final role is saved.

## B. Archive distinctions

- [ ] Confirm ambiguity alone does not recommend Archive.
- [ ] Verify all four Archive reasons are offered and understandable.
- [ ] Confirm Archive cannot be saved without selecting a reason.
- [ ] Save each reason on disposable test Albums where practical.
- [ ] Reload in a second browser and confirm role and reason persist.
- [ ] Confirm existing legacy Archive Albums still open without an assigned reason.

## C. Coach entry points

- [ ] Run the Coach from Capture.
- [ ] Run it from Library editing.
- [ ] Run it from a Reflection Inbox item.
- [ ] Cancel each flow once and confirm no role mutation occurs.

## D. Unresolved Binding workflow

- [ ] Open Bindings with at least one unresolved folder and confirm only unresolved
  cards are shown initially.
- [ ] Activate a card by mouse, keyboard, and touch.
- [ ] Confirm the resolver offers existing Library candidates and manual search.
- [ ] Select an existing Album and confirm the Binding is immediately confirmed.
- [ ] Capture a new Album and confirm no additional Binding approval is required.
- [ ] Confirm the Album Coach opens after a new Capture.
- [ ] Resolve the final unresolved card and confirm the page switches calmly to All.
- [ ] Confirm delete and maintenance actions cannot be triggered by an accidental card
  click.

## E. Failure safety

- [ ] Interrupt or reject one Capture before completion and confirm no partial Album is
  visible in the Library.
- [ ] Confirm the Binding remains unresolved and can be retried.
- [ ] Temporarily stop the API and confirm typed/selected UI state does not falsely
  appear saved.

## F. Metadata punctuation

- [ ] Resolve or search `Smoke + Mirrors` successfully.
- [ ] Verify representative titles containing `_`, `:`, `&`, a typographic dash,
  apostrophe, and accented Unicode.
- [ ] Confirm the stored Album title is the selected provider title, not a silent
  filesystem-normalized replacement.

## G. Layout and language

- [ ] Verify Coach and Binding resolver in German and English.
- [ ] Verify desktop and narrow/mobile widths without clipped controls.
- [ ] Confirm visible focus, logical tab order, and sufficiently large touch targets.

## Acceptance

- [ ] Processing several unresolved Albums feels materially faster than before.
- [ ] No duplicate Library Album or half-confirmed Binding was created.
- [ ] No existing Rotation, Reflection, Export, or Library workflow regressed.
- [ ] Any deviations are documented before Sprint 83.1 is closed.
