# Sprint 88 — Album Detail and External Sources NAS Acceptance

**Acceptance status:** Granted by the maintainer on 2026-07-20

## Accepted deployment

Sprint 88 was deployed to the NAS and exercised against the production Album Library.
The maintainer completed the Sprint Definition of Done and explicitly accepted the
result after the Release-Group relationship correction in commit `97dd806`.

## Accepted behavior

- Dedicated Album Detail navigation and direct routes work in the deployed environment.
- Canonical Album, Story, Role History, Listening, Reflection, Rotation, and Binding
  information remains useful with partial or unavailable related data.
- Capture retains MusicBrainz Release and Release-Group identities.
- Existing Albums can explicitly find, review, correct, replace, and remove stored
  source references without an automatic startup backfill.
- MusicBrainz Release-Group relationships resolve through Wikidata to the preferred
  German Wikipedia article where available. `The Eminem Show` was the production case
  that exposed and verified this path.
- Stored external destinations remain inspectable and open in protected new browsing
  contexts; Album Detail itself performs no third-party request.
- Missing external sources do not block Capture or Album Detail, and no third-party
  article content is embedded.
- German and English presentation, accessibility, security, automated verification,
  and NAS behavior were accepted through the completed Sprint checklist.

## Automated evidence accompanying acceptance

The final Release-Group correction was validated with:

- 252 passing frontend tests;
- 304 passing server tests;
- passing frontend and server lint;
- passing Markdown-link validation;
- passing frontend and server production builds.

The regression suite includes the MusicBrainz Release Group and Wikidata identity for
`The Eminem Show`, expecting the German Wikipedia destination
`https://de.wikipedia.org/wiki/The_Eminem_Show`.

## Acceptance decision

Sprint 88 is accepted and may be treated as completed. Discogs remains deliberately
deferred under [ADR 018](../adr/018-defer-discogs-integration.md); this is an accepted
product decision, not an incomplete Sprint deliverable.
