#!/usr/bin/env bash
set -e

# ── Locate the project root via Git
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
SRC="$PROJECT_ROOT/frontend-booking"

# ── Prepare a dumps directory under scripts/
DUMP_DIR="$PROJECT_ROOT/scripts/dumps"
mkdir -p "$DUMP_DIR"

# ── Output file
OUT="$DUMP_DIR/frontend-booking.txt"

# ── Sanity check: make sure frontend-booking exists
if [[ ! -d "$SRC" ]]; then
  echo "❌ Error: source dir not found: $SRC"
  exit 1
fi

# ── 1) Print a simple tree header, excluding *.json and node_modules/*
echo "└── frontend" > "$OUT"
find "$SRC" -type f \
     ! -name '*.json' \
     ! -path '*/node_modules/*' \
  | sed -E 's|^'"$PROJECT_ROOT"'|    ├── |' \
  | sort >> "$OUT"
echo >> "$OUT"

# ── 2) For each remaining file: separator, full path, then its contents (indented)
find "$SRC" -type f \
     ! -name '*.json' \
     ! -path '*/node_modules/*' \
  | sort \
  | while read -r FILE; do
      echo "––––––––––––––––––––––––" >> "$OUT"
      echo "$FILE"             >> "$OUT"
      sed 's/^/    /' "$FILE"  >> "$OUT"
      echo >> "$OUT"
    done

echo "✅ Dump complete: $OUT"
