#!/usr/bin/env bash
set -e

#
# scripts/dump-all.sh
#

# 1) find project root
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# 2) ensure dumps dir
DUMP_DIR="$PROJECT_ROOT/scripts/dumps"
mkdir -p "$DUMP_DIR"

# 3) paths to individual dumps
BACKEND_DUMP="$DUMP_DIR/all-backend.txt"
FRONTEND_DUMP="$DUMP_DIR/all-frontend.txt"

# 4) combined output
COMBINED="$DUMP_DIR/all-dumps.txt"

# 5) regenerate individual dumps (suppress their success messages)
"$PROJECT_ROOT/scripts/dump-backend.sh" >/dev/null 2>&1
"$PROJECT_ROOT/scripts/dump-frontend.sh" >/dev/null 2>&1

# 6) build the merged file
{
  echo "BACKEND FILES:"
  echo "--------------"
  cat "$BACKEND_DUMP"
  echo
  echo "FRONTEND FILES:"
  echo "---------------"
  cat "$FRONTEND_DUMP"
} > "$COMBINED"

echo "✅ Merged dump written to: $COMBINED"
