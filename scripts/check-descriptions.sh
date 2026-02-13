#!/usr/bin/env bash
# Validate that all registry item.json files have both description and longDescription.
# Used as a git pre-commit hook and can also be run standalone.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || dirname "$(dirname "$0")")"
REGISTRY_DIR="$REPO_ROOT/registry"
errors=0

for item_json in "$REGISTRY_DIR"/*/item.json "$REGISTRY_DIR"/*/*/item.json; do
  [ -f "$item_json" ] || continue

  rel_path="${item_json#"$REPO_ROOT"/}"
  slug=$(python3 -c "import json; print(json.load(open('$item_json')).get('slug','?'))" 2>/dev/null || echo "?")

  # Check description
  has_desc=$(python3 -c "
import json, sys
d = json.load(open('$item_json'))
desc = d.get('description', '')
sys.exit(0 if desc.strip() else 1)
" 2>/dev/null && echo "yes" || echo "no")

  # Check longDescription
  has_long=$(python3 -c "
import json, sys
d = json.load(open('$item_json'))
long = d.get('longDescription', '')
sys.exit(0 if long.strip() else 1)
" 2>/dev/null && echo "yes" || echo "no")

  if [ "$has_desc" = "no" ]; then
    echo "ERROR: $rel_path ($slug) is missing 'description'"
    errors=$((errors + 1))
  fi

  if [ "$has_long" = "no" ]; then
    echo "ERROR: $rel_path ($slug) is missing 'longDescription'"
    errors=$((errors + 1))
  fi
done

if [ $errors -gt 0 ]; then
  echo ""
  echo "$errors description error(s) found. Every item.json must have both 'description' and 'longDescription'."
  echo "Run '/audit-descriptions' to generate missing descriptions."
  exit 1
fi
