# Rotation v0.50.0

Halfway to 1.0. This release closes the core Album listening loop with a persistent
browser-native playback experience, completes the navigation restructuring started in
earlier sprints, and polishes the visual language across the app.

## Highlights

### Whole Album Session (Sprint 90)
- **Persistent bottom player band** — A skeuomorphic 1990s Hi-Fi CD player lives in the
  application shell, surviving every page transition. Dark matte-black chassis, Doto
  dot-matrix display font, cyan vacuum-fluorescent glow.
- **State-machine playback coordinator** — 8-state machine (`idle` → `loading` → `playing`
  ↔ `paused` → `stopping`/`completed`/`recoverable-error`/`terminal-error`). Single
  `HTMLAudioElement`, no competing audio authorities.
- **Whole-Album timeline** — Read-only progress bar with Track-boundary tick marks,
  disc-boundary distinction, elapsed/total Album time. No seeking, no skipping.
- **Cooperative media controls** — Media Session API integration, full keyboard
  accessibility, screen-reader live regions, reduced-motion support.
- **Entry points** — Focus Album, Album Detail, and Library all offer Play/Pause/Resume
  via compact circular icon buttons.
- **Interruption & recovery** — Browser-reload recovery dialog asks whether to continue
  or restart. 24-hour expiry, manifest compatibility validation.
- **Visual language** — Self-contained player aesthetic that does not bleed into Rotation's
  warm editorial palette. Dialog overlays stay above the band (`z-index` hierarchy).

### Navigation Restructure (Sprint 90G follow-up)
- **Library becomes a top-level page** — "Bibliothek" in the header nav, between Start
  and Insights. Full library functionality (edit, delete, archive, coach, detail) moved
  out of the Home page.
- **Home page reduced** — Focus Album + Player Rotation only. Clean, calm, no scrolling.
- **History removed from nav** — Album timeline and rotation history are better served
  inside the Album Detail view.

### Visual Polish
- **Icon buttons everywhere** — Fokuscard and Album Detail use consistent 28px circular
  icon buttons (▶ Play, 📝 Journal, ✎ Edit) instead of mixed text/labeled buttons.
- **Dialog safety** — Dialog overlay `z-index` raised above the player band; bottom
  padding ensures dialog buttons are never cut off.
- **Journal dialog colors** — Legend text now matches the warm Dialog palette instead of
  inheriting cyan from the player band.

## Known Limitations

- **90F deferred** — Natural Album completion does not yet auto-create a Listening Event.
  The existing "Gehört" button and manual Journal flow remain the canonical capture path.
- Player band height is fixed; very small viewports may still need scrolling.

## Deployment

- Back up the complete data directory and record currently running API/Web image digests.
- Wait for both publish workflows belonging to the same `v0.50.0` source commit, then
  redeploy matching API and Web `latest` images together.
- Run the health smoke and verify Library reads, Playback start/stop, Recovery dialog,
  and Cover rendering before creating the `v0.50.0` Git tag.
- Roll back both recorded image digests and the matching pre-deployment data backup
  together; do not start an older API against a database migrated by this release.

Production images intentionally use only the moving `latest` channel. The Git tag marks
accepted source and release notes; it is not a container rollback tag.