# Lenses IA Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single, overloaded `/lenses` page into 3 dedicated pages
(`/lenses` landing, `/crosswalk`, `/domains` index → existing `/domains/[slug]`), and
adopt 6 previously-unused `@astryxdesign/core` components (`TreeList`, `Typeahead`,
`SegmentedControl`, `Toolbar`, `Button`/`ButtonGroup`, `List`/`ListItem`) where they are
a genuine fit.

**Architecture:** Each page keeps one job. `/lenses` becomes a lightweight landing
(search + 2 cards, no heavy content). `/crosswalk` is Wilson's standards×competitor
grid, toolbar-controlled, on its own page. `/domains` is a `TreeList` navigator into
the existing `/domains/[slug]` deep-dive pages. No data-layer changes — `lib/content.ts`
and `DomainHubSections`' four content sections are reused as-is; this is a
composition/navigation change only, except one section (`DomainHubSections`' competitor
list) gets a genuine primitive swap from hand-rolled `Stack` rows to `List`/`ListItem`.

**Tech Stack:** Next.js App Router (static export via `generateStaticParams`),
`@astryxdesign/core` design system, TypeScript. No test framework exists in this repo —
verification is `next build` (compiles + prerenders every static route) plus this
repo's own density-check scripts plus manual browser verification; task steps use
those in place of unit tests.

**Spec:** `docs/superpowers/specs/2026-08-26-lenses-ia-redesign-design.md`

## Global Constraints

- PA, Occupational Therapy, and Nursing sort first everywhere a domain list is
  rendered — via the existing `sortDomainsByPriority`/`PRIORITY_DOMAINS` from
  `lib/content.ts`. Never re-derive this ordering by hand.
- No component may render a raw filename, YAML slug, or partial-looking path string
  as visible text (standing rule from `UI-DENSITY-PATTERNS.md`).
- Any new long-form `<Text>` (no `maxLines`, no nearby `<Collapsible`) must pass
  `npm run check:density` (`apps/ecosystem/scripts/check-render-density.sh`) — add a
  `DENSITY-OK:` comment only for a deliberate, precedented exception.
- Do not run `git commit` as part of executing this plan — this repo's commits are
  user-gated (see `CLAUDE.md`/session rules). Steps below end each task with a build +
  density verification instead of a commit; staging/committing is a separate,
  explicitly-requested action.
- All work happens inside `apps/ecosystem/` unless a step says otherwise — `cd` there
  before running `npm`/`npx` commands.

---

## Task 1: `/domains` index page — `TreeList` navigator

**Files:**
- Create: `apps/ecosystem/app/domains/page.tsx`

**Interfaces:**
- Consumes: `getAccreditorTiers(): AccreditorTiers | null`,
  `getCompetitorLandscape(): CompetitorLandscape | null`,
  `getStandardsCrosswalkForDomain(domain: string): StandardsCrosswalkForDomain | null`,
  `sortDomainsByPriority<T>(items: T[], getDomain: (item: T) => string): T[]` — all from
  `@/lib/content` (unchanged, already exist). `matchDisciplineMeta(subject: string):
  DisciplineMeta | null` from `@/lib/discipline-meta`. `DisciplineChip` from
  `@/components/discipline-chip`.
- Produces: the `/domains` route, linked from `/lenses` (Task 4) and `app-nav.tsx`
  (Task 5).

- [ ] **Step 1: Write the page**

```tsx
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Badge } from "@astryxdesign/core/Badge";
import { TreeList, type TreeListItemData } from "@astryxdesign/core/TreeList";
import { PageHeader } from "@/components/page-header";
import { DisciplineChip } from "@/components/discipline-chip";
import {
  getAccreditorTiers,
  getCompetitorLandscape,
  getStandardsCrosswalkForDomain,
  sortDomainsByPriority,
} from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

export default function DomainsIndexPage() {
  const tierDomains = sortDomainsByPriority(getAccreditorTiers()?.domains ?? [], (d) => d.domain);
  const landscape = getCompetitorLandscape();

  const items: TreeListItemData[] = tierDomains.map((d) => {
    const slug = matchDisciplineMeta(d.domain)?.slug ?? d.domain;
    const competitorCount = landscape?.domains.find((l) => l.domain === d.domain)?.competitors.length ?? 0;
    const standardsCount = getStandardsCrosswalkForDomain(d.domain)?.rows.length ?? 0;
    return {
      id: slug,
      label: d.domain,
      description: d.programmatic_accreditor,
      startContent: <DisciplineChip subject={d.domain} />,
      endContent: (
        <Stack direction="horizontal" gap={1.5}>
          <Badge variant="neutral" label={`${competitorCount} competitors`} />
          <Badge variant="neutral" label={`${standardsCount} standards`} />
        </Stack>
      ),
      href: `/domains/${slug}`,
    };
  });

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <PageHeader
          eyebrow="Lenses"
          title="Domains"
          description="Every tracked domain, PA/OT/Nursing first. Open one for its full accreditor structure, competitor landscape, feature comparison, and standards crosswalk."
        />
      </Section>
      <Section padding={6}>
        <TreeList items={items} density="balanced" header={<span>Domains</span>} />
      </Section>
    </Stack>
  );
}
```

- [ ] **Step 2: Build and verify the route exists**

Run: `cd apps/ecosystem && npx next build 2>&1 | tail -60`
Expected: `Compiled successfully`, no TypeScript errors, and `/domains` listed as a
static route in the build's route table (alongside the existing `/domains/[slug]`
entries).

- [ ] **Step 3: Manual browser check**

Start the dev server (`npx next dev -p 3000`, wait for `Ready`), open
`http://localhost:3000/domains`. Confirm: 13 rows, Physician Assistant / Occupational
Therapy / Nursing first; each row shows a `DisciplineChip`, domain name, accreditor as
description, and two count badges; clicking a row navigates to the matching
`/domains/[slug]` page (already built, unchanged).

---

## Task 2: `DomainHubSections` competitor section → `List`/`ListItem`

**Files:**
- Modify: `apps/ecosystem/components/domain-hub-sections.tsx`

**Interfaces:**
- Consumes: `List`, `ListItem` from `@astryxdesign/core/List` (`ListItemProps`:
  `label`, `description`, `startContent`, `endContent`, `href`). Existing
  `ThreatBadge` from `@/components/fit-badge`, existing `landscapeEntry.competitors:
  CompetitorThreatEntry[]` (`{competitor, slug, threat, rationale}`) already in scope.
- Produces: no external interface change — `DomainHubSections`' own props
  (`{domain, data}`) are unchanged; only its internal competitor-landscape rendering
  changes. `/domains/[slug]/page.tsx` and `/lenses/page.tsx`'s existing calls to
  `<DomainHubSections domain={...} data={...} />` need no edits for this task.

The current competitor block (hand-rolled bordered `Stack` rows, duplicated once for
`visibleCompetitors` and once inside the overflow `Collapsible`) is replaced by two
`List`s of `ListItem`s — same visible content, real DS primitive.

- [ ] **Step 1: Replace the competitor rendering block**

In `components/domain-hub-sections.tsx`, find this exact block (the `) : (` branch of
the "Competitor landscape" section's `!landscapeEntry?.competitors.length ? ... : (...)`
conditional):

```tsx
        ) : (
          <Stack gap={3}>
            {visibleCompetitors.map((c) => (
              <Stack key={c.slug} gap={1.5} paddingBlock={2} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <Stack direction="horizontal" hAlign="between" vAlign="center" gap={2} wrap="wrap">
                  <Link href={`/competitors/${c.slug}`} type="body" weight="semibold" size="sm" color="accent" hasUnderline>
                    {c.competitor}
                  </Link>
                  <ThreatBadge threat={c.threat} />
                </Stack>
                <Text type="supporting" size="sm" maxLines={2}>
                  {c.rationale}
                </Text>
              </Stack>
            ))}
            {overflowCompetitors.length ? (
              <Collapsible trigger={`Show ${overflowCompetitors.length} more competitors`} defaultIsOpen={false}>
                <Stack gap={3}>
                  {overflowCompetitors.map((c) => (
                    <Stack key={c.slug} gap={1.5} paddingBlock={2} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <Stack direction="horizontal" hAlign="between" vAlign="center" gap={2} wrap="wrap">
                        <Link href={`/competitors/${c.slug}`} type="body" weight="semibold" size="sm" color="accent" hasUnderline>
                          {c.competitor}
                        </Link>
                        <ThreatBadge threat={c.threat} />
                      </Stack>
                      <Text type="supporting" size="sm" maxLines={2}>
                        {c.rationale}
                      </Text>
                    </Stack>
                  ))}
                </Stack>
              </Collapsible>
            ) : null}
            {landscapeEntry.sources?.length ? (
              <Stack gap={1}>
                <Text type="label" color="secondary" size="xsm">
                  Sources
                </Text>
                <SentenceList items={landscapeEntry.sources.map(humanizeSourceRef)} maxLines={2} fallbackIcon="copy" />
              </Stack>
            ) : null}
          </Stack>
        )}
```

Replace it with:

```tsx
        ) : (
          <Stack gap={3}>
            <List hasDividers>
              {visibleCompetitors.map((c) => (
                <ListItem
                  key={c.slug}
                  href={`/competitors/${c.slug}`}
                  label={c.competitor}
                  description={c.rationale}
                  descriptionLines={2}
                  endContent={<ThreatBadge threat={c.threat} />}
                />
              ))}
            </List>
            {overflowCompetitors.length ? (
              <Collapsible trigger={`Show ${overflowCompetitors.length} more competitors`} defaultIsOpen={false}>
                <List hasDividers>
                  {overflowCompetitors.map((c) => (
                    <ListItem
                      key={c.slug}
                      href={`/competitors/${c.slug}`}
                      label={c.competitor}
                      description={c.rationale}
                      descriptionLines={2}
                      endContent={<ThreatBadge threat={c.threat} />}
                    />
                  ))}
                </List>
              </Collapsible>
            ) : null}
            {landscapeEntry.sources?.length ? (
              <Stack gap={1}>
                <Text type="label" color="secondary" size="xsm">
                  Sources
                </Text>
                <SentenceList items={landscapeEntry.sources.map(humanizeSourceRef)} maxLines={2} fallbackIcon="copy" />
              </Stack>
            ) : null}
          </Stack>
        )}
```

If the file's current content differs slightly from the "find" block above (e.g. from
edits made since this plan was written), match on the `visibleCompetitors.map`/
`overflowCompetitors.length ?`/`landscapeEntry.sources?.length ?` structure instead of
an exact character match, and preserve every prop value (`href`, `c.rationale`,
`c.threat`) unchanged — only the row markup (`Stack`+`Link`+`Text` → `ListItem`) and
its `List` wrapper change.

Add the import at the top of the file, alongside the other `@astryxdesign/core`
imports:

```tsx
import { List, ListItem } from "@astryxdesign/core/List";
```

- [ ] **Step 2: Build**

Run: `cd apps/ecosystem && npx next build 2>&1 | tail -60`
Expected: `Compiled successfully`, no TypeScript errors. `/domains/[slug]` and
`/lenses` (still the old version until Task 4) both still build.

- [ ] **Step 3: Density check**

Run: `npm run check:density`
Expected: `check-render-density: PASS` — `descriptionLines={2}` on both `ListItem`
instances clamps `c.rationale` the same way the `maxLines={2}` it replaced did.

- [ ] **Step 4: Manual browser check**

Open `/domains/pa` (or any domain with 2+ competitors). Confirm the competitor list
renders identically in content to before (name links to `/competitors/[slug]`,
rationale text, threat badge on the right) — now via `List`/`ListItem` instead of
hand-rolled `Stack` rows.

---

## Task 3: `/crosswalk` page — Toolbar + SegmentedControl + ButtonGroup

**Files:**
- Create: `apps/ecosystem/components/crosswalk-view.tsx`
- Create: `apps/ecosystem/app/crosswalk/page.tsx`

**Interfaces:**
- Consumes: `listStandardsCrosswalkDomains(): string[]`,
  `getStandardsCrosswalkForDomain(domain: string): StandardsCrosswalkForDomain | null`
  from `@/lib/content` (unchanged). `StandardsCrosswalkTable` from
  `@/components/standards-crosswalk-table` (unchanged, reused as-is).
  `DisciplineChip` from `@/components/discipline-chip`.
  `matchDisciplineMeta` from `@/lib/discipline-meta`.
- Produces: `CrosswalkView({ domains: StandardsCrosswalkForDomain[] })` — a client
  component consumed only by `app/crosswalk/page.tsx`.

`CrosswalkView` owns 3 pieces of client state: a text filter (substring match against
domain name), a priority/all `SegmentedControl` value, and the `CollapsibleGroup`'s
open-domain-slugs array (driven by the toolbar's Expand all/Collapse all buttons).

- [ ] **Step 1: Write `crosswalk-view.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { TextInput } from "@astryxdesign/core/TextInput";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { ButtonGroup } from "@astryxdesign/core/ButtonGroup";
import { Button } from "@astryxdesign/core/Button";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { DisciplineChip } from "@/components/discipline-chip";
import { StandardsCrosswalkTable } from "@/components/standards-crosswalk-table";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import { PRIORITY_DOMAINS } from "@/lib/content";
import type { StandardsCrosswalkForDomain } from "@/lib/content";

export function CrosswalkView({ domains }: { domains: StandardsCrosswalkForDomain[] }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"priority" | "all">("all");
  const slugs = useMemo(
    () => domains.map((d) => matchDisciplineMeta(d.domain)?.slug ?? d.domain),
    [domains]
  );
  const [openSlugs, setOpenSlugs] = useState<string[]>(slugs);

  const visible = domains.filter((d) => {
    if (scope === "priority" && !PRIORITY_DOMAINS.includes(d.domain)) return false;
    if (query && !d.domain.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <Stack gap={5}>
      <Toolbar
        label="Standards crosswalk controls"
        startContent={
          <TextInput
            label="Filter by domain"
            isLabelHidden
            value={query}
            onChange={setQuery}
            placeholder="Filter by domain name…"
            width={240}
          />
        }
        endContent={
          <Stack direction="horizontal" gap={3} vAlign="center">
            <SegmentedControl label="Domain scope" value={scope} onChange={(v) => setScope(v as "priority" | "all")}>
              <SegmentedControlItem value="priority" label="Priority domains" />
              <SegmentedControlItem value="all" label="All 12" />
            </SegmentedControl>
            <ButtonGroup label="Expand or collapse all domains">
              <Button label="Expand all" variant="secondary" size="sm" onClick={() => setOpenSlugs(slugs)} />
              <Button label="Collapse all" variant="secondary" size="sm" onClick={() => setOpenSlugs([])} />
            </ButtonGroup>
          </Stack>
        }
      />

      {visible.length === 0 ? (
        <EmptyState title="No domains match that filter" description="Clear the filter or switch scope above." />
      ) : (
        <CollapsibleGroup type="multiple" hasDividers value={openSlugs} onChange={(v) => setOpenSlugs(v as string[])}>
          {visible.map((d) => {
            const slug = matchDisciplineMeta(d.domain)?.slug ?? d.domain;
            return (
              <Collapsible
                key={d.domain}
                value={slug}
                trigger={
                  <Stack direction="horizontal" gap={2} vAlign="center">
                    <DisciplineChip subject={d.domain} />
                    <Text type="body" weight="semibold" size="base">
                      {d.domain}
                    </Text>
                    <Text type="supporting" size="sm" color="secondary">
                      {d.accreditor}
                    </Text>
                  </Stack>
                }
              >
                <Stack gap={3}>
                  <StandardsCrosswalkTable standardsCrosswalk={d} />
                  <Divider />
                </Stack>
              </Collapsible>
            );
          })}
        </CollapsibleGroup>
      )}
    </Stack>
  );
}
```

- [ ] **Step 2: Write `app/crosswalk/page.tsx`**

```tsx
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { CrosswalkView } from "@/components/crosswalk-view";
import { listStandardsCrosswalkDomains, getStandardsCrosswalkForDomain } from "@/lib/content";

export default function CrosswalkPage() {
  const domains = listStandardsCrosswalkDomains()
    .map((d) => getStandardsCrosswalkForDomain(d))
    .filter((d): d is NonNullable<typeof d> => d != null);
  const totalStandards = domains.reduce((sum, d) => sum + d.rows.length, 0);

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Wilson's crosswalk grid"
            title="Standards × competitor crosswalk"
            description={
              'Rows are individual accreditation standards, columns are Prism plus every ' +
              'competitor active in that domain — the exact shape Wilson asked for on the ' +
              '2026-08-26 call. Prism column is real, cited data; competitor columns show ' +
              '"Not yet researched" — Wilson is sourcing per-standard competitor ratings directly.'
            }
          />
          <MetadataList columns={2}>
            <MetadataListItem label="Domains">{domains.length}</MetadataListItem>
            <MetadataListItem label="Standards tracked">{totalStandards}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>
      <Section padding={6}>
        <CrosswalkView domains={domains} />
      </Section>
    </Stack>
  );
}
```

- [ ] **Step 3: Build**

Run: `cd apps/ecosystem && npx next build 2>&1 | tail -60`
Expected: `Compiled successfully`, no TypeScript errors, `/crosswalk` listed as a
static route.

- [ ] **Step 4: Density check**

Run: `npm run check:density`
Expected: `check-render-density: PASS`.

- [ ] **Step 5: Manual browser check**

Open `/crosswalk`. Confirm: all 12 domains render, expanded by default
(Physician Assistant/Occupational Therapy/Nursing first); typing in the filter field
narrows the visible domain sections by name; switching the segmented control to
"Priority domains" narrows to exactly PA/OT/Nursing; clicking "Collapse all" closes
every domain section, "Expand all" reopens them all; each domain's table matches what
was previously embedded on `/lenses`.

---

## Task 4: Rewrite `/lenses` as a lightweight landing page

**Files:**
- Modify: `apps/ecosystem/app/lenses/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `getAccreditorTiers`, `getCompetitorLandscape`, `listCompetitors`,
  `sortDomainsByPriority` from `@/lib/content` (unchanged). `matchDisciplineMeta` from
  `@/lib/discipline-meta`. `ThreatDistributionChart` from
  `@/components/charts/threat-distribution-chart` (unchanged, reused). `Typeahead`,
  `createStaticSource`, `type SearchableItem` from `@astryxdesign/core/Typeahead`.
- Produces: the `/lenses` route content — this is the landing page linked from
  `app-nav.tsx`'s "Lenses" top link.

The domain-jump `Typeahead` needs client state (it's a controlled component) and a
`useRouter` navigation call on select, so it's a small separate client component; the
page itself stays a server component.

- [ ] **Step 1: Write the jump-to-domain client component**

Create `apps/ecosystem/components/domain-jump-search.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Typeahead, createStaticSource, type SearchableItem } from "@astryxdesign/core/Typeahead";

interface DomainItem extends SearchableItem {
  slug: string;
}

export function DomainJumpSearch({ domains }: { domains: { name: string; slug: string }[] }) {
  const router = useRouter();
  const [value, setValue] = useState<DomainItem | null>(null);
  const items: DomainItem[] = domains.map((d) => ({ id: d.slug, label: d.name, slug: d.slug }));
  const searchSource = createStaticSource(items);

  return (
    <Typeahead<DomainItem>
      label="Jump to a domain"
      placeholder="Type a domain name…"
      searchSource={searchSource}
      value={value}
      onChange={(item) => {
        if (item) router.push(`/domains/${item.slug}`);
        setValue(null);
      }}
      hasEntriesOnFocus
      width={320}
    />
  );
}
```

- [ ] **Step 2: Rewrite `app/lenses/page.tsx`**

```tsx
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { DomainJumpSearch } from "@/components/domain-jump-search";
import { ThreatDistributionChart } from "@/components/charts/threat-distribution-chart";
import { getAccreditorTiers, getCompetitorLandscape, listCompetitors, sortDomainsByPriority } from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

export default function LensesPage() {
  const tiers = getAccreditorTiers();
  const landscape = getCompetitorLandscape();
  const competitors = listCompetitors();
  const domains = sortDomainsByPriority(tiers?.domains ?? [], (d) => d.domain);
  const highThreatCount =
    landscape?.domains.reduce((sum, d) => sum + d.competitors.filter((c) => c.threat === "high").length, 0) ?? 0;

  const jumpItems = domains.map((d) => ({
    name: d.domain,
    slug: matchDisciplineMeta(d.domain)?.slug ?? d.domain,
  }));

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Strategy"
            title="Lenses"
            description="Two ways into the same cross-mapped research: Wilson's standards × competitor crosswalk, or a per-domain deep dive. PA, OT, and Nursing lead everywhere — where Prism already has real footing."
          />
          <DomainJumpSearch domains={jumpItems} />
          <MetadataList columns={3}>
            <MetadataListItem label="Domains">{domains.length}</MetadataListItem>
            <MetadataListItem label="Competitors researched">{competitors.length}</MetadataListItem>
            <MetadataListItem label="High-threat entries">{highThreatCount}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <ThreatDistributionChart
          rows={(landscape?.domains ?? []).flatMap((d) => d.competitors.map((c) => ({ domain: d.domain, threat: c.threat })))}
        />
      </Section>

      <Section padding={6}>
        <Grid columns={{ minWidth: 320 }} gap={4}>
          <ClickableCard href="/crosswalk" label="Standards × Competitor Crosswalk" padding={4}>
            <Stack gap={3}>
              <Stack direction="horizontal" gap={2} vAlign="center">
                <Icon icon="success" size="md" color="secondary" />
                <Heading level={3}>Standards × Competitor Crosswalk</Heading>
              </Stack>
              <Text type="body" color="secondary" maxLines={3}>
                Wilson's own ask: every accreditation standard, Prism's real fit, and
                space for how each competitor stacks up.
              </Text>
            </Stack>
          </ClickableCard>
          <ClickableCard href="/domains" label="Domains" padding={4}>
            <Stack gap={3}>
              <Stack direction="horizontal" gap={2} vAlign="center">
                <Icon icon="viewColumns" size="md" color="secondary" />
                <Heading level={3}>Domains</Heading>
              </Stack>
              <Text type="body" color="secondary" maxLines={3}>
                One page per domain — accreditor structure, competitor landscape,
                feature comparison, and standards crosswalk, all in one scroll.
              </Text>
            </Stack>
          </ClickableCard>
        </Grid>
      </Section>
    </Stack>
  );
}
```

- [ ] **Step 3: Build**

Run: `cd apps/ecosystem && npx next build 2>&1 | tail -60`
Expected: `Compiled successfully`, no TypeScript errors.

- [ ] **Step 4: Density check**

Run: `npm run check:density`
Expected: `check-render-density: PASS`.

- [ ] **Step 5: Manual browser check**

Open `/lenses`. Confirm: no accordion, no embedded grid — just the header, the domain
jump search, the aggregate stats, the threat chart, and 2 cards. Type a domain name
into the jump search and select it; confirm it navigates to `/domains/[slug]`. Click
each card and confirm it lands on `/crosswalk` and `/domains` respectively.

---

## Task 5: Update navigation

**Files:**
- Modify: `apps/ecosystem/components/app-nav.tsx`

**Interfaces:**
- Consumes: nothing new — `SECTIONS` is a local array already in this file.
- Produces: nav links to all 3 pages.

- [ ] **Step 1: Edit the "Lenses" section**

Find this line in `SECTIONS`:

```tsx
  { title: "Lenses", items: [{ href: "/lenses", label: "Lenses" }] },
```

Replace with:

```tsx
  {
    title: "Lenses",
    items: [
      { href: "/lenses", label: "Lenses" },
      { href: "/crosswalk", label: "Crosswalk" },
      { href: "/domains", label: "Domains" },
    ],
  },
```

- [ ] **Step 2: Build**

Run: `cd apps/ecosystem && npx next build 2>&1 | tail -60`
Expected: `Compiled successfully`.

- [ ] **Step 3: Manual browser check**

Confirm the left nav's "Lenses" section shows 3 links (Lenses, Crosswalk, Domains),
each navigating correctly, and the active-link highlighting matches whichever page is
open (the existing `isSelected` logic in this file already handles exact-vs-prefix
matching correctly for these routes — no changes needed there).

---

## Task 6: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Repo-root content density check**

Run (from the repo root, not `apps/ecosystem`): `python3 scripts/check_content_density.py 2>&1 | tail -10`
Expected: same pre-existing count of `FAIL`s as before this plan started (31, per the
prior session's verified baseline) — this plan touches no `content/` files, so the
count must not change.

- [ ] **Step 2: Full production build**

Run: `cd apps/ecosystem && npx next build 2>&1 | tail -80`
Expected: `Compiled successfully`, zero TypeScript errors, and the route table lists
`/lenses`, `/crosswalk`, `/domains`, and `/domains/[slug]` (13 static paths) all as
`○`/`●` prerendered routes.

- [ ] **Step 3: Render density check**

Run: `npm run check:density`
Expected: `check-render-density: PASS`.

- [ ] **Step 4: End-to-end browser walkthrough**

Restart the dev server clean (kill anything on port 3000, `rm -rf .next`, `npx next dev -p 3000`, wait for `Ready`) and check, in order:
1. `/lenses` — landing only, jump search works, both cards link correctly.
2. `/crosswalk` — toolbar filter/scope/expand-all/collapse-all all work; grid content
   matches what was previously on `/lenses`.
3. `/domains` — `TreeList` renders all 13, PA/OT/Nursing first, each row links to its
   `/domains/[slug]`.
4. `/domains/pa` (or any domain) — full hub content unchanged, competitor section now
   renders via `List`/`ListItem` with identical visible content.
5. Confirm no page anywhere still references the old `/lenses` accordion or embedded
   crosswalk markup (both were replaced, not duplicated).
