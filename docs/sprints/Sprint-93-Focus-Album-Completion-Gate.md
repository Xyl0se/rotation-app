# Sprint 93 — Focus Album: Completion-aware Rotation

**Status:** Implemented — NAS acceptance pending

**Target version:** Subsequent minor after v0.51.0

**Type:** Listening workflow

**Depends on:** No Sprint-92 dependency. May be scheduled before Sprint 92.

## Goal

Make the Focus Album support a complete pass through the active Player Rotation.
When Rotation suggests a Focus Album, it may select only an album in the active
rotation that has not received a tracked listening session since that rotation
became active. Once every album has such a session, no further Focus Album is
suggested until the next rotation is activated.

This is a gentle completion gate, not a score, streak, or listening quota.

## Product rule

For an active rotation, define its listening window as:

```text
rotation activation timestamp = acceptedAt ?? createdAt
```

An album is eligible as a Focus Album exactly when all of the following are
true:

1. It is an item of the active rotation.
2. It has no `listen_event` whose `listenedAt` is on or after the rotation
   activation timestamp.

Both ways of tracking listening count identically: completion of a whole-album
session and the existing explicit “heard” action. A session from an earlier
rotation never disqualifies an album in the newly activated rotation.

## Scope

### 1. Server-owned eligibility query

Add a repository operation that reads the active rotation and returns its
eligible Focus Album IDs. It must compare persisted `listen_events` against
the active rotation's activation timestamp; do not derive eligibility from the
client's cached album fields.

The query must be bounded to the active rotation's album IDs and avoid an
N+plus-one event lookup. The target is one set-based SQLite query (or an
equivalent repository-level operation).

### 2. Focus-selection boundary

Update `POST /rotation-state/focus/random` to choose uniformly from the
eligible IDs only. If none are eligible, return a stable conflict response:

```text
409 NO_ELIGIBLE_FOCUS_ALBUM
```

Apply the same eligibility rule when a client explicitly sets a Focus Album,
so the server remains the source of truth even if a stale client calls
`PUT /rotation-state/focus`.

Activating a new rotation continues to clear `focusAlbumId`; it also begins a
new listening window through that plan's persisted activation timestamp.

### 3. Client feedback

Adapt the empty Focus Album state and the “suggest another” action:

- Before all rotation albums are heard, the action requests an eligible
  suggestion as today.
- After all have a tracked session, show a calm completion message instead of
  a generic failure: the current rotation has been heard once and the next
  Focus Album arrives with the next rotation.
- Treat the new 409 response as an expected product state, not an error toast.
- Keep manual listening, journal, Rotation review, export, and the automated
  Sprint-92 workflow unchanged.

### 4. Explainability and accessibility

Expose a small read-only eligibility summary where it best fits the existing
Focus/Rotation area, for example “3 of 12 albums still open in this rotation”.
The wording must avoid gamification. The no-eligible state needs a clear,
localized screen-reader announcement and DE/EN copy.

## Non-goals

- Requiring a session to reach a playback-duration threshold.
- Tracking partial playback as listening.
- Changing how a whole-album session creates a `listen_event`.
- Preventing an album from appearing in a future Player Rotation.
- Retrospectively inferring sessions for historic rotations.
- Scores, streaks, badges, notifications, or automatic rotation rollover.

## Implementation sequence

1. Add repository-level eligibility and summary operations, with a fixed clock
   in tests where required.
2. Enforce the rule in both Focus endpoints and define the conflict payload.
3. Extend the client API/service and `useRotationPlan` state to represent
   “all heard” separately from transport errors.
4. Update Focus Album UI, copy, and accessibility states.
5. Add an optional Rotation-detail progress label only if it remains quiet and
   does not duplicate the Focus state.

## Acceptance cases

| Situation | Expected result |
| --- | --- |
| New active rotation, no sessions | Every item is eligible. |
| One item has a session after activation | That item is never selected; other items remain eligible. |
| Session predates activation | The item remains eligible in the new rotation. |
| Session is recorded by whole-album completion | It immediately becomes ineligible after the event persists. |
| Session is recorded manually | It immediately becomes ineligible after the event persists. |
| Every active item has a qualifying session | Random and explicit focus selection return `NO_ELIGIBLE_FOCUS_ALBUM`; UI explains completion. |
| A new rotation is activated | Eligibility resets for its items, regardless of earlier sessions. |
| No active rotation | Existing `NO_ACTIVE_ROTATION` behaviour is retained. |

## Definition of done

- [x] Eligibility is computed server-side from active rotation state and
  persisted listening events.
- [x] Random and explicit Focus Album selection cannot bypass the rule.
- [x] The completed-rotation state is intentional, localized, and accessible.
- [x] Existing session-completion and manual-listen flows are covered as inputs.
- [x] Repository, route, hook, and component tests cover the acceptance cases.
- [x] Lint, tests, production build, and documentation-link check pass.
- [ ] NAS acceptance pass.

## Release gate inherited from Sprint 92

Sprint 93 starts from a clean, validated baseline. The shared domain package
must have a working lint configuration and all documented Markdown links must
resolve, so the project-wide `npm run validate` gate is green. Sprint 92 remains
independent future work.
