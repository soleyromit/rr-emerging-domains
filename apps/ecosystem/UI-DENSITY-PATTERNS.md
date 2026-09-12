# UI Density Patterns — the checklist for a new page or component

**What this is:** the render-side half of the content-density fix. Sibling to
`../content/CONTENT-DENSITY.md`, which governs how long a field is allowed to be;
this governs how that field gets shown once it exists.

**Last updated:** 2026-08-25

---

## The bug this doc exists to prevent

`components/journey-stage-section.tsx` wrapped its element-evidence steps in a
`CollapsibleGroup`, which *looked* like it collapsed content — but its children were
plain `Card`s, not `Collapsible`s, so the group provided zero actual collapsing.
Opening one journey stage dumped every step's full table at once (up to 18 cards / 137
rows for a single stage). It shipped, built cleanly, and looked correct in code review
— the bug was only visible by actually clicking it open in a browser. **A component
that looks collapsible in the JSX but isn't is worse than no collapsing at all**,
because it reads as done.

## The two-zone page shape

Every content-heavy page in this app should read in two zones, separated by an explicit
divider:

```tsx
<PageHeader eyebrow="..." title="..." description="..." />
<Takeaway status="...">one real headline finding, 2-3 sentences</Takeaway>
<MetadataList columns={3 or 4}>real computed numbers, not restated prose</MetadataList>
<SeverityDistributionChart .../>  {/* or whatever chart is relevant */}

<Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />

<CollapsibleGroup type="multiple">
  {/* everything else, closed by default */}
</CollapsibleGroup>
```

Reference implementations, in the order they were built well: `/prism`
(`app/prism/page.tsx`), `/synthesis/gap-analysis`, `/synthesis/vocabulary`,
`/repo-comparison`, `/synthesis/positioning`. If you're building a new page and it has
more than ~3 sections' worth of content, copy one of these, don't start from scratch.

**Default-open state matters as much as the divider.** A `CollapsibleGroup` with every
item open by default is the two-zone pattern in name only — see `journeys/[slug]`
before the fix. Pick a sensible default (first item open, everything else closed;
or nothing open and a summary count instead) and set it via `defaultValue`, not by
leaving every item's own `defaultIsOpen` to fend for itself.

## The reusable pieces — use these, don't reinvent them

- **`components/journey-stage-section.tsx`'s `FieldBlock`** — a single long-form field:
  2-line clamp with an automatic hover tooltip, plus a "Read the full section"
  `Collapsible` for the full text. This is the default answer for "I have one string
  that might be long."
- **`components/key-finding-list.tsx`'s `KeyFindingList`** — a decomposed list of
  `{subject, headline, severity, detail}` findings, rendered as one scannable row each
  (`DisciplineChip` + headline + severity `Badge`, `detail` auto-truncated by `List`'s
  own `ListItem description` handling). Use when you have N short findings about N
  different subjects, not one essay trying to hold all of them.
- **`components/discipline-variance-list.tsx`'s `DisciplineVarianceList`** — same idea
  as `KeyFindingList` but for a decomposed `{subject, detail}` list where each entry is
  itself a paragraph (not a one-liner) — one real `Collapsible` per subject.
- **`components/discipline-chip.tsx`'s `DisciplineChip`** — a consistent color-coded
  short code for a domain/discipline (`subject` prop, matched against
  `lib/discipline-meta.ts`). Use anywhere a domain/discipline needs a label, so scanning
  across pages becomes color/code pattern-matching instead of re-reading a full name
  every time.
- **`components/charts/severity-distribution-chart.tsx`'s `SeverityDistributionChart`**
  — a horizontal stacked bar of gap-severity counts (`{label, severity}[]` rows), same
  visual language as `fit-distribution-chart.tsx`. Put one of these above any table with
  more than ~10 rows so the shape of the data is visible before anyone reads a row.
- **`lib/markdown-sections.ts`'s `splitSectionsAtLevel`, `getPreamble`, `extractLead`**
  — for any page rendering a `content/*.md` document, split it into sections instead of
  dumping it as one `<Markdown>` block. `extractLead` gives you a short preview sentence
  for a section without reading the whole thing.

## The hierarchical index → detail → cross-link pattern

`/personas` is the reference implementation: an index page with a `TabList`
(discipline / role / lens) showing `ClickableCard` grids (`app/personas/page.tsx`),
each card linking to a typed `[slug]` detail page with its own `Breadcrumbs` back to
the index (`app/personas/discipline/[slug]/page.tsx`, `app/personas/role/[slug]/page.tsx`,
`app/personas/lens/[slug]/page.tsx`), each statically generated via
`generateStaticParams`. `/flows/[slug]` (`app/flows/[slug]/page.tsx`) extends this same
shape one level deeper — a detail page reachable from a journey stage rather than its
own tabbed index, breadcrumbed `Journeys > <journey name> > <stage name>`.

**Lateral cross-links** (a link sideways to a different subpage *type*, not strictly up
to an index or down to a child) follow the `app/personas/lens/[slug]/page.tsx` pattern:
build the `ComparisonCardGrid` item's `label` as a conditionally-`Link`-wrapped node —
wrap in `<Link href="/personas/role/{slug}">` only when the cross-reference actually
resolves (via a lookup like `findRoleSlug`/`roleNameMatches`), otherwise fall back to
plain `<Text>`. Never assume a cross-reference resolves; a broken or stale content
reference should degrade to plain text, not a link to a 404.

**Point-level "connects to a flow" links** are a narrower case of the same idea:
`components/related-flows-preview.tsx`'s `RelatedFlowsPreview` resolves a
`related_flows: {flow, step?, element?}[]` ref (server-side, via `lib/content.ts`'s
`resolveRelatedFlows`) into a compact `externalLink`-icon chip; hovering (or tapping, on
touch) previews the competitor's vs. Prism's actual solve for the cited element via
`HoverCard`, with a "View full flow →" link into `/flows/[slug]`. Wired into
`IconFactCard`/`ProseItemList`, `ComparisonCardGrid`, and `SentenceList` as an optional
trailing prop — absent or empty `relatedFlows`/`items` renders nothing, so every
existing caller with no `related_flows` content is unaffected. See
`app/personas/discipline/[slug]/page.tsx`'s `jtbdItems` mapping for the
resolve-then-pass-down shape.

**Zoomed-out-first diagrams**: `components/charts/journey-stepper.tsx`'s
`JourneyStepper` and `components/charts/flow-diagram.tsx`'s `FlowDiagram` are the "shape
of the whole thing before the deep dive" idiom for journeys and flows — hand-composed
from `Stack`/`Card`/`ClickableCard`/`Icon`/`Badge` (not a Plot/SVG chart), placed in the
scan-layer zone above the existing per-stage/per-element severity chart and well above
the `Divider`+`CollapsibleGroup` deep dive. Both reuse
`components/severity-mini-bar.tsx`'s `SeverityMiniBar` for their per-node severity
indicator rather than re-declaring the color logic.

**No raw filenames or partial URLs, ever, anywhere.** No component in this app may
render a raw filename, YAML slug, or partial-looking path string as visible text — not
a node label, not a breadcrumb, not a tooltip, not `alt`/`aria-label` text. Every
reference resolves to a full descriptive name (`flow_name`, `journey_name`, a real
stage/screen title) before rendering. `lib/strip-file-citations.ts`'s
`stripFileCitations` exists specifically because some flow-element prose
(`accreditation_citation`, `competitor_equivalent`) embeds parenthetical source-file
citations inline (e.g. `"...(competitors/emedley.yaml, e-value.yaml)..."`) — real,
correct research, but a literal raw-filename leak once rendered; strip it at render
time rather than rewriting the underlying content field.

## The four mechanical rules, enforced

1. **`<Markdown>` has no clamp prop.** The only way to control its exposure is nesting
   it inside a closed-by-default `<Collapsible>`, or explicitly marking it as an
   intentional always-visible on-ramp with a `{/* SCAN-LAYER: reason */}` comment
   directly above it (see `/synthesis/vocabulary`'s Rosetta Stone table for the one
   real example of that exception).
2. **`<Text>` rendering a field whose name signals long-form content** (description,
   summary, note, rationale, detail, body, comparison, pressure, tools, governs,
   opportunity, relevance, intro, variance, pain_or_gap, archetype_summary, ...) needs
   `maxLines={N}` on the tag, to sit inside a `<Collapsible>`, or a
   `{/* DENSITY-OK: reason */}` comment for a genuine false-positive (e.g. a `.body`
   property that's actually a short name, not prose — see
   `app/accreditation/[domain]/page.tsx` for a worked example of that comment).
3. **A `<Collapsible>`'s `trigger` gets a bare string, not a `<Text>` wrapper.** The
   trigger renders its plain string child inside a span carrying its own fixed
   ~17px/semibold styling. A `<Text>` sets its own font-size, which silently overrides
   what the label would otherwise inherit — so that one trigger renders smaller and
   lighter than its siblings even though all of them are the same conceptual level. This
   shipped once: `components/accreditation-standards-table.tsx` had three top-level
   triggers passing bare strings and a fourth ("Why Exxat is rated this way") wrapping
   its label in `<Text textWrap="wrap">`, and the difference was visible on screen before
   anyone found it in the source. Note what is and isn't the rule: a multi-line trigger
   is fine, and so are sibling `<Badge>`s next to the label — that same fixed trigger is
   a `<Stack>` wrapping a bare string plus two badges. What breaks is `<Text>` around the
   label. The check therefore fires only on a `<Text>` inside a `trigger={...}` that
   declares no explicit `type=`; an explicit `type=` is how a deliberate second line
   inside a trigger says so (a supporting subtitle beside a chip, as in
   `components/discipline-variance-list.tsx`). Escape hatch: `{/* NESTING-OK: reason */}`.
4. **Nothing renders inside a `<CollapsibleGroup>` except `<Collapsible>`s.**
   `CollapsibleGroup` renders only `{children}` — no wrapper DOM element at all unless
   `hasDividers` is set. So any content placed in the group but outside a `<Collapsible>`
   renders plainly, fully expanded, visually inside what looks like a collapsible
   section: hierarchy that reads real and behaves fake. Layout wrappers are fine and the
   check ignores them — a `<Stack>` or `<Card>` whose own children are `<Collapsible>`s
   is the design system's documented pattern, and `components/flow-detail.tsx` uses it
   correctly. What the check catches is a content component (`Text`, `Markdown`,
   `FieldBlock`, `Takeaway`, a chart) sitting in the group with no `<Collapsible>` above
   it, at any nesting depth. Escape hatch: `{/* NESTING-OK: reason */}`. See
   `components/dissect/node-detail-panel.tsx` for the group used correctly.

### The Three-Level Rule: a `Card` is never a level

Every content-heavy surface has exactly three disclosure levels, and each one is a
specific component:

- **L1 — the scan layer.** Visible with zero clicks: a `Takeaway`, a `MetadataList`, a
  summary chart. A reader who opens nothing still leaves with the answer.
- **L2 — a named, closed-by-default `<Collapsible>` inside a `<CollapsibleGroup>`.** The
  first click reveals a whole section ("Feature teardown by pillar"). The trigger names
  what's inside, so the click is a decision, not a gamble.
- **L3 — the evidence inside that section.** Either a `<FieldBlock>` (clamped prose with
  its own expand-to-full toggle) or, for genuinely deep content, a further-nested
  `<Collapsible>`.

The punchline: **a `<Card>` used for visual grouping is not a level.** It's decoration,
not disclosure. Putting content inside a `Card` instead of a `Collapsible` doesn't add a
level — it just looks like one while behaving exactly like L1, because everything inside
it still renders unclamped on page load. The same goes for a background tint, a border,
or a nested `Stack`: if the reader doesn't have to click to reveal it, it's L1 no matter
how it's boxed. This is why rule 4 above exists as a mechanical check rather than as
advice — a fake level type-checks and builds cleanly.

`components/dissect/node-detail-panel.tsx` is the reference implementation of the shape:
a `Takeaway` (L1), a `Divider`, then a `CollapsibleGroup` of named `Collapsible`s (L2),
with the cross-link row after it. `components/dissect/standard-detail-panel.tsx` shows
L3 filled in — every one of its L2 sections holds `FieldBlock`s with real `maxLines`,
and its "Why Exxat is rated this way" trigger carries an inline comment explaining the
bare string, so the next agent to touch it doesn't reintroduce rule 3's bug.

## `ListItem`'s `label`/`description` have NO tooltip — worse than a plain `<Text>` clamp

A bare `<Text maxLines={N}>` truncation is recoverable: `Text` wires an automatic
hover tooltip showing the full string once it detects overflow (see `Text.tsx`'s
`hasTruncateTooltip`, on by default). `ListItem`'s `label`/`description` do NOT do
this — a plain-string `label`/`description` gets single-line CSS ellipsis with zero
tooltip, zero recovery path. Passing a long string straight into either prop is
strictly worse than the unfixed `gap_note` tooltip-only bug once was, because there
isn't even a tooltip.

The fix: never pass a plain string that could be long into `label`/`description`.
Wrap it in `<Text maxLines={N}>` instead — `ListItem` accepts a `ReactNode` for
both props and defers entirely to the child's own truncation behavior, so the
wrapped `Text` gets its normal clamp + hover tooltip:

```tsx
<ListItem
  label={job.job}
  description={
    job.evidence_or_rationale ? (
      <Text type="supporting" maxLines={2}>{job.evidence_or_rationale}</Text>
    ) : undefined
  }
/>
```

See `app/personas/page.tsx` (jtbd, top_pains, how_they_implicitly_serve_roles),
`app/prism/page.tsx` (feature `detail`, intelligence-layer capabilities, open
questions), and `app/competitors/page.tsx` (strengths/weaknesses `claim`) for the
fixed pattern — all were plain-string `label`/`description` bound to fields that
run past 1,000 characters in real content before the 2026-08-25 fix.

Run `npm run check:density` (or `bash scripts/check-render-density.sh` from
`apps/ecosystem/`) before declaring any page or component done. It's a blunt text
search, not a real JSX parse — it will occasionally need a human to
add an allowlist comment for a true-positive-but-fine case. That's the intended
tradeoff: cheap enough to run every time, not a build dependency, not a false sense of
completeness either.

## When you're an agent building a new page or component

1. Read this file and skim the reference implementations above before writing JSX.
2. If you're rendering a `content/` field that could be long, reach for `FieldBlock`,
   `KeyFindingList`, or `DisciplineVarianceList` before reaching for a bare `<Text>`.
3. If you're building a `Collapsible`-based section, actually open it in a browser
   before calling the work done — a `CollapsibleGroup` wrapping non-collapsible
   children will look identical in the source and be a completely different experience
   live. Rule 4 now catches the common shape of that mistake, but it only knows about
   content components it can name; a custom component that renders no `Collapsible` of
   its own still slips through, and only a click finds it.
4. Count your levels against the Three-Level Rule before you ship: L1 scan, L2 named
   `Collapsible`, L3 `FieldBlock` or nested `Collapsible`. If a level is "a `Card`",
   you have one fewer level than you think.
5. Run `npm run check:density` and `npx next build` before finishing. Neither is
   optional — see `/CLAUDE.md`.
