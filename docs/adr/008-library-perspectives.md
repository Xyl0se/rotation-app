# ADR 008: Library Perspectives — Multiple Viewpoints on the Same Collection

## Status

Accepted

## Context

The library only knew two views: all albums or grouped by role. Users, however, also wanted to explore by artist, year, listening session, or last classification. The question was not: "What is missing?" but: "How can we show the same collection from different perspectives without overloading the UI?"

Sprint 50 was meant to extend the library by four additional perspectives.

## Decision

The library supports perspectives as different viewpoints on the same data set.

- Perspectives are groupings, not filters. Every album appears in exactly one group per perspective.
- A generic `LibraryGroup<T>` model describes all perspectives uniformly.
- The view switcher offers three main modes: All, By Role, Perspectives — with a sub-switcher for the four perspectives.
- Perspectives are: Artist, Year, Last Listening Session, Last Role Change.
- Time categories (Today, This Week, This Month, etc.) are computed by a shared helper function `categorizeRecency()`.

## Consequences

- New perspectives only require a new grouping function and a thin wrapper.
- `LibraryViewSwitcher` must be extended for new perspectives.
- The domain remains component-free; grouping logic lives in `domain/library-views/*`.
- Perspectives are deliberately not complex filters — they show the entire collection regrouped.
