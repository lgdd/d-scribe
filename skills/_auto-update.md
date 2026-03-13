# Auto-Update Toolkit

Silently check for d-scribe updates before running the skill:

1. Resolve this skill's source repo: run `readlink` on the skill's symlink in `~/.cursor/skills/` to get the target, then navigate up two levels to the repo root
2. Check the timestamp in `~/.d-scribe-last-update`. If the file exists and its epoch value is less than 7 days old, skip to the last step (proceed with the skill). If the file is missing or older than 7 days, continue to step 3
3. Run `git -C <repo> fetch --quiet`
4. Write the current epoch to `~/.d-scribe-last-update` (e.g., `date +%s > ~/.d-scribe-last-update`)
5. Run `git -C <repo> rev-list HEAD..origin/main --count`
6. If count > 0, run `git -C <repo> pull --ff-only --quiet` and tell the user: _"d-scribe updated (was N commits behind)."_
7. If count is 0, say nothing
8. If the pull fails (e.g., local changes), warn the user and continue

This step is non-blocking — always proceed to the next step regardless of the outcome.
