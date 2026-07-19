# Sprint 86.3 — Memory Prompts NAS Acceptance

**Status:** Accepted on production NAS — 2026-07-19 ✅

## Preconditions

- [x] API and Web `latest` images originate from the same green commit.
- [x] The Sprint 86.1 and 86.2 acceptance remains green.
- [x] At least three Albums have different combinations of missing Story fields.

## A. Story answers

- [x] Open Album editing and confirm “iTunes / Online” is available under acquisition.
- [x] Confirm “Ich erinnere mich nicht” / “I don't remember” is available for both
      acquisition and life phase.
- [x] Save each new value, reload the browser, and confirm server persistence.
- [x] Confirm the options are also available during new Album Capture.

## B. Memory Prompt

- [x] Open Insights and confirm at most one Memory Prompt is visible.
- [x] Confirm it names an existing Album and asks only about a genuinely missing field.
- [x] Reload repeatedly and confirm Album and question remain stable.
- [x] Open the prompt action and confirm the existing Album editor appears at the
      current viewport.
- [x] Complete the requested field, save, and confirm the resolved prompt disappears
      or changes to another eligible Album.

## C. Explicit unknown and privacy

- [x] Set both Story fields to the explicit unknown answer and confirm that Album is no
      longer offered as incomplete.
- [x] Confirm unknown does not appear as a personal-history narrative or Rotation
      explanation.
- [x] Confirm `/api/insights` contains no `memoryNote` or Journal prose.
- [x] Confirm merely opening or reloading Insights performs no write request.

## D. Regression and language

- [x] Verify prompt and new options in DE and EN.
- [x] Confirm analytical narratives and the Role overview still render normally.
- [x] Smoke-test Album Capture, Album editing, Library, Reflection, and Settings.

## Acceptance

- [x] Missing history feels like a quiet invitation rather than a validation error.
- [x] A deliberate lack of memory is respected and not asked again.
- [x] Weekly stability and direct editing work on the production NAS.
