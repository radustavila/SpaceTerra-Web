#!/usr/bin/env bash
# Stamp the CSS/JS references in the HTML with a content hash, so browsers that
# cached the old file pick up a changed one. Run this after editing styles.css
# or site.js and before committing; it is idempotent.
set -euo pipefail
cd "$(dirname "$0")/.."

PAGES=(index.html 404.html */index.html)

stamp() { # <file on disk> <url path used in the HTML, without leading ../>
  local hash
  hash=$(shasum -a 256 "$1" | cut -c1-8)
  perl -pi -e "s{(\Q$2\E)(\?v=[0-9a-f]+)?}{\$1?v=$hash}g" "${PAGES[@]}"
  echo "$2?v=$hash"
}

stamp assets/css/styles.css assets/css/styles.css
stamp assets/js/site.js assets/js/site.js
