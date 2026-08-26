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
        <CrosswalkView domains={domains} priorityDomains={PRIORITY_DOMAINS} />
      </Section>
    </Stack>
  );
}
