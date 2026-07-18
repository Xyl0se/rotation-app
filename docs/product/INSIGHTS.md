# Insights

Insights are not analytics scores. They are short, traceable observations about how
the user's relationship with music changes over time.

## Current deterministic families

- discovery versus familiarity across two bounded 90-day windows;
- Albums that are both long quiet and outside the active Rotation;
- listening returns after at least 180 days;
- established Role movement over 180 days;
- membership change between the active and previous accepted Rotation.
- recurring artists across multiple recently heard Albums;
- recurring release decades when enough years are documented;
- recurring structured life phases or acquisition reasons.

Every displayed observation has a stable rule code, a minimum sample, a bounded
period where relevant, an evidence level, and factual supporting counts. The page
shows no more than four at once and keeps the neutral Role overview permanently.
Among equally important candidates, selection is stable for a calendar week so a
reload never reshuffles the page while less prominent observations can surface later.

## Suppression

When evidence is sparse or a comparison period is missing, Rotation does not infer a
story. It may show one calm building state explaining which history is still forming.
Evidence levels describe support for a statement, never collection quality.

## Privacy and authority

The read-only server projection is authoritative. Historical Listening Events use the
Role valid at listening time. Free Journal notes and Album Story memory prose are not
read by the Insight engine. Insights cannot mutate Albums, Roles, Rotations,
Reflections, Bindings, or Archive state.

See [Insights Page](./INSIGHTS_PAGE.md), [Sprint 86](../sprints/Sprint-86.md), and
[ADR 016](../adr/016-deterministic-insight-evidence.md).
