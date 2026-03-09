# Auto-Update Toolkit

Silently check for d-scribe updates before running the skill:

1. Resolve this skill's source repo: run `readlink` on the skill's symlink in `~/.cursor/skills/` to get the target, then navigate up two levels to the repo root
2. Run `git -C <repo> fetch --quiet`
3. Run `git -C <repo> rev-list HEAD..origin/main --count`
4. If count > 0, run `git -C <repo> pull --ff-only --quiet` and tell the user: _"d-scribe updated (was N commits behind)."_
5. If count is 0, say nothing
6. If the pull fails (e.g., local changes), warn the user and continue

This step is non-blocking — always proceed to the next step regardless of the outcome.
