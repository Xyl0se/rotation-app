# Sprint 83.1 — Album Intake Compression

**Status:** Planned — concept approved, implementation pending

**Target version:** v0.30.1

**Type:** Workflow simplification, intake UX, role explainability, and metadata resilience

---

## Goal

Reduce the effort required to turn a music folder into a fully captured, bound, and
classified Library Album.

The Album Coach becomes a short three-stage journey, unresolved Bindings become the
clear primary task of the Bindings page, and metadata search becomes more resilient
to filesystem-safe punctuation.

## Product Decisions

Rotation should help the user make a thoughtful decision without forcing them
through an unnecessarily long sequence of screens. The Coach recommends a role, but
the user remains authoritative and explicitly confirms the final result.

Binding a folder and creating or selecting its Library Album should feel like one
atomic action rather than a chain of technical confirmations.

`archive` remains one visible role, but it is not one homogeneous relationship. A
stable internal Archive reason preserves why an Album was archived without creating
additional visible roles. Archive is a low-priority recommendation and requires
explicit evidence that no active positive role fits; uncertainty alone is not enough.

## Workstream 83.1A — Three-Stage Album Coach

Replace the current one-question-per-screen flow with exactly three visible stages:

1. **Intro**
   - Keep the existing reflective introduction.
   - Show the Album cover when available.
   - Explain that Rotation will suggest a role rather than decide it permanently.

2. **Relationship Snapshot**
   - Present all relevant inputs on one compact, readable page.
   - Prefer segmented controls and explicit choices over ambiguous free-form sliders.
   - Reveal follow-up inputs only when they are relevant.
   - Keep the complete Snapshot on one page at normal desktop and tablet widths.

3. **Recommendation**
   - Present one primary recommended role.
   - Explain which answers led to the recommendation.
   - Allow the user to accept it or select any other role directly.
   - Persist only the role finally confirmed by the user.

The Coach must remain usable from Capture, Library editing, Reflection Inbox, and
Archive Return workflows.

## Workstream 83.1B — Compact Relationship Model

Collect a small set of understandable signals:

- **Listening exposure**
  - Not yet listened to consciously
  - Up to three conscious listens
  - More than three conscious listens
- **Personal connection**
  - Five-point scale from little connection to very strong connection
- **Current return behavior**
  - Regularly
  - Occasionally
  - Rarely
  - Never
- **Time in the collection**
  - Less than six months
  - Six months to two years
  - Two to ten years
  - More than ten years
- **Formative influence**
  - Did this Album shape the user's musical taste?
- **Familiarity**
  - Is returning to this Album primarily comforting and familiar?
- **Continuing discovery**
  - Does the Album still reveal something, surprise, or challenge the user?

If insufficient exposure or no positive active relationship is apparent, show one
additional explicit relationship choice rather than inferring Archive from missing
or ambiguous answers.

The answer model uses stable semantic values rather than UI positions or localized
labels. Personal-connection stars are Coach evidence, not a persisted public review
or objective quality score.

## Workstream 83.1C — Deterministic Recommendation Policy

Keep role determination deterministic and cover the complete answer space with a
documented decision table.

Recommended priority:

1. **Newly Discovered**
   - Insufficient listening exposure and an explicit wish to continue exploring.
2. **Classic**
   - Strong personal connection plus formative, long-term biographical relevance.
3. **Comfort Food**
   - The present relationship is primarily defined by familiar, reliable return.
4. **Still Growing**
   - Continued return combined with discovery, surprise, or challenge.
5. **Admired**
   - Personal musical regard without a meaningful current desire to listen.
6. **Archive**
   - An explicit conclusion that no active positive role fits.

Time owned and personal-connection rating are supporting evidence and never determine
a role by themselves. Ambiguous combinations produce an explainable conservative
recommendation, never a random choice.

The result explanation should be concrete, for example:

> Rotation suggests Classic because this Album has accompanied you for years,
> strongly shaped your taste, and still matters to you today.

## Workstream 83.1D — Granular Archive Reasons

Keep `archive` as the only visible role while recording one optional internal reason:

### `not-interested-in-discovery`

The Album has not been explored sufficiently, and the user explicitly does not want
to give it further attention now.

Example explanation:

> You do not know this Album in depth yet, but you do not want to give it more room
> at the moment.

### `relationship-complete`

The Album was sufficiently heard and may have had an important or enjoyable phase,
but it no longer has an active role today.

Example explanation:

> This Album had its place in your life, but that relationship now seems complete.

### `canonical-but-not-personal`

The user recognizes an Album's cultural, historical, or artistic significance but
has no meaningful personal relationship with it.

This is distinct from:

- `classic`: personally formative and biographically important;
- `admire`: personally valued, even if rarely heard;
- `canonical-but-not-personal`: understood as important to others, but not personally
  valued enough for an active role.

Example explanation:

> You recognize why this Album matters, but it is not your personal Classic and does
> not draw you back.

### `no-connection`

The Album received sufficient listening attention, but no stable personal connection
or musical appreciation developed.

Example explanation:

> You gave this Album enough room, but no lasting connection emerged.

### Archive recommendation boundary

When no positive role is clear, ask which statement best describes the relationship:

- I still want to get to know this Album.
- I value it even though I rarely listen to it.
- It had its time, but that relationship is complete.
- I understand its significance, but it is not my Album.
- It never reached me despite several attempts.

The first answer routes to Newly Discovered or Still Growing; the second routes to
Admired; the remaining answers route to Archive with the corresponding reason.

For insufficiently heard Albums, retain the explicit question whether the user wants
to give the Album a real chance. Only an explicit “No” recommends Archive with
`not-interested-in-discovery`.

## Workstream 83.1E — Archive Reason Contract and Compatibility

Define a stable optional domain type:

```ts
type ArchiveReason =
    | "not-interested-in-discovery"
    | "relationship-complete"
    | "canonical-but-not-personal"
    | "no-connection"
```

- Store the reason with the confirmed Archive role-history entry.
- Keep the reason absent for non-Archive roles.
- Treat existing Archive history without a reason as valid `unknown` legacy data.
- Do not retroactively infer reasons for existing Albums.
- Store neither an unconfirmed recommendation nor discarded alternative roles.
- Make the reason available as future evidence for Reflection Inbox recurrence and
  warm/cold Archive projection without showing warm/cold as user-facing roles.
- An explicit return from Archive starts a new relationship phase and must not remain
  permanently penalized by the previous Archive reason.

Suggested future reflection behavior:

- `not-interested-in-discovery`: may receive a rare, low-pressure second chance;
- `relationship-complete`: may be revisited after a meaningful life interval;
- `canonical-but-not-personal`: should be asked about very rarely;
- `no-connection`: remains cold unless materially new listening occurs.

## Workstream 83.1F — User Override and Role History

- Show all six roles as compact, clearly labelled alternatives on the result screen.
- Highlight the recommendation without making alternatives look like errors.
- If Archive is manually selected, request an Archive reason before confirmation.
- Save only after explicit confirmation.
- Record the final role and optional Archive reason in Role History with the correct
  source.
- Do not record the discarded recommendation as a role change.
- Preserve all existing Coach entry points and cancellation behavior.
- Do not overwrite Album Story fields or listening history.

## Workstream 83.1G — Binding Page Task Focus

Make unresolved folders the primary content of the Bindings page.

- Default to unresolved Bindings whenever at least one exists.
- Automatically switch to the complete Binding inventory only when no unresolved
  Binding remains.
- Keep an explicit view switch so the user can still inspect all Bindings.
- Show a calm completion state when the unresolved queue is empty.
- Do not use warning counters or inbox-zero language.

An unresolved Binding card becomes one accessible interactive surface:

- Clicking or activating the card opens the Album Discovery workflow.
- Preserve correct keyboard focus, button semantics, and touch behavior.
- Avoid nested interactive controls inside a clickable card.
- Move delete, unlink, diagnostics, and other secondary operations into a clearly
  separated details or overflow surface.

## Workstream 83.1H — Unified Binding Resolution

The Album Discovery workflow covers both possible outcomes:

1. Link the folder to an existing Library Album.
2. Create a new Library Album and link it immediately.

After successful completion, Library Album creation or selection, Binding link,
Binding confirmation, and refreshed Binding state behave as one atomic server
operation.

- Remove the separate manual confirmation step after successful Capture.
- If any step fails, keep the previous state intact and the card unresolved.
- Preserve existing-Library candidate review so simplification cannot create avoidable
  duplicate Albums.
- Never make destructive actions an accidental consequence of card activation.

## Workstream 83.1I — Filesystem-Safe Metadata Search

Introduce one shared metadata-search normalization pipeline for Album and artist
names. Generate bounded variants for punctuation commonly changed by filesystems or
folder naming conventions:

- `:` and `_`
- `+`, `&`, and the word `and`
- dashes and hyphens
- repeated whitespace
- apostrophe variants
- Unicode composition and diacritics

For example, `Smoke + Mirrors` may be searched as:

- `Smoke + Mirrors`
- `Smoke & Mirrors`
- `Smoke and Mirrors`
- `Smoke Mirrors`

Requirements:

- Always try the original title first.
- Keep provider requests bounded and deduplicate equivalent variants.
- Escape MusicBrainz query syntax correctly.
- Fall back to the existing words-only search.
- Never silently replace the title finally stored in the Library.
- Add regression tests for `+`, `_`, `:`, `&`, dashes, apostrophes, and Unicode.

## Workstream 83.1J — Migration and Cross-Workflow Safety

- Existing Albums, roles, Bindings, and role histories remain valid.
- Existing role-determination tests become the baseline for the new decision table.
- Reflection Inbox and Archive Return continue opening the correct Coach variant.
- Capture continues to invoke the Coach after a newly created Album is bound.
- DE and EN use the same semantic answer and Archive-reason model.
- The workflow remains usable on narrow screens, by touch, and by keyboard.
- Backup/restore and a second browser preserve final roles and Archive reasons.

## Definition of Done

- [ ] Album classification has exactly three visible stages: Intro, Snapshot, Result.
- [ ] The Snapshot normally requires one page and no repeated modal transitions.
- [ ] Every valid answer combination produces a deterministic, tested recommendation.
- [ ] Archive is recommended only from an explicit conclusion, not ambiguity alone.
- [ ] All four Archive reasons are distinguishable, explainable, and tested.
- [ ] Existing Archive history without a reason remains valid.
- [ ] The result explains its recommendation and permits every role as an override.
- [ ] Manual Archive selection requires a reason before confirmation.
- [ ] Only the explicitly confirmed role and optional Archive reason enter Role History.
- [ ] Capture, Library, Reflection, and Archive entry points continue to work.
- [ ] Unresolved Bindings are the default view while any exist.
- [ ] One card activation opens the complete resolution workflow.
- [ ] Successful Capture creates or selects, links, and confirms atomically without a
  second approval.
- [ ] Failed Capture leaves no partial Album or half-confirmed Binding.
- [ ] Existing-Album matching remains available after visible card actions are reduced.
- [ ] Metadata search resolves `Smoke + Mirrors` and all documented punctuation cases.
- [ ] DE/EN, keyboard, touch, responsive layout, cancellation, retry, persistence,
  migration, and backup/restore behavior are tested.
- [ ] NAS acceptance confirms that processing a larger unresolved batch feels
  materially faster than before.

## Non-Goals

- Machine-learned or AI-based role prediction
- Automatic role changes without explicit confirmation
- Additional visible Archive sub-roles
- User-visible warm/cold Archive labels
- Persisting a public star rating or review score
- Retroactively assigning Archive reasons to existing Albums
- Replacing Album Story or Listening Journal fields
- Bulk auto-acceptance of metadata matches
- Deleting or hiding the complete Binding inventory
- Removing unlink, delete, diagnostic, or repair capabilities
- Changing Rotation role quotas
- General redesign of Home, Insights, Export, or Settings
