# Dashboard

The Dashboard bundles the most important signals of the current collection.

It replaces no domain logic.

It evaluates no library.

It makes developments and connections visible and helps direct attention to the right albums.

---

## Task

The Dashboard answers questions like:

- Which albums are occupying me right now?
- What stories are developing in my collection?
- Which reflection deserves attention?
- Which roles are currently represented?
- How is my player rotation developing?

It explicitly does **not** answer:

- Which role is too large?
- Which role is too small?
- Which distribution would be optimal?

---

## Areas

The Dashboard consists of:

- Reflection — open questions and possible reclassifications
- Insights — linguistic observations about collection and listening behavior
- Role overview — neutral overview of current album roles

Long term, the Dashboard can additionally integrate Explainability of the active player rotation.

---

## Data Flow

The HomePage passes:

- `albums`
- `reflectionPrompt`

The Dashboard uses exclusively existing domain functions.

For example:

- `evaluateReflection`
- `evaluateInsights`

Further domains (Explainability of the player rotation) can be added later.

---

## Role Overview

The role overview serves exclusively for orientation.

Each role shows:

- Title
- Description
- Number of albums
- Optional cover preview

The role overview has:

- No target sizes
- No limits
- No progress bars
- No warnings
- No recommendations

Album roles describe relationships with music.

They have no optimal size.

---

## Product Principle

The library is not evaluated.

The Dashboard observes developments.

It supports reflection.

It explains connections.

It does not optimize a collection.

---

## Product Limit

The Dashboard is not an analytics dashboard.

It contains:

- No charts
- No KPIs
- No scores
- No gamification
- No role optimization

The Dashboard answers exclusively:

> What deserves attention right now?

Not:

> What should I optimize?
