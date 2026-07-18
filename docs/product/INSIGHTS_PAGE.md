# Insights Page

The Insights page is Rotation's quiet place for reflection and observation. It keeps
the Home page focused on listening while preserving the former Dashboard domains.

## Responsibilities

Insights combines:

- the next Reflection question and its Coach entry point;
- localized linguistic observations about the Library;
- a neutral overview of the roles currently represented.

It evaluates no Library and recommends no target role distribution. Album roles
describe relationships; they are not collection health metrics.

## Navigation

Insights is the second first-class application page. The primary order is Home,
Insights, Export, Bindings, and Settings. Home contains Focus Album, Player Rotation,
and Library instead of a Dashboard composition.

## Data Flow

The page loads Reflection context from the canonical API and obtains narratives plus
the neutral Role overview from the read-only `GET /insights` projection. The server
derives bounded facts from SQLite; the browser only localizes and renders stable
Insight codes. Role changes persist only after explicit server confirmation. Archive
rediscovery continues to use the Archive Return Coach.

Every narrative provides an optional evidence disclosure with its bounded period,
supporting counts, and stable rule code. At most four observations are visible. Their
selection remains stable within a calendar week. When
minimum samples are missing, the page says which comparison is still developing
instead of inventing a conclusion.

Free Journal prose and Album Story memory notes are outside the Insight evidence
boundary. Extended narratives may use artist, release year, and the enumerated Story
fields `lifePhase` and `acquiredBecause`. Historical Listening evidence uses the Role
valid at the time of listening.

## Product Limit

Insights must remain editorial rather than judgmental. It may use deeper deterministic
analysis, explain patterns, compare bounded periods, and invite a decision, but must
not introduce scores, warnings about role sizes, or a concept of an optimal collection.
The role overview remains a permanent neutral foundation. Facts and eligibility stay
deterministic. Any later AI wording layer is optional, sanitized, explicitly enabled,
and unable to mutate domain data; deterministic wording always remains available.
