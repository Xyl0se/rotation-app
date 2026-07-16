# Sprint 76.3 — Trusted Proxy Write Boundary

**Status:** Implementation complete; container publication and NAS verification pending

**Target version:** `v0.26.2-dev`

**Type:** Security-boundary simplification and UX recovery

---

## Context

Rotation is deployed as a local single-user web application. The browser currently
stores the API write token in `localStorage` and must attach it to every mutation.
Clearing browser storage, changing browsers, or mistyping the deployment secret
therefore breaks Album, Binding, Cover, Export, and Backup workflows even though
the user is already accessing the trusted local Rotation web frontend.

The API still needs a write boundary: export changes the managed rotation tree,
and other mutations can alter or delete Library and operational data. The problem
is not the existence of a boundary, but placing its shared secret in browser state.

## Decision

Caddy becomes the trusted application boundary:

```text
Browser
    → same-origin /api request without a secret
    → Caddy overwrites/injects X-Rotation-Write-Token
    → private Docker-network API validates the internal secret
```

The browser never receives, stores, or submits the deployment secret. Anyone who
can access the local Rotation UI can operate the single-user application. Direct
API mutations that bypass the trusted proxy remain protected.

## Workstream 76.3A — Internal Proxy Authentication

- Provide the same internal secret to API and web containers through Compose.
- Make Caddy overwrite `X-Rotation-Write-Token` on every proxied API request.
- Keep the API container private to the Compose network.
- Retain constant-time token validation in the API.
- Ensure a client cannot override the proxy-provided header.

## Workstream 76.3B — Browser Token Removal

- Remove the write-token `localStorage` service.
- Remove the write-token dialog and navigation lock button.
- Stop attaching authentication headers in the frontend API client.
- Remove browser-facing token translations and status messaging.
- Change `/config/auth` to describe trusted-proxy mode without exposing secrets.

## Workstream 76.3C — Same-Origin Mutation Protection

- Reject browser mutations with `Sec-Fetch-Site: cross-site`.
- Do not compare `Origin` with proxy Host/protocol because NAS reverse proxies may
  legitimately rewrite both before the request reaches Caddy.
- Permit non-browser administration requests without `Origin` only when they
  present the internal token directly.
- Keep safe GET/HEAD/OPTIONS requests readable.

## Workstream 76.3D — Deployment and Documentation

- Update development and production Compose definitions.
- Update self-hosting, architecture, product, acceptance-test, and changelog docs.
- Remove instructions telling users to enter a token in the UI.
- Document that the deployment secret is internal infrastructure configuration.

## Acceptance Criteria

- [ ] A fresh browser can create, edit, capture, export, and back up without token setup.
- [ ] Clearing browser storage cannot break write access.
- [x] Browser storage contains no Rotation API secret.
- [x] Direct API mutations without the internal token return `403`.
- [x] Same-origin mutations through Caddy are configured and covered by CI smoke tests.
- [x] Cross-site browser mutations return `403`.
- [x] Incoming client token headers cannot replace the Caddy-injected secret.
- [ ] Web/API container smoke tests cover the proxy boundary.
- [x] Frontend/server lint, tests, and production builds pass.

## Non-Goals

- User accounts or multi-user authorization
- Internet-facing authentication
- OAuth/OIDC integration
- Per-operation permissions
- Making the API publicly reachable

## Operational Consequence

Rotation remains a trusted local single-user application. Network-level access to
the web frontend implies permission to operate it. Internet exposure still requires
an external authentication proxy or VPN and is not supported by this sprint.
