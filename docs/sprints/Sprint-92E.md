# Sprint 92E — Client: UI-Anpassungen für vollautomatischen Workflow

**Status:** Planned

**Target version:** v0.51.0

**Type:** Frontend workflow & UX redesign

**Depends on:** 92A, 92B, 92C, 92D

## Goal

Transition Rotation from a tool that requires manual interaction to a proactive companion. The normal UI workflow no longer surfaces manual rotation generation. Instead, the interface communicates that Rotation prepares the listening week automatically and shows relevant automation status. Manual rotation generation remains accessible only as a maintenance/debug function inside Settings → Automation (covered by 92D).

## Scope

### 1. Remove Manual Rotation Generation from Normal Workflow

The prominent **"Generate Player Rotation"** or **"New Rotation"** button in the main UI (HomePage, Player Rotation panel, or equivalent) is removed. Specifically:

- Remove the client-side `regenerate()` call from the main UI flow.
- Remove any UI button, card, or CTA that triggers `generateRotationPlan` from the normal browsing experience.
- Keep the underlying `generateRotationPlan` domain logic intact (it is now shared and used server-side in 92B).

### 2. Automation Status in Main UI

Replace the removed generation CTA with an **automation status indicator** that tells the user what to expect:

- **Next rotation:** Human-readable timestamp (e.g. "Next rotation: Sunday, 20:00").
- **Current week status:** Whether a rotation already exists for the current week.
- **Settings shortcut:** A link or button to Settings → Automation for configuration.

This indicator appears in a location that previously held the generation button (e.g. the Player Rotation card on HomePage).

### 3. Adapt Empty-State Messaging

If no rotation exists yet (e.g. first-time user, or automation not yet run):

- **Before:** "Generate and accept a rotation plan first." (or similar)
- **After:** "Your first rotation will be prepared automatically. You can also start one manually in Settings → Automation."

### 4. Preserve Manual Export Workflow

The existing interactive export flow (Preview → Stage → Apply) remains fully functional and reachable from the UI. Automation does not remove or alter the manual export path. Users who want to export a different selection or re-export can still do so.

### 5. Preserve Rotation Review & Reflection

The ability to view the current rotation, see album explanations, set a focus album, and reflect on listened albums remains unchanged. Only the **creation** of a new rotation becomes automatic by default.

### 6. Settings-Only Manual Trigger

The manual trigger introduced in 92D (`POST /automation/jobs/weekly-rotation/run`) is the sole remaining way to force a rotation generation from the client. It lives exclusively in Settings → Automation and is framed as a maintenance/debug tool, not a primary workflow action.

### 7. Optional: Automation Onboarding Hint

For users who have not yet enabled automation, show a gentle, dismissible hint in the main UI:

> "Rotation can now prepare your listening week automatically. [Enable in Settings]"

This hint appears once and can be dismissed. It is stored in `localStorage` (device-local preference, consistent with existing onboarding patterns).

## Non-Goals

- Redesigning the entire HomePage (only the rotation-generation CTA area changes)
- Removing the Export page or export UI
- Changing the Album Detail, Library, Timeline, Insights, or Reflection pages
- AI-generated UI copy
- Push notifications or in-app alerts

## Technical Decisions

### Why remove the generation button entirely instead of disabling it?

Removing the button eliminates cognitive load. A disabled button with an explanation would still draw attention and confuse users. The automation status indicator replaces it with forward-looking information.

### Why keep manual export?

Export is a separate concern from rotation generation. A user might want to export the current rotation to a different device or re-export after fixing bindings. The automated export toggle (in Settings) is the default, but manual export remains an escape hatch.

### Why an onboarding hint rather than a modal?

A modal would be intrusive for an existing user upgrading to v0.51.0. A dismissible inline hint respects the user's attention and can be ignored.

## Definition of Done

- [ ] Manual rotation generation button is removed from the normal client workflow
- [ ] Automation status indicator is visible in the main UI (next run, current week status)
- [ ] Empty-state messages are updated to reflect automatic workflow
- [ ] Manual export flow remains fully functional and accessible
- [ ] Rotation review, focus selection, and reflection features are untouched
- [ ] Manual trigger is reachable only in Settings → Automation
- [ ] Optional onboarding hint is implemented and dismissible
- [ ] All new code passes lint and type-check
- [ ] Existing component tests are updated to reflect UI changes
- [ ] New tests verify automation status display and onboarding hint behaviour