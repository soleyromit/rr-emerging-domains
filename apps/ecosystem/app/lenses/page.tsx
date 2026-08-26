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

  // Only domains that resolve to real discipline metadata get a route — Counseling
  // has no accreditation data and matchDisciplineMeta returns null for it, so
  // /domains/[slug] never builds a page for it. Filter it out before it can appear
  // as a jump-search result that leads to a 404.
  const jumpItems = domains
    .map((d) => ({ name: d.domain, meta: matchDisciplineMeta(d.domain) }))
    .filter((d): d is { name: string; meta: NonNullable<typeof d.meta> } => d.meta !== null)
    .map((d) => ({ name: d.name, slug: d.meta.slug }));

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
                <Icon icon="funnel" size="md" color="secondary" />
                <Heading level={2}>Standards × Competitor Crosswalk</Heading>
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
                <Heading level={2}>Domains</Heading>
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
