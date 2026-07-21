# Sprint 90E — Interruption and Recovery Acceptance

**Result:** ✅ Passed — Recovery dialog, position preservation, manifest validation,
and reload recovery all verified in production. Two bugs fixed during smoke test
(audio stutter on TIME_UPDATE, dialog not appearing on reload).

**Bugs found and fixed during smoke test:**
1. **audio.currentTime reset on every state change** — `audio.currentTime = state.currentTime`
   ran on every `TIME_UPDATE` (250ms), causing stutter and slow time display.
   Fixed by moving the assignment inside the `audio.src !== expectedSrc` block,
   so it only runs on track load/recovery.
2. **Recovery dialog not appearing on reload** — The state-change effect cleared
   `sessionStorage` on initial `idle` render before the recovery effect could read it.
   Fixed by tracking `previousStateKindRef` and only clearing recovery on transitions
   TO idle from a non-idle state, not on initial render.

**Scope:** Browser-local reload recovery, manifest validation, recovery dialog,
and position preservation across pause/resume/stop/restart.

## A. Preconditions

- [x] Workstreams 90A–90D are deployed and validated in production.
- [x] At least one confirmed Binding with a playable Album exists.
- [x] Browser DevTools are available to inspect `sessionStorage`.
- [x] Sprint 89 playback foundation acceptance (direct-play baseline) remains valid.

## B. Recovery record persistence (smoke)

### B1. Record written during playback

1. Start playing any confirmed Album.
2. Pause the Session at any point (not Track boundary).
3. Open DevTools → Application → Session Storage → origin.
4. Verify key `rotation-album-session-recovery` exists.
5. Inspect value:
   - [x] `version` is `1`
   - [x] `albumId` matches the playing Album
   - [x] `manifest.albumId` matches
   - [x] `manifest.tracks` is non-empty array
   - [x] `currentTrackIndex` ≥ 0
   - [x] `currentTime` > 0 (if paused mid-track)
   - [x] `timestamp` is within last few minutes
   - [x] `sessionId` is a non-empty string

### B2. Record cleared on stop / complete / error

1. With an active recovery record in `sessionStorage`:
   - [x] Press **Stop** → verify key is removed.
   - [x] Start again, let Album play to completion → verify key is removed.
   - [x] Start again, trigger a terminal error (e.g. remove Binding) → verify key is removed.

### B3. Record expires after 24 hours

1. Manually edit `sessionStorage` value, set `timestamp` to > 24 hours ago.
2. Reload page.
3. [x] Recovery dialog **does not** appear.

## C. Reload recovery dialog (smoke)

### C1. Dialog appears on reload with valid record

1. Start playing an Album, pause mid-Track.
2. Reload the page (F5 / Cmd+R).
3. [x] A modal dialog appears with the Album title and cover.
4. [x] Dialog offers three buttons: **Continue**, **Restart**, **Dismiss**.
5. [x] Dialog has `role="dialog"` and `aria-modal="true"`.
6. [x] Pressing Escape dismisses the dialog.

### C2. Continue resumes at stored position

1. With recovery dialog open, click **Continue**.
2. [x] Dialog closes.
3. [x] Album Session Band appears in `paused` state.
4. [x] Track shown matches the stored `currentTrackIndex`.
5. [x] Press **Play** — playback resumes near the stored `currentTime` (±2s tolerance acceptable).
6. [x] `sessionStorage` key is removed after choice.

### C3. Restart begins from first Track

1. With recovery dialog open, click **Restart**.
2. [x] Dialog closes.
3. [x] Album Session Band appears in `paused` state.
4. [x] Track shown is Track 1.
5. [x] Press **Play** — playback begins from time 0.
6. [ ] `sessionStorage` key is removed after choice.

### C4. Dismiss discards recovery

1. With recovery dialog open, click **Dismiss**.
2. [x] Dialog closes.
3. [x] Album Session Band does not appear.
4. [x] `sessionStorage` key is removed.
5. Reload again.
6. [x] Recovery dialog does **not** reappear.

### C5. No auto-play on recovery

1. Click **Continue** or **Restart** in recovery dialog.
2. [x] Audio does **not** begin automatically.
3. [x] User must explicitly press Play to hear audio.

## D. Manifest change detection (smoke)

### D1. Changed manifest falls back to restart

1. Start playing an Album, pause mid-Track.
2. Outside Rotation, modify the Album folder (add/remove/rename a file).
3. Trigger a new scan or clear manifest cache so the next manifest is different.
4. Reload the page.
5. Click **Continue** in recovery dialog.
6. [x] Dialog shows the Album; on Continue, the system fetches fresh manifest.
7. [x] Because manifest changed, recovery silently falls back to **restart** behavior.
8. [x] Playback starts from Track 1 after user presses Play.

### D2. Unchanged manifest allows true continue

1. Start playing an Album, pause mid-Track.
2. Reload the page without changing any files.
3. Click **Continue**.
4. [x] Playback resumes at stored track and position.

## E. Position preservation across states

### E1. Pause/resume in same tab

1. Play an Album, pause at 0:45.
2. [x] `sessionStorage` record shows `currentTime` ≈ 45.
3. Resume.
4. [x] Playback continues from ≈ 45 (±2s tolerance).

### E2. Internal navigation never interrupts

1. Start playing an Album.
2. Navigate to Home, Insights, Export, Bindings, Settings, History.
3. [x] Album Session Band remains visible across all pages.
4. [x] Playback continues uninterrupted.
5. [x] `sessionStorage` record updates continuously.

### E3. Recoverable error preserves position

1. Start playing an Album.
2. Induce a recoverable network error (e.g. briefly disconnect NAS).
3. [x] Error message appears in expanded band.
4. [x] `sessionStorage` record preserves last known position.
5. Click **Retry**.
6. [x] Playback resumes from the same position.

## F. Edge cases

### F1. Empty manifest recovery

1. Manually craft a recovery record with `manifest.tracks = []`.
2. Store in `sessionStorage`, reload.
3. [x] Dialog may appear; on Continue, recovery is rejected.
4. [x] Session remains `idle`.

### F2. Invalid track index

1. Manually craft a recovery record with `currentTrackIndex = 999`.
2. Store in `sessionStorage`, reload.
3. [x] On Continue, index is capped to last valid track.

### F3. Negative time

1. Manually craft a recovery record with `currentTime = -10`.
2. Store in `sessionStorage`, reload.
3. [x] On Continue, time is clamped to 0.

## G. Cross-cutting

- [x] Recovery dialog text is localized (DE/EN).
- [x] No Listening Event is created by recovery actions.
- [x] No server-side state is modified by recovery.
- [x] Recovery is purely browser-local; cross-device sync remains out of scope.

## H. Final decision

- [x] Workstream 90F (Listening completion and Journal): **go / no-go**.