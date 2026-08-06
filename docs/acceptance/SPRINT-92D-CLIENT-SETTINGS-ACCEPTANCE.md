# Sprint 92D Acceptance — Client: Automation Settings UI

## Overview

Validate that the Automation settings section in the client is fully functional, correctly integrated with the server API, responsive, accessible, and gracefully handles errors.

---

## 1. Navigation & Layout

### 1.1 Settings section reachable

```
GIVEN the user is on the main Settings page
WHEN they look for the Automation section
THEN it is visible and clearly labelled
AND clicking it navigates to or expands the Automation settings
```

### 1.2 Desktop layout

```
GIVEN a viewport width of 1280px
WHEN the Automation settings are displayed
THEN labels and inputs are arranged in a two-column layout
AND all fields are aligned and readable
```

### 1.3 Mobile layout

```
GIVEN a viewport width of 375px
WHEN the Automation settings are displayed
THEN all fields stack vertically in a single column
AND no horizontal scrolling is required
AND touch targets are at least 44×44px
```

---

## 2. Master Toggle

### 2.1 Toggle enables automation

```
GIVEN automation is currently disabled
WHEN the user enables the "Enable automatic rotation" toggle
AND clicks Save
THEN a PUT /automation/settings request is sent with { enabled: true }
AND the other configuration fields become editable
```

### 2.2 Toggle disables automation

```
GIVEN automation is currently enabled
WHEN the user disables the master toggle
AND clicks Save
THEN a PUT request is sent with { enabled: false }
AND the other fields become visually dimmed / read-only
```

### 2.3 Toggle state persisted

```
GIVEN the user toggled automation on and saved
WHEN the page is reloaded
THEN the toggle reflects the saved state (on)
```

---

## 3. Scheduling Fields

### 3.1 Weekday dropdown

```
GIVEN the Automation settings are visible
WHEN the user opens the Weekday dropdown
THEN options are: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
AND the currently saved weekday is pre-selected
```

### 3.2 Weekday save

```
GIVEN the user selects "Friday" from the dropdown
WHEN they click Save
THEN PUT /automation/settings contains { weekday: 5 }
```

### 3.3 Time picker

```
GIVEN the Automation settings are visible
WHEN the user enters "18:30" in the Time field
AND clicks Save
THEN PUT /automation/settings contains { time: "18:30" }
```

### 3.4 Time validation — invalid format rejected

```
GIVEN the user enters "25:00" in the Time field
WHEN they attempt to save
THEN the client shows a validation error
AND no PUT request is sent
```

### 3.5 Timezone display

```
GIVEN the server returns timezone = "Europe/Berlin"
WHEN the settings load
THEN the Timezone field displays "Europe/Berlin"
AND it is read-only (no input control)
```

---

## 4. Email Fields

### 4.1 Email toggle enables recipient field

```
GIVEN the "Enable weekly briefing email" toggle is off
WHEN the user turns it on
THEN the "Email recipient" input becomes editable
```

### 4.2 Email toggle disables recipient field

```
GIVEN the email toggle is on and a recipient is set
WHEN the user turns it off
THEN the recipient input becomes read-only
AND its current value is preserved (not cleared)
```

### 4.3 Valid email accepted

```
GIVEN the email toggle is on
WHEN the user enters "user@example.com"
AND clicks Save
THEN the PUT request contains { email_enabled: true, email_recipient: "user@example.com" }
```

### 4.4 Invalid email rejected client-side

```
GIVEN the email toggle is on
WHEN the user enters "not-an-email"
AND attempts to save
THEN a client-side validation error is shown
AND no PUT request is sent
```

### 4.5 Empty email rejected when toggle is on

```
GIVEN the email toggle is on
WHEN the user leaves the recipient field empty
AND attempts to save
THEN a validation error is shown
```

---

## 5. Export Toggle

### 5.1 Enable automatic export

```
GIVEN the "Enable automatic export" toggle is off
WHEN the user turns it on
AND clicks Save
THEN the PUT request contains { auto_export_enabled: true }
```

### 5.2 Disable automatic export

```
GIVEN the toggle is on
WHEN the user turns it off
AND clicks Save
THEN the PUT request contains { auto_export_enabled: false }
```

---

## 6. Grace Period

### 6.1 Grace period selection

```
GIVEN the grace period dropdown shows options: 0, 60, 120, 240, 480 minutes
WHEN the user selects "240 minutes"
AND clicks Save
THEN the PUT request contains { grace_period_minutes: 240 }
```

### 6.2 Grace period explanatory text

```
GIVEN the Automation settings are visible
WHEN the user reads the grace period field
THEN explanatory text is present describing the catch-up behaviour
```

---

## 7. Status Display

### 7.1 Next scheduled run

```
GIVEN the server returns nextRun = "2026-07-26T18:00:00+02:00"
WHEN the settings load
THEN the "Next scheduled run" field displays a human-readable timestamp
  (e.g. "Sunday, 26 July 2026 at 18:00" in the user's locale)
```

### 7.2 Last run — completed

```
GIVEN the server returns lastRun = { startedAt: "...", status: "completed" }
WHEN the settings load
THEN the "Last run" field shows the timestamp and a success indicator
```

### 7.3 Last run — failed

```
GIVEN the server returns lastRun = { startedAt: "...", status: "failed", error: "Export lock held" }
WHEN the settings load
THEN the "Last run" field shows the timestamp and an error indicator
AND the error message is visible (e.g. on hover or in an expandable detail)
```

### 7.4 Current week rotation — yes

```
GIVEN the server returns currentWeekRotation = true
WHEN the settings load
THEN the display indicates that a rotation exists for the current week
```

### 7.5 Current week rotation — no

```
GIVEN the server returns currentWeekRotation = false
WHEN the settings load
THEN the display indicates that no rotation exists for the current week yet
```

---

## 8. Manual Trigger Button

### 8.1 Button visible when automation enabled

```
GIVEN automation is enabled
WHEN the Automation settings are displayed
THEN a "Run weekly rotation now" button is visible
```

### 8.2 Button hidden when automation disabled

```
GIVEN automation is disabled
WHEN the settings are displayed
THEN the manual trigger button is hidden or disabled
```

### 8.3 Button triggers job

```
GIVEN automation is enabled
WHEN the user clicks "Run weekly rotation now"
THEN a POST /automation/jobs/weekly-rotation/run request is sent
AND the button enters a loading state
```

### 8.4 Button shows success result

```
GIVEN the manual trigger returned { status: "completed", planId: "abc" }
WHEN the response arrives
THEN a success message is displayed
AND the status display updates (currentWeekRotation = true)
```

### 8.5 Button shows skipped result

```
GIVEN the manual trigger returned { status: "skipped", reason: "already-executed" }
WHEN the response arrives
THEN an informational message is displayed
  (e.g. "This week's rotation has already been generated.")
```

### 8.6 Button shows failure

```
GIVEN the manual trigger returned 500 or network error
WHEN the error occurs
THEN an error message is displayed
AND the button returns to its normal state
```

### 8.7 Button disabled while running

```
GIVEN the user clicked the manual trigger
AND the request is still in flight
WHEN they attempt to click again
THEN the button is disabled
```

---

## 9. Error Handling

### 9.1 Network error on load

```
GIVEN the GET /automation/settings request fails with a network error
WHEN the page loads
THEN an error message is shown
AND a "Retry" button is present
```

### 9.2 Server validation error

```
GIVEN the user submits invalid data that passes client validation
  (e.g. weekday = 8, simulating a server-side race condition)
WHEN the PUT request returns 400
THEN the error is displayed inline next to the relevant field
  or as a general form error
```

### 9.3 Save failure reverts state

```
GIVEN the user changed weekday from Sunday to Friday
AND the PUT request fails
WHEN the error is displayed
THEN the weekday dropdown reverts to Sunday
  (or remains on Friday with an explicit "Revert" action)
```

### 9.4 Manual trigger error does not navigate

```
GIVEN the manual trigger fails
WHEN the error is shown
THEN the user remains on the Automation settings page
AND no unexpected navigation occurs
```

---

## 10. Accessibility

### 10.1 Labels associated with inputs

```
GIVEN the Automation settings form
WHEN inspected with a screen reader
THEN every input has an associated <label>
AND the label is announced when the input receives focus
```

### 10.2 Toggle keyboard operable

```
GIVEN the master toggle
WHEN the user presses Tab to focus it
AND presses Space or Enter
THEN the toggle state changes
```

### 10.3 Error messages linked

```
GIVEN a validation error on the email field
WHEN inspected
THEN the input has aria-describedby pointing to the error message element
```

---

## 11. Non-Goals Verified

| Non-Goal | Verification |
|----------|--------------|
| Removing manual rotation UI | Existing "Generate Player Rotation" UI still present |
| Email preview / template editing | No template editor or preview pane |
| SMTP configuration | No SMTP fields in the client |
| Adaptive scheduling UI | No adaptive or smart scheduling controls |
| Calendar integration | No calendar connect or export |
| Push notifications | No push notification settings |