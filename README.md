# Rotation

> Rotation accompanies the relationship between person and music.

Rotation is a calm, self-hosted React application for a conscious album collection. It helps cultivate the listening relationship with albums over many years — not as data entry, but as a conversation about music.

## Core Features

- **Album Discovery**: Enter title and artist, look up metadata from MusicBrainz and Cover Art Archive.
- **Album Coach**: A short decision tree assigns the album a role.
- **Library**: Albums as cards, with perspectives (artist, year, listening session, role change).
- **Role Explorer**: All six roles as independent, explorable spaces.
- **Focus Album**: Exactly one album highlighted for attention.
- **Listening History**: Listening sessions as real events, visible in the album timeline.
- **Player Rotation**: Curated selection for the MP3 player, with review and replacement suggestions.
- **Reflection Engine**: Rotation asks a question at appropriate albums for re-evaluation.
- **Archive Workflow**: Conscious letting go with classic protection and rediscovery.
- **Insights**: Linguistic observations about the collection instead of statistics dashboards.
- **Cover Override**: Manual cover adjustment via upload, URL, or alternative from Cover Art Archive.
- **Album File Binding**: Map albums to folders in your music library. Export a curated rotation as physical directories for device sync.
- **Self-Hosted**: Runs on your NAS or home server via Docker. SQLite persistence, automatic backups, health diagnostics.

## Tech Stack

- React 19
- TypeScript
- Vite
- Vitest
- SQLite (server persistence)
- IndexedDB (cover cache, custom covers)
- MusicBrainz & Cover Art Archive (metadata)
- Docker & Docker Compose (deployment)
- Caddy (reverse proxy)

## Quick Start

```bash
export ROTATION_HOST_MUSIC_PATH=/absolute/path/to/music
export ROTATION_WRITE_TOKEN="$(openssl rand -hex 32)"
docker compose -f docker-compose.prod.yml up -d
```

See [`SELFHOST.md`](./docs/operations/SELFHOST.md) for detailed setup instructions.

## Development

```bash
# Frontend + API with hot reload
docker compose up -d --build

# Tests
npm test
```

## Project Structure

- `src/components/features/` — Feature components (Library, Dashboard, Coach, etc.)
- `src/components/ui/` — Reusable UI building blocks
- `src/domain/` — Component-free domain logic
- `src/hooks/` — React hooks (useLibrary, useRotationPlan, useListenEvents)
- `src/repositories/` — Storage abstractions
- `src/services/` — External APIs (MusicBrainz, Cover Art Archive) and internal API client
- `server/` — Node.js backend (Express, SQLite, export engine, scan service)
- `docs/` — Architecture, product notes, changelog, ADRs, sprint plans

## Design

Rotation has a binding design system (`docs/design/DESIGN_SYSTEM.md`). The visual identity is warm, reduced, and editorial — like a personal music journal, not a dashboard.

## Status

Current version: `v0.30.0` (release candidate; `v0.29.1` remains the stable tag)

Rotation is in active development. The domain is stable, the infrastructure is being hardened for production use on home servers. The roadmap is in `docs/ROADMAP.md`.
