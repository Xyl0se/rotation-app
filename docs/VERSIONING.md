# Versioning

Rotation uses sprint-oriented versioning starting from `v0.3.0-dev`.

Early tags remain as historical markers. Versions are not retroactively added.

## Current Anchor

`v0.21.0-dev` marks Sprint 60: Internationalization (i18n) & Documentation Sprint.

Includes:

- Complete i18n system with DE/EN locale files
- React Context + Hook for type-safe translations
- Language switcher with persistent preference
- All UI components internationalized
- All documentation translated to English
- No new dependencies — pure TypeScript/React implementation

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
3. Run lint and build.
4. Create versioning commit.
5. Set Git tag with the target version.
6. The next sprint starts again under `Unreleased`.
