# Sprint 82F — Performance Baseline and Budgets

## Purpose

These budgets protect Rotation's actual single-user NAS/browser workload. They are not
generic web benchmarks. CI gates use generous deterministic ceilings; wall-clock NAS
results remain a release-acceptance observation because shared CI timing is misleading.

## Reference datasets

| Dataset | Shape |
|---|---|
| Large Library | 10,000 Albums, 500 Artists, four eligible roles |
| Rotation history | 50 archived Rotations, 25 ordered items and one linked export each |
| Initial Home | At most 10,000 Albums, one active/draft plan, and newest 1,000 Listening Events |
| History page | 10 Rotations per request |
| Audit | 20 events per request |
| Scan/export | Real mounted music tree; measured on NAS because filesystem/cache behavior dominates |

## Automated baseline — 2026-07-16

Environment: Apple Silicon (`arm64`), Node 22-compatible local toolchain, in-memory
SQLite for database microbenchmarks, warm dependency cache. Measurements are test-run
durations rather than claims about production NAS latency.

| Path | Observed local evidence | Regression budget |
|---|---:|---:|
| Library filter, 10,000 Albums | Included in 25 ms combined domain-test body | < 500 ms |
| Rotation generation, 10,000 Albums | Included in 25 ms combined domain-test body | < 500 ms |
| SQLite Album hydration, 10,000 Albums | Included in 66 ms database test including fixture creation | < 500 ms query/hydration |
| History page, 10 of 50 Rotations | Included in same 66 ms test | < 250 ms repository call |
| Production frontend bundle | 360.09 kB / 107.22 kB gzip after 82E | < 450 kB / < 140 kB gzip |

The ceilings intentionally leave headroom for slower CI runners while still catching
algorithmic regressions such as accidental quadratic filtering or unbounded history.

## Query-plan evidence

Migration 11 adds only indexes demonstrated by the representative hot queries:

- `idx_albums_created_id` serves newest-first bounded Library loading.
- `idx_listen_events_time` serves newest-first bounded initial listening history.
- `idx_exports_rotation_status_created` prevents a scan for each History item.
- Existing `idx_rotation_history` serves archived pagination.
- The `rotation_plan_items` primary key already serves ordered item hydration; no extra
  index was added.

Automated tests assert that SQLite selects each relevant index through
`EXPLAIN QUERY PLAN`.

## Request bounds and initial-load policy

- `/albums`: maximum 10,000 per request; offset supported.
- `/bindings`: maximum 10,000 per request; offset supported.
- `/rotation-state/listens`: defaults to 1,000, maximum 5,000; newest first and offset supported.
- `/rotation-state/history`: defaults to 20, maximum 100; Home never requests it.
- `/audit`: repository-bounded to 20; only Settings requests it.
- Export staging remains a durable asynchronous job. History and export staging are not
  loaded into initial Home state.

## Render and filesystem audit

Library already renders only the current 10-item UI page. Filtering and Rotation
generation are linear and remain below budget at 10,000 Albums, so memoization or
virtualization would add complexity without measured benefit.

Directory scan and export preview still perform synchronous metadata traversal. Local
fixtures do not reproduce Synology disk/cache behavior; no architectural rewrite is
justified without a measured NAS breach. File copying itself remains asynchronous and
durable. Record cold and warm scan/preview observations during release acceptance.

## NAS acceptance observations

Record these in `docs/archive/acceptance-tests/SPRINT-82-RELEASE-ACCEPTANCE.md`:

| Path | Budget | Cold | Warm | Result |
|---|---:|---:|---:|---|
| Home usable after navigation | 3 s | | | |
| Library filter/page interaction | 250 ms perceived | | | |
| Rotation generation | 1 s | | | |
| History page (10 items) | 1 s | | | |
| Music-folder scan | baseline only; no timeout | | | |
| Export preview | 5 s | | | |

If scan or preview breaches the operational timeout on the representative NAS tree,
schedule a bounded job implementation based on that evidence rather than masking it
with a larger browser timeout.
