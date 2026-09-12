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
# Two more checks guard nesting INTEGRITY rather than density — the escape
# hatch for both is a `NESTING-OK:` comment:
#   3. No <Text without an explicit `type=` inside a <Collapsible's
#      `trigger={...}` value. Collapsible's trigger span applies its own fixed
#      ~17px/semibold styling to a plain string child; a <Text sets its own
#      font-size and silently overrides it, so that one trigger renders
#      smaller/lighter than its siblings. This shipped once, in
#      accreditation-standards-table.tsx ("Why Exxat is rated this way"), and
#      was fixed by dropping the <Text wrapper for a bare string. An explicit
#      `type=` is how a deliberate second line inside a trigger (a supporting
#      subtitle next to a chip, say) distinguishes itself from the accident:
#      all 10 real triggers that contain a <Text declare one.
#   4. No direct JSX child of a <CollapsibleGroup that isn't a <Collapsible.
#      CollapsibleGroup's own doc comment: "By default it renders only
#      {children} — no wrapper DOM element." So a non-Collapsible child renders
#      as normal, uncollapsed content sitting visually inside what looks like a
#      collapsible section — hierarchy that reads real and behaves fake.
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
echo "== Checking <Collapsible trigger typography =="
# Scans the REAL extent of each `trigger={...}` prop value by brace-matching
# from its opening `{` to the matching `}`, rather than a fixed line window.
# Both directions matter: real trigger blocks in this app run 1-24 lines, so a
# short window misses the long ones, and a window that overruns a one-line
# trigger reads the Collapsible's own BODY as if it were the trigger (7 of 17
# fixed-window hits were exactly that false positive).
while IFS=: read -r file line; do
  start=$((line > 5 ? line - 5 : 1))
  context=$(sed -n "${start},${line}p" "$file")
  if echo "$context" | grep -q "NESTING-OK:"; then continue; fi
  echo "FAIL  $file:$line  <Text with no explicit type= inside this Collapsible's trigger={...} — Text sets its own font-size and silently overrides the trigger's inherited ~17px/semibold, so this trigger renders smaller/lighter than its siblings. Use a bare string, or an explicit type= if the differing step is deliberate."
  FAIL=1
done < <(find app components -name "*.tsx" -print0 | xargs -0 awk '
  FNR == 1 { intrig = 0; depth = 0; buf = ""; tstart = 0 }
  {
    pos = 1
    if (!intrig) {
      idx = index($0, "trigger={")
      if (idx == 0) next
      intrig = 1; depth = 0; buf = ""; tstart = FNR
      pos = idx + 8              # land on the "{" of trigger={
    }
    seg = substr($0, pos)
    n = length(seg)
    for (i = 1; i <= n; i++) {
      c = substr(seg, i, 1)
      if (c == "{") depth++
      else if (c == "}") {
        depth--
        if (depth == 0) {
          buf = buf substr(seg, 1, i)
          tmp = buf
          while (match(tmp, /<Text[^>]*>/)) {
            tag = substr(tmp, RSTART, RLENGTH)
            after = substr(tag, 6, 1)          # char right after "<Text"
            if (after !~ /[A-Za-z0-9]/ && index(tag, "type=") == 0) {
              print FILENAME ":" tstart
              break
            }
            tmp = substr(tmp, RSTART + RLENGTH)
          }
          intrig = 0
          break
        }
      }
    }
    if (intrig) buf = buf seg " "
  }
')

echo ""
echo "== Checking <CollapsibleGroup nesting integrity =="
# The rule stated positively: content rendered inside a <CollapsibleGroup but
# OUTSIDE any <Collapsible is uncollapsed content wearing collapsible chrome.
#
# This tracks Collapsible open/close depth rather than the indentation of
# "direct children", for two reasons found by running both against the real
# app. Indentation over-fires: it flags a <Stack>/<Card> layout wrapper whose
# own children are Collapsibles, which is the pattern CollapsibleGroup's own
# doc comment demonstrates (flow-detail.tsx does exactly this, correctly). And
# it under-fires: a stray <Text two wrappers deep but still outside every
# Collapsible is the actual fake-nesting bug, and no "direct child" rule sees
# it. Depth-tracking gets both right.
#
# Only unambiguous CONTENT tags are flagged. A custom PascalCase component may
# itself render a Collapsible (FlowStepDetail does), and a text search cannot
# know — so components outside this list are deliberately left alone.
CONTENT_TAGS='Text|Markdown|FieldBlock|Takeaway|Heading|Table|MetadataList|KeyFindingList|DisciplineVarianceList|SeverityDistributionChart'
while IFS=: read -r file line tag; do
  start=$((line > 5 ? line - 5 : 1))
  context=$(sed -n "${start},${line}p" "$file")
  if echo "$context" | grep -q "NESTING-OK:"; then continue; fi
  echo "FAIL  $file:$line  <$tag renders inside a <CollapsibleGroup but outside any <Collapsible. The group renders only {children} with no wrapper DOM, so this is plain uncollapsed content sitting in what looks like a collapsible section. Move it into a <Collapsible, or above the group in the scan layer."
  FAIL=1
done < <(find app components -name "*.tsx" -print0 | xargs -0 awk -v tags="$CONTENT_TAGS" '
  FNR == 1 { ingroup = 0; opentag = 0; depth = 0 }
  {
    trimmed = $0
    sub(/^[ \t]*/, "", trimmed)

    if (!ingroup) {
      if ($0 ~ /<CollapsibleGroup([ \t>]|$)/) {
        if (trimmed ~ /\/>[ \t]*$/) next                                       # self-closing: no body
        ingroup = 1; depth = 0
        opentag = (trimmed ~ />[ \t]*$/ && trimmed !~ /=>[ \t]*$/) ? 0 : 1
      }
      next
    }
    if (opentag) {                                                              # still in the group props
      if (trimmed ~ />[ \t]*$/ && trimmed !~ /=>[ \t]*$/) opentag = 0
      next
    }
    if ($0 ~ /<\/CollapsibleGroup>/) { ingroup = 0; next }

    # Track how deep inside <Collapsible> elements this line sits. A Collapsible
    # opened on this line covers the rest of it (its trigger= prop included).
    opened = gsub(/<Collapsible([ \t>]|$)/, "&")
    closed = gsub(/<\/Collapsible>/, "&")
    if (depth == 0 && opened == 0 && trimmed !~ /^(\/\/|\{\/\*|\/\*|\*)/) {
      if (match(trimmed, "<(" tags ")([ \t/>]|$)")) {
        tag = substr(trimmed, RSTART + 1, RLENGTH - 1)
        sub(/[^A-Za-z0-9_.].*$/, "", tag)
        print FILENAME ":" FNR ":" tag
      }
    }
    depth += opened - closed
    if (depth < 0) depth = 0
  }
')

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "check-render-density: PASS"
else
  echo "check-render-density: FAIL — see above. Fix by adding maxLines=, nesting inside a Collapsible,"
  echo "dropping a <Text wrapper from a trigger, or moving content into a <Collapsible — or, only for a"
  echo "deliberate exception, a SCAN-LAYER:/DENSITY-OK:/NESTING-OK: comment explaining why."
fi
exit "$FAIL"
