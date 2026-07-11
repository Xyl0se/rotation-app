# ADR 006: Identity Refresh — Design System as Binding Foundation

## Status

Accepted

## Context

Rotation grew organically. Colors, spacing, shadows, and radii emerged situationally. The interface felt like grown-together code, not like a designed product.

Sprint 46.5 was meant to give Rotation a distinct visual identity for the first time.

## Decision

Rotation receives a binding Design System. All existing and new components must orient themselves to its rules.

The Design System defines:
- Color palette (warm, reduced, not colorful)
- Typographic hierarchy (readable, not decorative)
- Spacing system (rhythmic, not arbitrary)
- Component rules (buttons, cards, dialogs, forms)
- Motion guidelines (subtle, not conspicuous)

The implementation is not a pixel-perfect replica, but a consistent translation of the principles into code.

## Consequences

- `docs/DESIGN_SYSTEM.md` is a binding foundation throughout the entire development.
- Colors come exclusively from the Design System.
- Buttons, cards, dialogs, and forms have a uniform design language.
- Animations are subtle and uniform.
- New features must not work with ad-hoc styles.
