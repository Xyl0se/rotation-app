# Curated Rotation

Rotation means from Sprint 43 onwards a curated player selection.

The app should not just highlight one album, but from a large library make a conscious selection:

- Target size, initially typically 30 albums
- Weighted proportions from multiple roles
- Traceable selection from more candidates than slots
- No automatic removal from the library

## Terms

### Library

All albums the user knows, discovered, archived, or revisited.

### Role

The current relationship with an album, for example Newly Discovered, Comfort Food, or Classic.

Roles are candidate classes for a rotation.

### RotationPlan

The target model for a concrete player rotation.

A RotationPlan contains:

- Target size
- Album IDs
- Concrete items with role and selection reason
- Role quotas
- Creation timestamp

Sprint 44 generates the first visible player rotation suggestion from this.

### Generator MVP

`generateRotationPlan(albums)` creates a first selection:

- Default target is 30 albums.
- Archived albums are excluded.
- Role quotas favor Newly Discovered, Comfort Food, Classic, Growing, and Admiration.
- When roles don't have enough candidates, free slots are robustly filled.
- Each item remembers whether it came in via a role slot or a fill slot.

The generator is deliberately simple and traceable.

### RotationPlan Lifecycle (Sprint 45)

Every `RotationPlan` has a status:

- `draft` — The suggestion is currently being reviewed and can still be edited.
- `active` — The user has adopted the plan. It is then fixed and read-only.

A draft can contain individual albums that the user removes or replaces with alternatives of the same role. Only when clicking "Adopt" is the plan set to `active` and saved in `rotation-active-plan`.

### Replacement Logic

`findReplacementCandidates(removedItem, plan, albums)` searches for the best replacement candidates for a removed album:

- Candidates must have the same role.
- Albums already contained in the plan are excluded.
- Sorting by listen count, then last listen timestamp, then title.
- By default, the top 3 are suggested.

### Focus Album

A single album highlighted in the UI.

The Focus Album replaces the old language "Currently in Rotation". It does not mean that this album *is* the rotation.

Technically, the app continues to use the legacy field `isCurrent` for this.

### Listening Session

A listening event on an album.

Listening sessions can be captured on every album card. They are not bound to whether an album is the Focus Album or later becomes part of a RotationPlan.

### Visible Player Rotation

The HomePage shows its own player rotation section:

- Number of suggested albums
- Button for a new rotation
- In draft mode: "Adopt" button for fixation
- Role summary
- Compact album tiles with cover, role, and reason
- In draft mode per tile: Remove and Replace buttons
- Expandable drawer with 3 cover suggestions of the same role

The current player rotation is stored locally:
- Draft under `rotation-current-plan`
- Active under `rotation-active-plan`
