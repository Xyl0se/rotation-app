# Archive Workflow

Archiving in Rotation does not mean deleting.

An album in the archive remains part of the collection but rests outside an active player selection.

## Entering the Archive

Before an album is placed in the archive, a classic protection runs.

The protection asks three questions:

1. Does this album have a biographical place in my life?
2. Have I really listened to it in the last 12 months?
3. Do I say "I should listen to that again" more often than I actually do?

> **Sprint 57 update:** `wouldRecommend` was removed as the primary protection signal. Instead, `hasBiographicPlace` is now the primary signal — personal classics may currently rest and remain protected nonetheless.

Possible results:

- `archive`: The album may rest.
- `classic`: The album is too important for a pure archive spot.
- `admire`: The album is admired without immediately being part of a player selection.

Every decision writes a `roleHistory` entry with `source: "archive"`.

When the Focus Album goes into the archive, the legacy field `isCurrent` is set to `false`.

## Returning from the Archive

The return is part of the Reflection workflow.

When an album has been in the archive for at least 180 days, the Reflection Engine can show a rediscovery impulse.

The Archive Return Coach asks:

1. Have I listened to it consciously in the last 6 months?
2. Do I spontaneously remember a song, a riff, a lyric line, or a special moment?
3. Would I object if someone called the album average?
4. Why did I buy it back then?
5. Does it fit my current life phase or listening mood?
6. Am I today looking more for familiarity or discovery?

Possible results:

- `archive`: The album stays in the archive.
- `classic`: The album returns as a classic.
- `growing`: The album returns as a rediscovery.

Return decisions write `roleHistory` with `source: "reflection"`.

## Product Principle

Rotation may ask questions.

Rotation must never automatically bring an album back or put it away.
