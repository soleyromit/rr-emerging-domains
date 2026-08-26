import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Badge } from "@astryxdesign/core/Badge";
import { TreeList, type TreeListItemData } from "@astryxdesign/core/TreeList";
import { PageHeader } from "@/components/page-header";
import { DisciplineChip } from "@/components/discipline-chip";
import {
  getAccreditorTiers,
  getCompetitorLandscape,
  getStandardsCrosswalkForDomain,
  sortDomainsByPriority,
} from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

export default function DomainsIndexPage() {
  const tierDomains = sortDomainsByPriority(getAccreditorTiers()?.domains ?? [], (d) => d.domain);
  const landscape = getCompetitorLandscape();

  const items: TreeListItemData[] = tierDomains.map((d) => {
    const slug = matchDisciplineMeta(d.domain)?.slug ?? d.domain;
    const competitorCount = landscape?.domains.find((l) => l.domain === d.domain)?.competitors.length ?? 0;
    const standardsCount = getStandardsCrosswalkForDomain(d.domain)?.rows.length ?? 0;
    return {
      id: slug,
      label: d.domain,
      description: d.programmatic_accreditor,
      startContent: <DisciplineChip subject={d.domain} />,
      endContent: (
        <Stack direction="horizontal" gap={1.5}>
          <Badge variant="neutral" label={`${competitorCount} competitors`} />
          <Badge variant="neutral" label={`${standardsCount} standards`} />
        </Stack>
      ),
      href: `/domains/${slug}`,
    };
  });

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <PageHeader
          eyebrow="Lenses"
          title="Domains"
          description="Every tracked domain, PA/OT/Nursing first. Open one for its full accreditor structure, competitor landscape, feature comparison, and standards crosswalk."
        />
      </Section>
      <Section padding={6}>
        <TreeList items={items} density="balanced" header={<span>Domains</span>} />
      </Section>
    </Stack>
  );
}
