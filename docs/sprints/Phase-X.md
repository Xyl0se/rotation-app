# Phase X — Platform & Companion

**Status:** No active development. Future vision only.

---

## Platform Foundation

Preparation of a native application.

- PWA
- iOS
- Android
- Offline First
- Prepare synchronization

## Native Prototype

First runnable mobile version.

## Musical Companion

Rotation evolves from tool to companion.

## Weekly Reflection

Weekly reviews.

Not statistics.

But stories.

## Asynchronous Scan Engine

The current scan is synchronous and blocking. For large libraries (10,000+ albums) or slow NAS filesystems (NFS, CIFS), a scan can take minutes.

Future direction:

- Streaming scanner: processes directories incrementally, writes intermediate progress to the database
- Progress events: frontend receives real-time updates (WebSocket or SSE) instead of polling
- Background worker: scan runs in a separate process/thread, HTTP request returns immediately with a job ID
- Resumable scans: if the server restarts mid-scan, the scan can resume from the last checkpoint

This makes Rotation usable for real-world music collections without UI freezes or timeouts.

## Listening Patterns

Rotation recognizes long-term developments.

Examples:

- You are listening to more jazz again.
- Many albums are currently changing their role.
- Your classics change hardly at all.

No evaluation. Only observation.

## Explainability 2.0

The Player Rotation becomes fully traceable.

The user understands at all times:

- why an album was chosen
- which role it fulfills there
- which story the rotation tells

---

## Long-term Vision

Rotation should never feel like a database.

Rotation should never feel like Spotify.

Rotation should never feel like a statistics tool.

Rotation should feel like a conversation about music.

An album is not a file.

An album is a story.

Rotation helps consciously accompany these stories over many years.
