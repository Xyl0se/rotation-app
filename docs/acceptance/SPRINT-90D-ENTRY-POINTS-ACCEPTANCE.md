# Sprint 90D — Entry Points Acceptance

## Goal
Verify that "Start Album Session" is available only for Albums with a confirmed playable
manifest, from the three intentional attention contexts: Focus Album, active Player
Rotation, and Album Detail page.

## Preconditions
- A library with at least 3 albums: one with a **confirmed** binding, one with a
  **proposed** binding, and one with **no binding**.
- An active (accepted) Player Rotation containing the confirmed-bound album.
- Browser console open to observe any errors.

## Test Cases

### 1. Focus Album — Confirmed Binding
1. Set the confirmed-bound album as the Focus Album.
2. Observe the Focus Album card.
3. **Expected:** A "Album abspielen" (DE) / "Play Album" (EN) button is visible.
4. Click the button.
5. **Expected:** The persistent bottom band appears and begins loading/playing the album.
6. The "Gehört" button remains visible alongside the playback control.

### 2. Focus Album — No Binding
1. Set the unbound album as the Focus Album.
2. Observe the Focus Album card.
3. **Expected:** No play button. Instead, a calm status message appears:
   "Kein Musikordner verknüpft." (DE) / "No music folder linked." (EN).
4. The message does not expose internal paths or technical details.

### 3. Focus Album — Proposed (Unconfirmed) Binding
1. Set the proposed-bound album as the Focus Album.
2. Observe the Focus Album card.
3. **Expected:** Status message: "Musikordner noch nicht bestätigt." (DE) /
   "Music folder not yet confirmed." (EN).

### 4. Active Player Rotation — Confirmed Binding
1. Ensure the active Rotation contains the confirmed-bound album.
2. Navigate to the Player Rotation section.
3. **Expected:** Each tile shows a small secondary play button.
4. Click the play button on the confirmed album's tile.
5. **Expected:** Session starts in the bottom band.

### 5. Active Player Rotation — No or Unconfirmed Binding
1. If an album in the active Rotation has no or unconfirmed binding:
2. **Expected:** Its tile shows the appropriate unavailability message instead of a
   play button, matching the Focus Album behavior.

### 6. Draft Player Rotation — No Play Buttons
1. Generate a new Rotation draft.
2. **Expected:** No play buttons appear on draft tiles. Only remove/replace actions
   are available, as before.

### 7. Album Detail Page — Confirmed Binding
1. Open the confirmed-bound album's detail page.
2. **Expected:** The `AlbumPlayer` section shows "Album abspielen".
3. Click it.
4. **Expected:** Session starts; bottom band appears.

### 8. Album Detail Page — No Binding
1. Open the unbound album's detail page.
2. **Expected:** The `AlbumPlayer` section is entirely absent (existing behavior).

### 9. Playback State Consistency Across Contexts
1. Start a session from the Focus Album.
2. Navigate to the Album Detail page for the same album.
3. **Expected:** The Album Detail page shows "Pausieren" (pause) — the active session
   is recognized.
4. Navigate to the Player Rotation.
5. **Expected:** The tile shows "Pausieren" as well.
6. Pause from any context.
7. **Expected:** All three contexts update to show "Fortsetzen" (resume).

### 10. Different Album — Independent State
1. While one album is playing, view a different album in any context.
2. **Expected:** That different album shows "Album abspielen" — not pause/resume.
   Only one session is active at a time.

## Accessibility

- All play/pause/resume buttons are `<button>` elements with visible focus.
- Unavailability messages use `role="status"` for screen-reader announcement.
- Button labels include the album title for context: "Album abspielen: Kind of Blue".

## Definition of Done

- [x] "Start Album Session" available on Focus Album, active Rotation, and Album Detail.
- [x] Unavailable albums explain the reason without exposing internal paths.
- [x] Draft Rotation tiles unchanged (no play buttons).
- [x] Playback state is consistent across all three entry-point contexts.
- [x] Only one session active at a time; other albums offer fresh start.
- [x] DE/EN i18n complete for all states.
- [x] All frontend and server tests passing.