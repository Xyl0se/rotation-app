# Rotation API

Node.js + Express backend for Rotation.

## Responsibilities

- SQLite persistence (albums, listen events, rotation plans, bindings, export locks)
- File system operations (scanning, export staging, path guarding)
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
