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

installed=0
skipped=0

link_item() {
  local src="$1" dst="$2" name="$3" type="$4"
  if [ -L "$dst" ]; then
    existing_target="$(readlink "$dst")"
    if [ "$existing_target" = "$src" ]; then
      echo "  [skip] ${type} ${name} (already linked)"
      skipped=$((skipped + 1))
      return
    fi
    echo "  [update] ${type} ${name} (relinking)"
    rm "$dst"
  elif [ -e "$dst" ]; then
    echo "  [warn] ${type} ${name} exists and is not a symlink — skipping"
    skipped=$((skipped + 1))
    return
  fi
  ln -s "$src" "$dst"
  echo "  [ok] ${type} ${name}"
  installed=$((installed + 1))
}

echo "d-sect installer"
echo "==============================="
echo ""
echo "Source: ${TOOLKIT_DIR}"
echo "Target: ${CURSOR_DIR}"
echo ""

# --- Skills ---
echo "Skills:"
mkdir -p "$SKILLS_DST"
for skill_dir in "${SKILLS_SRC}"/*/; do
  [ -d "$skill_dir" ] || continue
  name="$(basename "$skill_dir")"
  link_item "$skill_dir" "${SKILLS_DST}/${name}" "$name" "skill"
done
echo ""

# --- Agents ---
echo "Subagents:"
mkdir -p "$AGENTS_DST"
for agent_file in "${AGENTS_SRC}"/*.md; do
  [ -f "$agent_file" ] || continue
  name="$(basename "$agent_file")"
  link_item "$agent_file" "${AGENTS_DST}/${name}" "$name" "agent"
done
echo ""

# --- Commands ---
echo "Commands:"
mkdir -p "$COMMANDS_DST"
for cmd_file in "${COMMANDS_SRC}"/*.md; do
  [ -f "$cmd_file" ] || continue
  name="$(basename "$cmd_file")"
  link_item "$cmd_file" "${COMMANDS_DST}/${name}" "$name" "command"
done
echo ""

echo "==============================="
echo "Done: ${installed} installed, ${skipped} skipped."
echo ""
echo "Rules are NOT installed globally — they are copied into each demo project"
echo "by the dd-scaffold-demo skill when you scaffold a new project."
