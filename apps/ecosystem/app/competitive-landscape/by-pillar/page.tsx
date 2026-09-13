import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { StatusIcon } from "@/components/feature-status";
import { FeatureMapHeatmap } from "@/components/charts/feature-map-heatmap";
import { FeatureMapTabs } from "@/components/feature-map-tabs";
import { DomainFilterNotice, resolveDomainFilter } from "@/components/competitive-landscape-filter";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import { listFeatureMaps, type FeatureMapStatus } from "@/lib/content";

const LEGEND: { status: FeatureMapStatus; label: string; desc: string }[] = [
  { status: "leading", label: "Prism leads", desc: "Real, shipped Prism capability nobody else matches." },
  { status: "behind", label: "Competitor leads", desc: "A named competitor ships something Prism doesn't." },
  { status: "opportunity", label: "Whitespace opportunity", desc: "Nobody — including Prism — has built this yet." },
];

// The by-pillar pivot of /competitive-landscape — one pillar, every competitor,
// per domain. Was /feature-map (now a permanent redirect here, see
// next.config.ts). Its sibling pivot, ../page.tsx, slices the same market by
// competitor instead.
export default async function CompetitiveLandscapeByPillarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const filter = resolveDomainFilter(query.domain);

  // Matched on the feature map's own `domain` field rather than through
  // accreditor-tiers: these four files ARE the domain axis of this pivot, so the
  // slug comparison that decides which of them survives belongs against their own
  // label. resolveDomainFilter still gates it, so an unknown slug never silently
  // empties the page.
  const all = listFeatureMaps();
  const featureMaps = filter ? all.filter((fm) => matchDisciplineMeta(fm.domain)?.slug === filter.slug) : all;

  const counts = { leading: 0, behind: 0, opportunity: 0 };
  for (const fm of featureMaps) for (const p of fm.pillars) counts[p.status] += 1;
  // Computed, never hardcoded: this denominator was the literal "24" when the page
  // only ever rendered all four domains. A domain filter makes that number wrong on
  // sight, and a fifth feature-map file would have made it wrong silently.
  const totalCells = featureMaps.reduce((n, fm) => n + fm.pillars.length, 0);

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          {/* No eyebrow — the layout's breadcrumb states the trail above the pivots. */}
          <PageHeader
            title={
              filter
                ? `${filter.domain}: ${totalCells} pillar cells — where Prism leads, where a competitor leads, and where nobody has built it yet`
                : `${totalCells} pillar × domain cells — where Prism leads, where a competitor leads, and where nobody has built it yet`
            }
            description="Every Prism pillar, judged per domain against the strongest competitor evidence found. Colors read the same everywhere on this page: green = Prism's win, red = a named competitor's win, blue = open ground."
          />
          {filter ? (
            <DomainFilterNotice filter={filter} clearHref="/competitive-landscape/by-pillar" />
          ) : null}
          {totalCells > 0 ? (
            <>
              <Takeaway title="Whitespace outnumbers head-to-head losses">
                {counts.opportunity} of {totalCells} cells are genuine whitespace — nobody has built it, including the
                named incumbents. That&apos;s the highest-leverage list on this site: features worth building because the
                market hasn&apos;t decided a winner yet, not because Prism is catching up.
              </Takeaway>
              <MetadataList columns={3}>
                <MetadataListItem label="Prism leads">{counts.leading} / {totalCells}</MetadataListItem>
                <MetadataListItem label="Competitor leads">{counts.behind} / {totalCells}</MetadataListItem>
                <MetadataListItem label="Whitespace opportunity">{counts.opportunity} / {totalCells}</MetadataListItem>
              </MetadataList>
            </>
          ) : null}
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Heading level={2}>How to read this</Heading>
          <Stack direction="horizontal" gap={5} wrap="wrap">
            {LEGEND.map((l) => (
              <Stack key={l.status} direction="horizontal" gap={2} vAlign="start" maxWidth={280}>
                <StatusIcon status={l.status} />
                <Stack gap={0.5}>
                  <Text type="body" weight="semibold">
                    {l.label}
                  </Text>
                  <Text type="supporting" size="xsm">
                    {l.desc}
                  </Text>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Heading level={2}>
            {filter ? `${filter.domain} at a glance` : `All ${all.length} domains at a glance`}
          </Heading>
          {featureMaps.length ? (
            // Keyed for the same reason as the by-competitor pivot's depth chart:
            // PlotFigure draws once inside an empty-dep useEffect, so a surviving
            // instance would keep the previous filter's cells.
            <FeatureMapHeatmap key={filter?.slug ?? "all"} featureMaps={featureMaps} />
          ) : (
            <EmptyState
              title="No feature map for this domain yet"
              description="This isn't a gap in the grid — it's the honest current state of research for this domain."
            />
          )}
        </Stack>
      </Section>

      <Section padding={6}>
        <Stack gap={3}>
          <Stack gap={1}>
            <Heading level={2}>Per-domain detail</Heading>
            <Text type="supporting">Pick a domain — each pillar shows who leads, why, and the specific opportunity.</Text>
          </Stack>
          {featureMaps.length ? (
            // Keyed for a different reason than the charts above: FeatureMapTabs seeds
            // its selected-tab useState from featureMaps[0] on mount only, so after a
            // filter change the retained state names a domain no longer in the list and
            // its `active` lookup finds nothing — an empty panel under a live tab bar.
            <FeatureMapTabs key={filter?.slug ?? "all"} featureMaps={featureMaps} />
          ) : (
            <EmptyState title="No feature map for this domain yet" />
          )}
        </Stack>
      </Section>
    </Stack>
  );
}
