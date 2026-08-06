# Sprint 92E Acceptance — Client: UI-Anpassungen für vollautomatischen Workflow

## Overview

Validate that the normal client workflow no longer requires manual rotation generation, that automation status is clearly communicated in the main UI, and that all existing features (export, review, reflection) remain untouched.

---

## 1. Manual Rotation Generation Removed from Normal Workflow

### 1.1 No generation button on HomePage

```
GIVEN the user is on the HomePage
WHEN they look at the Player Rotation card/section
THEN no button labelled "Generate", "New Rotation", "Create Rotation",
  or similar is visible
```

### 1.2 No generation button in navigation

```
GIVEN the user views the main navigation or action bar
WHEN they inspect all visible buttons and menu items
THEN no action triggers client-side rotation generation
  (except Settings → Automation manual trigger, which is a debug tool)
```

### 1.3 generateRotationPlan not called from main UI

```
GIVEN the user browses the normal UI (Home, Library, Export, Rotation History)
WHEN any interaction occurs
THEN the generateRotationPlan domain function is never invoked
  from a user-facing component outside Settings → Automation
```

### 1.4 Domain logic preserved

```
GIVEN the shared rotation-plan module
WHEN inspected
THEN generateRotationPlan and related exports still exist
AND are still used by the server-side automation (92B)
```

---

## 2. Automation Status Indicator

### 2.1 Indicator visible on HomePage

```
GIVEN the user is on the HomePage
WHEN automation is enabled
THEN an automation status indicator is visible
  in the area previously occupied by the generation button
```

### 2.2 Shows next rotation time

```
GIVEN automation is enabled
AND the next scheduled run is Sunday, 26 July 2026 at 20:00
WHEN the status indicator renders
THEN it displays a human-readable next-run timestamp
  (e.g. "Next rotation: Sunday, 20:00" or locale equivalent)
```

### 2.3 Shows current week status — rotation exists

```
GIVEN a rotation was already generated for the current week
WHEN the status indicator renders
THEN it indicates that the current week's rotation is ready
  (e.g. "This week's rotation is ready" or a checkmark)
```

### 2.4 Shows current week status — rotation pending

```
GIVEN no rotation exists for the current week yet
AND the next run is in the future
WHEN the status indicator renders
THEN it indicates that the rotation is scheduled
  (e.g. "Your rotation will be prepared on Sunday")
```

### 2.5 Link to Automation settings

```
GIVEN the status indicator is visible
WHEN the user clicks the settings link/icon
THEN they navigate to Settings → Automation
```

### 2.6 Indicator hidden when automation disabled

```
GIVEN automation is disabled
WHEN the user is on the HomePage
THEN the automation status indicator is hidden
OR shows a prompt to enable automation
```

---

## 3. Empty-State Messaging

### 3.1 First-time user without rotation

```
GIVEN a new user with no active or archived rotations
WHEN they view the Player Rotation area
THEN the empty-state message reads approximately:
  "Your first rotation will be prepared automatically.
   You can also start one manually in Settings → Automation."
AND the previous "Generate and accept a rotation plan first."
  message no longer appears
```

### 3.2 User with automation disabled and no rotation

```
GIVEN automation is disabled
AND no rotation exists
WHEN the user views the Player Rotation area
THEN the empty-state message guides them to Settings → Automation
  or explains that automation is off
```

---

## 4. Manual Export Workflow Preserved

### 4.1 Export page accessible

```
GIVEN the user navigates to the Export page
WHEN the page loads
THEN the full export UI is present:
  - Preview button
  - Stage button
  - Apply button
  - Status/progress display
```

### 4.2 Export preview works

```
GIVEN an active rotation exists
WHEN the user clicks "Preview Export"
THEN the export preview is calculated and displayed
AND album counts, file counts, and size are shown
```

### 4.3 Export stage and apply work

```
GIVEN a valid export preview
WHEN the user clicks "Stage Export"
AND staging completes
AND they click "Apply Export"
THEN the export is applied successfully
```

### 4.4 Export not auto-triggered by UI

```
GIVEN the user browses the normal UI
WHEN no explicit export action is taken
THEN no export operation is initiated automatically
  (unless the server-side automation does so per settings)
```

---

## 5. Rotation Review & Reflection Preserved

### 5.1 Rotation list visible

```
GIVEN an active rotation exists
WHEN the user views the Player Rotation
THEN all albums in the rotation are listed
WITH their roles and explanations
```

### 5.2 Focus album selectable

```
GIVEN an active rotation with multiple albums
WHEN the user clicks "Set Focus" on an album
THEN the focus album is updated
AND the UI reflects the change
```

### 5.3 Reflection workflow intact

```
GIVEN a listened album in the current rotation
WHEN the user opens the Reflection dialog
THEN they can answer reflection questions
AND submit the reflection
AND the album's role may update accordingly
```

### 5.4 Rotation history accessible

```
GIVEN archived rotations exist
WHEN the user navigates to Rotation History
THEN past rotations are listed with their albums and dates
```

---

## 6. Settings-Only Manual Trigger

### 6.1 Manual trigger not visible outside Settings

```
GIVEN the user is on any page except Settings → Automation
WHEN they inspect all interactive elements
THEN no "Run weekly rotation now" button is present
```

### 6.2 Manual trigger exists in Settings

```
GIVEN the user is on Settings → Automation
WHEN automation is enabled
THEN the "Run weekly rotation now" button is visible
AND it is framed as a debug/maintenance tool
  (e.g. label includes "Debug" or tooltip explains purpose)
```

---

## 7. Onboarding Hint (Optional)

### 7.1 Hint shown for users without automation

```
GIVEN automation is disabled
AND the user has not dismissed the onboarding hint
WHEN they visit the HomePage
THEN a dismissible hint is visible
  with text encouraging automation enablement
```

### 7.2 Hint dismissible

```
GIVEN the onboarding hint is visible
WHEN the user clicks the dismiss button
THEN the hint disappears
AND it does not reappear on subsequent visits
```

### 7.3 Hint state persisted

```
GIVEN the user dismissed the hint
WHEN the page is reloaded
AND the browser localStorage is intact
THEN the hint remains hidden
```

### 7.4 Hint hidden when automation enabled

```
GIVEN automation is enabled
WHEN the user visits the HomePage
THEN the onboarding hint is not shown
  (regardless of previous dismissal state)
```

---

## 8. Responsive & Accessibility

### 8.1 Status indicator on mobile

```
GIVEN a viewport width of 375px
WHEN the automation status indicator renders
THEN it is readable, not truncated, and does not cause overflow
```

### 8.2 Empty-state message accessible

```
GIVEN the empty-state message is visible
WHEN inspected with a screen reader
THEN it is announced as a status message or heading
AND the Settings link is focusable and operable
```

---

## 9. Regression Tests

### 9.1 Library page unchanged

```
GIVEN the user navigates to the Library
WHEN they browse, search, and filter albums
THEN all functionality works as before Sprint 92
```

### 9.2 Album Detail page unchanged

```
GIVEN the user opens an album detail
WHEN they view metadata, cover, role history, and listen events
THEN all functionality works as before
```

### 9.3 Insights page unchanged

```
GIVEN the user navigates to Insights
WHEN they view reflections, role overview, and linguistic insights
THEN all functionality works as before
```

### 9.4 Timeline unchanged

```
GIVEN the user navigates to Timeline
WHEN they view album history and events
THEN all functionality works as before
```

---

## 10. Non-Goals Verified

| Non-Goal | Verification |
|----------|--------------|
| Full HomePage redesign | Only the rotation-generation CTA area is modified |
| Export page removed | Export UI is fully present and functional |
| Album Detail changed | No modifications to Album Detail page |
| Library changed | No modifications to Library page |
| Timeline changed | No modifications to Timeline page |
| Insights changed | No modifications to Insights page |
| AI-generated copy | All UI copy is static or template-based |
| Push notifications | No push notification UI or logic |