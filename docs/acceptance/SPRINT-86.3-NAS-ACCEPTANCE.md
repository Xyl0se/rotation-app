# Sprint 86.3 — Memory Prompts NAS Acceptance

## Preconditions

- [x] API and Web `latest` images originate from the same green commit.
- [x] The Sprint 86.1 and 86.2 acceptance remains green.
- [x] At least three Albums have different combinations of missing Story fields.

## A. Story answers

- [ ] Open Album editing and confirm “iTunes / Online” is available under acquisition.
- [ ] Confirm “Ich erinnere mich nicht” / “I don't remember” is available for both
      acquisition and life phase.
- [ ] Save each new value, reload the browser, and confirm server persistence.
- [ ] Confirm the options are also available during new Album Capture.

## B. Memory Prompt

- [ ] Open Insights and confirm at most one Memory Prompt is visible.
- [ ] Confirm it names an existing Album and asks only about a genuinely missing field.
- [ ] Reload repeatedly and confirm Album and question remain stable.
- [ ] Open the prompt action and confirm the existing Album editor appears at the
      current viewport.
- [ ] Complete the requested field, save, and confirm the resolved prompt disappears
      or changes to another eligible Album.

## C. Explicit unknown and privacy

- [ ] Set both Story fields to the explicit unknown answer and confirm that Album is no
      longer offered as incomplete.
- [ ] Confirm unknown does not appear as a personal-history narrative or Rotation
      explanation.
- [ ] Confirm `/api/insights` contains no `memoryNote` or Journal prose.
- [ ] Confirm merely opening or reloading Insights performs no write request.

## D. Regression and language

- [ ] Verify prompt and new options in DE and EN.
- [ ] Confirm analytical narratives and the Role overview still render normally.
- [ ] Smoke-test Album Capture, Album editing, Library, Reflection, and Settings.

## Acceptance

- [ ] Missing history feels like a quiet invitation rather than a validation error.
- [ ] A deliberate lack of memory is respected and not asked again.
- [ ] Weekly stability and direct editing work on the production NAS.
