# Rotation v0.30.0

This release candidate extends the server-owned personal music workflow with durable
Reflection, optional Listening Journal context, deeper deterministic Insights, and
local-first Album artwork.

## Highlights

- Added the server-owned Reflection Inbox, compressed Album Coach intake, and optional
  Listening Journal context without exposing private prose to Insights.
- Added deterministic, evidence-backed Insights and calm Memory Prompts with complete
  German and English presentation.
- Added local-first Cover resolution from bounded folder and embedded MP3/M4A/FLAC
  artwork, durable diagnostics, last-known-good rollback, and a read-only NAS contract.
- Added Completion and Collection essential as distinct Album acquisition reasons.
- Kept persisted Album Covers on the same-origin server cache and manual alternatives
  authoritative over automatic resolution.

## Deployment

- Back up the complete data directory and record the currently running API/Web image
  digests before deployment.
- Wait for both publish workflows belonging to the same `v0.30.0` source commit, then
  redeploy matching API and Web `latest` images together.
- Run the health smoke and verify Library reads, Cover rendering, Bindings, and database
  persistence before creating the `v0.30.0` Git tag.
- Roll back both recorded image digests and the matching pre-deployment data backup
  together; do not start an older API against a database migrated by this candidate.

Production images intentionally use only the moving `latest` channel. The Git tag marks
accepted source and release notes; it is not a container rollback tag.
