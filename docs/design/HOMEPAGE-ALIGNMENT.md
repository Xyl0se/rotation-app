# Homepage Design Alignment

Status: Implemented on 2026-07-17; pending visual acceptance.

## Purpose

Bring the Home page back toward the original Rotation design language: a calm,
editorial music journal in which covers and reflection have priority over controls,
metrics, and dashboard density.

This pass changes the Home page and introduces a dedicated Insights page for content
removed from Home. Album Coach, Discover/Capture, Edit, Archive, Bindings, Export,
History, and Settings retain their intentional visual identities.

## Scope Boundary

The Home page receives a dedicated CSS boundary:

```tsx
<main className="home-page container">
```

Homepage rules must be nested below `.home-page`. Existing global tokens may be
deprecated in documentation, but this pass must not silently restyle other surfaces.

The shared header receives only two functional additions: an Insights navigation item
and an unobtrusive Bindings attention dot. Its general styling and logo are not
redesigned because they are visible on every page.

## Shape Contract

Arbitrary `small`, `medium`, and `large` radii have caused components to drift apart.
Future work should use purpose-based tokens instead.

### Radius tokens

| Token | Value | Use |
|---|---:|---|
| `--radius-standard` | `8px` | Buttons, inputs, Album Cards, Rotation tiles, ordinary panels, cover images |
| `--radius-dialog` | `12px` | Modal shells and deliberately elevated journeys only |
| `--radius-round` | `999px` | Semantic chips and badges only |
| circle | `50%` | Icon-only controls whose geometry is genuinely circular |

Rules:

- An element must not use a pill radius merely because it is clickable.
- Primary and secondary text buttons use `8px`.
- Homepage containers and Album Cards use `8px`.
- Role/status chips may remain pills because their shape communicates a tag.
- Album covers use `8px`, matching their Card rather than introducing another radius.
- New one-off radius values are not allowed without updating the Design System.

The implementation applies this contract only below `.home-page`. After visual
acceptance, other product surfaces can adopt it deliberately rather than through a
global breaking CSS change.

## Color Alignment

Homepage colors use only the original named palette:

| Purpose | Color |
|---|---|
| Page | Warm White `#FCFBF8` |
| Secondary section | Sand `#F3EEE7` |
| Individual Card | Paper `#FFFFFF` |
| Primary text/action | Ink `#2B2B2B` |
| Secondary text | Smoke `#6F6B66` |
| Divider | `#E8E2DA` |
| Mood accents | Sage, Dust Blue, Terracotta, Muted Gold, Blush |

Semantic success, information, warning, and error colors remain reserved for actual
status. They must not decorate ordinary Homepage Cards or actions.

The current green action colors `#5A7D5A` and `#4E6E4E` are not part of the original
sheet. Homepage primary actions therefore move to Ink. Sage may appear as a quiet
supporting accent, not as a generic button color.

## Typography

- Keep Inter for body text, labels, and controls.
- Use the existing editorial display face for headings in the first pass. The Design
  System permits both Cormorant Garamond and Playfair Display, so a font replacement is
  not required to restore alignment.
- Avoid uppercase labels and excessive letter spacing.
- Reduce competing headings: the page should have one clear visual hierarchy rather
  than several equally prominent module titles.

## Component Changes

### Buttons

- Replace Homepage pill buttons with `8px` corners.
- Primary action: Ink background, Paper text, no decorative gradient.
- Secondary action: Paper background, Ink border and text.
- Tertiary action: text-only with a restrained underline or arrow.
- Remove pronounced lift and scaling. Hover may change background/border and move by at
  most one pixel.
- Circular icon controls remain circular; they require an accessible label and tooltip.

### Album Cards

- Reduce Card radius from `16px` to `8px` on the Home page.
- Reduce shadow strength and remove the three-pixel hover lift.
- Keep the cover as the strongest object; tools remain visually secondary.
- Use Paper Cards on Warm White, with Divider borders where separation is needed.
- Avoid showing every maintenance action at equal weight.

### Focus Album

- Retain the prominent cover, but reduce the visual mass of the enclosing hero Card.
- Use an `8px` container and cover radius.
- Flatten the shadow and reduce unused internal vertical space.
- Keep the random-focus control as a circular icon exception.
- Keep the timeline behind its disclosure/tooltip rather than permanently expanding it.
- Add a quiet Edit action that opens the existing Album Edit dialog for the Focus Album.
  It may appear on pointer hover and keyboard focus, but must remain discoverable on
  touch devices. Hover must never be its only access path.

### Insights Page

- Add `Insights` as a first-class page and navigation destination.
- Move Reflection, linguistic Insights, and the neutral role overview from Home to
  this page.
- Preserve all existing Reflection actions and Coach entry points.
- Retire the generic Dashboard composition once its three responsibilities have moved;
  reuse the existing domain components instead of duplicating their logic.
- The Insights page remains editorial and reflective. It must not become an analytics
  control center or evaluate the size of Library roles.

### Player Rotation

- Keep the current Player Rotation layout and interaction model.
- Apply the corrected `8px` radii, named palette, quieter shadows, and spacing rhythm.
- Preserve draft review, replacement, and handover behavior.
- Composition chips remain pills because they are semantic tags.
- Use one primary action per state; secondary operations remain visually subordinate.

### Library

- Keep ten Albums per page and newest-first ordering.
- Establish a clear section break before the Library so it does not merge visually with
  the Rotation workflow.
- Apply the `8px` Card contract without changing Library behavior or filtering.

## Page Rhythm

Preferred reading order:

1. Focus Album
2. Active or proposed Player Rotation
3. Library

Reflection, Insights, and the neutral role overview live on the dedicated Insights
page and no longer interrupt the primary Home journey.

Use the existing 8px spacing grid. Sections should primarily use 32, 48, or 64 pixels
of separation. More Cards are not a substitute for rhythm.

## Illustrative Elements

The original record-groove, wave, sun, and botanical motifs may return only as subtle,
non-interactive Homepage decoration. They must:

- use the named palette;
- remain behind content;
- preserve text contrast;
- disappear or simplify on narrow screens;
- respect `prefers-reduced-motion` and never animate continuously.

Illustrations are deferred. Shape, color, hierarchy, navigation, and density must be
accepted first. They may be reconsidered as a separate polish pass only if the aligned
Homepage still needs atmosphere.

## Bindings Attention Indicator

Remove the unbound-Album banner and its dismissal state from Home. Replace it with a
small attention dot attached to the Bindings navigation label when one or more orphaned
music folders are waiting for capture.

- The dot is an indicator, not a warning or error state.
- It uses a restrained palette accent rather than semantic error red.
- Assistive text exposes the meaning and number of waiting folders.
- A tooltip/title explains the dot to pointer users.
- The indicator disappears when the orphan count reaches zero.
- Binding/orphan state should be owned at app-shell level or shared through a provider,
  avoiding separate stale requests from Header and Home.
- Removing the banner also removes the `rotation:orphanPromptDismissed` Homepage state;
  no migration is needed because it is only a disposable device preference.

## Explicit Non-Goals

- No changes to Album, Rotation, Binding, or Reflection domain rules.
- No redesign of dialogs, Coach journeys, Bindings, Export, History, or Settings.
- No global replacement of all existing radius tokens in the first pass.
- No new dashboard metrics.
- No removal of accessible labels, focus states, or mobile controls.

## Acceptance Criteria

- Homepage text buttons and ordinary Homepage containers use an `8px` radius.
- Pills are limited to role/status/composition chips; icon-only round controls are true
  circles.
- Homepage primary actions no longer use the off-palette green action colors.
- Cards have quieter shadows and no pronounced hover lift or scale.
- Focus, Rotation, and Library have a clear reading order on Home.
- Reflection, Insights, and role overview are reachable on the dedicated Insights page
  with their existing behavior intact.
- Focus Album offers an accessible path into the existing Album Edit dialog.
- The Home orphan banner is absent; Bindings shows an accessible attention dot only
  while orphaned folders exist.
- The page remains usable at desktop and 390px width without horizontal overflow.
- Keyboard focus remains visible and contrast meets WCAG AA.
- Visual regression review confirms that non-Homepage dialogs and pages did not change.
- All existing functional tests remain green.

## Resolved Decisions

1. Reflection, Insights, and role overview move to a dedicated Insights page.
2. Player Rotation retains its current layout and receives only the aligned visual
   treatment.
3. Illustrative elements are deferred until after structural and visual acceptance.
4. Focus Album gains an accessible Edit entry point.
5. The Homepage orphan banner is replaced by an accessible Bindings attention dot.
