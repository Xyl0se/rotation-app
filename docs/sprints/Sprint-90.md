# Sprint 90 — Whole Album Session

**Status:** In Progress — Workstream 90A completed, Workstreams 90B–90G planned

**Target version:** Future major product capability

**Type:** Persistent application-shell playback, Album attention, and Listening capture

## Goal

Complete Rotation's attention loop with a calm browser experience for listening to one
Album from its beginning to its end. The interface offers Play/Pause rather than a set
of Track-navigation decisions and stays present as a restrained bottom band while the
user moves through Rotation.

> Rotation does not play Tracks. Rotation plays an Album.

## Product philosophy

The Album Session is a cooperative listening environment, not a technical restriction
system. Rotation intentionally omits skipping and seeking because they conflict with
the experience, but it does not attempt to defeat developer tools, direct media URLs,
or operating-system capabilities.

The interface should reduce decisions without punishing interruption. Pausing,
stopping, recovering from an error, and deliberately restarting remain legitimate.

## Approved interaction model

An Album Session:

- always starts with the first Track of the first disc;
- advances automatically in canonical manifest order;
- exposes Play/Pause as its central control;
- allows the user to stop the Session;
- permits "Restart Album" as a deliberate, confirmed action;
- has no next, previous, shuffle, repeat, queue, speed, or Track selection controls;
- has no mouse-, touch-, or keyboard-operable seek control;
- leaves volume primarily to the browser, operating system, or playback device.

## Persistent bottom band

The Player lives once in the application shell rather than inside an individual page.
It remains mounted across Home, Insights, Export, Bindings, Settings, History, and Album
Detail navigation.

Its compact state shows:

- cached Album artwork;
- artist and Album title;
- current Track title and `Track n of m` context;
- Play/Pause;
- a read-only whole-Album progress line with Track-boundary markers;
- elapsed and total Album time where space and accessibility permit;
- a restrained way to expand Session details or stop playback.

No page may create a second competing audio element or separate playback authority.

## Workstream 90A — Playback coordinator ✅ Completed

- [x] Formal state-machine with 8 states (`idle`, `loading`, `playing`, `paused`,
      `stopping`, `completed`, `recoverable-error`, `terminal-error`) implemented in
      `src/domain/album-session/albumSessionState.ts`.
- [x] Stale-session guards via `lastSessionId`; duplicate `TRACK_ENDED` deduplication
      via `completedTracks`; rapid Play/Pause toggle guard via `lastToggleAt`.
- [x] `AlbumSessionProvider` owns the single `HTMLAudioElement`, wires all audio events,
      handles preload policy, and drives `audio.play()` / `audio.pause()` from state.
- [x] `useAlbumSession` hook exposes thin read/write interface to components.
- [x] `AlbumPlayer` migrated from legacy `useAlbumPlayback` to new coordinator.
- [x] `main.tsx` wrapped with `AlbumSessionProvider`.
- [x] 45 unit tests covering every legal transition, stale-event rejection, and edge
      cases (double-start, rapid toggle, duplicate ended, empty manifest).
- [x] All 297 frontend tests and 350 server tests passing; TypeScript strict; lint clean.

**Implementation notes:**
- Session ID is generated once in `start()` and passed through the `START` action so
  `MANIFEST_LOADED` / `MANIFEST_FAILED` share the same ID (fixed session-ID mismatch bug).
- `resolveMediaUrl()` resolves relative manifest paths to absolute URLs before comparing
  with `audio.src` (fixed "operation was aborted" bug from constant src resets).
- Recovery infrastructure (`sessionStorage` read/write) is in place for Workstream 90E.

Suggested state model (implemented):

```text
idle -> loading -> playing <-> paused
                  -> stopping -> idle
                  -> completed
                  -> recoverable-error -> playing (retry)
                  -> terminal-error
```

## Workstream 90B — Whole-Album timeline ✅ Completed

- [x] `trackTimeline.ts` domain module: `getTrackBoundaries()`, `getTrackContext()`,
      `getElapsedAlbumTime()`, `formatAlbumTime()`, `getTotalAlbumDuration()`,
      `isDiscBoundary()` with full test coverage (26 tests).
- [x] `AlbumProgress` component: semantic `role="progressbar"` with `aria-valuenow`,
      Track tick markers at cumulative positions, current-Track highlight,
      disc-boundary distinction, elapsed/total time display. No interaction handlers.
- [x] `AlbumSessionBand` component: persistent fixed bottom band with Album cover,
      artist/title, current Track + "Track n of m", Play/Pause, Stop, expand/collapse,
      and whole-Album progress. Survives all internal page transitions.
- [x] Integrated into `App.tsx` as persistent shell component; pages receive bottom
      padding so content is never hidden.
- [x] Full i18n support (DE/EN) for all player controls and labels.
- [x] CSS: dark gradient band, cyan progress fill, Track tick markers, responsive
      mobile layout.
- [x] 6 component tests for `AlbumProgress` covering progressbar semantics, tick
      markers, current-Track highlight, time display, absence of clickable elements,
      disc boundaries, and zero-duration fallback.

## Workstream 90C — Cooperative media controls ✅ Completed

- [x] No native browser audio controls exposed (`HTMLAudioElement` without `controls`).
- [x] Media Session API integration: `navigator.mediaSession.metadata` updated with
      title, artist, album, and artwork on every track/state change.
- [x] `setActionHandler("play")` → `resume()`; `setActionHandler("pause")` → `pause()`.
- [x] **No** `seekbackward`, `seekforward`, `previoustrack`, `nexttrack` handlers
      registered — browser/OS cannot suppress these, but Rotation intentionally omits them.
- [x] Full keyboard accessibility: all controls are `<button>` elements with visible focus.
- [x] Screen-reader support:
  - `role="region"` with descriptive `aria-label` (artist — album).
  - `aria-pressed` on Play/Pause toggle button.
  - `aria-expanded` on expand/collapse button.
  - `aria-live="polite"` live region for dynamic status (error, completed, playing).
  - `role="alert"` on error messages.
  - `role="alertdialog"` with `aria-labelledby` for restart confirmation.
- [x] Reduced motion: `@media (prefers-reduced-motion: reduce)` removes the
      `width` transition from `AlbumProgress` fill so the real position is never obscured.
- [x] i18n keys added for screen-reader status text (DE/EN): `nowPlaying`,
      `errorOccurred`, `albumCompleted`, `loading`, plus `common.cancel`.
- [x] 9 component tests covering region semantics, `aria-pressed`, `aria-expanded`,
      `aria-live`, alert roles, alertdialog, and idle-state absence.

## Workstream 90D — Entry points

Allow "Start Album Session" only for Albums with a confirmed playable manifest from:

- Focus Album;
- an Album in the active Player Rotation;
- the Sprint 88 Album Detail page.

Library-wide playback may be evaluated after production use. It is not required for the
first release because Focus, active Rotation, and Album Detail are the intentional
attention contexts.

Unavailable Albums explain whether the Binding, ordering, file, or codec is the reason
without exposing internal paths.

## Workstream 90E — Interruption and recovery

- Pause/resume preserves the current Track position in the active tab.
- Internal navigation never interrupts the Session.
- A recoverable network or Track error offers retry of the same position where the
  browser and source permit, stop, or restart; it never silently skips ahead.
- Define a bounded browser-local reload recovery record with Album/manifest identity,
  Track, and position.
- On reload, ask whether to continue the interrupted Session or restart the Album; do
  not auto-play because browsers and user intent may prohibit it.
- A changed or invalid manifest invalidates recovery calmly.
- Cross-browser and cross-device position synchronization remains out of scope.

## Workstream 90F — Listening completion and Journal

- Starting, loading, pausing, retrying, stopping, or restarting does not count as a
  Listening Event.
- Version one completes only when the final Track reaches its natural `ended` event
  through the coordinator's canonical sequence.
- Completion uses an idempotency key so duplicate browser events or retries cannot
  create two Listening Events.
- After server confirmation, offer the existing optional Listening Journal overlay.
- Record the Listening Event through the canonical server-owned flow with a source such
  as `album-session` only if the domain contract is explicitly extended and migrated.
- Insights and Reflection consume the resulting canonical Listening Event normally;
  they do not receive private playback telemetry.

Alternative "nearly complete" thresholds are explicitly deferred until real use proves
that natural completion is too strict.

## Workstream 90G — Visual language: 90s CD-Player Skeuomorphism

The bottom band is deliberately skeuomorphic — a self-contained visual object that
references 1990s Hi-Fi CD players. It does not adopt Rotation's warm editorial palette
for its own surfaces; instead it establishes its own material vocabulary as a persistent
listening instrument.

### Chassis

- Dark matte-black housing with a subtle top-to-bottom gradient (`#1a1a1a` → `#0d0d0d`).
- Rounded front edges with a faint bevel shadow to suggest physical depth.
- Four corner screw heads (CSS or inline SVG) as subtle mechanical detail.

### Display window

- A glossy plastic-glass overlay above the text area using a semi-transparent
  white linear-gradient at an angle to simulate acrylic reflection.
- The display itself is a recessed dark panel behind this glass.

### Typography

- **Display font:** [Doto](https://fonts.google.com/specimen/Doto) (Google Fonts),
  a rounded geometric dot-matrix typeface.
- All track information, elapsed time, and status text in Doto at small sizes
  (12–14 px).
- Bright cyan glow on the characters (`#5cdbff` or `#7ee8ff`) with a soft
  `text-shadow` to simulate vacuum-fluorescent / LED dot-matrix luminance.
- Secondary labels (artist, album) in a slightly dimmer cyan; the active track
  title in the brightest cyan.

### Controls

- Physical push-button look using `box-shadow` with dark outer bevel and bright
  inner highlight.
- Active / pressed state inverts the shadow to an `inset` appearance.
- Play/Pause is the largest and most central control.
- Stop is a smaller adjacent button.
- Expand / collapse and Restart sit behind a discrete detail toggle, not
  competing with the primary transport.

### Album artwork

- A small square thumbnail (40 × 40 px) on the far left of the band.
- Slightly rounded corners (4 px) so it reads as a physical mini cover inside
  the player chassis.

### Progress

- A thin horizontal line below the display, rendered as a calm cyan bar against
  a dark recessed track.
- Small tick marks at Track boundaries; the current Track marker slightly
  brighter or taller.
- No interaction; purely read-out.

### Coexistence with the rest of Rotation

- The band is visually self-contained: it carries its own blacks, its own
  glows, and its own surface model.
- Dialog overlays, page content, and the warm paper palette of Rotation remain
  untouched. The band sits above them as a fixed appliance.
- Page content receives adequate bottom padding so nothing is hidden behind the
  player.

## Verification

- State-machine unit tests cover every legal transition and reject stale/duplicate
  events.
- Component tests cover persistence across page navigation, keyboard behavior, progress
  semantics, Track markers, and the absence of seek/skip controls.
- Integration tests cover manifest loading, Range playback, automatic transitions,
  pause/resume, retry, stop, restart, reload recovery, and idempotent completion.
- Listening tests prove partial and failed Sessions create no event, while one complete
  Session creates exactly one event and can open the Journal.
- Production NAS acceptance uses normal, multi-disc, continuous/live, Unicode,
  unsupported, and corrupt Albums in DE and EN.
- Long-session testing covers browser backgrounding, reverse-proxy timeout, API restart,
  and resource cleanup.

## Definition of Done

- [x] A playable bound Album can be heard automatically from first to final Track. *(90A — state machine + audio control)*
- [ ] One persistent bottom band survives every internal page transition. *(90B–G)*
- [ ] Play/Pause is central; no Rotation UI permits Track skip or seeking. *(90B–G)*
- [ ] Whole-Album progress and Track boundaries are accurate and read-only. *(90B)*
- [ ] Pause, stop, restart, errors, and reload recovery preserve user agency. *(90A foundation + 90E recovery dialog)*
- [ ] Final natural completion creates exactly one canonical Listening Event. *(90F)*
- [ ] Partial, stopped, and failed Sessions create no Listening Event. *(90F)*
- [ ] The optional Journal integrates without making completion dependent on writing. *(90F)*
- [ ] Accessibility, DE/EN, browser compatibility, automated tests, and NAS acceptance
      pass. *(ongoing)*
- [ ] Production use still feels like Rotation, not a generic streaming player. *(90G)*

## Non-goals

- Track-centric browsing or playback
- Next, previous, seek, scrub, shuffle, repeat, queue, or playback-speed controls
- Playlist import or creation
- Streaming from third-party music services
- Cross-device playback control or synchronization
- Social listening, casting, AirPlay, or Chromecast guarantees
- Listening scores, completion streaks, or gamification
- DRM-style enforcement against direct technical access