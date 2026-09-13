"use client";

import { useState } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { TextInput } from "@astryxdesign/core/TextInput";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import { Link } from "@astryxdesign/core/Link";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { DisciplineChip } from "@/components/discipline-chip";
import { CompetitorLogoStrip } from "@/components/competitor-logo";
import { FitBadge } from "@/components/fit-badge";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import type { StandardsCrosswalkForDomain } from "@/lib/content";

interface DomainRow extends Record<string, unknown> {
  _id: string;
  domain: StandardsCrosswalkForDomain;
}

// Wilson's original ask (2026-08-26 call) was a full per-standard × competitor grid,
// all domains at once. That grid still exists — one domain at a time, in full depth
// (Evidence/Software-Behavior/Gap-Notes + competitor ratings), on each domain hub's
// Standards tab (/domains/[slug]/standards). This page's job narrowed to comparing
// *across* domains at a glance and linking into the deep view — embedding all 12
// full tables here was the single biggest source of "too much vertical scroll."
export function CrosswalkView({
  domains,
  priorityDomains,
  dissectedSlugs = [],
}: {
  domains: StandardsCrosswalkForDomain[];
  priorityDomains: string[];
  /** Route slugs that have a dissection manifest — those rows get a second link into
   * the Dissection map. Passed in rather than derived here because the manifests are
   * read from content/ through node:fs, which this client component cannot do. */
  dissectedSlugs?: string[];
}) {
  const dissected = new Set(dissectedSlugs);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"priority" | "all">("all");

  const visible = domains.filter((d) => {
    if (scope === "priority" && !priorityDomains.includes(d.domain)) return false;
    if (query && !d.domain.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const rows: DomainRow[] = visible.map((d) => ({ _id: d.domain, domain: d }));

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
            hasClear
          />
        }
        endContent={
          <SegmentedControl label="Domain scope" value={scope} onChange={(v) => setScope(v as "priority" | "all")}>
            <SegmentedControlItem value="priority" label="Priority domains" />
            <SegmentedControlItem value="all" label={`All ${domains.length}`} />
          </SegmentedControl>
        }
      />

      {visible.length === 0 ? (
        <EmptyState title="No domains match that filter" description="Clear the filter or switch scope above." />
      ) : (
        <Table<DomainRow>
          data={rows}
          idKey="_id"
          density="balanced"
          textOverflow="wrap"
          verticalAlign="top"
          columns={[
            {
              key: "domain",
              header: "Domain",
              width: proportional(1.3),
              renderCell: (r) => (
                <Stack direction="horizontal" gap={2} vAlign="center">
                  <DisciplineChip subject={r.domain.domain} />
                  <Stack gap={0}>
                    <Text type="body" weight="semibold">
                      {r.domain.domain}
                    </Text>
                    <Text type="supporting" color="secondary">
                      {r.domain.accreditor}
                    </Text>
                  </Stack>
                </Stack>
              ),
            },
            {
              key: "standards",
              header: "Standards",
              width: pixel(110),
              renderCell: (r) => <Text type="body">{r.domain.rows.length}</Text>,
            },
            {
              key: "fit",
              header: "Prism fit",
              width: pixel(220),
              renderCell: (r) => {
                // Build is a real `prism_fit` value, not a hypothetical: CAEP rates 1
                // element Build and COA rates 2. Without a bucket for it those rows
                // silently dropped elements — the "Standards" column said 14 while the
                // badges beside it summed to 13 and 12 — so this tally now covers the
                // SAME four-value vocabulary FitBadge's own FIT_VARIANT maps
                // (transfer/configure/build/gap), and the badge labels reuse those
                // exact words so the fit language is spelled once, not twice.
                const counts = { Transfer: 0, Configure: 0, Build: 0, Gap: 0 };
                for (const row of r.domain.rows) {
                  const fit = (row.prism_fit ?? "").toLowerCase();
                  if (fit.includes("transfer")) counts.Transfer += 1;
                  else if (fit.includes("configure")) counts.Configure += 1;
                  else if (fit.includes("build")) counts.Build += 1;
                  else if (fit.includes("gap")) counts.Gap += 1;
                }
                return (
                  <Stack direction="horizontal" gap={1} wrap="wrap">
                    {counts.Transfer ? <FitBadge fit={`Transfer (${counts.Transfer})`} /> : null}
                    {counts.Configure ? <FitBadge fit={`Configure (${counts.Configure})`} /> : null}
                    {counts.Build ? <FitBadge fit={`Build (${counts.Build})`} /> : null}
                    {counts.Gap ? <FitBadge fit={`Gap (${counts.Gap})`} /> : null}
                  </Stack>
                );
              },
            },
            {
              key: "competitor_logos",
              header: "Competitors",
              width: pixel(180),
              renderCell: (r) =>
                r.domain.competitors.length ? (
                  <CompetitorLogoStrip competitors={r.domain.competitors} />
                ) : (
                  <Text type="body" color="secondary">
                    None researched
                  </Text>
                ),
            },
            {
              key: "competitors",
              header: "Cells rated",
              width: pixel(130),
              renderCell: (r) => (
                <Text type="body">
                  {r.domain.ratedCompetitorCellCount} / {r.domain.totalCompetitorCellCount}
                </Text>
              ),
            },
            {
              key: "link",
              header: "",
              // 175px, not the 140 one link needed: the second link's label is the
              // longer of the two, and at 140 it wrapped onto a third line.
              width: pixel(175),
              renderCell: (r) => {
                const slug = matchDisciplineMeta(r.domain.domain)?.slug;
                if (!slug) return null;
                return (
                  // Stacked, not side by side — two accent links on one line in a
                  // 175px cell read as one wrapped phrase rather than two destinations.
                  <Stack gap={1}>
                    <Link href={`/domains/${slug}/standards`} color="accent" hasUnderline>
                      View standards →
                    </Link>
                    {/* Only for a domain that really has a manifest: the other rows'
                        Dissection tab is an honest "not dissected yet" state, and a
                        link column advertising a map that has no nodes is the dead end
                        this page's linking rule exists to avoid. */}
                    {dissected.has(slug) ? (
                      <Link href={`/domains/${slug}/dissect`} color="accent" hasUnderline>
                        Dissection map →
                      </Link>
                    ) : null}
                  </Stack>
                );
              },
            },
          ]}
        />
      )}
    </Stack>
  );
}
