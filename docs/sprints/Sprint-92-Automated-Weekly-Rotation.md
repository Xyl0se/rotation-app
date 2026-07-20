# Sprint XX --- Automated Weekly Rotation

## Goal

Introduce a fully automated weekly rotation workflow that turns Rotation
into a proactive companion instead of a tool requiring manual
interaction.

At the beginning of every listening week, Rotation should automatically
curate a new Player Rotation, export it to the configured destination
and notify the user with a concise weekly briefing.

The listening experience should feel like receiving a thoughtfully
prepared recommendation rather than operating software.

------------------------------------------------------------------------

# Problem Statement

The current workflow requires several manual steps:

1.  Create a new Player Rotation.
2.  Review the generated selection.
3.  Export the rotation.
4.  Start listening.

While each individual action is simple, they introduce friction and
require the user to remember starting a new listening cycle.

This conflicts with one of Rotation's core ideas:

> The software should disappear into the background while the music
> moves into the foreground.

------------------------------------------------------------------------

# User Story

**As a listener**

I want Rotation to prepare my next listening week automatically

so that every Monday begins with a fresh, curated selection waiting for
me.

------------------------------------------------------------------------

# Desired Experience

Sunday evening:

-   Rotation generates a new Player Rotation using the configured
    generation parameters.
-   The rotation is automatically exported to the configured export
    folder.
-   Rotation sends a weekly email summarizing the upcoming listening
    week.

Monday morning:

The user opens their email and immediately discovers:

-   how many albums are in this week's rotation,
-   several highlighted albums and why they deserve attention,
-   optional statistics about the generated selection.

The listening device already contains the new music.

No manual interaction is required.

------------------------------------------------------------------------

# Functional Requirements

## 1. Scheduled Rotation Generation

Introduce a scheduler capable of executing recurring jobs.

Initially support:

-   Weekly execution
-   Configurable weekday
-   Configurable execution time

Default:

-   Sunday
-   20:00

The scheduler invokes the existing rotation generation pipeline.

No alternative generation logic should be introduced.

## 2. Automatic Export

After successful generation:

-   export the rotation using the existing export pipeline,
-   overwrite the previous export as today,
-   preserve all existing export behaviour.

Export only occurs if generation completed successfully.

## 3. Weekly Briefing Email

After a successful export, Rotation sends an email containing:

### Header

Example:

> Your listening week is ready.

### Summary

-   Number of albums
-   Total duration
-   Number of artists
-   Number of first listens
-   Number of archived albums (optional)

### Featured Albums

Highlight between one and three albums.

Examples:

-   **Long Time No Listen** --- You haven't listened to this album in
    over two years.
-   **First Listen** --- This album has never been played before.
-   **Second Chance** --- A previously underappreciated album returns to
    your rotation.
-   **Rediscovery** --- One of your oldest library entries appears
    again.

The goal is not ranking albums but creating anticipation.

### Closing

Encourage listening rather than statistics.

Example:

> Have a wonderful listening week.

------------------------------------------------------------------------

# Album Highlight Strategy

Possible highlight categories include:

-   Never listened
-   Longest time since last listen
-   Second Chance
-   Recently added
-   Forgotten favourite
-   Returning archive album
-   Coach recommendation

------------------------------------------------------------------------

# Configuration

Introduce a new **Automation** section in Settings.

Possible settings:

-   Enable automatic rotation
-   Weekday
-   Time
-   Email recipient
-   Enable email briefing
-   Enable automatic export

------------------------------------------------------------------------

# Failure Handling

If generation fails:

-   keep the previous export untouched,
-   log the error,
-   optionally send an error notification email,
-   retry is left for a future sprint.

------------------------------------------------------------------------

# Non-Goals

This sprint does **not** include:

-   automatic review of completed rotations,
-   AI-generated listening commentary,
-   push notifications,
-   calendar integration,
-   multiple scheduled rotations,
-   adaptive scheduling.

------------------------------------------------------------------------

# Technical Considerations

Potential implementation pieces:

-   Scheduler service (cron-based)
-   Weekly Rotation Job
-   Email Service abstraction
-   HTML email templates
-   Configuration persistence
-   Job logging
-   Export pipeline integration

The scheduler should orchestrate existing services rather than duplicate
business logic.

------------------------------------------------------------------------

# Acceptance Criteria

-   Automatic weekly execution can be enabled and disabled.
-   Rotation is generated automatically at the configured time.
-   Existing generation logic is reused.
-   Rotation is exported automatically after successful generation.
-   Weekly email is delivered successfully.
-   Email contains summary information and 1--3 featured albums.
-   Existing manual workflow remains fully functional.
-   Failures are logged and do not overwrite the previous export.

------------------------------------------------------------------------

# Future Extensions

This sprint establishes the foundation for broader automation
capabilities, including:

-   automatic reminder emails for unevaluated albums,
-   monthly listening summaries,
-   "Rotation is waiting for you" notifications,
-   adaptive scheduling based on listening behaviour,
-   AI-written weekly introductions,
-   integration with external services (e.g. calendar or mobile
    notifications).

The scheduler introduced in this sprint should therefore be designed as
a generic automation framework rather than a feature dedicated solely to
weekly rotation generation.
