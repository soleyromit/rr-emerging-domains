import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Badge } from "@astryxdesign/core/Badge";
import { List, ListItem } from "@astryxdesign/core/List";
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

  // Only domains that resolve to real discipline metadata get a route — Counseling
  // has no accreditation data (see DOMAIN_TO_ACCREDITATION_SLUG in lib/content.ts) and
  // matchDisciplineMeta returns null for it, so generateStaticParams on
  // /domains/[slug] never builds a page for it. Filter it out here too, or it renders
  // as a dead link.
  const domainsWithMeta = tierDomains
    .map((d) => ({ entry: d, meta: matchDisciplineMeta(d.domain) }))
    .filter((x): x is { entry: typeof x.entry; meta: NonNullable<typeof x.meta> } => x.meta !== null);

  const items = domainsWithMeta.map(({ entry: d, meta }) => {
    const slug = meta.slug;
    const competitorCount = landscape?.domains.find((l) => l.domain === d.domain)?.competitors.length ?? 0;
    const standardsCount = getStandardsCrosswalkForDomain(d.domain)?.rows.length ?? 0;
    return {
      id: slug,
      label: d.domain,
      description: d.programmatic_accreditor,
      startContent: <DisciplineChip subject={d.domain} />,
      endContent: (
        <Stack direction="horizontal" gap={1.5}>
          <Badge variant="neutral" label={`${competitorCount} ${competitorCount === 1 ? "competitor" : "competitors"}`} />
          <Badge variant="neutral" label={`${standardsCount} ${standardsCount === 1 ? "standard" : "standards"}`} />
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
        <List hasDividers>
          {items.map((item) => (
            <ListItem
              key={item.id}
              label={item.label}
              description={item.description}
              startContent={item.startContent}
              endContent={item.endContent}
              href={item.href}
            />
          ))}
        </List>
      </Section>
    </Stack>
  );
}
