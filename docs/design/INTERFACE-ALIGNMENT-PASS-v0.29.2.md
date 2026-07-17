# Interface Alignment Pass v0.29.2

**Status:** Implemented on 2026-07-17; pending visual acceptance on NAS

## Purpose

Complete the first post-release design alignment without changing Rotation domain
behavior. Home remains the accepted visual anchor. This pass aligns the shared
navigation and Bindings workspace with that system while preserving each page's
intentional identity.

## Scope Boundary

Included:

- global navigation order;
- Bindings page visual language and responsive information layout;
- Homepage semantic-tag geometry;
- Focus Album Card composition.

Excluded:

- Reflection and Insights rules;
- Album, Binding, Rotation, or export persistence;
- local music-file cover extraction;
- redesign of Coach, Discover/Capture, Album Edit, Export, or Settings.

## Workstream A — Navigation Order

Use this primary order on desktop and narrow navigation:

1. Home
2. Insights
3. Export
4. Bindings
5. Settings

The Bindings attention dot remains attached to Bindings and must not alter layout or
be announced as an error. Active, hover, focus, and touch states remain accessible.

## Workstream B — Bindings as the Record-Shop Back Room

Bindings should feel like the technical stockroom behind a calm record shop: shelves,
labels, inventory references, and precise maintenance tools rather than a generic dark
dashboard.

- Retain the darker page-wide workspace, but replace decorative orange actions with a
  restrained technical palette based on Charcoal, Ink, Dusty Blue, Steel neutrals,
  Paper labels, and semantic colors only for real status.
- Use a legible monospace face for paths, scan IDs, evidence, timestamps, and compact
  technical labels. Album names, explanations, and primary actions remain in Inter.
- Apply the shared `8px` standard radius to Cards, text buttons, inputs, labels, and
  ordinary containers. Reserve circles for genuinely circular icon actions.
- Reduce ornamental gradients and make shelf/rail motifs structural and quiet.
- Preserve strong contrast and readable type sizes; “technical” must not mean dim or
  cramped.

### Binding Card layout

Desktop uses a two-column Card grid, analogous to the Library: two complete Binding
Cards sit next to each other. Each individual Card remains a compact single-column
record with source information first and resolution/actions below it.

- Keep the source path visually traceable within each Card.
- Group buttons with at least 8px internal gaps and 16px edge clearance.
- Put destructive actions last and visually separate them from the primary resolution.
- Collapse the Card grid to one Card per row on narrow screens without reordering
  status after destructive actions.

## Workstream C — Homepage Tag Geometry

Homepage role and state tags no longer use fully pill-shaped ends. Use the same `8px`
standard radius as ordinary Homepage controls, with compact horizontal padding.

This is a deliberate refinement of the earlier Homepage contract: semantic meaning is
conveyed by label, color, and placement rather than by a `999px` pill silhouette.
Circular icon-only controls remain unchanged.

## Workstream D — Three-Column Focus Card

On wide layouts, compose the Focus Card as:

```text
| Album artwork | Album identity and story | Listening status and actions |
```

- Column 1: cover as the strongest visual object.
- Column 2: title, artist, year/role, and the quiet entry into Album editing/history.
- Column 3: listening sessions, last-listened context, and the primary “Gehört” action
  aligned to the upper-right, matching the action logic of Rotation Cards.
- Keep random Focus and edit/history actions visually secondary.
- Collapse to two columns and then one column at bounded breakpoints; the “Gehört”
  action must remain visible without hover.
- Long titles, missing covers, missing listening history, DE/EN copy, keyboard focus,
  and touch layouts are acceptance cases.

## Definition of Done

- [x] Navigation order is Home, Insights, Export, Bindings, Settings everywhere.
- [x] Bindings uses the technical stockroom identity without orange decorative actions.
- [x] The Binding list shows two complete Cards per row on desktop and one per row on
  narrower screens; each Card remains internally single-column.
- [x] Ordinary Bindings elements and Homepage tags use the shared 8px radius.
- [x] Focus is three-column on wide screens with “Gehört” at top right.
- [x] No domain behavior or persistence contract changes.
- [x] Automated DE/EN structure, keyboard semantics, long-path wrapping, and responsive
  layout contracts pass; 390px and desktop appearance await NAS visual acceptance.
- [ ] Visual review confirms specialist dialogs and Export remain unchanged.
