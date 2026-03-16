#!/usr/bin/env bash
# Structural validation for d-scribe toolkit.
# Checks frontmatter, naming, dispatcher size, reference integrity, and README sync.
set -uo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
errors=0
warnings=0

err()  { echo "  ERROR: $1"; errors=$((errors + 1)); }
warn() { echo "  WARN:  $1"; warnings=$((warnings + 1)); }

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Extract a YAML frontmatter value (simple single-line values only).
fm_value() {
  local file="$1" key="$2"
  sed -n '2,/^---$/p' "$file" | grep -E "^${key}:" | head -1 | sed "s/^${key}:[[:space:]]*//" || true
}

has_frontmatter() {
  [ "$(head -1 "$1")" = "---" ]
}

# ---------------------------------------------------------------------------
# 1. Rules — .mdc frontmatter
# ---------------------------------------------------------------------------
echo "Rules"
for f in "${REPO_DIR}"/rules/*.mdc; do
  [ -f "$f" ] || continue
  name="$(basename "$f" .mdc)"

  [[ "$name" == dd-* ]] || err "$name: missing dd- prefix"

  if ! has_frontmatter "$f"; then
    err "$name: missing YAML frontmatter"
    continue
  fi

  desc="$(fm_value "$f" description)"
  [ -n "$desc" ] || err "$name: missing 'description' in frontmatter"

  always="$(fm_value "$f" alwaysApply)"
  [ -n "$always" ] || err "$name: missing 'alwaysApply' in frontmatter"

  if [ "$always" = "false" ]; then
    globs="$(fm_value "$f" globs)"
    [ -n "$globs" ] || warn "$name: alwaysApply is false but no 'globs' defined"
  fi
done

# ---------------------------------------------------------------------------
# 2. Skills — SKILL.md frontmatter + dispatcher size + reference integrity
# ---------------------------------------------------------------------------
echo "Skills"
for skill_dir in "${REPO_DIR}"/skills/*/; do
  [ -d "$skill_dir" ] || continue
  name="$(basename "$skill_dir")"

  [[ "$name" == _* ]] && continue

  [[ "$name" == dd-* ]] || err "$name: missing dd- prefix"

  skill_file="${skill_dir}SKILL.md"
  if [ ! -f "$skill_file" ]; then
    err "$name: missing SKILL.md"
    continue
  fi

  if ! has_frontmatter "$skill_file"; then
    err "$name: SKILL.md missing YAML frontmatter"
    continue
  fi

  fm_name="$(fm_value "$skill_file" name)"
  [ -n "$fm_name" ] || err "$name: SKILL.md missing 'name' in frontmatter"
  fm_desc="$(fm_value "$skill_file" description)"
  [ -n "$fm_desc" ] || err "$name: SKILL.md missing 'description' in frontmatter"

  if [ -n "$fm_name" ] && [ "$fm_name" != "$name" ]; then
    err "$name: frontmatter name '${fm_name}' does not match directory name"
  fi

  total_lines="$(wc -l < "$skill_file" | tr -d ' ')"
  if [ "$total_lines" -gt 150 ]; then
    warn "$name: SKILL.md is ${total_lines} lines (expected ~80-120, dispatcher may be too large)"
  fi

  # reference integrity: check template references resolve
  refs="$(grep -oE '\(templates/[^)]+\)' "$skill_file" | tr -d '()' || true)"
  if [ -n "$refs" ]; then
    while read -r ref; do
      if [ ! -e "${skill_dir}${ref}" ]; then
        err "$name: broken reference '${ref}' in SKILL.md"
      fi
    done <<< "$refs"
  fi

  # templates/ directory should exist if referenced
  if grep -q 'templates/' "$skill_file" 2>/dev/null && [ ! -d "${skill_dir}templates" ]; then
    err "$name: SKILL.md references templates/ but directory does not exist"
  fi
done

# ---------------------------------------------------------------------------
# 3. Agents — frontmatter
# ---------------------------------------------------------------------------
echo "Agents"
for f in "${REPO_DIR}"/agents/*.md; do
  [ -f "$f" ] || continue
  name="$(basename "$f" .md)"

  [[ "$name" == dd-* ]] || err "$name: missing dd- prefix"

  if ! has_frontmatter "$f"; then
    err "$name: missing YAML frontmatter"
    continue
  fi

  fm_name="$(fm_value "$f" name)"
  [ -n "$fm_name" ] || err "$name: missing 'name' in frontmatter"
  fm_desc="$(fm_value "$f" description)"
  [ -n "$fm_desc" ] || err "$name: missing 'description' in frontmatter"
  fm_model="$(fm_value "$f" model)"
  [ -n "$fm_model" ] || err "$name: missing 'model' in frontmatter"

  if [ -n "$fm_name" ] && [ "$fm_name" != "$name" ]; then
    err "$name: frontmatter name '${fm_name}' does not match filename"
  fi
done

# ---------------------------------------------------------------------------
# 4. Commands — no frontmatter, under 20 lines
# ---------------------------------------------------------------------------
echo "Commands"
for f in "${REPO_DIR}"/commands/*.md; do
  [ -f "$f" ] || continue
  name="$(basename "$f" .md)"

  [[ "$name" == dd-* ]] || err "$name: missing dd- prefix"

  if has_frontmatter "$f"; then
    err "$name: commands must not have YAML frontmatter"
  fi

  lines="$(wc -l < "$f" | tr -d ' ')"
  if [ "$lines" -gt 20 ]; then
    warn "$name: ${lines} lines (should be under 20)"
  fi
done

# ---------------------------------------------------------------------------
# 5. README sync — check that every artifact appears in README.md
# ---------------------------------------------------------------------------
echo "README sync"
readme="${REPO_DIR}/README.md"

if [ ! -f "$readme" ]; then
  err "README.md not found"
else
  for f in "${REPO_DIR}"/rules/*.mdc; do
    [ -f "$f" ] || continue
    name="$(basename "$f" .mdc)"
    grep -q "\`${name}\`" "$readme" || err "rule '${name}' not found in README.md"
  done

  for skill_dir in "${REPO_DIR}"/skills/*/; do
    [ -d "$skill_dir" ] || continue
    name="$(basename "$skill_dir")"
    [[ "$name" == _* ]] && continue
    grep -q "\`${name}\`" "$readme" || err "skill '${name}' not found in README.md"
  done

  for f in "${REPO_DIR}"/agents/*.md; do
    [ -f "$f" ] || continue
    name="$(basename "$f" .md)"
    grep -q "\`${name}\`" "$readme" || err "agent '${name}' not found in README.md"
  done

  for f in "${REPO_DIR}"/commands/*.md; do
    [ -f "$f" ] || continue
    name="$(basename "$f" .md)"
    grep -q "/\`\?${name}\`\?" "$readme" \
      || err "command '${name}' not found in README.md"
  done

  # Section header count checks
  actual_rules_count="$(find "${REPO_DIR}/rules" -name '*.mdc' | wc -l | tr -d ' ')"
  readme_rules_header="$(grep -oE 'Rules \([0-9]+ templates\)' "$readme" | grep -oE '[0-9]+' || true)"
  if [ -n "$readme_rules_header" ] && [ "$readme_rules_header" != "$actual_rules_count" ]; then
    err "README says ${readme_rules_header} rules but found ${actual_rules_count}"
  fi

  actual_skills_count="$(find "${REPO_DIR}/skills" -maxdepth 1 -mindepth 1 -type d -not -name '_*' | wc -l | tr -d ' ')"
  readme_skills_header="$(grep -oE 'Skills \([0-9]+\)' "$readme" | grep -oE '[0-9]+' || true)"
  if [ -n "$readme_skills_header" ] && [ "$readme_skills_header" != "$actual_skills_count" ]; then
    err "README says ${readme_skills_header} skills but found ${actual_skills_count}"
  fi

  actual_agents_count="$(find "${REPO_DIR}/agents" -name '*.md' | wc -l | tr -d ' ')"
  readme_agents_header="$(grep -oE 'Subagents \([0-9]+\)' "$readme" | grep -oE '[0-9]+' || true)"
  if [ -n "$readme_agents_header" ] && [ "$readme_agents_header" != "$actual_agents_count" ]; then
    err "README says ${readme_agents_header} agents but found ${actual_agents_count}"
  fi

  actual_commands_count="$(find "${REPO_DIR}/commands" -name '*.md' | wc -l | tr -d ' ')"
  readme_commands_header="$(grep -oE 'Commands \([0-9]+\)' "$readme" | grep -oE '[0-9]+' || true)"
  if [ -n "$readme_commands_header" ] && [ "$readme_commands_header" != "$actual_commands_count" ]; then
    err "README says ${readme_commands_header} commands but found ${actual_commands_count}"
  fi
fi

# ---------------------------------------------------------------------------
# 6. Shared includes exist
# ---------------------------------------------------------------------------
echo "Shared includes"
for include in _auto-update.md _doc-lookup.md; do
  if [ ! -f "${REPO_DIR}/skills/${include}" ]; then
    err "missing shared include: skills/${include}"
  fi
done

# Check that skills referencing includes point to existing files
for skill_dir in "${REPO_DIR}"/skills/*/; do
  [ -d "$skill_dir" ] || continue
  name="$(basename "$skill_dir")"
  [[ "$name" == _* ]] && continue
  skill_file="${skill_dir}SKILL.md"
  [ -f "$skill_file" ] || continue

  refs="$(grep -oE '\.\./_([-a-z]+)\.md' "$skill_file" || true)"
  if [ -n "$refs" ]; then
    while read -r ref; do
      if [ ! -f "${skill_dir}${ref}" ]; then
        err "$name: broken include reference '${ref}'"
      fi
    done <<< "$refs"
  fi
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
if [ "$errors" -gt 0 ] || [ "$warnings" -gt 0 ]; then
  echo "Result: ${errors} error(s), ${warnings} warning(s)"
else
  echo "Result: all checks passed"
fi

exit "$errors"
