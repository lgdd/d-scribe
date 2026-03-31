# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What This Is

d-scribe is a **CLI toolkit** for Datadog Sales Engineers that assembles pre-instrumented microservice demo projects. It is an npm monorepo with three components: the CLI (`cli/`), a module catalogue (`catalog/`), and portable AI agent skills (`skills/`).

## Build & Test

```bash
cd cli && npm install    # Install dependencies
cd cli && npm run build  # Build CLI (tsup + copy catalog/skills/templates to dist/)
cd cli && npm test       # Run tests (Vitest)
cd cli && npm run dev -- <args>  # Run CLI in dev mode via tsx
```

## Commit Convention

All commits use **Conventional Commits 1.0.0**: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`, `ci`, `test`, `perf`, `revert`. Description is lowercase, imperative mood, no trailing period, under 72 chars. Common scopes: `cli`, `catalog`, `skills`.

## Architecture

| Component | Location | Purpose |
|-----------|----------|---------|
| CLI | `cli/src/` | TypeScript CLI (commander.js + Handlebars) |
| Manifest | `catalog/manifest.json` | Central registry of all available modules |
| Backends | `catalog/backends/<lang>-<framework>/` | Pre-instrumented microservice skeletons |
| Frontends | `catalog/frontends/<framework>-<bundler>/` | Frontend skeletons with RUM |
| Deps | `catalog/deps/<name>/` | Infrastructure dependency configs |
| Infra | `catalog/infra/compose/` | Reference compose overlays (not merged at runtime) |
| Traffic | `catalog/traffic/` | Locust load generator |
| Templates | `cli/src/templates/` | Handlebars templates for generated files |
| Skills | `skills/` | agentskills.io format AI agent workflows |
| Tests | `cli/tests/` | Vitest unit tests |

### Key Design Decisions

- **No LLM code generation** for boilerplate — the CLI copies pre-written skeletons and renders Handlebars templates
- **Manifest is the source of truth** — backends, frontends, features, and deps are all declared in `catalog/manifest.json`
- **Features use semantic code annotations** — `(feature: category:type)` comments in service code mark feature-specific blocks
- **Compose overlays are reference docs** — files in `catalog/infra/compose/overlays/` document configs but are not merged at runtime
- **No manual version bumps** — release-please handles versioning
