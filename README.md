<p align="center">
  <img src="https://github.com/lgdd/doc-assets/blob/main/d-scribe/d-scribe.png?raw=true" alt="d-scribe" width="400">
</p>

<h1 align="center">AI-first CLI toolkit for Datadog Sales Engineers</h1>

Scaffolds pre-instrumented microservice architectures that AI coding agents then bring to life with domain-specific business logic, guided by instrumentation patterns and portable skills.

## Quick Start

```bash
# Install skills for your AI coding agent
npx d-scribe install skills
```

Ask your AI coding agent to build a demo
> "Build me a Datadog demo for an online shop selling dog food & toys"

Your agent scaffolds the project, generates domain-specific business logic, and walks you through running it — all guided by bundled patterns and skills.

## What Gets Generated

A scaffolded project includes:

- **N minimal microservices** (configurable via `--services`, default 4) — each compiles, starts, exposes `/health`, logs JSON, and is instrumented for APM, but has no business logic. AI generates domain-specific code guided by instrumentation patterns.
- **Instrumentation patterns** in `references/patterns/` — compact reference files (~30 lines each) for DBM (PostgreSQL, MySQL, MongoDB), Code Security, Profiling, SIEM, Data Streams (Kafka), LLM Observability (RAG), and inter-service calls
- **Datadog Agent** pre-configured for APM, Logs, and Infrastructure Monitoring
- **Traffic generator** (Locust) with golden paths and failure scenarios
- **docker-compose.yml** with all services wired together
- **AGENTS.md** with project context, architecture, and pattern references for AI coding agents
- **Skills** for domain customization, preflight checks, traffic generation, telemetry verification, and runbook generation

## Available Backends

| Key | Framework |
|-----|-----------|
| `java:spring` | Java Spring Boot 3.4.x |
| `java:quarkus` | Java Quarkus 3.17.x |
| `python:flask` | Python Flask 3.x |
| `python:django` | Python Django 5.1.x |
| `node:express` | Node.js Express 5.x |
| `ruby:rails` | Ruby on Rails 8.0.x |
| `php:laravel` | PHP Laravel 12.x |
| `dotnet:aspnetcore` | .NET ASP.NET Core 9.0 |
| `go:gin` | Go Gin 1.10.x |

## Available Frontends

| Key | Framework |
|-----|-----------|
| `react:vite` | React 18 (Vite) |
| `angular:esbuild` | Angular 19 (esbuild) |
| `vue:vite` | Vue 3 (Vite) |

## Available Features

| Key | Description | Requires |
|-----|-------------|----------|
| `dbm:postgresql` | Database Monitoring (PostgreSQL) | PostgreSQL |
| `dbm:mysql` | Database Monitoring (MySQL) | MySQL |
| `dbm:mongodb` | Database Monitoring (MongoDB) | MongoDB |
| `security:code` | Code Security (IAST) | — |
| `security:sast` | Static Analysis (SAST) | — |
| `security:app-protection` | App & API Protection | — |
| `security:workload-protection` | Workload Protection | — |
| `security:siem` | Cloud SIEM | Keycloak |
| `apm:profiling` | Continuous Profiling | — |
| `ai:llmobs` | LLM Observability | PostgreSQL or MongoDB |
| `djm:spark` | Data Jobs Monitoring (Spark) | Apache Spark |
| `djm:airflow` | Data Jobs Monitoring (Airflow) | Apache Airflow |
| `dsm:kafka` | Data Streams Monitoring (Kafka) | Apache Kafka |

## Architecture

d-scribe is a monorepo with three components:

- **`cli/`** — TypeScript CLI that reads a manifest, resolves dependencies, copies service templates N times, and renders Handlebars templates. Deterministic — no LLM code generation.
- **`catalog/`** — Minimal service templates (`service-template/`), instrumentation patterns (`patterns/`), infrastructure configs, and a traffic generator.
- **`skills/`** — Portable AI agent workflows (agentskills.io format) for scaffolding, domain customization, validation, and runbook generation.

## Commands

| Command | Description |
|---------|-------------|
| `d-scribe init demo` | Create a complete demo project |
| `d-scribe install skills` | Install skills globally for Cursor and/or Claude Code |
| `d-scribe list backends` | List available backend frameworks |
| `d-scribe list frontends` | List available frontend frameworks |
| `d-scribe list features` | List available Datadog features |
| `d-scribe list deps` | List available infrastructure dependencies |
| `d-scribe add feature` | Add a feature to existing project (coming soon) |
| `d-scribe add dep` | Add a dependency to existing project (coming soon) |
