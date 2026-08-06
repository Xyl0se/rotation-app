# Sprint 92C Acceptance — Email Service & Weekly Briefing

## Overview

Validate that the email transport layer is robust, the weekly briefing content is generated correctly from rotation and listening history, and the full send pipeline works end-to-end without coupling content to transport.

---

## 1. Email Service Abstraction

### 1.1 SMTP configuration validation

```
GIVEN all required SMTP env vars are set
WHEN the server starts
THEN EmailService.verifyConnection() returns true within 5 seconds
```

### 1.2 Degraded mode when SMTP unconfigured

```
GIVEN ROTATION_SMTP_HOST is missing
WHEN the server starts
THEN EmailService is created in degraded mode
AND send() logs a warning
AND does not crash the scheduler or weekly rotation job
```

### 1.3 Send succeeds with mock transport in tests

```
GIVEN a test EmailService using a mock SMTP transport
WHEN send() is called with a valid EmailMessage
THEN the mock transport receives the message
AND the returned messageId is non-empty
```

### 1.4 Send timeout handling

```
GIVEN an SMTP server that accepts the connection but never responds
WHEN send() is called
THEN it rejects with a timeout error within 30 seconds
```

### 1.5 Connection error handling

```
GIVEN an unreachable SMTP host
WHEN send() is called
THEN it rejects with a connection error
AND the error is logged with the recipient and subject
```

---

## 2. WeeklyBriefingService — Content Generation

### 2.1 Basic briefing structure

```
GIVEN an active rotation with 10 albums
AND 5 distinct artists
AND 3 albums with listenCount === 0
WHEN WeeklyBriefingService.generate(plan, albums, listenEvents) is called
THEN the result contains:
  weekIdentifier matching the current ISO week
  albumCount: 10
  artistCount: 5
  firstListenCount: 3
  totalDurationMinutes: number | null
  featuredAlbums: array with 1–3 items
```

### 2.2 Never-listened highlight

```
GIVEN a rotation containing an album with no listen events
AND no higher-priority category applies
WHEN the briefing is generated
THEN featuredAlbums includes that album
AND its category is "never-listened"
AND explanation contains "never played before" or similar
```

### 2.3 Long-time-no-listen highlight

```
GIVEN a rotation containing an album whose last listen event is 800 days ago
AND no "never-listened" album exists
WHEN the briefing is generated
THEN featuredAlbums includes that album
AND its category is "long-time-no-listen"
AND explanation references the time gap
```

### 2.4 Long-time threshold enforced

```
GIVEN an album last listened 600 days ago
WHEN the briefing is generated
THEN it is NOT selected as "long-time-no-listen"
  (below 730-day threshold)
```

### 2.5 Second-chance highlight

```
GIVEN an album that appeared in a previous archived rotation
AND that rotation had 5 items
AND the album has only 2 listen events
WHEN the briefing is generated
THEN it MAY be selected as "second-chance"
AND explanation references "another chance" or similar
```

### 2.6 Returning-archive highlight

```
GIVEN an album whose roleHistory contains an "archived" entry
  followed by a non-archived role
WHEN the briefing is generated
THEN it MAY be selected as "returning-archive"
AND explanation references returning from archive
```

### 2.7 Recently-added highlight

```
GIVEN an album created 10 days ago
AND no higher-priority category applies
WHEN the briefing is generated
THEN it MAY be selected as "recently-added"
AND explanation references being new to the library
```

### 2.8 Recently-added threshold enforced

```
GIVEN an album created 45 days ago
WHEN the briefing is generated
THEN it is NOT selected as "recently-added"
  (beyond 30-day threshold)
```

### 2.9 Forgotten-favourite highlight

```
GIVEN an album with listenCount = 15
AND last listen 400 days ago
AND no higher-priority category applies
WHEN the briefing is generated
THEN it MAY be selected as "forgotten-favourite"
AND explanation references "favourite" and the time gap
```

### 2.10 Forgotten-favourite threshold enforced

```
GIVEN an album with listenCount = 15
AND last listen 200 days ago
WHEN the briefing is generated
THEN it is NOT selected as "forgotten-favourite"
  (below 365-day threshold)
```

### 2.11 Coach-recommendation highlight

```
GIVEN an album whose roleHistory shows the current role
  was set by the Album Coach workflow
WHEN the briefing is generated
THEN it MAY be selected as "coach-recommendation"
AND explanation references the Coach
```

### 2.12 Maximum 3 featured albums

```
GIVEN a rotation where 5 albums match highlight categories
WHEN the briefing is generated
THEN featuredAlbums.length is at most 3
```

### 2.13 No duplicate albums

```
GIVEN a rotation where one album matches multiple categories
WHEN the briefing is generated
THEN that album appears at most once in featuredAlbums
```

### 2.14 Empty highlights handled gracefully

```
GIVEN a rotation where no album matches any highlight category
WHEN the briefing is generated
THEN featuredAlbums is an empty array
AND the email template omits the Featured Albums section
```

### 2.15 Priority order respected

```
GIVEN one never-listened album and one long-time-no-listen album
WHEN the briefing is generated
THEN the never-listened album is selected first
AND the long-time-no-listen album is selected second
```

---

## 3. Email Template Rendering

### 3.1 HTML template contains all sections

```
GIVEN a complete WeeklyBriefing
WHEN the HTML template is rendered
THEN the output contains:
  - the header text
  - album count
  - artist count
  - first-listen count
  - each featured album's title, artist, category label, and explanation
  - the closing text
```

### 3.2 Plain-text fallback

```
GIVEN a complete WeeklyBriefing
WHEN the plain-text version is rendered
THEN it contains the same information as the HTML version
AND contains no HTML tags
```

### 3.3 Null duration omitted

```
GIVEN totalDurationMinutes = null
WHEN the HTML template is rendered
THEN no duration line appears in the output
```

### 3.4 Empty featured albums omitted

```
GIVEN featuredAlbums = []
WHEN the HTML template is rendered
THEN the Featured Albums section is completely absent
```

### 3.5 Mobile-friendly layout

```
GIVEN the rendered HTML
WHEN inspected in a browser at 375px width
THEN all text is readable without horizontal scrolling
AND padding/margins are comfortable
```

### 3.6 No external dependencies

```
GIVEN the rendered HTML
WHEN inspected
THEN no <img> tags reference external URLs
AND no <link> tags reference external stylesheets
AND no tracking pixels are present
```

---

## 4. Weekly Rotation Job — Email Integration

### 4.1 Email sent after successful export

```
GIVEN automation enabled
AND email_enabled = true
AND email_recipient = "user@example.com"
AND auto_export_enabled = true
AND the weekly job completes export successfully
WHEN the job handler finishes
THEN EmailService.send() is called exactly once
AND the recipient equals "user@example.com"
AND the subject contains the current week identifier
```

### 4.2 Email sent after generation when export disabled

```
GIVEN automation enabled
AND email_enabled = true
AND auto_export_enabled = false
AND generation succeeds
WHEN the job handler finishes
THEN EmailService.send() is called exactly once
```

### 4.3 No email when email disabled

```
GIVEN email_enabled = false
WHEN the weekly job completes
THEN EmailService.send() is never called
```

### 4.4 No email when recipient unset

```
GIVEN email_enabled = true
AND email_recipient = null
WHEN the weekly job completes
THEN EmailService.send() is never called
```

### 4.5 Failed email does not fail the job

```
GIVEN email_enabled = true
AND EmailService.send() throws a connection error
WHEN the weekly job runs
THEN the job log entry remains "completed"
AND the rotation and export remain successful
AND the error is logged
```

### 4.6 Error notification email on job failure

```
GIVEN email_enabled = true
AND the weekly rotation job fails during generation
WHEN the error is caught
THEN an error-notification email is sent
AND the subject contains "Failed"
AND the body contains the week identifier and error summary
```

### 4.7 No error notification when email disabled

```
GIVEN email_enabled = false
AND the weekly rotation job fails
WHEN the error is caught
THEN no error-notification email is sent
```

---

## 5. SMTP Integration Tests

### 5.1 Real SMTP send (test server)

```
GIVEN a test SMTP server (e.g. Mailpit or ethereal.email)
WHEN EmailService.send() is called with a weekly briefing
THEN the message is received by the test server
AND the HTML body matches the rendered template
AND the text body matches the plain-text fallback
```

### 5.2 Weekly briefing end-to-end

```
GIVEN a complete automated weekly rotation job
AND a test SMTP server
WHEN the job executes successfully
THEN the test server receives exactly one briefing email
AND the email subject contains the current ISO week
AND the email body contains the rotation summary
```

---

## 6. Error Handling & Edge Cases

### 6.1 Rotation plan with zero albums

```
GIVEN an active rotation with 0 items
WHEN WeeklyBriefingService.generate() is called
THEN it returns albumCount: 0
AND artistCount: 0
AND firstListenCount: 0
AND featuredAlbums: []
```

### 6.2 Album missing from library

```
GIVEN a rotation item references an albumId not present in the album list
WHEN the briefing is generated
THEN that item is skipped for enrichment
AND the summary counts reflect the available data
```

### 6.3 Listen events empty

```
GIVEN no listen events exist
WHEN the briefing is generated
THEN firstListenCount equals albumCount
  (all albums are effectively never-listened)
AND "never-listened" is the dominant highlight category
```

---

## 7. Non-Goals Verified

| Non-Goal | Verification |
|----------|--------------|
| Push notifications | No push notification code or APIs |
| Calendar integration | No iCal or calendar events generated |
| AI-generated commentary | No LLM calls; explanations are template-based |
| Multiple email templates | Only Weekly Briefing template exists |
| Delayed email delivery | Emails sent synchronously after export |
| Unsubscribe management | No unsubscribe links or list management |