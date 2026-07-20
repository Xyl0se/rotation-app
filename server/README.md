# Rotation API

Node.js + Express backend for Rotation.

## Responsibilities

- SQLite persistence (albums, bindings, scans, exports, backup state, playback manifests)
- Server cover storage and scheduled SQLite backups
- File system operations (scanning, export staging, path guarding, bounded metadata extraction)
- Playback manifest generation for confirmed Album Bindings (read-only, path-safe)
- REST API consumed by the React frontend

## Development

```bash
cd server
npm install
npm run dev    # starts on :3001 with auto-reload
npm test       # runs server-side tests
npm run build  # TypeScript compilation
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ROTATION_DATA_DIR` | `/rotation-data/data` | SQLite database directory |
| `ROTATION_MUSIC_PATH` | `/music` | Read-only music library root |
| `ROTATION_WORKSPACE_PATH` | `/rotation-data` | Writable workspace (exports, staging, archive) |
| `ROTATION_SYNCTHING_ROOT` | — | Syncthing export target path |
| `ROTATION_WRITE_TOKEN` | — | Token required for all write operations |
| `PORT` | `3001` | HTTP server port |

## Playback Manifest Endpoint

`GET /playback/manifest/:albumId` returns a canonical, server-owned manifest for a confirmed Album Binding. The manifest contains opaque Track identifiers, validated disc/track ordering, duration, and media type — never physical source paths. Manifests are cached in SQLite and invalidated on scan or binding change. Ambiguous ordering surfaces as a `503` diagnostic; no sequence is silently invented.

The production container runs unprivileged as numeric UID/GID `1026:100`. The mounted host data directory must have the same ownership. Startup creates and checks `${ROTATION_DATA_DIR}/{backups,covers}`, workspace staging/archive/export directories, and the Syncthing root. `ROTATION_WRITE_TOKEN` is trimmed and blank values fail startup.
