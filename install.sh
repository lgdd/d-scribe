#!/usr/bin/env bash
set -euo pipefail

if [ -t 1 ]; then
  C_OK=$'\033[32m' C_UPDATE=$'\033[94m' C_SKIP=$'\033[90m' C_WARN=$'\033[33m' C_RST=$'\033[0m'
  C_B=$'\033[1m'
else
  C_OK="" C_UPDATE="" C_SKIP="" C_WARN="" C_RST=""
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

installed=0
skipped=0

link_item() {
  local src="$1" dst="$2" name="$3"
  name="${name%.md}"
  if [ -L "$dst" ]; then
    existing_target="$(readlink "$dst")"
    if [ "$existing_target" = "$src" ]; then
      echo "  ${C_SKIP}[skip]${C_RST} ${name} (already linked)"
      skipped=$((skipped + 1))
      return
    fi
    echo "  ${C_UPDATE}[update]${C_RST} ${name} (relinking)"
    rm "$dst"
  elif [ -e "$dst" ]; then
    echo "  ${C_WARN}[warn]${C_RST} ${name} (not a symlink)"
    skipped=$((skipped + 1))
    return
  fi
  ln -s "$src" "$dst"
  echo "  ${C_OK}[ok]${C_RST} ${name}"
  installed=$((installed + 1))
}

echo "${C_B}d-scribe installer${C_RST}"
echo "  ${TOOLKIT_DIR} -> ~/.cursor"
echo ""

# --- Skills ---
echo "${C_B}Skills${C_RST}"
mkdir -p "$SKILLS_DST"
for skill_dir in "${SKILLS_SRC}"/*/; do
  [ -d "$skill_dir" ] || continue
  name="$(basename "$skill_dir")"
  link_item "$skill_dir" "${SKILLS_DST}/${name}" "$name"
done

# --- Agents ---
echo "${C_B}Subagents${C_RST}"
mkdir -p "$AGENTS_DST"
for agent_file in "${AGENTS_SRC}"/*.md; do
  [ -f "$agent_file" ] || continue
  name="$(basename "$agent_file")"
  link_item "$agent_file" "${AGENTS_DST}/${name}" "$name"
done

# --- Commands ---
echo "${C_B}Commands${C_RST}"
mkdir -p "$COMMANDS_DST"
for cmd_file in "${COMMANDS_SRC}"/*.md; do
  [ -f "$cmd_file" ] || continue
  name="$(basename "$cmd_file")"
  link_item "$cmd_file" "${COMMANDS_DST}/${name}" "$name"
done
echo ""
echo "Done: ${installed} installed, ${skipped} skipped."
echo "Rules are copied per-project by dd-scaffold-demo."
