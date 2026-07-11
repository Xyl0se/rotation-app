# Album Coach

The Album Coach determines the current relationship with an album.

It replaces direct role selection with short yes/no questions. This makes the classification feel less like administration and more like reflection.

## Decision Tree (Sprint 57)

The new tree is fully deterministic with 8 possible questions and no mandatory long question chain.

### Step 1: Listened Enough?

**Question:** Has the album been listened to consciously at least three times?

- **No** → `new`
- **Yes** → Continue

### Step 2: Would Miss?

**Question:** Would I miss this album?

- **No** → `archive`
- **Yes** → Continue

### Step 3: Returning Consciously?

**Question:** Do I still return to this album consciously?

- **No** → Passive branch (Step 5)
- **Yes** → Active branch (Step 4)

### Step 4: Shaped Taste Long-Term? (Active Branch)

**Question:** Has this album shaped my taste long-term?

- **Yes** → `classic`
- **No** → Continue to Step 6

> **Priority rule:** `classic` takes precedence over `comfort-food` and `growing`.

### Step 5: Musically Valued? (Passive Branch)

**Question:** Do I value this album musically?

- **Yes** → `admire`
- **No** → `archive`

### Step 6: Comfort Album?

**Question:** Is this an automatic feel-good album?

- **Yes** → `comfort-food`
- **No** → Continue

### Step 7: Still Surprising?

**Question:** Does this album still surprise or challenge me?

- **Yes** → `growing`
- **No** → `archive`

### Partial Answers

`AlbumCoachAnswers = Partial<AlbumCoachAnswerValues>`.

Missing answers are not interpreted as `false`.

## Roles

- `new`: The album wants to be discovered first.
- `growing`: The album changes with further listens.
- `comfort-food`: The album is familiar and reliable.
- `classic`: The album has had a lasting formative effect.
- `admire`: The album is appreciated without being listened to often.
- `archive`: The album is resting at the moment.

## Examples

### Example: Kid A

✓ listened at least three times

✓ would miss it

✓ still returning consciously

✗ did not shape taste long-term

✗ not a comfort album

✓ still surprises me

➡️ Growing

### Example: Rumours

✓ listened at least three times

✓ would miss it

✓ still returning consciously

✗ did not shape taste long-term

✓ comfort album

➡️ Comfort Food

### Example: Unknown Pleasures

✓ listened at least three times

✓ would miss it

✓ still returning consciously

✓ shaped taste long-term

➡️ Classic (priority over comfort-food/growing)

### Example: Obscure Jazz Record

✓ listened at least three times

✓ would miss it

✗ not returning consciously anymore

✓ valued musically

➡️ Admire
