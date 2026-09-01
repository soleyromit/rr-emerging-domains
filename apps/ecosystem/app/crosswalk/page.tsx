import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { CrosswalkView } from "@/components/crosswalk-view";
import { listStandardsCrosswalkDomains, getStandardsCrosswalkForDomain, PRIORITY_DOMAINS } from "@/lib/content";

export default function CrosswalkPage() {
  const domains = listStandardsCrosswalkDomains()
    .map((d) => getStandardsCrosswalkForDomain(d))
    .filter((d): d is NonNullable<typeof d> => d != null);
  const totalStandards = domains.reduce((sum, d) => sum + d.rows.length, 0);
  const ratedCompetitorCells = domains.reduce((sum, d) => sum + d.ratedCompetitorCellCount, 0);
  const totalCompetitorCells = domains.reduce((sum, d) => sum + d.totalCompetitorCellCount, 0);

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Market"
            title="Standards crosswalk"
            description={
              "Every domain's accreditation-standards coverage at a glance — Prism fit " +
              "distribution and how much competitor research is done. Open a domain's full " +
              "standards table (element-by-element, with competitor ratings) from the link on " +
              "its row."
            }
          />
          <MetadataList columns={3}>
            <MetadataListItem label="Domains">{domains.length}</MetadataListItem>
            <MetadataListItem label="Standards tracked">{totalStandards}</MetadataListItem>
            <MetadataListItem label="Competitor cells rated">
              {ratedCompetitorCells} / {totalCompetitorCells}
            </MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>
      <Section padding={6}>
        <CrosswalkView domains={domains} priorityDomains={PRIORITY_DOMAINS} />
      </Section>
    </Stack>
  );
}
