# Sprint 75.3 — Library-Bindings UI Bridge

**Status:** Done ✅ — completed after Sprint 75.2, before Sprint 76.

**Target version:** `v0.25.8-dev`

---

## Goal

Sprint 75.2 provided the data layer (JOINs, DTO extensions, `libraryAlbumId` correlation). Sprint 76 will build advanced UX on top. Sprint 75.3 is the **UI bridge** that makes the binding↔library relationship visible to the user for the first time.

The user must be able to see at a glance:
- In the Library: "Does this album have files on disk?"
- In the Bindings list: "Which library album does this folder belong to?"

---

## Topics

### 1. Library → Binding Visibility (`AlbumCard`)

Each album card in the Library gets a binding-status indicator.

**Data flow:**
- `HomePage` mounts `useBindings()` and passes binding state down to `Library` → `AlbumCard`
- Alternatively: `AlbumCard` receives `binding: Binding | undefined` as a prop

**UI changes in `AlbumCard`:**
- Add a small folder icon badge when `binding.state === "confirmed"` and `binding.folderExists === true`
- Add a "missing folder" warning badge when `binding.state === "confirmed"` but `binding.folderExists === false`
- No badge when the album has no binding (unbound album)
- Hover tooltip shows the `relativePath` of the bound folder

**Props change:**
```tsx
type AlbumCardProps = {
  album: Album
  binding?: Binding        // NEW — passed from parent via useBindings lookup
  isFocus: boolean
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onLogListen: (id: string) => void
  onReconsider: (id: string) => void
  onSetFocus: (id: string) => void
  showRoleLabel?: boolean
}
```

**I18n keys needed:**
- `albumCard.boundTooltip` — "Files at: {path}"
- `albumCard.missingFolderTooltip` — "Folder missing: {path}"

---

### 2. Binding → Library Visibility (`BindingsPage`)

Each binding row in `BindingsPage` shows the correlated library album.

**Data already available:**
- `albumTitle?: string`
- `albumArtist?: string`
- `libraryExists: boolean`

**UI changes in `BindingsPage`:**
- If `libraryExists === true`: render the album title + artist as a clickable link/badge
- If `libraryExists === false`: render the orphan badge ("Not in Library") — already prepared in Sprint 75.2
- Clicking the album link scrolls to / highlights the album in the Library (or opens `EditAlbumDialog`)

**Props / state change:**
- None — uses existing `Binding` fields from Sprint 75.2

**I18n keys needed:**
- `bindings.albumPreview` — "{title} by {artist}" (already in Sprint 75.2)
- `bindings.orphanBadge` — "Not in Library" (already in Sprint 75.2)

---

### 3. `EditAlbumDialog`: Binding Path Display

When editing an album, the user should see whether (and where) it is bound.

**UI changes in `EditAlbumDialog`:**
- Add a read-only section at the bottom: "Bound folder: `{relativePath}`"
- If no binding: "Not bound to any folder"
- If `folderExists === false`: show warning text "Folder no longer exists on disk"

**Props change:**
```tsx
type EditAlbumDialogProps = {
  album: Album
  binding?: Binding        // NEW
  onClose: () => void
  onSave: (album: Album) => void
  // ... existing cover props
}
```

**I18n keys needed:**
- `editDialog.boundFolder` — "Bound folder"
- `editDialog.notBound` — "Not bound to any folder"
- `editDialog.folderMissing` — "Folder no longer exists on disk"

---

### 4. `HomePage`: Wire `useBindings` into the Library

`HomePage` is the common ancestor of `Library` and `AlbumCard`. It must load bindings once and distribute them.

**Changes in `HomePage`:**
- Import and call `useBindings()`
- Build a `Map<libraryAlbumId, Binding>` for O(1) lookup
- Pass the matching `Binding` to each `AlbumCard`
- Pass the matching `Binding` to `EditAlbumDialog` when open

**Code sketch:**
```tsx
const { bindings, isLibraryAlbumBound, getBindingForLibraryAlbum } = useBindings()

// In render:
<Library
  albums={albums}
  bindings={bindings}              // NEW
  getBindingForAlbum={getBindingForLibraryAlbum}  // NEW
  // ... existing props
/>
```

---

### 5. `Library`: Forward Binding to `AlbumCard`

`Library` receives the lookup function and passes the correct `Binding` to each card.

**Changes in `Library`:**
```tsx
type LibraryProps = {
  albums: Album[]
  bindings?: Binding[]             // NEW
  getBindingForAlbum?: (id: string) => Binding | undefined  // NEW
  // ... existing props
}

// In render:
{albums.map(album => (
  <AlbumCard
    key={album.id}
    album={album}
    binding={getBindingForAlbum?.(album.id)}  // NEW
    // ... existing props
  />
))}
```

---

### 6. Album Coach Orphan Prompt (Preparation)

Sprint 76 will implement the full orphan-capture flow. Sprint 75.3 lays the UI groundwork.

**Changes:**
- In `HomePage`, after `useBindings` loads, check for confirmed orphans
- If a confirmed binding exists without a library album, show a dismissible info banner (not a blocking dialog)
- Banner text: "You have albums on disk that are not in your Library yet."
- Action button: "Show me" → switches to `BindingsPage` with `filter="missing"` (or similar)

**I18n keys needed:**
- `coach.orphanPrompt.title` — "Albums on disk not in Library" (already in Sprint 75.2)
- `coach.orphanPrompt.description` — "Would you like to capture them?" (already in Sprint 75.2)
- `coach.orphanPrompt.dismiss` — "Not now" (already in Sprint 75.2)
- `coach.orphanPrompt.capture` — "Show bindings" (adapted from Sprint 75.2)

---

## Architecture Changes

- **Changed Client Components:**
  - `src/pages/HomePage.tsx` — mounts `useBindings`, passes binding data down
  - `src/components/features/library/Library.tsx` — forwards binding to cards
  - `src/components/features/library/AlbumCard.tsx` — binding status badges
  - `src/components/features/library/EditAlbumDialog.tsx` — bound folder display
  - `src/pages/BindingsPage.tsx` — album preview + orphan badges
- **New Client Components:**
  - None (pure UI wiring)
- **I18n:**
  - `src/i18n/locales/en.ts` — new keys (see above)
  - `src/i18n/locales/de.ts` — new keys (see above)

---

## Affected Components

| Component | Change |
|---|---|
| `src/pages/HomePage.tsx` | Mount `useBindings`, build lookup map, pass to `Library` and `EditAlbumDialog` |
| `src/components/features/library/Library.tsx` | Accept `getBindingForAlbum` prop, forward to `AlbumCard` |
| `src/components/features/library/AlbumCard.tsx` | Show folder/missing-folder badge, tooltip with path |
| `src/components/features/library/EditAlbumDialog.tsx` | Read-only bound-folder section |
| `src/pages/BindingsPage.tsx` | Show `albumTitle`/`albumArtist` or orphan badge per row |
| `src/i18n/locales/en.ts` | New keys for badges, tooltips, dialog |
| `src/i18n/locales/de.ts` | New keys for badges, tooltips, dialog |

---

## Data Flow after Sprint 75.3

```
┌─────────────────────────────────────────────┐
│              SQLite Database                │
├─────────────────────────────────────────────┤
│  albums (id PK)  │  bindings (album_id)     │
│  title, artist   │  relative_path, state    │
└────────┬─────────┘────────────┬─────────────┘
         │                      │
         │ LEFT JOIN            │
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Album API      │    │  Binding API    │
│  /albums        │    │  /bindings      │
│  /bindings/     │    │  /bindings/     │
│     orphans     │    │     by-library  │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
          ┌─────────────────┐
          │   useBindings   │ → Map<libraryAlbumId, Binding>
          └────────┬────────┘
                   │
         ┌─────────┼─────────┐
         ▼         ▼         ▼
    ┌────────┐ ┌────────┐ ┌─────────────┐
    │Library │ │AlbumCard│ │EditAlbumDlg │
    │(grid)  │ │(badge) │ │(path info)  │
    └────────┘ └────────┘ └─────────────┘
```

---

## Risks

| Risk | Mitigation |
|---|---|
| `useBindings` pollutes `HomePage` with server concerns | Keep the hook self-contained; `HomePage` only receives a lookup function |
| Too many re-renders when bindings load | `useMemo` for the `Map` inside `useBindings` (already done) |
| AlbumCard becomes cluttered with badges | Use subtle icons (not text) and tooltips; limit to one binding badge |
| Orphan banner is annoying | Make it dismissible with `localStorage` flag; do not block interaction |

---

## Definition of Done

- [ ] `AlbumCard` shows a folder icon for confirmed bindings, warning for missing folders
- [ ] `BindingsPage` shows album title/artist for bound albums, orphan badge for unbound
- [ ] `EditAlbumDialog` displays the bound folder path (read-only)
- [ ] `HomePage` loads bindings once and distributes them efficiently
- [ ] Dismissible orphan banner appears when confirmed bindings lack library albums
- [ ] All new UI strings are internationalized (EN/DE)
- [ ] No regression: existing Library, Bindings, and Export features work unchanged

---

## Enabler for Sprint 76

After completing 75.3, Sprint 76 can focus purely on advanced UX:

- Album Coach full orphan-capture flow (DiscoverAlbumDialog pre-filled from binding data)
- Bulk actions in BindingsPage ("Capture all orphans")
- Navigation from Binding row → Library album (scroll/highlight)
- No further data-layer or prop-drilling work required
