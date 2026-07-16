# Curated Rotation

Rotation means from Sprint 43 onwards a curated player selection.

The app should not just highlight one album, but from a large library make a conscious selection:

- Target size of at most 25 albums for focused listening sessions
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

- Default target is at most 25 albums: 10 Newly Discovered, 5 Comfort Food,
  5 Classic, and 5 Still Growing.
- Admired and Archived albums are excluded.
- Role quotas describe the preferred first pass. If an eligible role cannot fill its
  quota, remaining slots are filled randomly from other eligible roles up to the
  configured target size.
- Each item records the role quota through which it entered the Rotation.

The generator is deliberately simple and traceable.

### RotationPlan Lifecycle (Sprint 45)

Every `RotationPlan` has a status:

- `draft` — The suggestion is currently being reviewed and can still be edited.
- `active` — The user has adopted the plan. It is then fixed and read-only.
- `archived` — A previously active plan retained as immutable history.

A draft can contain individual albums that the user removes or replaces with alternatives of the same role. Only when clicking "Adopt" is the plan confirmed by the server as `active`; the previous active plan becomes archived transactionally.

### Replacement Logic

`findReplacementCandidates(removedItem, plan, albums)` searches for the best replacement candidates for a removed album:

- Candidates must have the same role.
- Albums already contained in the plan are excluded.
- Sorting by listen count, then last listen timestamp, then title.
- By default, the top 3 are suggested.

### Focus Album

A single album highlighted in the UI.

The Focus Album replaces the old language "Currently in Rotation". It does not mean that this album *is* the rotation.

Technically, the Focus Album is stored on the server and must belong to the active Rotation.

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

Draft, active, archived history, Focus Album, and Listening Events are stored in SQLite
through the Rotation State API. Browser storage contains no canonical Rotation data.
