#!/usr/bin/env bash
set -euo pipefail

if [ -t 1 ]; then
  C_OK=$'\033[32m' C_SKIP=$'\033[90m' C_RST=$'\033[0m'
  C_B=$'\033[1m'
else
  C_OK="" C_SKIP="" C_RST=""
  C_B=""
fi

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
  local src="$1" dst="$2" name="$3"
  name="${name%.md}"
  if [ -L "$dst" ]; then
    existing_target="$(readlink "$dst")"
    if [ "$existing_target" = "$src" ]; then
      rm "$dst"
      echo "  ${C_OK}[ok]${C_RST} ${name}"
      removed=$((removed + 1))
      return
    fi
    echo "  ${C_SKIP}[skip]${C_RST} ${name} (symlink points elsewhere)"
    skipped=$((skipped + 1))
  elif [ -e "$dst" ]; then
    echo "  ${C_SKIP}[skip]${C_RST} ${name} (not a symlink)"
    skipped=$((skipped + 1))
  else
    echo "  ${C_SKIP}[skip]${C_RST} ${name} (not installed)"
    skipped=$((skipped + 1))
  fi
}

echo "${C_B}d-scribe uninstaller${C_RST}"
echo "  ${TOOLKIT_DIR} -> ~/.cursor"
echo ""

# --- Skills ---
echo "${C_B}Skills${C_RST}"
for skill_dir in "${SKILLS_SRC}"/*/; do
  [ -d "$skill_dir" ] || continue
  name="$(basename "$skill_dir")"
  unlink_item "$skill_dir" "${SKILLS_DST}/${name}" "$name"
done

# --- Agents ---
echo "${C_B}Subagents${C_RST}"
for agent_file in "${AGENTS_SRC}"/*.md; do
  [ -f "$agent_file" ] || continue
  name="$(basename "$agent_file")"
  unlink_item "$agent_file" "${AGENTS_DST}/${name}" "$name"
done

# --- Commands ---
echo "${C_B}Commands${C_RST}"
for cmd_file in "${COMMANDS_SRC}"/*.md; do
  [ -f "$cmd_file" ] || continue
  name="$(basename "$cmd_file")"
  unlink_item "$cmd_file" "${COMMANDS_DST}/${name}" "$name"
done
echo ""
echo "Done: ${removed} removed, ${skipped} skipped."
echo "Rules live inside individual demo projects."
