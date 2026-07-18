# Album Timeline

The Album Timeline makes visible what Rotation already knows about an album.

It is not a statistic. It is a small chronicle of the relationship with an album.

## Current Scope

Sprint 40 introduced the timeline for the active album.

The timeline generates events from:

- `roleHistory`
- `listenEvents`
- `story` (Sprint 55)
- optional Listening Journal entries (Sprint 84)

## Events

Current event types:

- `role-assigned`: A role was set by Coach, Reflection, or Archive Workflow.
- `listened`: The album was listened to.
- `story-created`: The album story was first documented (Sprint 55).
- `story-updated`: The album story was edited.
- `listened` events may include an optional note plus bounded mood/context tags.

The role shown for a Listening Event is derived from the most recent role-history
entry at or before `listenedAt`. It is labelled as derived and omitted when no reliable
historical role exists. Later roles are never projected backwards.

The timeline is sorted newest first.

## Conscious Limit

Rotation stores a full listening session history since Sprint 46.

The timeline shows individual listening sessions with ordinal numbers:
- "First listen"
- "Last listen"
- "Session N"

Before Sprint 46, the timeline only showed the last listening moment and the total number of documented listening sessions.
