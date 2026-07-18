# Sprint 86.1 — Deeper Insights NAS Acceptance

## Preconditions

- [ ] API and Web `latest` images originate from the same green commit.
- [ ] A database backup exists before redeployment.
- [ ] The Library, Listening Events, and at least one accepted Rotation load normally.

## A. Read-only and baseline

- [ ] Open Insights without a Write Token and confirm narratives and Role overview load.
- [ ] Confirm the Role counts match the visible Library, including empty Roles.
- [ ] Reload and switch browsers; confirm the same eligible narratives remain stable.
- [ ] Confirm loading Insights changes no Album, Role, Reflection, Rotation, or Archive state.

## B. Evidence and tone

- [ ] Expand “Why am I seeing this?” on every card.
- [ ] Confirm every card shows factual counts and a stable rule code.
- [ ] Confirm periods and counts are plausible for the production data.
- [ ] Confirm no statement describes the Library as healthy, deficient, optimal, or scored.
- [ ] Confirm no more than four narratives are shown.

## C. Sparse and historical behavior

- [ ] With insufficient comparable listening history, confirm an honest building state appears.
- [ ] Confirm an Album's current Role is not presented as its historical listening Role when Role History changed later.
- [ ] Confirm a previous accepted Rotation enables the Rotation-change family; absence is handled quietly.

## D. Privacy and language

- [ ] Search the `/api/insights` response for a distinctive Journal sentence and confirm it is absent.
- [ ] Confirm Album Story `memoryNote` prose is absent from the response.
- [ ] Verify all headings, narratives, evidence labels, and building states in DE and EN.

## E. Operational smoke

- [ ] Confirm the Insights request completes without noticeable delay on the NAS.
- [ ] Restart API and Web; confirm Insights returns without migration or persistence errors.
- [ ] Confirm Reflection, Album Coach, Export, Bindings, and Home still open normally.

## Acceptance

- [ ] The observations feel calm, useful, and traceable rather than dashboard-like.
- [ ] Sparse data is represented honestly.
- [ ] No private prose or domain data was altered.
- [ ] Deviations are documented before 86.2 begins.
