#!/bin/bash
# PostToolUse hook: Check .tsx files for UI anti-patterns after Write/Edit.
# These checks complement the ESLint plugin (eslint-plugin-toolr-design.js)
# by catching patterns that are difficult to express as AST-based lint rules.
# The ESLint plugin handles: raw spacing, raw colors, raw text sizes, raw form
# elements, deep imports, direct lucide imports, and browser dialogs.

FILE="$1"

# Only check .tsx files in src/
if [[ ! "$FILE" =~ \.tsx$ ]] || [[ ! "$FILE" =~ src/ ]]; then
  exit 0
fi

# Skip files in the design system itself
if [[ "$FILE" =~ shared/ui-design/ ]]; then
  exit 0
fi

WARNINGS=""

# 1. group-hover tooltip pattern (hard to detect via AST without false positives)
if grep -n 'group-hover' "$FILE" 2>/dev/null | grep -i 'tooltip\|tip\|hint' | head -3 | grep -q .; then
  LINES=$(grep -n 'group-hover' "$FILE" | grep -i 'tooltip\|tip\|hint' | head -3 | cut -d: -f1 | tr '\n' ',')
  WARNINGS="${WARNINGS}\n[UI] group-hover tooltip at line(s) ${LINES%,} — use Tooltip component (portal-based)"
fi

# 2. Template literal className (should use cn() for conditional classes)
if grep -n 'className={`' "$FILE" 2>/dev/null | head -3 | grep -q .; then
  LINES=$(grep -n 'className={`' "$FILE" | head -3 | cut -d: -f1 | tr '\n' ',')
  WARNINGS="${WARNINGS}\n[UI] Template literal className at line(s) ${LINES%,} — use cn() from @toolr/ui-design"
fi

# Output warnings if any found
if [ -n "$WARNINGS" ]; then
  echo -e "UI Anti-Pattern Warnings in $(basename "$FILE"):${WARNINGS}"
  echo ""
  echo "Fix these before proceeding. See ui-consumer skill for correct patterns."
fi
