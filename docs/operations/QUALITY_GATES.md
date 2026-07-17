# Quality Gates and Image Promotion

Every pull request and every push to `main` runs the reusable `Validate` workflow. It installs both npm packages with `npm ci`, lints and tests frontend and server in their own environments, validates local Markdown links, builds both packages, validates development and production Compose files, and starts the development stack for HTTP health checks.

The web and API publication workflows call that same workflow as a required `needs`
dependency. Images are built only after validation succeeds. A successful `main`
build replaces exactly one deployment channel for each service:
`ghcr.io/xyl0se/rotation-app-api:latest` and
`ghcr.io/xyl0se/rotation-app-web:latest`. Git tags still identify source releases and
GitHub Release notes, but they do not create additional container tags.

GitHub Actions currently use reviewed major-version tags. Dependabot checks Actions, npm dependencies, and Docker base images weekly; each update is reviewed and must pass the complete validation workflow before merge. This is the repository's explicit action-update policy in place of unmanaged floating versions.

Local equivalents:

- `npm run lint` — frontend and server lint
- `npm test` — frontend tests in jsdom, then server tests in Node
- `npm run docs:check` — all local Markdown links resolve after documentation moves
- `npm run validate` — lint, tests, and both production builds
- `docker compose config --quiet` — development Compose validation
- `docker compose -f docker-compose.prod.yml config --quiet` — production Compose validation
