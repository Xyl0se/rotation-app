# Rotation Product Note

Rotation helps people consciously maintain their relationship with albums over many years.

Rotation should never feel like data entry.

Rotation should feel like a conversation about music.

---

## Product Principles

Rotation does not evaluate a music collection.

Album roles have no target sizes and no optimal distribution.

The library documents relationships with music.

The Player Rotation is a conscious selection from this library.

Recommendations refer exclusively to the active Player Rotation or to the reflection of individual albums — never to the size of a role within the library.

---

## Current Product State

Rotation is a self-hosted client/server application for a conscious album collection.

The user first goes through a short welcome page. After that, the application lives on the HomePage: collection, Focus Album, Dashboard, Player Rotation, and the dialog for discovering a new album.

The term "Rotation" once again means the original vision: a curated player selection of multiple albums. The individually highlighted album is called the Focus Album.

---

## Core Features

- **Discover New Album:** Title and artist are entered manually.
- **Metadata Lookup:** MusicBrainz provides release data, Cover Art Archive provides the front cover.
- **Album Coach:** A short decision tree assigns the album a role.
- **Library:** Albums are displayed as cards and can be consciously placed in the archive.
- **Library Maintenance:** Title, artist, year, and cover override can be edited. Albums can be permanently deleted after confirmation.
- **Library Perspectives:** The library can be grouped by artist, year, last listening session, or last role change.
- **Focus Album:** Exactly one album can be highlighted for attention.
- **Capture Listening Session:** On every album card, a listening event can be recorded. This updates `listenCount` and `lastListened`, regardless of whether the album is the Focus Album.
- **Listening History:** Listening sessions are modeled as real events and can be displayed in the album timeline.
- **Player Rotation:** Rotation can generate a curated selection for the MP3 player and display it visibly. The Player Rotation originates from the library but does not evaluate it.
- **Rotation Review:** The user can consciously accept, remove, or replace suggested rotations.
- **Curated Rotation Model:** `RotationPlan` describes a player selection of multiple albums.
- **Role History:** Role changes are documented with timestamp and source.
- **Album Timeline:** An album shows its documented history so far.
- **Reflection Engine:** Rotation asks questions at appropriate albums, supports conscious reclassifications, and can restart the coach. Reflection never evaluates the library as a whole.
- **Archive Workflow:** A classic protection checks whether an album may really rest. Archived albums can later appear as rediscovery candidates.
- **Role Explorer:** All six roles as standalone overview pages within the library.
- **Insights:** Rotation formulates linguistic observations about listening habits and the development of the collection. Insights do not evaluate the collection.
- **Dashboard:** Reflection, Insights, and a neutral overview of the library together form the entry point into Rotation.
- **Cover Override System:** Users can manually adjust covers — via upload, external URL, or as an alternative from the Cover Art Archive.

---

## Album Roles

- New Discovery
- Growing
- Comfort Food
- Classic
- Admiration
- Archive

These roles are not rigid categories.

They exclusively describe the current relationship between person and album.

There is no recommended number of albums per role.

There are no target sizes or optimal distributions.

---

## What Rotation Is Not

Rotation is not a streaming service.

Rotation is not a statistics dashboard.

Rotation is not a collection optimizer.

Rotation does not evaluate album roles.

Rotation does not try to create an evenly distributed library.

Rotation does not assign points or scores to a collection.

---

## Product Limits

- Rotation knows only albums, not songs.
- The Library, covers, bindings, scans, and export operations are server-backed. Library state is loaded from the API and is not persisted in browser storage.
- Listening History, RotationPlan, and Focus Album remain canonical browser-local data until their planned server migration.
- Language, onboarding state, and dismissed prompts are intentionally device-local. Authentication is an internal trusted-proxy concern, not browser state.
- There are no user accounts or multi-user conflict semantics yet.
- The Metadata Lookup is a helper, but not a prerequisite for saving an album.
- Rotation does not try to create a "perfect" library.
- Rotation does not optimize role distribution.
