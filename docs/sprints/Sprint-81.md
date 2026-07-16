# Sprint 81 — Product Shell & Interaction Polish

**Status:** Implemented — production visual acceptance pending

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
- Add a server-owned Rotation default-settings contract instead of storing composition
  preferences in the browser or deriving them from the most recent RotationPlan.
- Let the user configure both the maximum Rotation size and the quota for every
  eligible role: Newly Discovered, Comfort Food, Classic, and Still Growing.
- Start from the accepted default of at most 25 Albums: 10 Newly Discovered and 5
  each of Comfort Food, Classic, and Still Growing. These values are defaults, not
  permanent hard-coded product limits.
- Require non-negative integer role quotas and a positive maximum size. The effective
  selection must never exceed either a role quota or the configured total maximum.
- Show the quota sum and a clear warning when it differs from the maximum. If the sum
  is greater, the total maximum wins; if it is smaller or the Library lacks candidates,
  the generated Rotation remains smaller rather than silently reallocating slots.
- Apply changed defaults only to newly generated Rotations. Existing draft and active
  Rotations remain stable until the user deliberately generates a new one.
- Persist and return the settings through explicit API endpoints, include them in
  backup/restore, and use confirmed-mutation plus retry behavior consistent with the
  other server-owned state.
- Keep controls legible, keyboard accessible, and usable on touch devices.

## Workstream 81C — Focus and Home Density

- Replace the permanently expanded Focus Album timeline with an accessible popover.
- Render the unbound-folder notice in the compact server-status-banner format.
- Preserve direct navigation to Bindings without implying one unnamed Album.

## Workstream 81D — Language and Product Copy

- Remove the internal “Album Coach” label from the visible Coach introduction.
- Convert Insights from hard-coded English prose to localized message codes/params.
- Audit all Home, Focus, Timeline, and Settings states in German and English.

## Workstream 81E — Reflective Workflow Dialogs

- Give Archive Protection and Archive Return the same reflective blue visual system
  as the Album Coach instead of presenting them as generic application dialogs.
- Reuse the Coach's typography, spacious layout, atmospheric background, button
  treatment, focus states, and responsive behavior without merging their distinct
  domain questions or outcomes.
- Keep cancellation/later actions clearly available and accessible on pointer,
  keyboard, and touch devices.

## Definition of Done

- [x] One responsive branded header serves all four pages.
- [x] Settings contains language, total Rotation size, and per-role server-owned
  composition controls with the documented validation and precedence rules.
- [x] Reload and a second browser show the same confirmed Rotation settings; new
  settings affect only newly generated Rotations.
- [x] API, migration, backup/restore, generator, and UI regression tests cover default,
  custom, invalid, over-subscribed, and under-subscribed compositions.
- [x] Focus history is available through an accessible popover on pointer and touch.
- [x] The unbound-folder notice is compact and actionable.
- [x] No internal Album Coach label is visible to users.
- [x] Insights display no English fallback prose when German is active.
- [x] Archive Protection and Archive Return visually match the Album Coach across
  desktop and mobile while retaining their own localized content.
- [x] Accessibility and responsive regression tests cover the new shell.

## Implementation Notes

- Migration 7 persists one server-owned settings record with the accepted `25 / 10–5–5–5`
  defaults; `GET` and `PUT /rotation-state/settings` provide the confirmed contract.
- Newly generated plans load the current settings immediately before generation.
  Existing plans retain their stored target and quota snapshot.
- The Settings machine room exposes language, total size, every eligible role quota,
  quota-sum warnings, and explicit save/retry behavior.
- The global SVG product mark and responsive navigation now frame Home, Bindings,
  Export, and Settings consistently.
- Focus history uses native accessible disclosure, Insights and archive questions use
  DE/EN catalog copy, and reflective archive dialogs reuse the Coach visual system.

## Non-Goals

- Reopening server ownership decisions from Sprint 80
- User accounts or per-user Settings
- Native/offline applications
