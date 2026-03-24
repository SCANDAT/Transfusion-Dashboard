#!/bin/bash
# Memory stack integrity validator
# Run from repo root: bash memory/validate.sh
# Returns exit code 0 if healthy, 1 if issues found

MEMORY_DIR="memory"
ERRORS=0
WARNINGS=0

echo "=== Memory Stack Validation ==="
echo ""

# 1. Check all files in the manifest exist
echo "--- File Manifest ---"
while IFS='|' read -r _ file lines scope _; do
  file=$(echo "$file" | sed 's/^ *//;s/ *$//' | sed 's/\[.*\](\(.*\))/\1/')
  lines=$(echo "$lines" | sed 's/^ *//;s/ *$//')

  # Skip non-file rows: headers, separators, category labels, rows without markdown links
  [[ "$file" != *.md ]] && continue

  filepath="$MEMORY_DIR/$file"
  if [ ! -f "$filepath" ]; then
    echo "  MISSING: $filepath"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  actual=$(wc -l < "$filepath")
  if [ "$actual" != "$lines" ]; then
    echo "  DRIFT: $file — manifest says $lines lines, actual $actual"
    WARNINGS=$((WARNINGS + 1))
  fi
done < <(grep '^\|.*\](' "$MEMORY_DIR/MEMORY.md")

[ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ] && echo "  All files present, all line counts match"

# 2. Check internal markdown links resolve
echo ""
echo "--- Internal Links ---"
LINK_ERRORS=0
for mdfile in $(find "$MEMORY_DIR" -name '*.md'); do
  dir=$(dirname "$mdfile")
  grep -oP '\[.*?\]\(\K[^)]+' "$mdfile" 2>/dev/null | while read -r link; do
    # Skip external links, anchors, and section references
    [[ "$link" == http* ]] && continue
    [[ "$link" == \#* ]] && continue
    # Strip anchor from link
    linkpath="${link%%#*}"
    [ -z "$linkpath" ] && continue

    resolved="$dir/$linkpath"
    if [ ! -f "$resolved" ]; then
      echo "  BROKEN: $mdfile → $link"
      LINK_ERRORS=$((LINK_ERRORS + 1))
    fi
  done
done
[ $LINK_ERRORS -eq 0 ] && echo "  All internal links resolve"

# 3. Check code references still exist
echo ""
echo "--- Code References ---"
CODE_REFS=(
  "src/services/dataService.ts:normalizeVitalAbbreviation"
  "src/services/dataService.ts:fetchCSVWithFallback"
  "src/services/dataService.ts:preloadData"
  "src/services/dataService.ts:loadVizIndex"
  "src/services/cache.ts:DataCache"
  "src/stores/dashboardStore.ts:useDashboardStore"
  "docs/architecture.md:"
  "sas_code/README.md:"
)
CODE_ERRORS=0
for ref in "${CODE_REFS[@]}"; do
  file="${ref%%:*}"
  symbol="${ref##*:}"
  if [ ! -f "$file" ]; then
    echo "  MISSING FILE: $file"
    CODE_ERRORS=$((CODE_ERRORS + 1))
    continue
  fi
  if [ -n "$symbol" ]; then
    if ! grep -q "$symbol" "$file" 2>/dev/null; then
      echo "  MISSING SYMBOL: $symbol in $file"
      CODE_ERRORS=$((CODE_ERRORS + 1))
    fi
  fi
done
[ $CODE_ERRORS -eq 0 ] && echo "  All code references valid"

# 4. Validate soul tags
echo ""
echo "--- Soul Tags ---"
VALID_TAGS="Weight|Honesty|Humility|Mechanism|Rigor|Understanding|Uniformity|Patience|Guardianship|Vigilance|Reproducibility"
TAG_ERRORS=0
for mdfile in $(find "$MEMORY_DIR" -name '*.md'); do
  # Extract soul_tags from frontmatter
  tags=$(sed -n '/^---$/,/^---$/p' "$mdfile" | grep -oP 'soul_tags:.*' | grep -oP '\w+' | tail -n +2)
  for tag in $tags; do
    if ! echo "$tag" | grep -qP "^($VALID_TAGS)$"; then
      echo "  INVALID TAG: '$tag' in $mdfile"
      TAG_ERRORS=$((TAG_ERRORS + 1))
    fi
  done
done
[ $TAG_ERRORS -eq 0 ] && echo "  All soul tags valid"

# 5. Check junction integrity
echo ""
echo "--- Junction ---"
JUNCTION_PATH="$USERPROFILE/.claude/projects/W--Transfusion-Dashboard/memory"
if [ -d "$JUNCTION_PATH" ]; then
  # Verify junction points to correct target by checking content matches
  if diff "$JUNCTION_PATH/MEMORY.md" "$MEMORY_DIR/MEMORY.md" > /dev/null 2>&1; then
    echo "  Auto-memory junction intact"
  else
    echo "  JUNCTION STALE: content mismatch between junction and repo"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  JUNCTION MISSING: $JUNCTION_PATH does not exist"
  echo "  Run: cmd /c mklink /J \"$(echo $JUNCTION_PATH | sed 's|/|\\|g')\" \"$(pwd)\\memory\""
  ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "=== Summary ==="
TOTAL=$((ERRORS + WARNINGS + LINK_ERRORS + CODE_ERRORS + TAG_ERRORS))
if [ $TOTAL -eq 0 ]; then
  echo "  HEALTHY: 0 issues"
  exit 0
else
  echo "  $ERRORS errors, $WARNINGS warnings, $LINK_ERRORS link issues, $CODE_ERRORS code ref issues, $TAG_ERRORS tag issues"
  exit 1
fi
