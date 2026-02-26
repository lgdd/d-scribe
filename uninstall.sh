#!/usr/bin/env bash
set -euo pipefail

TOOLKIT_DIR="$(cd "$(dirname "$0")" && pwd)"
CURSOR_DIR="${HOME}/.cursor"

SKILLS_SRC="${TOOLKIT_DIR}/skills"
AGENTS_SRC="${TOOLKIT_DIR}/agents"
COMMANDS_SRC="${TOOLKIT_DIR}/commands"

SKILLS_DST="${CURSOR_DIR}/skills"
AGENTS_DST="${CURSOR_DIR}/agents"
COMMANDS_DST="${CURSOR_DIR}/commands"

removed=0
skipped=0

unlink_item() {
  local src="$1" dst="$2" name="$3" type="$4"
  if [ -L "$dst" ]; then
    existing_target="$(readlink "$dst")"
    if [ "$existing_target" = "$src" ]; then
      rm "$dst"
      echo "  [ok] ${type} ${name}"
      removed=$((removed + 1))
      return
    fi
    echo "  [skip] ${type} ${name} (symlink points elsewhere)"
    skipped=$((skipped + 1))
  elif [ -e "$dst" ]; then
    echo "  [skip] ${type} ${name} (not a symlink — leaving in place)"
    skipped=$((skipped + 1))
  else
    echo "  [skip] ${type} ${name} (not installed)"
    skipped=$((skipped + 1))
  fi
}

echo "d-sect uninstaller"
echo "================================="
echo ""
echo "Source: ${TOOLKIT_DIR}"
echo "Target: ${CURSOR_DIR}"
echo ""

# --- Skills ---
echo "Skills:"
for skill_dir in "${SKILLS_SRC}"/*/; do
  [ -d "$skill_dir" ] || continue
  name="$(basename "$skill_dir")"
  unlink_item "$skill_dir" "${SKILLS_DST}/${name}" "$name" "skill"
done
echo ""

# --- Agents ---
echo "Subagents:"
for agent_file in "${AGENTS_SRC}"/*.md; do
  [ -f "$agent_file" ] || continue
  name="$(basename "$agent_file")"
  unlink_item "$agent_file" "${AGENTS_DST}/${name}" "$name" "agent"
done
echo ""

# --- Commands ---
echo "Commands:"
for cmd_file in "${COMMANDS_SRC}"/*.md; do
  [ -f "$cmd_file" ] || continue
  name="$(basename "$cmd_file")"
  unlink_item "$cmd_file" "${COMMANDS_DST}/${name}" "$name" "command"
done
echo ""

echo "================================="
echo "Done: ${removed} removed, ${skipped} skipped."
echo ""
echo "Rules are NOT managed globally — they live inside individual demo projects."
