# Versioning

Rotation uses sprint-oriented versioning starting from `v0.3.0-dev`.

Early tags remain as historical markers. Versions are not retroactively added.

## Current Anchor

`v0.29.1` remains the current stable patch release. `v0.30.0` is the current release
candidate containing the accumulated server-owned Reflection, Journal, Insights,
local-first artwork, and acquisition-context work through Sprint 87.1. It becomes the
stable source release only after matching API/Web images pass deployment acceptance
and the Git tag is created. `v0.29.0` was the first deliberately
accepted stable release and advanced the minor
version after Sprint 80/81 established the `v0.28.x-dev` line and Sprint 82 added a
durable Rotation lifecycle. Production NAS lifecycle, backup/restore, desktop,
narrow-viewport, and localization acceptance were recorded on 2026-07-16.

The `v0.29.1` patch aligns the Homepage with the accepted design language and
hardens container publication by generating deterministic lowercase GHCR tags
without an external metadata step.

Includes:

- Health-Check Panel im Frontend: DB, Music folder, Workspace, Syncthing, Bindings
- Expandable Details mit Refresh-Button
- Write-Token Dialog funktioniert korrekt
- Scan-Button erscheint auch bei 0 Bindings
- Docker Volume-Mount und Permissions korrigiert

## Rule

Major product sprints increase the minor version.

Smaller corrections and polishing within a sprint increase the patch version.

## Planned Line

- Sprint 57 Classic & Archive Logic Rework: `v0.18.0-dev`
- Sprint 58 Backup & Portability: `v0.19.0-dev`
- Sprint 59 Self-Hosting with GitHub Container Registry: `v0.20.0-dev`
- Sprint 60 Internationalization (i18n) & Documentation Sprint: `v0.21.0-dev`
- Sprint 61 Server Persistence (SQLite + REST API): `v0.22.0-dev`

Patch examples:

- `v0.6.1-dev`: small product fix before Sprint 43
- `v0.7.1-dev`: terminology clarification or UI polish within the Curated Rotation Model

## Release Process

1. Set `package.json` and `package-lock.json` to the target version.
2. Cut `docs/CHANGELOG.md` from `Unreleased` to the target version.
3. Run `npm run validate` and both Compose configuration checks.
4. Create versioning commit.
5. Push the version commit to `main`. The image workflows replace only the API and Web
   `latest` tags after the shared validation gate succeeds.
6. Wait for **both** `Docker Publish API` and `Docker Publish Web` for that `main`
   commit to complete successfully. A green GitHub Release workflow does not prove
   that the moving container tags already contain the new commit.
7. Before authorizing Portainer deployment, verify both deployment manifests directly:

   ```bash
   docker manifest inspect ghcr.io/xyl0se/rotation-app-api:latest >/dev/null
   docker manifest inspect ghcr.io/xyl0se/rotation-app-web:latest >/dev/null
   ```

   Confirm in Actions that both successful runs belong to the intended commit. A
   manifest check alone proves availability, not which commit `latest` represents.
8. Redeploy matching API/Web `latest` images and run the post-release health smoke test.
9. Set the Git version tag for source history and GitHub Release notes after acceptance.
10. The next sprint starts again under `Unreleased`.

Production intentionally follows the moving `latest` channel. Before redeploying,
record the currently running image digests and keep the database backup. Rollback uses
those recorded digests locally; a version Git tag is not a container rollback tag.
