# Sprint 86.2 — Extended Insights NAS Acceptance

## Preconditions

- [x] API and Web `latest` images originate from the same green commit.
- [x] Sprint 86.1 remains accepted and a current database backup exists.
- [x] Production data contains some release years and structured Album Story fields.

## A. Extended narrative eligibility

- [x] Confirm an artist narrative appears only when recent listens cover at least two Albums by that artist.
- [x] Confirm an era narrative names a plausible release decade and its evidence counts match the Library.
- [x] Confirm a personal-history narrative uses a translated life phase or acquisition reason.
- [x] Confirm sparse artist, year, or Story data is silently suppressed rather than overstated.

## B. Stable selection

- [x] Record the visible narrative codes, reload repeatedly, and confirm the same selection and order.
- [x] Open a second browser in the same week and confirm the selection matches.
- [x] Confirm no more than four narratives are displayed when more families qualify.

## C. Privacy and traceability

- [x] Expand every extended narrative and verify factual counts plus stable rule code.
- [x] Search `/api/insights` for distinctive Journal and `memoryNote` sentences and confirm both are absent.
- [x] Confirm artist names and structured fields are the only personal-history subjects returned.
- [x] Confirm viewing Insights performs no write request and changes no domain state.

## D. Language, tone, and regression

- [x] Verify artist, decade, life-phase, acquisition, and evidence copy in DE and EN.
- [x] Confirm German decades use forms such as `1990er`, not `1990s`.
- [x] Confirm the narratives remain observational rather than prescriptive or evaluative.
- [x] Smoke-test Reflection, Album Coach, Home, Export, Bindings, and Settings.

## E. Operational behavior

- [x] Confirm Insights remains responsive with production data.
- [x] Restart API and Web and confirm selection remains stable for the current week.
- [x] Confirm no migration or backup change was required.

## Acceptance

- [x] Extended observations add meaning without making the page dense.
- [x] Weekly stability feels calm and predictable.
- [x] Private prose remains excluded and no domain state was mutated.
- [x] Any deviations are documented before Sprint 86 is closed.
