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
import { listFeatureMaps, type FeatureMapStatus } from "@/lib/content";

const LEGEND: { status: FeatureMapStatus; label: string; desc: string }[] = [
  { status: "leading", label: "Prism leads", desc: "Real, shipped Prism capability nobody else matches." },
  { status: "behind", label: "Competitor leads", desc: "A named competitor ships something Prism doesn't." },
  { status: "opportunity", label: "Whitespace opportunity", desc: "Nobody — including Prism — has built this yet." },
];

export default function FeatureMapPage() {
  const featureMaps = listFeatureMaps();

  const counts = { leading: 0, behind: 0, opportunity: 0 };
  for (const fm of featureMaps) for (const p of fm.pillars) counts[p.status] += 1;

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Market"
            title="24 pillar × domain cells — where Prism leads, where a competitor leads, and where nobody has built it yet"
            description="Every Prism pillar, judged per domain against the strongest competitor evidence found. Colors read the same everywhere on this page: green = Prism's win, red = a named competitor's win, blue = open ground."
          />
          <Takeaway title="Whitespace outnumbers head-to-head losses">
            {counts.opportunity} of 24 cells are genuine whitespace — nobody has built it, including the named
            incumbents. That's the highest-leverage list on this site: features worth building because the market
            hasn't decided a winner yet, not because Prism is catching up.
          </Takeaway>
          <MetadataList columns={3}>
            <MetadataListItem label="Prism leads">{counts.leading} / 24</MetadataListItem>
            <MetadataListItem label="Competitor leads">{counts.behind} / 24</MetadataListItem>
            <MetadataListItem label="Whitespace opportunity">{counts.opportunity} / 24</MetadataListItem>
          </MetadataList>
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
          <Heading level={2}>All four domains at a glance</Heading>
          {featureMaps.length ? (
            <FeatureMapHeatmap featureMaps={featureMaps} />
          ) : (
            <EmptyState title="No feature map yet" />
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
            <FeatureMapTabs featureMaps={featureMaps} />
          ) : (
            <EmptyState title="No feature map yet" description="content/feature-map/*.yaml has not been written." />
          )}
        </Stack>
      </Section>
    </Stack>
  );
}
