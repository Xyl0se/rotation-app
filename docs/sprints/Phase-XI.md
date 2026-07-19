# Phase XI — Shared Library, Personal Relationships

**Status:** Long-term product direction — not scheduled and no Sprint numbers reserved

---

## Purpose

Phase XI explores Rotation as a trusted multi-user household application. It does not
turn Rotation into a public service or social network. The intended model is one
physical music collection shared by a small household, with a private musical
relationship for each person.

The central product distinction is:

> The files and release identity can be shared. A person's relationship with an Album
> is their own.

Authentication is therefore not the main project. The main project is separating the
currently combined concepts of shared Album and personal Album relationship without
damaging the accepted single-user installation.

## Why this phase remains deliberately distant

Rotation already provides substantial value as a single-user self-hosted product.
Local artwork, Album Detail, and the bounded Whole Album Session should be implemented
and observed before the domain is expanded for a second person.

Phase XI receives concrete Sprints only when:

- at least two real household users want independent Rotation relationships;
- privacy expectations between those users have been discussed;
- the shared-folder and per-user export model is understood;
- Sprints 87–90 have either been accepted or explicitly reprioritized;
- a full production backup and reversible migration rehearsal are possible.

Numbers such as Sprint 91 and beyond remain unassigned until those conditions exist.

## Recommended household model

Use a shared catalog with private profiles rather than duplicate isolated Libraries:

| Shared household data | Private profile data |
|-----------------------|----------------------|
| Physical music folder and scan evidence | Current Role and Role History |
| Confirmed Binding | Album Story and personal notes |
| Artist, Album title, year, edition identity | Listening Events and Journal |
| MusicBrainz, Wikipedia, and Wikidata references | Rotation Plans and Focus Album |
| Local and remotely resolved artwork | Reflections and Insights |
| Track order and playback manifest | Personal Rotation Settings |
| File and codec diagnostics | Language and device preferences |
| Server backup and operational health | Active or recoverable Album Session |

The same catalog Album can therefore represent different relationships:

```text
Shared Catalog Album: Radiohead — OK Computer
  -> Profile A: Classic, studies, 18 Listening Events
  -> Profile B: Growing, 3 Listening Events
  -> Profile C: Archive, canonical-but-not-personal
```

Personal Roles never evaluate the shared collection and never become a household-wide
property.

## Domain redesign

The current `Album` combines release metadata and personal state. A multi-user model
must separate these concepts rather than merely add `user_id` to the existing table:

```text
CatalogAlbum
  id
  artist
  title
  year / edition metadata
  cover and external sources
  Binding and playback manifest

UserAlbum
  userId
  catalogAlbumId
  Role and Role History
  Album Story
  personal lifecycle state
```

Adding one user column to the current Album record would duplicate physical folders,
Bindings, scans, artwork, and external metadata. That shortcut is explicitly rejected.

Other personal aggregates must receive an owning user or profile:

- Listening Events and Journal entries;
- Rotation Plans, items, history, and Focus Album;
- Rotation composition Settings;
- Reflection Inbox state, snoozes, and dismissals;
- Insights evidence projections;
- playback recovery and completion idempotency;
- personal export operations and targets;
- domain audit actor and affected profile.

Shared operational aggregates remain household-scoped:

- scans and scan runs;
- Bindings and Binding candidates;
- shared cover and media metadata caches;
- physical file diagnostics;
- backups and global runtime health.

## Existing foundations that should carry forward

The project already has useful prerequisites:

- canonical domain state is server-owned in SQLite;
- Albums and events use stable identifiers;
- API, service, repository, and domain layers are separated;
- Bindings and path guards already protect the read-only music folder;
- cover and future media delivery can remain same-origin and shared;
- Rotation, Focus, Listening, Reflection, and Journal are durable and backed up;
- deterministic Insights can be evaluated against a user-scoped repository;
- route-level integration and security tests provide an isolation-test foundation;
- a small trusted household does not inherently require replacing SQLite.

These foundations reduce migration risk, but none of them currently establishes a
human identity or a tenant boundary.

## Identity and session direction

The existing internal write token authenticates the trusted reverse-proxy boundary; it
does not identify a person and cannot serve as a multi-user login.

The first household implementation should prefer simple local accounts:

- one initial administrator created through a controlled setup flow;
- strong password hashing and no recoverable password storage;
- server-managed sessions in secure, HTTP-only cookies;
- login, logout, expiry, revocation, and password-change flows;
- CSRF protection for cookie-authenticated mutations;
- bounded login attempts and privacy-safe authentication logs;
- profile creation, disablement, deletion, and recovery rules.

OIDC may be evaluated when a real identity-provider integration is wanted. Google,
GitHub, email invitation, and public registration are not initial requirements.

## Authorization boundary

Frontend filtering is never a privacy mechanism. Every personal repository and API
route must derive its user scope from the authenticated server session:

```text
getRotation(authenticatedUserId)
getInsights(authenticatedUserId)
getListeningEvents(authenticatedUserId)
updateAlbumStory(authenticatedUserId, catalogAlbumId)
```

Tests must prove that a valid user cannot retrieve or mutate another user's data by
guessing an Album, event, Reflection, Rotation, export, or audit identifier. Error
messages, counts, caches, logs, and timing-sensitive existence checks must not leak
private state.

## Initial household roles

Keep system permissions separate from musical Album Roles.

### Administrator

- manage household profiles and global operations;
- scan the music folder and resolve Bindings;
- correct shared release metadata and artwork;
- configure export destinations and backups;
- inspect global file and runtime diagnostics.

### Member

- maintain their own relationship to shared Albums;
- manage private Story, Roles, Listening, Journal, Rotation, and Focus;
- see private Reflections and Insights;
- use permitted playback and export profiles.

A complex permission matrix is deferred until these two roles prove insufficient.

## Privacy defaults

The first version keeps the following private by default:

- Album Roles and Role History;
- Album Story and all free prose;
- Listening Events and Journal;
- Rotation, Focus, Reflection, and Insights;
- current playback and recovery state.

Future voluntary sharing of an individual Role or Album relationship requires a
separate opt-in product decision. Social visibility is not implied by household use.

## Singleton state that must become scoped

The single-user implementation contains concepts that logically exist once today:

- active Rotation and Focus Album;
- Rotation Settings;
- Reflection Inbox;
- some export destinations and locks;
- browser onboarding state.

Rotation, Focus, Settings, and Reflections become per-profile. Physical scan locks,
backup coordination, and shared cache maintenance remain global. Export concurrency
requires an explicit mixed model rather than blindly adding a user column.

## Export model

One Syncthing target cannot safely represent several personal Rotations. A likely
layout is:

```text
/exports/users/profile-a/current-rotation
/exports/users/profile-b/current-rotation
/exports/users/profile-c/current-rotation
```

The design must cover:

- administrator-assigned export profiles and destinations;
- separate operation history, locks, and current outputs;
- storage and concurrency limits;
- prevention of path overlap between profiles;
- clear deletion semantics for profile removal;
- backup and restore of destination configuration without exposing secrets.

## Playback model

The Playback Foundation and catalog manifest remain shared. Playback state and its
domain consequences remain personal:

- several users may stream the same physical Album concurrently;
- each browser/profile owns its Album Session;
- completion creates a Listening Event only for the authenticated profile;
- Journal, Reflection, and Insight consequences remain private;
- media authorization confirms access without disclosing another profile's state.

## Migration of the existing installation

The accepted single-user database must become the first owner profile without changing
the meaning of its history:

```text
existing installation
  -> create initial administrator/owner
  -> extract shared Catalog Albums and Bindings
  -> assign existing Album relationships to the owner profile
  -> assign Listening, Journal, Rotation, Focus, Reflection, and Settings
  -> preserve stable identifiers wherever domain-safe
  -> verify counts, history, exports, and backups before enabling another user
```

This is the highest-risk part of Phase XI. It must be:

- transactional and schema-versioned;
- preceded by a verified full backup;
- rehearsed with a realistic production copy;
- idempotent or protected against partial re-entry;
- verified through before/after invariants and privacy queries;
- accompanied by a documented rollback path.

Deleting a profile must not delete the shared physical Album, Binding, or another
profile's history. Deleting a shared Catalog Album requires a separate administrator
workflow with explicit impact preview.

## Possible future delivery slices

These are conceptual work packages, not assigned Sprints:

1. **Domain and migration design** — ADRs, privacy matrix, shared/personal schema,
   deletion semantics, and migration rehearsal.
2. **Identity and sessions** — local administrator, accounts, secure cookies, CSRF,
   session lifecycle, and security tests.
3. **Tenant isolation** — user-scoped repositories, routes, caches, audits, and hostile
   cross-user integration tests.
4. **Personal Rotation experience** — profile UI, Roles, Story, Listening, Rotation,
   Focus, Reflection, Insights, and Settings.
5. **Shared infrastructure** — administrator scans, Bindings, artwork, export profiles,
   playback concurrency, locks, and resource boundaries.
6. **Migration and household acceptance** — production upgrade, backup/restore,
   deletion, two-user/two-browser privacy, rollback, and sustained NAS observation.

Only after Phase XI is activated should these packages receive concrete Sprint numbers,
budgets, and acceptance documents.

## Acceptance themes

- One user's free prose or behavior is never exposed to another user by API or UI.
- The same physical Album supports independent personal relationships.
- Global scan/Binding changes do not silently overwrite personal data.
- Concurrent Rotation, export, and playback operations remain isolated and bounded.
- Existing single-user production history survives migration exactly once.
- Backup/restore preserves both shared and private ownership boundaries.
- Removing a user has explicit, reviewable consequences and does not damage the catalog.
- The single-user experience remains calm and does not become administratively heavy.

## Explicit exclusions without a new decision

- Public registration or internet-facing SaaS
- Social feeds, friends, comments, or household leaderboards
- Shared or automatically visible Journals and Insights
- Collaborative Rotation editing or automatic conflict merging
- Email invitation and account-recovery infrastructure
- Complex organization, group, or role-based access-control matrices
- Separate physical music roots for every user
- Offline mutation queues or cross-device editing conflict resolution
- Migration to PostgreSQL solely because more than one profile exists
- Native mobile apps as a prerequisite for household profiles
