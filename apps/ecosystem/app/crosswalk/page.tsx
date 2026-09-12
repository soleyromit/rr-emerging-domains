import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { CrosswalkView } from "@/components/crosswalk-view";
import { CoverageGapsCallout } from "@/components/coverage-gaps-callout";
import {
  listStandardsCrosswalkDomains,
  getStandardsCrosswalkForDomain,
  listDissectionDomains,
  PRIORITY_DOMAINS,
} from "@/lib/content";

export default function CrosswalkPage() {
  const domains = listStandardsCrosswalkDomains()
    .map((d) => getStandardsCrosswalkForDomain(d))
    .filter((d): d is NonNullable<typeof d> => d != null);
  const totalStandards = domains.reduce((sum, d) => sum + d.rows.length, 0);
  const ratedCompetitorCells = domains.reduce((sum, d) => sum + d.ratedCompetitorCellCount, 0);
  const totalCompetitorCells = domains.reduce((sum, d) => sum + d.totalCompetitorCellCount, 0);
  // Which domains have a dissection manifest at all — derived, never a hardcoded list,
  // so the "Dissection map" link appears on a row the day that domain's manifest lands
  // and never advertises a six-question answer that does not exist. The row's existing
  // "View standards" link is unaffected.
  const dissectedSlugs = listDissectionDomains().map((d) => d.slug);

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
              "standards table (element-by-element, with competitor ratings) from the links on " +
              "its row — and, where the domain has been dissected, its topology map too."
            }
          />
          <MetadataList columns={3}>
            <MetadataListItem label="Domains">{domains.length}</MetadataListItem>
            <MetadataListItem label="Standards tracked">{totalStandards}</MetadataListItem>
            <MetadataListItem label="Competitor cells rated">
              {ratedCompetitorCells} / {totalCompetitorCells}
            </MetadataListItem>
          </MetadataList>
          {/* Compact form: the MetadataList directly above already carries the
              raw numbers, so this restates the coverage gap in one honest line
              rather than a second, louder tile beside it. */}
          <CoverageGapsCallout ratedCount={ratedCompetitorCells} totalCount={totalCompetitorCells} isCompact />
        </Stack>
      </Section>
      <Section padding={6}>
        <CrosswalkView domains={domains} priorityDomains={PRIORITY_DOMAINS} dissectedSlugs={dissectedSlugs} />
      </Section>
    </Stack>
  );
}
