# Sprint 86.1 — Deeper Insights NAS Acceptance

**Result:** Accepted — all checks passed

## Preconditions

- [x] API and Web `latest` images originate from the same green commit.
- [x] A database backup exists before redeployment.
- [x] The Library, Listening Events, and at least one accepted Rotation load normally.

## A. Read-only and baseline

- [x] Open Insights without a Write Token and confirm narratives and Role overview load.
- [x] Confirm the Role counts match the visible Library, including empty Roles.
- [x] Reload and switch browsers; confirm the same eligible narratives remain stable.
- [x] Confirm loading Insights changes no Album, Role, Reflection, Rotation, or Archive state.

## B. Evidence and tone

- [x] Expand “Why am I seeing this?” on every card.
- [x] Confirm every card shows factual counts and a stable rule code.
- [x] Confirm periods and counts are plausible for the production data.
- [x] Confirm no statement describes the Library as healthy, deficient, optimal, or scored.
- [x] Confirm no more than four narratives are shown.

## C. Sparse and historical behavior

- [x] With insufficient comparable listening history, confirm an honest building state appears.
- [x] Confirm an Album's current Role is not presented as its historical listening Role when Role History changed later.
- [x] Confirm a previous accepted Rotation enables the Rotation-change family; absence is handled quietly.

## D. Privacy and language

- [x] Search the `/api/insights` response for a distinctive Journal sentence and confirm it is absent.
- [x] Confirm Album Story `memoryNote` prose is absent from the response.
- [x] Verify all headings, narratives, evidence labels, and building states in DE and EN.

## E. Operational smoke

- [x] Confirm the Insights request completes without noticeable delay on the NAS.
- [x] Restart API and Web; confirm Insights returns without migration or persistence errors.
- [x] Confirm Reflection, Album Coach, Export, Bindings, and Home still open normally.

## Acceptance

- [x] The observations feel calm, useful, and traceable rather than dashboard-like.
- [x] Sparse data is represented honestly.
- [x] No private prose or domain data was altered.
- [x] Deviations are documented before 86.2 begins.
