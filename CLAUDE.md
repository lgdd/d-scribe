# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

d-scribe is a **distribution toolkit** for Cursor IDE — not an application. It ships Markdown-based rules, skills, agents, and commands that get symlinked into `~/.cursor/` for use across other projects. There is no build step, no runtime, no dependencies, and no tests. Content is Markdown (with YAML frontmatter), shell scripts, and a version file.

The toolkit helps Datadog Sales Engineers scaffold, validate, and present demo projects that send telemetry to a Datadog sandbox org.

## No Build/Test/Lint Commands

There are no package managers, build scripts, test frameworks, or linters. Do not add any. The only executable scripts are `install.sh` and `uninstall.sh`. The only CI pipeline is `.github/workflows/review-templates.yml` (monthly template freshness review).

## Commit Convention

All commits use **Conventional Commits 1.0.0**: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`, `ci`, `test`, `perf`, `revert`. Description is lowercase, imperative mood, no trailing period, under 72 chars. Common scopes: `skills`, `agents`, `rules`, `commands`, `install`.

## Architecture

### Component Types


| Type         | Location                 | Format                                                                                          | Installed by                                                                    |
| ------------ | ------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Rules**    | `rules/*.mdc`            | `.mdc` with YAML frontmatter (`description`, `alwaysApply`, optional `globs`)                   | Copied into demo projects by scaffold skill — **not** symlinked by `install.sh` |
| **Skills**   | `skills/<name>/SKILL.md` | Directory with `SKILL.md` (YAML frontmatter: `name`, `description`) + `templates/` subdirectory | Symlinked to `~/.cursor/skills/`                                                |
| **Agents**   | `agents/<name>.md`       | Single `.md` with YAML frontmatter (`name`, `description`, `model`, optional `readonly`)        | Symlinked to `~/.cursor/agents/`                                                |
| **Commands** | `commands/<name>.md`     | Single `.md`, **no frontmatter**, under 20 lines, delegates to a skill or agent                 | Symlinked to `~/.cursor/commands/`                                              |


Shared includes in `skills/`: `_auto-update.md` (auto-update procedure) and `_doc-lookup.md` (documentation lookup procedure) — prefixed with `_` to indicate they are not standalone skills.

### Dispatcher Pattern

Every skill SKILL.md must be a **lean dispatcher** (~80–120 lines) that defines the workflow and loads sub-documents from `templates/` on demand. Reference data (topologies, failure scenarios, instrumentation patterns) lives in `templates/`, not alongside SKILL.md. This keeps context usage low — only the material needed for the current step is loaded.

### Naming Convention

All artifacts use a `dd-` prefix.

### Repo-Local Cursor Config (`.cursor/`)

The `.cursor/` directory contains repo-scoped rules and a `review-templates` agent/command for validating toolkit content against Datadog docs. These are **not** installed globally — they only apply when working inside this repo.

### Keeping Things in Sync

When adding, removing, or renaming a component:

- Update the matching table in `README.md`
- `install.sh` / `uninstall.sh` iterate with `for` loops over each directory type, so adding a new file within an existing type requires **no script change** — only edit them when introducing a new directory type or changing the symlink strategy
- Rules are never added to `install.sh` or `uninstall.sh` (they are copied per-project by the scaffold skill)

