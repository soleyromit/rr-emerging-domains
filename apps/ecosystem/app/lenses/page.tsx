import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { DisciplineChip } from "@/components/discipline-chip";
import { DomainHubSections } from "@/components/domain-hub-sections";
import { StandardsCrosswalkTable } from "@/components/standards-crosswalk-table";
import { ThreatDistributionChart } from "@/components/charts/threat-distribution-chart";
import {
  getAccreditorTiers,
  getCompetitorLandscape,
  listCompetitors,
  listStandardsCrosswalkDomains,
  getStandardsCrosswalkForDomain,
  getDomainHubData,
  sortDomainsByPriority,
} from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

export default function LensesPage() {
  const tiers = getAccreditorTiers();
  const landscape = getCompetitorLandscape();
  const competitors = listCompetitors();
  const domains = sortDomainsByPriority(tiers?.domains ?? [], (d) => d.domain);

  const highThreatCount =
    landscape?.domains.reduce((sum, d) => sum + d.competitors.filter((c) => c.threat === "high").length, 0) ?? 0;
  const standardsDomains = listStandardsCrosswalkDomains()
    .map((d) => getStandardsCrosswalkForDomain(d))
    .filter((d): d is NonNullable<typeof d> => d != null);
  const totalStandards = standardsDomains.reduce((sum, d) => sum + d.rows.length, 0);

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Strategy"
            title="Every domain, standard, and competitor — cross-mapped, one page"
            description="Every domain below expands in place to show its full accreditor structure, competitor landscape, feature comparison, and standards crosswalk — no tabs, no side panel, no separate pages to click through. Leads with PA, OT, and Nursing — where Prism already has real footing — per Wilson's own priority (2026-08-26)."
          />
          <Takeaway title="Click any domain to expand it — several can be open at once">
            Nothing here is a new claim, only a new way to reach claims already made
            elsewhere in this repo. A competitor or accreditation page link inside a
            domain is the only place this ever navigates you away.
          </Takeaway>
          <MetadataList columns={4}>
            <MetadataListItem label="Domains">{domains.length}</MetadataListItem>
            <MetadataListItem label="Competitors researched">{competitors.length}</MetadataListItem>
            <MetadataListItem label="Standards tracked">{totalStandards}</MetadataListItem>
            <MetadataListItem label="High-threat entries">{highThreatCount}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <ThreatDistributionChart
          rows={(landscape?.domains ?? []).flatMap((d) => d.competitors.map((c) => ({ domain: d.domain, threat: c.threat })))}
        />
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Stack gap={2}>
            <PageHeader
              eyebrow="Wilson's crosswalk grid"
              title="Standards × competitor crosswalk"
              description={
                'Rows are individual accreditation standards, columns are Prism plus every ' +
                'competitor active in that domain — the exact shape Wilson asked for on the ' +
                '2026-08-26 call ("similar to what we have in the feature crosswalk grid... but ' +
                'with each of the standards"). Always visible below, not behind a click. Prism ' +
                'column is real, cited data; competitor columns show "Not yet researched" — Wilson ' +
                'is sourcing per-standard competitor ratings directly.'
              }
            />
          </Stack>
          <Stack gap={8}>
            {standardsDomains.map((d) => (
              <Stack key={d.domain} gap={3}>
                <Stack direction="horizontal" gap={2} vAlign="center">
                  <DisciplineChip subject={d.domain} />
                  <Text type="body" weight="semibold" size="base">
                    {d.domain}
                  </Text>
                  <Text type="supporting" size="sm" color="secondary">
                    {d.accreditor}
                  </Text>
                </Stack>
                <StandardsCrosswalkTable standardsCrosswalk={d} />
                <Divider />
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Section>

      <Section padding={6}>
        <PageHeader
          eyebrow="By domain"
          title="Full domain hub"
          description="Everything about one domain — accreditor structure, competitor landscape, feature comparison, and the same standards crosswalk above — in one expandable place."
        />
      </Section>

      <Section padding={6}>
        <CollapsibleGroup type="multiple" hasDividers density="spacious">
          {domains.map((d) => {
            const slug = matchDisciplineMeta(d.domain)?.slug ?? d.domain;
            return (
              <Collapsible
                key={d.domain}
                value={slug}
                defaultIsOpen={false}
                trigger={
                  <Stack direction="horizontal" gap={2} vAlign="center">
                    <DisciplineChip subject={d.domain} />
                    <Text type="body" weight="semibold" size="base">
                      {d.domain}
                    </Text>
                    <Text type="supporting" size="sm" color="secondary">
                      {d.programmatic_accreditor}
                    </Text>
                  </Stack>
                }
              >
                <DomainHubSections domain={d.domain} data={getDomainHubData(d.domain)} />
              </Collapsible>
            );
          })}
        </CollapsibleGroup>
      </Section>
    </Stack>
  );
}
