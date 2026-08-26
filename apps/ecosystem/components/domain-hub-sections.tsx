"use client";

import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Icon } from "@astryxdesign/core/Icon";
import { Badge } from "@astryxdesign/core/Badge";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { Link } from "@astryxdesign/core/Link";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { DisciplineChip } from "@/components/discipline-chip";
import { SentenceList } from "@/components/sentence-list";
import { FieldBlock } from "@/components/field-block";
import { DepthBadge, ThreatBadge } from "@/components/fit-badge";
import { FeatureDepthChart } from "@/components/charts/feature-depth-chart";
import { StandardsCrosswalkTable } from "@/components/standards-crosswalk-table";
import { humanizeSourceRef, stripFileCitations } from "@/lib/strip-file-citations";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import type { FeatureComparisonCell, DomainHubData } from "@/lib/content";

const STATE_VARIATION_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  confirmed: "warning",
  unconfirmed: "neutral",
  false: "success",
};

const STATE_VARIATION_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  unconfirmed: "Unconfirmed",
  false: "None",
};

const EXPANSION_DOMAIN_SLUGS = new Set(["do", "pharmacy", "dentistry", "medicine"]);

const VISIBLE_COMPETITOR_COUNT = 4;

interface FeatureRow extends Record<string, unknown> {
  _id: string;
  pillar: string;
  cells: FeatureComparisonCell[];
}

// The shared building block behind both /domains/[slug] (one page per domain) and
// /lenses (every domain as a collapsible section on one page) — see the 2026-08-26
// "not impressed with the architecture" feedback: everything about one domain now
// renders as plain stacked sections with inline expand, not a tab+rail+cross-link
// chain. No "use client" here — Collapsible/FieldBlock are themselves client
// components and compose fine into a server tree.
export function DomainHubSections({ domain, data }: { domain: string; data: DomainHubData }) {
  const { tierEntry, landscapeEntry, featureComparison, standardsCrosswalk } = data;

  if (!tierEntry) return <EmptyState title={`No lens data yet for ${domain}`} />;

  const slug = matchDisciplineMeta(domain)?.slug;
  const featureRows: FeatureRow[] = featureComparison.rows.map((r) => ({
    _id: r.pillar,
    pillar: r.pillar,
    cells: r.cells,
  }));
  const visibleCompetitors = landscapeEntry?.competitors.slice(0, VISIBLE_COMPETITOR_COUNT) ?? [];
  const overflowCompetitors = landscapeEntry?.competitors.slice(VISIBLE_COMPETITOR_COUNT) ?? [];

  return (
    <Stack gap={6}>
      <Stack direction="horizontal" gap={2} vAlign="center">
        <DisciplineChip subject={domain} />
        <Text type="body" weight="semibold" size="lg">
          {domain}
        </Text>
      </Stack>

      <MetadataList columns={4}>
        <MetadataListItem label="Programmatic accreditor">{tierEntry.programmatic_accreditor}</MetadataListItem>
        <MetadataListItem label="Competitors active">{landscapeEntry?.competitors.length ?? 0}</MetadataListItem>
        <MetadataListItem label="Standards tracked">{standardsCrosswalk?.rows.length ?? 0}</MetadataListItem>
        <MetadataListItem label="Feature pillars rated">{featureComparison.rows.length}</MetadataListItem>
      </MetadataList>

      <Divider />

      {/* Accreditor structure */}
      <Stack gap={3}>
        <Text type="label" color="secondary" size="sm">
          Accreditor structure
        </Text>
        <Stack direction="horizontal" gap={6} wrap="wrap">
          <Stack gap={1}>
            <Text type="label" color="secondary" size="xsm">
              Regional layer
            </Text>
            <Tooltip
              content={
                tierEntry.regional_accreditor
                  ? "Confirmed: a genuine regional accreditor tier on top of the programmatic one."
                  : "No regional accreditor tier confirmed for this domain."
              }
            >
              <Stack direction="horizontal" gap={1.5} vAlign="center">
                <Icon
                  icon={tierEntry.regional_accreditor ? "success" : "close"}
                  size="sm"
                  color={tierEntry.regional_accreditor ? undefined : "secondary"}
                />
                <Text type="supporting" size="sm">
                  {tierEntry.regional_accreditor ? "Yes" : "No"}
                </Text>
              </Stack>
            </Tooltip>
          </Stack>
          <Stack gap={1}>
            <Text type="label" color="secondary" size="xsm">
              State variation
            </Text>
            <Badge
              variant={STATE_VARIATION_VARIANT[tierEntry.state_licensure_variation] ?? "neutral"}
              label={STATE_VARIATION_LABEL[tierEntry.state_licensure_variation] ?? tierEntry.state_licensure_variation}
            />
          </Stack>
        </Stack>
        {tierEntry.consortium_note ? (
          <FieldBlock label="Consortium structure" text={tierEntry.consortium_note} type="body" size="sm" maxLines={2} />
        ) : null}
        {tierEntry.notes ? <FieldBlock label="Notes" text={tierEntry.notes} type="body" size="sm" maxLines={2} /> : null}
        {tierEntry.sources?.length ? (
          <Stack gap={1}>
            <Text type="label" color="secondary" size="xsm">
              Sources
            </Text>
            <SentenceList items={tierEntry.sources.map(humanizeSourceRef)} maxLines={2} fallbackIcon="copy" />
          </Stack>
        ) : null}
      </Stack>

      <Divider />

      {/* Competitor landscape */}
      <Stack gap={3}>
        <Text type="label" color="secondary" size="sm">
          Competitor landscape
        </Text>
        {landscapeEntry?.note ? (
          <Text type="body" size="sm" color="secondary" maxLines={2}>
            {landscapeEntry.note}
          </Text>
        ) : null}
        {!landscapeEntry?.competitors.length ? (
          <EmptyState
            title="No researched competitors active in this domain yet"
            description="This isn't a gap in the table — it's the honest current state of research for this domain."
          />
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
                      <Text type="supporting" size="sm">
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
      </Stack>

      <Divider />

      {/* Feature comparison */}
      <Stack gap={3}>
        <Text type="label" color="secondary" size="sm">
          Feature comparison
        </Text>
        {featureComparison.competitors.length === 0 ? (
          <EmptyState
            title="No researched competitors active in this domain yet"
            description="This isn't a gap in the table — it's the honest current state of research for this domain."
          />
        ) : (
          <Stack gap={4}>
            <Table<FeatureRow>
              data={featureRows}
              idKey="_id"
              density="balanced"
              textOverflow="wrap"
              verticalAlign="top"
              columns={[
                {
                  key: "pillar",
                  header: "Pillar",
                  width: pixel(200),
                  renderCell: (row) => (
                    <Text type="body" weight="semibold" size="sm">
                      {row.pillar}
                    </Text>
                  ),
                },
                ...featureComparison.competitors.map((c) => ({
                  key: c.slug,
                  header: c.competitor,
                  width: proportional(1),
                  renderCell: (row: FeatureRow) => {
                    const cell = row.cells.find((cc) => cc.slug === c.slug);
                    if (!cell?.depth) return <Text type="supporting" color="secondary">—</Text>;
                    const hasDetail = !!(cell.capability || cell.evidence);
                    return (
                      <Stack gap={1.5}>
                        <DepthBadge depth={cell.depth} />
                        {hasDetail ? (
                          <Collapsible trigger="Detail" defaultIsOpen={false}>
                            <Stack gap={2}>
                              {cell.capability ? (
                                <FieldBlock
                                  label="Capability"
                                  text={stripFileCitations(cell.capability)}
                                  type="supporting"
                                  size="xsm"
                                  maxLines={4}
                                />
                              ) : null}
                              {cell.evidence ? (
                                <FieldBlock
                                  label="Evidence"
                                  text={stripFileCitations(cell.evidence)}
                                  type="supporting"
                                  size="xsm"
                                  maxLines={4}
                                />
                              ) : null}
                            </Stack>
                          </Collapsible>
                        ) : null}
                      </Stack>
                    );
                  },
                })),
              ]}
            />
            <FeatureDepthChart domain={featureComparison} />
          </Stack>
        )}
      </Stack>

      <Divider />

      {/* Standards crosswalk */}
      <Stack gap={3}>
        <Text type="label" color="secondary" size="sm">
          Standards crosswalk
        </Text>
        {standardsCrosswalk ? (
          <Text type="supporting" size="sm" color="secondary">
            Prism column is real, cited data. Competitor columns are placeholders —
            Wilson is sourcing per-standard competitor ratings directly.
          </Text>
        ) : null}
        <StandardsCrosswalkTable standardsCrosswalk={standardsCrosswalk} />
      </Stack>

      {slug && EXPANSION_DOMAIN_SLUGS.has(slug) ? (
        <>
          <Divider />
          <Link href={`/accreditation/${slug}`} size="sm" color="accent" hasUnderline>
            Full accreditation page for {domain} →
          </Link>
        </>
      ) : null}
    </Stack>
  );
}
