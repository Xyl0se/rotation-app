# Sprint 90G — Visual Language: 90s CD-Player Skeuomorphism

## Acceptance Criteria

### Chassis
- [ ] The bottom band renders as a self-contained visual object with a dark matte-black housing (`#1a1a1a` → `#0d0d0d` gradient).
- [ ] Rounded front edges (`border-radius: 12px 12px 0 0`) with a faint bevel shadow suggesting physical depth.
- [ ] Four corner screw heads (CSS-generated) as subtle mechanical detail.

### Display window
- [ ] A glossy plastic-glass overlay (`::before`-style gradient at 160deg) simulates acrylic reflection above the text area.
- [ ] The display itself is a recessed dark panel (`#0a0a0a`) behind the glass overlay.

### Typography
- [ ] All track information, elapsed time, and status text use the **Doto** font family (Google Fonts, loaded in `index.html`).
- [ ] Bright cyan glow (`#5cdbff`, `#7ee8ff`) with soft `text-shadow` to simulate vacuum-fluorescent / LED dot-matrix luminance.
- [ ] Secondary labels (artist, album) render in a slightly dimmer cyan (`#3ba8c4`); the active track title uses the brightest cyan (`#7ee8ff`).

### Controls
- [ ] Physical push-button look using `box-shadow` with dark outer bevel and bright inner highlight.
- [ ] Active / pressed state inverts the shadow to an `inset` appearance with `translateY(1px)`.
- [ ] Play/Pause is the largest and most central control.
- [ ] Stop is a smaller adjacent button.
- [ ] Expand / collapse and Restart sit behind the discrete detail toggle, not competing with primary transport.

### Album artwork
- [ ] A small square thumbnail (40 × 40 px) on the far left of the band.
- [ ] Slightly rounded corners (4 px) reading as a physical mini cover inside the player chassis.

### Progress
- [ ] A thin horizontal line below the display, rendered as a calm cyan bar (`#5cdbff`) against a dark recessed track (`#0a0a0a`).
- [ ] Small tick marks at Track boundaries; the current Track marker is slightly brighter/taller.
- [ ] No interaction; purely read-out.

### Coexistence
- [ ] The band is visually self-contained: it carries its own blacks, its own glows, and its own surface model.
- [ ] Dialog overlays, page content, and the warm paper palette of Rotation remain untouched.
- [ ] Page content receives adequate bottom padding (`padding-bottom: 120px` desktop, `110px` mobile) so nothing is hidden.

### Accessibility preserved
- [ ] `role="region"` with descriptive `aria-label` remains on the band.
- [ ] `aria-pressed` on Play/Pause toggle button.
- [ ] `aria-expanded` on expand/collapse button.
- [ ] `aria-live="polite"` live region for dynamic status.
- [ ] `role="alert"` on error messages.
- [ ] `role="alertdialog"` with `aria-labelledby` for restart confirmation.
- [ ] `@media (prefers-reduced-motion: reduce)` removes the `width` transition from `AlbumProgress` fill.

### Technical verification
- [ ] TypeScript strict mode compiles without errors.
- [ ] ESLint passes for both frontend and server.
- [ ] All 375 frontend unit tests pass (including 6 `AlbumProgress` tests and 13 `AlbumSessionBand.accessibility` tests).
- [ ] Google Font "Doto" loads correctly (verified via Network tab).

## Test Commands

```bash
# TypeScript
npx tsc --noEmit

# Lint
npm run lint

# Frontend unit tests
npx vitest run
```

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Implementation | Cline | 2026-07-21 | ✅ |
| Product Review | — | — | Pending |
| QA / NAS | — | — | Pending |