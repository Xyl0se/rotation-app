# Sprint 92D — Client: Automation Settings UI

**Status:** Planned

**Target version:** v0.51.0

**Type:** Frontend feature

**Depends on:** 92A

## Goal

Provide a dedicated Automation section in the client Settings where users can enable, configure, and monitor the automated weekly rotation workflow. The UI communicates with the server APIs introduced in 92A and reflects live scheduler state.

## Scope

### 1. New Settings Section: Automation

A new card or page within the existing Settings UI (location TBD based on current settings structure). Contains:

#### Master Toggle

- **Enable automatic rotation** — Global on/off switch.
- When disabled, all other fields are visually dimmed / read-only.
- Changing this immediately updates the server and reflects in the scheduler status.

#### Scheduling

- **Weekday** — Dropdown: Sunday, Monday, … Saturday (mapped to 0–6).
- **Time** — Time picker (HH:MM, 24-hour format).
- **Timezone** — Read-only display of the configured timezone (default `Europe/Berlin`). Future sprints may make this editable.

#### Email

- **Enable weekly briefing email** — Toggle.
- **Email recipient** — Text input, validated as email address. Only editable when email toggle is on.

#### Export

- **Enable automatic export** — Toggle.
- When enabled, the rotation is automatically exported after generation.

#### Grace Period

- **Catch-up grace period** — Slider or dropdown (0, 60, 120, 240, 480 minutes).
- Explanatory text: "If the server was offline at the scheduled time, Rotation will still run within this window."

#### Status Display

- **Next scheduled run** — Read-only, ISO timestamp formatted for locale.
- **Last run** — Read-only, timestamp + status (completed / failed / skipped).
- **Current week rotation** — Read-only boolean (yes/no).

### 2. API Integration

- `GET /automation/settings` — Load settings on mount.
- `PUT /automation/settings` — Save changes. The server handles live replanning.
- `GET /automation/jobs/weekly-rotation/status` — Poll or fetch on demand for status display.
- `POST /automation/jobs/weekly-rotation/run` — Manual trigger button (debug/maintenance).

### 3. Validation

Client-side validation before sending:

- `weekday`: integer 0–6
- `time`: valid HH:MM, 00:00–23:59
- `email_recipient`: valid email format (when email enabled)
- `grace_period_minutes`: integer ≥ 0

Server-side validation (already specified in 92A) is the authoritative boundary.

### 4. Manual Trigger Button

A **"Run weekly rotation now"** button, visible only when automation is enabled. Requirements:

- Disabled while a job is already running.
- On click: calls `POST /automation/jobs/weekly-rotation/run`.
- Shows loading state during execution.
- Displays result (success / skipped / failed) in a toast or inline message.

This serves as both a debug tool and a way for power users to force a rotation outside the schedule.

### 5. Error Handling

- Network errors during settings load: show retry button.
- Validation errors from server: display inline per field.
- Save failure: revert to last known good state, show error toast.
- Manual trigger failure: show error details without navigating away.

### 6. Responsive Design

The settings form adapts to mobile and desktop:

- Desktop: two-column layout (labels left, inputs right)
- Mobile: single-column stacked layout

### 7. Accessibility

- All inputs have associated `<label>` elements.
- Toggle switches are keyboard-operable.
- Error messages are linked via `aria-describedby`.

## Non-Goals

- Removing manual rotation UI (92E)
- Displaying email preview or template editing
- Configuring SMTP (server-side only)
- Adaptive scheduling UI
- Calendar integration UI
- Push notification settings

## Technical Decisions

### Why a dedicated Automation section instead of scattering settings?

Grouping automation-related controls in one place matches the mental model of "this is how Rotation behaves automatically." It also leaves room for future automation features (monthly summaries, reminders) without reorganising settings.

### Why show timezone as read-only?

Timezone configuration affects cron derivation and DST behaviour. Making it editable in the UI without server-side validation could lead to invalid timezone strings. A future sprint can add a validated dropdown.

### Why include a manual trigger in the UI?

It provides an escape hatch for users who want to test the automation or recover from a missed week without SSHing into the server. It is protected by the same write-token boundary as other mutations.

## Definition of Done

- [ ] Automation settings section is reachable from the main Settings UI
- [ ] All configuration fields (toggle, weekday, time, email, export, grace period) are present and functional
- [ ] Settings load from and save to `/automation/settings`
- [ ] Live replanning is reflected in the "Next scheduled run" display
- [ ] Manual trigger button exists and calls the run endpoint
- [ ] Status display shows next run, last run, and current-week rotation state
- [ ] Client-side validation prevents obvious invalid input
- [ ] Server errors are displayed gracefully
- [ ] Responsive layout works on mobile and desktop
- [ ] Accessible labels and keyboard navigation
- [ ] All new code passes lint and type-check
- [ ] Component tests for form validation and API integration