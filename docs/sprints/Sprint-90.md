# Sprint 90 — Whole Album Session

**Status:** Planned — depends on Sprint 89 go decision

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
- permits “Restart Album” as a deliberate, confirmed action;
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

## Workstream 90A — Playback coordinator

- Add one application-level playback coordinator backed by the Sprint 89 manifest.
- Own the active `HTMLAudioElement`, automatic Track transition, preload policy, and
  state-machine transitions in one place.
- Keep playback alive during internal navigation and component remounts.
- Guard against double starts, stale events from a previous Track, duplicate `ended`
  events, rapid Play/Pause input, and manifest changes during a Session.
- Allow only one active Album Session per browser tab.

Suggested state model:

```text
idle -> loading -> playing <-> paused
                  -> stopping -> idle
                  -> completed
                  -> recoverable-error
                  -> terminal-error
```

## Workstream 90B — Whole-Album timeline

- Calculate Album progress as completed Track durations plus current Track time divided
  by total manifest duration.
- Position Track markers from cumulative durations, including multi-disc boundaries.
- Render a semantic read-only progress indicator, not a disabled slider.
- Do not attach click, drag, touch, wheel, or seek keyboard behavior.
- Clearly identify the current Track without turning the Track list into navigation.
- Handle unknown or corrected durations without jumping backwards or presenting false
  precision.

## Workstream 90C — Cooperative media controls

- Do not expose native browser audio controls.
- Register Media Session metadata where supported so Album, artist, artwork, and current
  Track are visible outside the tab.
- Support Play and Pause media actions only where the platform permits.
- Do not register seek, next, or previous handlers; verify the actual production
  browser behavior and document controls the browser or OS cannot suppress.
- Make Play/Pause, Stop, Restart, status, and errors fully keyboard and screen-reader
  accessible.
- Respect reduced motion and never use progress animation that obscures real position.

## Workstream 90D — Entry points

Allow “Start Album Session” only for Albums with a confirmed playable manifest from:

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

Alternative “nearly complete” thresholds are explicitly deferred until real use proves
that natural completion is too strict.

## Workstream 90G — Visual language

- Treat the bottom band as a calm listening horizon rather than a transport-console
  dashboard.
- Reuse Rotation's established colors, 8px geometry, typography, and restrained motion.
- Let artwork and Album identity remain primary; controls should not visually dominate.
- Keep the collapsed band compact on desktop and mobile browser widths without hiding
  Play/Pause or status.
- Avoid waveform visuals, animated equalizers, Track-list density, and streaming-service
  conventions that suggest endless choice.

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

- [ ] A playable bound Album can be heard automatically from first to final Track.
- [ ] One persistent bottom band survives every internal page transition.
- [ ] Play/Pause is central; no Rotation UI permits Track skip or seeking.
- [ ] Whole-Album progress and Track boundaries are accurate and read-only.
- [ ] Pause, stop, restart, errors, and reload recovery preserve user agency.
- [ ] Final natural completion creates exactly one canonical Listening Event.
- [ ] Partial, stopped, and failed Sessions create no Listening Event.
- [ ] The optional Journal integrates without making completion dependent on writing.
- [ ] Accessibility, DE/EN, browser compatibility, automated tests, and NAS acceptance
      pass.
- [ ] Production use still feels like Rotation, not a generic streaming player.

## Non-goals

- Track-centric browsing or playback
- Next, previous, seek, scrub, shuffle, repeat, queue, or playback-speed controls
- Playlist import or creation
- Streaming from third-party music services
- Cross-device playback control or synchronization
- Social listening, casting, AirPlay, or Chromecast guarantees
- Listening scores, completion streaks, or gamification
- DRM-style enforcement against direct technical access

