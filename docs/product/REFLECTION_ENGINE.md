# Reflection Engine

The Reflection Engine asks questions when an album should likely be reconsidered.

It does not change a role automatically. It only generates an impulse and can restart the Album Coach.

## Data Flow

1. `evaluateReflection(albums)` checks all albums against `reflectionRules`.
2. The HomePage shows the `ReflectionCard`.
3. If an impulse is present, the card shows the first matching album.
4. The user can start the Album Coach or — for archive albums — the Archive Return Coach.
5. The result sets `category`.
6. `roleHistory` receives an entry with `source: "reflection"`.

## Current Rules

- `new-after-listens`: A new album has been listened to at least three times.
- `growing-for-a-while`: A growing album has been in this role for at least 90 days.
- `comfort-not-recent`: A comfort-food album has not been listened to for at least 60 days.
- `archive-return-candidate`: An archive album has been resting for at least 180 days.

## Repeat Protection

If the current role was last confirmed by a Reflection, the same role does not immediately generate a new impulse again.

## Product Principle

Reflection is not an alarm.

Reflection is an invitation to briefly look at one's own relationship with an album again.
