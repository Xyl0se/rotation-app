# Sprint 92C — Email Service & Weekly Briefing

**Status:** Future

**Target version:** Future minor (not scheduled)

**Type:** Notification & content generation

**Depends on:** 92B

## Goal

Send a concise, anticipation-building weekly briefing email after a successful automated rotation and export. The email summarises the upcoming listening week and highlights 1–3 featured albums. The content generation logic is strictly separated from the transport layer.

## Scope

### 1. Email Service Abstraction

`EmailService` is a thin wrapper around an SMTP transport (e.g. Nodemailer). It owns **only** transport concerns:

- Connection pooling and lifecycle
- HTML + plain-text message construction
- Send operation with timeout
- Error handling and logging

Interface:

```typescript
interface EmailService {
  send(options: EmailMessage): Promise<{ messageId: string }>
  verifyConnection(): Promise<boolean>
}

interface EmailMessage {
  to: string
  subject: string
  htmlBody: string
  textBody: string
}
```

SMTP configuration is read from environment variables:

| Variable | Required | Default |
|----------|----------|---------|
| `ROTATION_SMTP_HOST` | Yes | — |
| `ROTATION_SMTP_PORT` | No | 587 |
| `ROTATION_SMTP_SECURE` | No | false |
| `ROTATION_SMTP_USER` | Yes | — |
| `ROTATION_SMTP_PASS` | Yes | — |
| `ROTATION_SMTP_FROM` | Yes | — |

If any required variable is missing, the `EmailService` is created in a **degraded** state where `send()` logs a warning and returns a mock success (or throws, depending on strictness decided at implementation time). The scheduler must not crash because SMTP is unconfigured.

### 2. HTML Email Template

A single, self-contained HTML template for the Weekly Briefing. Requirements:

- Mobile-friendly (max width ~600px)
- Inline CSS or `<style>` block (no external stylesheets)
- Light background, readable typography
- No images (keeps emails lightweight and avoids tracking concerns)
- Plain-text fallback generated from the same content

Template sections:

1. **Header** — e.g. "Your listening week is ready."
2. **Summary** — album count, total duration, artist count, first-listen count
3. **Featured Albums** — 1–3 albums with category label and short explanation
4. **Closing** — e.g. "Have a wonderful listening week."

### 3. WeeklyBriefingService

`WeeklyBriefingService` generates the content. It knows **nothing** about SMTP. It receives:

- The active `RotationPlan`
- The full album list (for enrichment)
- The `ListenEvent` history (for highlight logic)

And produces:

```typescript
interface WeeklyBriefing {
  weekIdentifier: string      // e.g. "2026-W30"
  albumCount: number
  totalDurationMinutes: number | null
  artistCount: number
  firstListenCount: number
  featuredAlbums: FeaturedAlbum[]
}

interface FeaturedAlbum {
  albumId: string
  title: string
  artist: string
  category: HighlightCategory
  explanation: string
}

type HighlightCategory =
  | "never-listened"
  | "long-time-no-listen"
  | "second-chance"
  | "recently-added"
  | "forgotten-favourite"
  | "returning-archive"
  | "coach-recommendation"
```

#### Highlight Selection Algorithm

Select 1–3 albums from the active rotation using the following priority:

1. **Never listened** — `listenCount === 0` and no `listenEvents`.
2. **Long time no listen** — Most days since `lastListened` (or most recent `listenEvent`), minimum threshold 730 days (> 2 years).
3. **Second chance** — Album previously in a rotation that was archived without being fully listened to. Detected via: album appears in a previous archived rotation but has fewer listen events than rotation items.
4. **Returning archive** — Album was previously `archived` category and has since been reactivated. Detected via `roleHistory` showing an `archived` → active transition.
5. **Recently added** — Album with the most recent `created_at` in the library, not older than 30 days.
6. **Forgotten favourite** — High `listenCount` but longest gap since last listen (minimum 365 days).
7. **Coach recommendation** — Album whose current role was set by Album Coach (detected via `roleHistory`).

Selection rules:

- Pick the highest-priority category that yields at least one candidate.
- Never select more than 3 albums.
- Never select the same album twice.
- If fewer than 3 albums match any category, return fewer.
- If no highlight categories match (edge case), return an empty `featuredAlbums` array and omit the section from the email.

#### Duration Calculation

`totalDurationMinutes` is derived from the playback manifest if available, or summed from audio file metadata. If neither is available, the field is `null`.

#### Artist Count

Distinct `artist` values across the rotation's albums.

#### First Listen Count

Number of albums in the rotation with `listenCount === 0` (no listen events).

### 4. Weekly Rotation Job Extension

The `WeeklyRotationJob` from 92B is extended to send the briefing **after** a successful export (or after successful generation if auto-export is disabled but email is enabled).

Logic:

```typescript
if (automationSettings.emailEnabled && automationSettings.emailRecipient) {
  const briefing = weeklyBriefingService.generate(plan, albums, listenEvents);
  const { htmlBody, textBody } = renderWeeklyBriefing(briefing);
  await emailService.send({
    to: automationSettings.emailRecipient,
    subject: `Your Rotation — Week ${briefing.weekIdentifier}`,
    htmlBody,
    textBody,
  });
}
```

If SMTP is unconfigured or the send fails:

- The failure is logged.
- The job log entry remains `completed` (the rotation and export succeeded; email is a side effect).
- Optionally, a separate error-notification email is attempted (if configured).

### 5. Error Notification Email

If the weekly rotation job fails (generation or export), an optional error notification can be sent to the same recipient:

```
Subject: Rotation Automation Failed — Week 2026-W30
Body: Brief error summary + timestamp + suggestion to check logs.
```

This is only sent if `emailEnabled === true` and SMTP is healthy. It does not block the job log.

### 6. Configuration Integration

The existing `automation_settings` table (from 92A) already contains `email_enabled` and `email_recipient`. No new persistence is required for 92C.

### 7. Testability

- `WeeklyBriefingService` is pure logic and fully unit-testable with mocked data.
- `EmailService` is tested with a mock transport in unit tests.
- Integration tests verify the full pipeline using a test SMTP server (e.g. Mailpit or ethereal.email).

## Non-Goals

- Push notifications
- Calendar integration
- AI-generated listening commentary
- Multiple email templates (only Weekly Briefing)
- Email scheduling (send immediately after export; no delayed delivery)
- Unsubscribe management (single recipient, system email)

## Technical Decisions

### Why separate WeeklyBriefingService from EmailService?

To keep content generation testable without an SMTP dependency, and to allow future channels (push, in-app) to reuse the same briefing content.

### Why no images in emails?

Avoids external dependencies, tracking concerns, and spam-folder heuristics. The design relies on typography and layout instead.

### Why null totalDurationMinutes instead of 0?

0 would misleadingly suggest the rotation has no content. Null signals "duration unknown" and the template omits the line.

## Definition of Done

- [ ] `EmailService` abstraction exists with SMTP transport
- [ ] SMTP configuration is validated at startup; degraded mode handled gracefully
- [ ] `WeeklyBriefingService` generates briefing content from rotation + history
- [ ] Highlight categories are fachlich defined and consistently selected
- [ ] HTML + plain-text email template renders correctly
- [ ] Weekly Rotation Job sends the briefing after successful export/generation
- [ ] Failed email send is logged but does not mark the job as failed
- [ ] Optional error-notification email is sent on job failure
- [ ] All new code passes lint and type-check
- [ ] Unit tests for briefing generation (all highlight categories)
- [ ] Integration tests for email send pipeline
