#!/usr/bin/env bash
# Build i publish na here.now — używany lokalnie (z .env) i w GitHub Actions.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

die() {
  echo "error: $1" >&2
  exit 1
}

# Wczytaj .env lokalnie (w CI zmienne przychodzą z env)
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${HERENOW_API_KEY:?Ustaw HERENOW_API_KEY (sekret GitHub lub ~/.herenow/credentials)}"
: "${HERENOW_SLUG:?Ustaw HERENOW_SLUG (np. onyx-nebula-z9zp)}"
: "${VITE_SUPABASE_URL:?Ustaw VITE_SUPABASE_URL}"
: "${VITE_SUPABASE_ANON_KEY:?Ustaw VITE_SUPABASE_ANON_KEY}"

export VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY

echo "Building SPA…" >&2
npm run build

# here.now publish.sh pomija upload, gdy hash się nie zmienił — stamp wymusza deploy.
BUILD_STAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
INDEX_HTML="site/dist/index.html"
[[ -f "$INDEX_HTML" ]] || die "brak $INDEX_HTML po buildzie"

if grep -q '<!-- build:' "$INDEX_HTML"; then
  sed -i.bak "s|<!-- build:.* -->|<!-- build: $BUILD_STAMP -->|" "$INDEX_HTML"
else
  sed -i.bak "s|</html>|<!-- build: $BUILD_STAMP --></html>|" "$INDEX_HTML"
fi
rm -f "$INDEX_HTML.bak"

PUBLISH_SH="${PUBLISH_SH:-$HOME/.agents/skills/here-now/scripts/publish.sh}"
if [[ ! -x "$PUBLISH_SH" ]]; then
  die "Nie znaleziono publish.sh — zainstaluj skill: npx skills add heredotnow/skill --skill here-now -g"
fi

echo "Publishing to https://${HERENOW_SLUG}.here.now/ …" >&2
"$PUBLISH_SH" site/dist \
  --spa \
  --client github-actions \
  --slug "$HERENOW_SLUG" \
  --api-key "$HERENOW_API_KEY"

echo "Deploy OK: https://${HERENOW_SLUG}.here.now/" >&2
