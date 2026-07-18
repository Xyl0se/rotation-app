# Sprint 88 — Album Detail and External Sources

**Status:** Planned

**Target version:** Future minor version

**Type:** Product navigation, personal album history, and metadata provenance

## Goal

Establish one calm Album Detail page that brings together the information Rotation
already owns about an Album and, where reliably available, links to MusicBrainz and
Wikipedia for further reading.

External source references are resolved once during Capture or through an explicit
manual retry and then stored server-side. Opening the Album Detail page must not call
MusicBrainz, Wikipedia, Wikidata, or Discogs.

## Product decision

Sprint 88 deliberately does **not** embed third-party article text, summaries, or
screenscraped content. Rotation presents the user's own relationship with the Album;
external services remain clearly labelled destinations for optional further reading.

This keeps the page fast and offline-tolerant and avoids turning Rotation into a
second-hand encyclopedia view.

## Target experience

An Album Card opens a dedicated route such as `/albums/:albumId`. Editing remains an
explicit action from that page rather than the page's sole purpose.

The detail view combines:

- cover, artist, title, release year, and current Role;
- Role reasoning and Role History;
- structured Album Story fields, personal notes, and acquisition context;
- Listening Sessions, Reflections, and the Album timeline;
- active or historic Rotation membership;
- confirmed music-folder Binding and its state;
- actions such as “Edit Album”, “Listened”, and “Open Album journey” where applicable;
- a compact “External sources” area containing only verified, stored links.

The external area may show:

- **View on MusicBrainz**;
- **Read on Wikipedia**;
- a Wikidata link only when it is the best verified reference and no language-specific
  Wikipedia article has been resolved.

Unavailable sources are omitted rather than rendered as broken or disabled promises.

## Resolution flow

The existing MusicBrainz search in Capture remains the authoritative starting point:

```text
MusicBrainz search
  -> user selects the matching release
  -> selected release details and URL relationships are loaded once
  -> MusicBrainz identity and canonical URL are stored
  -> a direct Wikipedia relationship is stored when available
  -> otherwise a Wikidata relationship may resolve a DE Wikipedia article
  -> EN Wikipedia is the optional fallback
  -> the Album is created with the verified source references
```

The additional detail lookup occurs only after the user has selected a MusicBrainz
result. It is not repeated during normal Album reads or Detail-page rendering.

Rotation must never manufacture a Wikipedia URL from artist and Album title alone.
Self-titled Albums, remasters, regional editions, punctuation, and disambiguation
suffixes make such URLs too easy to get wrong.

## Workstream 88A — Detail-page foundation

- Add a first-class Album Detail route and navigation from Library Album Cards.
- Keep “Edit Album” available as a clear secondary action.
- Compose the view from canonical server-owned Album, Story, Role History, Listening,
  Reflection, Rotation, and Binding data.
- Provide complete DE/EN copy, loading, empty, partial-data, and failure states.
- Preserve readable typography; longer personal history may use progressive disclosure
  but not inaccessible miniature text.

## Workstream 88B — Persistent external identity

- Persist the selected MusicBrainz release ID and, where appropriate, release-group ID
  as stable external identities instead of treating them as transient Capture results.
- Store normalized source records with provider, canonical URL, external identifier,
  locale where relevant, resolution status, and resolution timestamp.
- Validate provider and protocol server-side; arbitrary executable or malformed URLs
  must never be returned to the client.
- Keep source identity separate from mutable Album title, artist, and year fields.

## Workstream 88C — Capture enrichment

- After a MusicBrainz result is selected, request its URL relationships once.
- Prefer a direct, entity-correct Wikipedia relationship.
- Otherwise use a MusicBrainz-linked Wikidata entity as the language bridge and prefer
  the German Wikipedia article, with English as a documented fallback.
- Store the resolved URLs together with the Album creation transaction where practical.
- A failed enrichment request must not prevent Capture: the Album is created and the
  missing sources can be retried later.
- Respect provider identification, timeout, retry, and rate-limit requirements.

## Workstream 88D — Existing Albums and correction

- Add an explicit “Find external sources” action to Album editing or the Detail page.
- Let users review found references before saving when matching is ambiguous.
- Permit stored source URLs to be corrected, replaced, or removed manually.
- Never silently replace a user-confirmed source during a later lookup.
- Provide a bounded migration/backfill path for existing Albums without generating a
  burst of external requests on application startup.

## Workstream 88E — External-source presentation

- Render stored sources as compact, clearly external link cards.
- Open sources safely in a new browser context and protect the originating page.
- Identify each provider by name and keep the destination URL inspectable.
- Do not fetch previews, favicons, summaries, HTML, or article content while rendering.
- The page remains useful when the NAS has no internet connection.

## Workstream 88F — Optional Discogs evaluation

Discogs is not required for the first Album Detail release. Before adding it:

- evaluate whether its data adds meaningful value beyond MusicBrainz;
- document authentication, attribution, rate-limit, and API-terms implications;
- prefer a stored outbound link over reproducing Discogs content;
- require an explicit product decision before introducing credentials or another
  runtime dependency.

## Data and API direction

The concrete schema is implementation-owned, but it should express a source record
similar to:

```text
albumId
provider          musicbrainz | wikipedia | wikidata
externalId        provider-native stable identifier when available
url               validated canonical HTTPS URL
locale            de | en | null
resolutionStatus  resolved | missing | ambiguous | failed
resolvedAt
confirmedByUser
```

Normal Album-detail reads return these persisted records from Rotation's API. Provider
access belongs to a bounded server-side resolver invoked by Capture or an explicit
retry, never to React components.

## Verification

- Route tests cover complete, partial, empty, and unavailable related data.
- Capture integration tests cover direct Wikipedia, Wikidata-to-Wikipedia, no match,
  timeout, and ambiguous relationships.
- Existing-Album tests cover retry, correction, removal, and protection of a
  user-confirmed source.
- Security tests reject unsupported providers, non-HTTPS URLs, malformed identifiers,
  and unsafe outbound-link behavior.
- A render test proves that opening Album Detail performs no request to an external
  provider.
- NAS acceptance verifies useful offline rendering and correct links for representative
  German, English, remastered, self-titled, and unmatched Albums.

## Definition of Done

- [ ] Every Album can be opened in a dedicated Detail view.
- [ ] The Detail view aggregates the relevant canonical Rotation data without creating
      a second editable copy of it.
- [ ] Capture permanently retains the selected MusicBrainz identity.
- [ ] Available Wikipedia or Wikidata relationships are resolved once and stored.
- [ ] Existing Albums can resolve and correct external sources explicitly.
- [ ] Album Detail performs no third-party API call during normal rendering.
- [ ] Missing or unavailable external sources never block Capture or Album Detail.
- [ ] No third-party article text or scraped content is embedded.
- [ ] DE/EN, accessibility, security, automated tests, and NAS acceptance are complete.

## Non-goals

- Embedded Wikipedia or Discogs articles, extracts, or summaries
- Runtime scraping of third-party websites
- Automatically generated Wikipedia URLs based only on title and artist
- Automatic bulk enrichment during server startup
- Treating external metadata as more authoritative than the user's stored Album story
- AI-written Album biographies or summaries

