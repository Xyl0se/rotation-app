# Versioning

Rotation uses sprint-oriented versioning starting from `v0.3.0-dev`.

Early tags remain as historical markers. Versions are not retroactively added.

## Current Anchor

`v0.29.0` is the first deliberately accepted stable release. It advances the minor
version after Sprint 80/81 established the `v0.28.x-dev` line and Sprint 82 added a
durable Rotation lifecycle. Production NAS lifecycle, backup/restore, desktop,
narrow-viewport, and localization acceptance were recorded on 2026-07-16.

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
5. Set Git tag with the target version. The image workflows publish the tested commit as SHA, version, and (on `main`) `latest` tags. Production Compose uses the immutable version tag, never `latest`.
6. Wait for **both** `Docker Publish API` and `Docker Publish Web` for the release tag
   to complete successfully. A pushed Git tag or a green GitHub Release workflow does
   not prove that the container manifests already exist.
7. Before authorizing Portainer deployment, verify both registry manifests directly:

   ```bash
   docker manifest inspect ghcr.io/xyl0se/rotation-app-api:vX.Y.Z >/dev/null
   docker manifest inspect ghcr.io/xyl0se/rotation-app-web:vX.Y.Z >/dev/null
   ```

   Do not tell an operator to use **Pull and redeploy** until both commands succeed.
   `manifest unknown` means the referenced image tag is not yet available; wait for or
   diagnose image publication instead of repeatedly redeploying the stack.
8. Redeploy matching API/Web version tags and run the post-release health smoke test.
9. The next sprint starts again under `Unreleased`.

This ordering prevents the release race in which Compose already references a new
immutable tag while GHCR is still building or publishing that tag.
