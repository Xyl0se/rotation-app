# ADR 018 — Defer Discogs Integration

## Status

Accepted — no Discogs runtime integration or credentials in Sprint 88

## Date

2026-07-20

## Context

Sprint 88 evaluated whether Discogs adds enough value beside the persisted MusicBrainz,
Wikipedia, and Wikidata references on Album Detail. Discogs can add edition-level
collector information such as formats, catalogue numbers, barcodes, labels, credits,
images, marketplace data, and collection context.

Rotation is not an inventory or marketplace application. Its canonical object is the
user's relationship with an Album, while MusicBrainz already supplies the stable release
and release-group identities needed for source resolution. Pressing-specific metadata
would therefore serve a narrower, currently unproven use case.

The Discogs API terms reviewed on 2026-07-20 distinguish CC0 catalogue fields from
restricted user, marketplace, and image data. They also require prominent application
and per-data attribution, prohibit circumventing provider limits, restrict retention of
outdated API content, and allow access or terms to change. A production integration
would additionally need registered authentication, secret handling, response-header
rate-limit control, provider-specific invalidation, and periodic terms review.

## Decision

- Do not add Discogs credentials, authentication, provider code, schema values, API
  requests, images, marketplace data, or runtime dependencies in Sprint 88.
- MusicBrainz remains the external release identity authority for Capture and Album
  source resolution.
- Do not copy Discogs metadata into the durable, offline Album model under the current
  terms and product need.
- If a future, evidenced physical-edition workflow needs Discogs, begin with a new
  product decision. Prefer one user-confirmed, stored outbound Discogs release link over
  reproducing provider content.
- Any future implementation must re-review the then-current API terms, use server-side
  credentials, follow response rate-limit headers, provide required attribution, define
  bounded freshness/deletion behavior, and exclude restricted marketplace/user data by
  default.

## Reconsideration gate

Reopen this decision only when users need to distinguish physical editions or pressings
and MusicBrainz release identity plus a manually confirmed link cannot satisfy the
workflow. General interest in more metadata is not sufficient.

## Consequences

- Sprint 88 has no Discogs operational dependency and remains useful without internet
  access after source resolution.
- Rotation avoids a new deployment secret and avoids presenting short-lived provider
  data as canonical personal history.
- Discogs remains a possible future destination, not a current data authority.

## Sources reviewed

- [Discogs API Terms of Use](https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use)
- [Discogs API specifications](https://www.discogs.com/developers)
- [Discogs Application Name and Description Policy](https://support.discogs.com/hc/en-us/articles/360009207054-Application-Name-and-Description-Policy)

## Related documentation

- [Sprint 88](../sprints/done/Sprint-88.md)
- [ADR 013 — Data Ownership Boundaries](./013-data-ownership-boundaries.md)
