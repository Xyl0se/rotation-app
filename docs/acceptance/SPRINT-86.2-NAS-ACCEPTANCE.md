# Sprint 86.2 — Extended Insights NAS Acceptance

## Preconditions

- [ ] API and Web `latest` images originate from the same green commit.
- [ ] Sprint 86.1 remains accepted and a current database backup exists.
- [ ] Production data contains some release years and structured Album Story fields.

## A. Extended narrative eligibility

- [ ] Confirm an artist narrative appears only when recent listens cover at least two Albums by that artist.
- [ ] Confirm an era narrative names a plausible release decade and its evidence counts match the Library.
- [ ] Confirm a personal-history narrative uses a translated life phase or acquisition reason.
- [ ] Confirm sparse artist, year, or Story data is silently suppressed rather than overstated.

## B. Stable selection

- [ ] Record the visible narrative codes, reload repeatedly, and confirm the same selection and order.
- [ ] Open a second browser in the same week and confirm the selection matches.
- [ ] Confirm no more than four narratives are displayed when more families qualify.

## C. Privacy and traceability

- [ ] Expand every extended narrative and verify factual counts plus stable rule code.
- [ ] Search `/api/insights` for distinctive Journal and `memoryNote` sentences and confirm both are absent.
- [ ] Confirm artist names and structured fields are the only personal-history subjects returned.
- [ ] Confirm viewing Insights performs no write request and changes no domain state.

## D. Language, tone, and regression

- [ ] Verify artist, decade, life-phase, acquisition, and evidence copy in DE and EN.
- [ ] Confirm German decades use forms such as `1990er`, not `1990s`.
- [ ] Confirm the narratives remain observational rather than prescriptive or evaluative.
- [ ] Smoke-test Reflection, Album Coach, Home, Export, Bindings, and Settings.

## E. Operational behavior

- [ ] Confirm Insights remains responsive with production data.
- [ ] Restart API and Web and confirm selection remains stable for the current week.
- [ ] Confirm no migration or backup change was required.

## Acceptance

- [ ] Extended observations add meaning without making the page dense.
- [ ] Weekly stability feels calm and predictable.
- [ ] Private prose remains excluded and no domain state was mutated.
- [ ] Any deviations are documented before Sprint 86 is closed.
