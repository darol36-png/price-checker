#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLISH_SH="${HOME}/.agents/skills/here-now/scripts/publish.sh"
STATE_FILE="$ROOT/.herenow/state.json"

cd "$ROOT"
npm run build

# here.now publish.sh has a bug when all files are hash-skipped (seq 0 -1 loop).
# Stamp index.html so at least one file always uploads on update.
BUILD_STAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
INDEX_HTML="site/dist/index.html"
if [[ -f "$INDEX_HTML" ]]; then
  if grep -q '<!-- build:' "$INDEX_HTML"; then
    sed -i '' "s|<!-- build:.* -->|<!-- build: $BUILD_STAMP -->|" "$INDEX_HTML"
  else
    sed -i '' "s|</html>|<!-- build: $BUILD_STAMP --></html>|" "$INDEX_HTML"
  fi
fi

SLUG=""
if [[ -f "$STATE_FILE" ]] && command -v jq >/dev/null 2>&1; then
  # Use the most recently published slug owned by this project (authenticated sites only).
  SLUG=$(jq -r '
    [.publishes | to_entries[] | select(.value.claimToken == null or .value.claimToken == "") | .key]
    | last // empty
  ' "$STATE_FILE" 2>/dev/null || true)
fi

ARGS=(site/dist --spa --client cursor)
if [[ -n "$SLUG" ]]; then
  echo "Updating existing site: $SLUG" >&2
  ARGS+=(--slug "$SLUG")
else
  echo "Creating new site (first deploy)..." >&2
fi

"$PUBLISH_SH" "${ARGS[@]}"
