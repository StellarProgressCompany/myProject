#!/usr/bin/env bash
set -e

# ── Locate the project root via Git
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
SRC="$PROJECT_ROOT/frontend/src/services"

# ── Prepare a dumps directory under scripts/
DUMP_DIR="$PROJECT_ROOT/scripts/dumps"
mkdir -p "$DUMP_DIR"

# ── Output file
OUT="$DUMP_DIR/services.txt"

# ── Sanity check: make sure services/ exists
if [[ ! -d "$SRC" ]]; then
  echo "❌ Error: source dir not found: $SRC"
  exit 1
fi

# ── 1) Print a simple tree header
echo "└── frontend/src/services" > "$OUT"
find "$SRC" -type f \
  | sed -E 's|^'"$PROJECT_ROOT"'/|    ├── |' \
  | sort \
  >> "$OUT"
echo >> "$OUT"

# ── 2) For each file: separator, full path, then its contents (indented)
find "$SRC" -type f \
  | sort \
  | while read -r FILE; do
      echo "––––––––––––––––––––––––" >> "$OUT"
      echo "$FILE"             >> "$OUT"
      sed 's/^/    /' "$FILE"  >> "$OUT"
      echo >> "$OUT"
    done

echo "✅ Dump complete: $OUT"
