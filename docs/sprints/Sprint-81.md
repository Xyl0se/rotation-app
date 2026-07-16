# Sprint 81 — Product Shell & Interaction Polish

**Status:** Planned — begins after Sprint 80 establishes server-owned settings

**Target version:** `v0.28.1-dev`

**Type:** Product identity, navigation, accessibility, and localization

---

## Goal

Give Rotation a coherent global shell and move operational preferences into a
dedicated Settings area, while reducing persistent visual weight on the Home page.

## Workstream 81A — Header and Product Mark

- Move the Rotation name into one global header shared by every page.
- Add a repository-native SVG mark combining Album, recurrence, and movement.
- Integrate Home, Bindings, Export, and Settings navigation responsively.

## Workstream 81B — Settings Machine Room

- Add a fourth Settings page with a metallic/chrome machine-room identity.
- Move DE/EN language selection from the Home footer into Settings.
- Display server-owned Rotation composition controls once Sprint 80 exposes them.
- Keep controls legible, keyboard accessible, and usable on touch devices.

## Workstream 81C — Focus and Home Density

- Replace the permanently expanded Focus Album timeline with an accessible popover.
- Render the unbound-folder notice in the compact server-status-banner format.
- Preserve direct navigation to Bindings without implying one unnamed Album.

## Workstream 81D — Language and Product Copy

- Remove the internal “Album Coach” label from the visible Coach introduction.
- Convert Insights from hard-coded English prose to localized message codes/params.
- Audit all Home, Focus, Timeline, and Settings states in German and English.

## Definition of Done

- [ ] One responsive branded header serves all four pages.
- [ ] Settings contains language and server-owned Rotation composition controls.
- [ ] Focus history is available through an accessible popover on pointer and touch.
- [ ] The unbound-folder notice is compact and actionable.
- [ ] No internal Album Coach label is visible to users.
- [ ] Insights display no English fallback prose when German is active.
- [ ] Accessibility and responsive regression tests cover the new shell.

## Non-Goals

- Reopening server ownership decisions from Sprint 80
- User accounts or per-user Settings
- Native/offline applications
