# Sprint 75 — Observability & Operations

**Status:** Done

**Target version:** `v0.25.5-dev`

---

## Goal

You can see what Rotation is doing without looking at the code.

## Architecture Changes

- Structured logging (not just `console.log`)
- Healthcheck returns more than just `200 OK`
- Optional: metrics (export size, scan duration)

## Affected Components

- `logger.ts` — consistent log format
- `health.ts` — DB connection, volume state, last scan
- `SELFHOST.md` — troubleshooting extension
- Docker Compose — log rotation configuration

## Risks

- Verbose logging could leak sensitive paths
- Metrics collection adds overhead

## Definition of Done

- [x] Every important operation (scan, export, apply) is logged
- [x] Healthcheck shows: DB ok, /music readable, /rotation-data writable, Syncthing path writable, last scan, metrics
- [x] Logs are readable via `docker compose logs -f` and meaningful
- [x] `SELFHOST.md` has a troubleshooting section
- [x] Log rotation is configured (no unbounded log growth)
- [x] Failed operations are logged with enough context to debug
- [x] All `console.log` / `console.error` calls replaced by structured logger
