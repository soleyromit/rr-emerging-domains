# Lenses IA redesign: 3 dedicated pages + broader DS adoption

## Context

The Lenses feature has been rebuilt twice this session already:

1. **First pass**: 4 separate pages (Accreditor tiers, Competitor landscape, Feature
   comparison, Standards crosswalk), each `TabList` + `Table` + sticky-rail +
   cross-links. Rejected: *"not impressed with the architecture and click down on all
   the lenses. i need more simplicity, access to details."*
2. **Second pass**: collapsed everything onto one `/lenses` page — an always-visible
   standards×competitor crosswalk section, plus every domain as a `CollapsibleGroup`
   accordion rendering the full domain-hub content inline. This fixed the "click down"
   complaint but over-corrected. Rejected: *"i don't want to see all lenses in one
   page. you need to build a better architecture, layout plan. also since you aren't
   using all the ds components, we need to better ds which you adopt."*

Two independent problems to fix this time: (1) real page separation — not zero pages
(the tab+rail version) and not one page (the accordion version) — and (2) meaningfully
broader use of `@astryxdesign/core`, the app's design system. An audit of every
component the library ships versus every component this app has ever imported (see
below) found real, unused, well-suited primitives sitting idle — the app has been
reusing the same dozen components (`Stack`, `Table`, `Card`, `Badge`, `Collapsible`,
`Text`, `Link`...) for everything, including cases where a purpose-built component
already exists.

## Design-system audit

Full component list (`ls node_modules/@astryxdesign/core/dist`) versus everything ever
imported across `app/` and `components/` (`grep -rhoE 'from "@astryxdesign/core/[A-Za-z]+"'`):
**used** — AppShell, Badge, Banner, Blockquote, Breadcrumbs, Card, Citation,
ClickableCard, Collapsible, Divider, EmptyState, Grid, Heading, HoverCard, Icon, Item,
Link, List, Markdown, MetadataList, Section, SideNav, Stack, StatusDot, TabList, Table,
Text, Token, Tooltip. Everything else — including `TreeList`, `Typeahead`,
`SegmentedControl`, `Toolbar`, `Button`, `ButtonGroup`, `DropdownMenu`,
`CommandPalette`, `Popover` — has never been imported anywhere in this codebase.

Most of the unused set is genuinely inapplicable (this is a static, read-only research
site: no `FormLayout`, `Calendar`, `Chat`, `FileInput`, `Slider`, form controls, no
`Carousel`/`Lightbox`/`Avatar` — nothing to carousel, zoom, or attribute to a person).
Five are a real, well-justified fit for this redesign specifically:

- **`TreeList`** — a real hierarchical list component (`items: TreeListItemData[]`,
  each with `startContent`/`label`/`description`/`endContent`/`href`/`children`).
  This is the actual primitive for "navigate into one domain," replacing the
  hand-rolled `CollapsibleGroup`-of-full-content from pass 2.
- **`Typeahead`** — jump straight to a domain by typing its name, instead of
  scrolling/clicking through a list.
- **`SegmentedControl`** — a real filter toggle (`"Priority domains" | "All 12"`)
  instead of dumping everything at once.
- **`Toolbar`** — `startContent`/`centerContent`/`endContent` slots for the
  search+filter+actions row above the crosswalk grid, instead of a loose `Stack`.
- **`Button`/`ButtonGroup`** — real actions ("Expand all" / "Collapse all") instead of
  every interactive element being a `Link` or `ClickableCard`.
- **`List`/`Item`** — `Item`'s `label`/`description`/`startContent`/`endContent` slots
  map exactly onto "competitor name / rationale / threat badge," replacing the
  hand-rolled bordered `Stack` rows in the competitor-landscape section.

## Mobbin research

**This session, round 2** (IA/navigation/toolbar/microinteraction — round 1, on the
matrix/table pattern itself, is cited in the prior design and unchanged: Webflow,
Productboard, 7shifts, Quicken, Midday, Clerk, Deputy, Remote, Sentry):

- **Tree/hierarchical navigation**: [Midday chart of accounts](https://mobbin.com/screens/7cfe9c99-0fb9-4095-858d-f5c42479c50b)
  (indented categories, disclosure triangles, click-through to a detail panel) and
  [GitBook's structure tree](https://mobbin.com/screens/5e25f82f-e668-4a52-8a81-eab81441a987)
  (icon + title + description per node) — the direct precedent for `TreeList` as the
  `/domains` navigator: icon, name, one-line description, no full content inline.
- **Toolbar (search + filter + actions) above a data table**: [Midday's transaction toolbar](https://mobbin.com/screens/2cec1a0e-94d4-4a47-8f59-7d01c4bbc6dd)
  (search input + filter + segmented All/Review tabs), [Mixpanel's event table toolbar](https://mobbin.com/screens/6823ef21-11d6-421b-9863-70d8e443d24a)
  (date-range segmented control + filter + search + export) — the precedent for
  `/crosswalk`'s `Toolbar`: domain filter, priority/all `SegmentedControl`, expand/
  collapse `ButtonGroup`.
- **Command palette / quick jump**: [Remote's inline quick-actions search](https://mobbin.com/screens/2c863fcf-aab8-4a14-a85d-c6839d1b40f8)
  (type "file" → jump straight to a page) — the precedent for the `Typeahead` on
  `/lenses`; lighter-weight than a full `CommandPalette` overlay since there are only
  13 domains to jump between, not an app-wide index.
- **Search-first landing page with a couple of large cards below**: [Navan's "Where to?"](https://mobbin.com/screens/514feceb-6783-404d-8b2f-3163a1e15e1c)
  and [Codecademy's "Explore the catalog"](https://mobbin.com/screens/014ce7cf-92a3-4f70-8059-60a7c1d3f4ec)
  — search bar first, a couple of large destination cards below, no dense content on
  the page itself — the precedent for the rebuilt `/lenses` landing page.

## Architecture — 3 pages, one job each

1. **`/lenses`** (rewritten — landing, not content). `PageHeader` + aggregate
   `MetadataList` + a `Typeahead` ("Jump to a domain") that navigates to
   `/domains/[slug]` on select + two `ClickableCard`s ("Standards × Competitor
   Crosswalk" → `/crosswalk`, "Domains" → `/domains`) + the existing
   `ThreatDistributionChart`. No accordion, no embedded grid — everything here either
   is a link or takes one interaction to become one.

2. **`/crosswalk`** (new — Wilson's grid, and only that).
   `Toolbar` (`startContent`: domain-name filter input; `endContent`: `SegmentedControl`
   for "Priority domains" (PA/OT/Nursing) vs. "All 12"; a `ButtonGroup` with "Expand
   all"/"Collapse all" driving every domain's `Collapsible` open-state at once). Below
   it, each domain section (label row + the existing `StandardsCrosswalkTable`,
   unchanged) wrapped in a `Collapsible`, **open by default** — this page's only
   purpose is showing the grid, so nothing is hidden from view on load; the toolbar
   controls exist for narrowing/collapsing when the user wants to, not as a gate.

3. **`/domains`** (new index) + **`/domains/[slug]`** (existing, lightly revised).
   `/domains`: a single `TreeList`, one top-level item per domain
   (`sortDomainsByPriority` — PA/OT/Nursing first), `href` to `/domains/[slug]`,
   `startContent` = `DisciplineChip`, `label` = domain name, `description` =
   programmatic accreditor, `endContent` = compact stat badges (competitor count,
   standards count). Real navigation, not an inline content dump.
   `/domains/[slug]`: `DomainHubSections` stays as the full single-domain deep dive,
   unchanged except the competitor-landscape section's hand-rolled bordered `Stack`
   rows become a `List` of `Item`s (`label`=competitor name+link, `description`=
   rationale, `endContent`=`ThreatBadge`) — same content, a real DS primitive instead
   of a bespoke row.

**Nav** (`app-nav.tsx`): "Lenses" section grows from 1 link to 3 — Lenses, Crosswalk,
Domains — matching the existing multi-item group pattern already used for "Market" and
"Customer."

**What's removed from `/lenses`**: the `CollapsibleGroup` domain accordion (moves to
`/domains` as a `TreeList`, content unchanged) and the embedded always-visible
crosswalk section (moves to its own `/crosswalk` page, content unchanged — same
`StandardsCrosswalkTable` component, just relocated and now toolbar-controlled).

**What's unchanged**: `lib/content.ts`'s data layer (`getAccreditorTiers`,
`getCompetitorLandscape`, `getFeatureComparisonForDomain`,
`getStandardsCrosswalkForDomain`, `getDomainHubData`, `sortDomainsByPriority`,
`PRIORITY_DOMAINS`), `DomainHubSections`' four content sections and their data,
`StandardsCrosswalkTable`, `ThreatDistributionChart`, `/domains/[slug]`'s existing
route. This is a navigation/composition change, not a content or data-layer rewrite.

## Verification

```
python3 scripts/check_content_density.py     # repo root — 0 new FAIL vs. the existing 31
cd apps/ecosystem && npm run check:density && npx next build
```

In-browser: `/lenses` loads fast with no heavy content, `Typeahead` search navigates
correctly to a domain page; `/crosswalk`'s toolbar filter narrows domains shown, the
priority/all `SegmentedControl` toggles the domain set, "Collapse all"/"Expand all"
actually drives every domain's `Collapsible` state; `/domains`'s `TreeList` renders all
13 domains PA/OT/Nursing-first and each `href` resolves to the matching
`/domains/[slug]`; `/domains/[slug]`'s competitor list renders via `List`/`Item` with
identical content to before.

### Critical files

- New: `apps/ecosystem/app/crosswalk/page.tsx`, `apps/ecosystem/app/domains/page.tsx`
- Rewritten: `apps/ecosystem/app/lenses/page.tsx`
- Edited: `apps/ecosystem/components/domain-hub-sections.tsx` (competitor section →
  `List`/`Item`), `apps/ecosystem/components/app-nav.tsx` (3 Lenses sub-links)
- Unchanged (reused as-is): `apps/ecosystem/lib/content.ts`,
  `apps/ecosystem/components/standards-crosswalk-table.tsx`,
  `apps/ecosystem/app/domains/[slug]/page.tsx`,
  `apps/ecosystem/components/charts/threat-distribution-chart.tsx`
