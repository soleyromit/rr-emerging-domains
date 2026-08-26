#!/usr/bin/env bash
# Mechanical version of the "no unclamped content on page load" rule in
# UI-DENSITY-PATTERNS.md. An audit found 10 spots rendering a content/ field
# fully exposed, unclamped, ungated — this script is what catches the next one
# before an agent declares a page done, instead of relying on the rule being
# remembered.
#
# Two checks, both with a self-documenting allowlist-comment escape hatch for
# deliberate exceptions (e.g. a markdown TABLE meant as an always-visible
# on-ramp, not prose):
#   1. Every <Markdown occurrence needs a <Collapsible opening within the
#      preceding LOOKBACK lines (a Collapsible's trigger block can run
#      10-20 lines before its body starts), OR a `SCAN-LAYER:` comment
#      directly above it.
#   2. Every <Text occurrence rendering a property whose name signals
#      long-form content (description, summary, note, rationale, detail,
#      body, comparison, pressure, tools, governs, opportunity, relevance,
#      intro, variance, pain_or_gap, archetype_summary, ...) needs
#      `maxLines=` on the same tag, a preceding <Collapsible within
#      LOOKBACK lines, or a `DENSITY-OK:` comment.
#
# This is intentionally a blunt instrument (fixed-window text search, not a
# real JSX parse) — it will occasionally need a human to add an allowlist
# comment for a true positive-but-fine case. That's the tradeoff called for:
# cheap enough to run every time, not a build dependency.
#
# Usage: bash scripts/check-render-density.sh   (run from apps/ecosystem/)

set -uo pipefail
cd "$(dirname "$0")/.."

LOOKBACK=30
RISKY='\.(description|summary|note|notes|rationale|detail|body|comparison|pressure|tools|governs|opportunity|relevance|intro|variance|state_in_prism|pain_or_gap|archetype_summary)\b'
FAIL=0

echo "== Checking <Markdown usages =="
while IFS=: read -r file line; do
  start=$((line > LOOKBACK ? line - LOOKBACK : 1))
  context=$(sed -n "${start},${line}p" "$file")
  if echo "$context" | grep -q "<Collapsible"; then continue; fi
  if echo "$context" | grep -q "SCAN-LAYER:"; then continue; fi
  echo "FAIL  $file:$line  <Markdown not preceded by a <Collapsible or SCAN-LAYER: comment within $LOOKBACK lines"
  FAIL=1
done < <(grep -rn "<Markdown" app components --include="*.tsx" | cut -d: -f1,2)

echo ""
echo "== Checking <Text usages rendering a long-form field =="
while IFS=: read -r file line; do
  snippet=$(sed -n "${line},$((line + 2))p" "$file")
  if ! echo "$snippet" | grep -qE "$RISKY"; then continue; fi
  if echo "$snippet" | grep -q "maxLines="; then continue; fi
  start=$((line > LOOKBACK ? line - LOOKBACK : 1))
  context=$(sed -n "${start},${line}p" "$file")
  if echo "$context" | grep -q "<Collapsible"; then continue; fi
  if echo "$context" | grep -q "DENSITY-OK:"; then continue; fi
  echo "FAIL  $file:$line  <Text renders a long-form field with no maxLines=, no nearby <Collapsible, and no DENSITY-OK: comment"
  FAIL=1
done < <(grep -rn "<Text" app components --include="*.tsx" | cut -d: -f1,2)

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "check-render-density: PASS"
else
  echo "check-render-density: FAIL — see above. Fix by adding maxLines=, nesting inside a Collapsible,"
  echo "or — only for a deliberate exception — a SCAN-LAYER:/DENSITY-OK: comment explaining why."
fi
exit "$FAIL"
