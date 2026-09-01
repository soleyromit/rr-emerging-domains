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
}: {
  domains: StandardsCrosswalkForDomain[];
  priorityDomains: string[];
}) {
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
                const counts = { Transfer: 0, Configure: 0, Gap: 0 };
                for (const row of r.domain.rows) {
                  const fit = (row.prism_fit ?? "").toLowerCase();
                  if (fit.includes("transfer")) counts.Transfer += 1;
                  else if (fit.includes("configure")) counts.Configure += 1;
                  else if (fit.includes("gap")) counts.Gap += 1;
                }
                return (
                  <Stack direction="horizontal" gap={1} wrap="wrap">
                    {counts.Transfer ? <FitBadge fit={`Transfer (${counts.Transfer})`} /> : null}
                    {counts.Configure ? <FitBadge fit={`Configure (${counts.Configure})`} /> : null}
                    {counts.Gap ? <FitBadge fit={`Gap (${counts.Gap})`} /> : null}
                  </Stack>
                );
              },
            },
            {
              key: "competitors",
              header: "Competitor cells rated",
              width: pixel(160),
              renderCell: (r) => (
                <Text type="body">
                  {r.domain.ratedCompetitorCellCount} / {r.domain.totalCompetitorCellCount}
                </Text>
              ),
            },
            {
              key: "link",
              header: "",
              width: pixel(140),
              renderCell: (r) => {
                const slug = matchDisciplineMeta(r.domain.domain)?.slug;
                return slug ? (
                  <Link href={`/domains/${slug}/standards`} color="accent" hasUnderline>
                    View standards →
                  </Link>
                ) : null;
              },
            },
          ]}
        />
      )}
    </Stack>
  );
}
