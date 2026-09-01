import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Badge } from "@astryxdesign/core/Badge";
import { List, ListItem } from "@astryxdesign/core/List";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { DisciplineChip } from "@/components/discipline-chip";
import { DomainJumpSearch } from "@/components/domain-jump-search";
import { ThreatDistributionChart } from "@/components/charts/threat-distribution-chart";
import {
  getAccreditorTiers,
  getCompetitorLandscape,
  getStandardsCrosswalkForDomain,
  listCompetitors,
  sortDomainsByPriority,
} from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

export default function DomainsIndexPage() {
  const tierDomains = sortDomainsByPriority(getAccreditorTiers()?.domains ?? [], (d) => d.domain);
  const landscape = getCompetitorLandscape();
  const competitors = listCompetitors();
  const highThreatCount =
    landscape?.domains.reduce((sum, d) => sum + d.competitors.filter((c) => c.threat === "high").length, 0) ?? 0;

  // Defensive filter, not a Counseling-specific exclusion — Counseling now resolves
  // via lib/discipline-meta.ts and gets a real route. Kept in case any future
  // accreditor-tiers.yaml entry is added ahead of its discipline-meta.ts entry, so it
  // doesn't render as a dead link before that follow-up lands.
  const domainsWithMeta = tierDomains
    .map((d) => ({ entry: d, meta: matchDisciplineMeta(d.domain) }))
    .filter((x): x is { entry: typeof x.entry; meta: NonNullable<typeof x.meta> } => x.meta !== null);

  const jumpItems = domainsWithMeta.map(({ entry, meta }) => ({ name: entry.domain, slug: meta.slug }));

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
        <Stack gap={5}>
          <PageHeader
            eyebrow="Market"
            title="Domains"
            description="Every tracked discipline, PA/OT/Nursing first. Open one for its full accreditor structure, standards, competitors, and persona — one hub, four tabs."
          />
          <DomainJumpSearch domains={jumpItems} />
          <MetadataList columns={3}>
            <MetadataListItem label="Domains">{domainsWithMeta.length}</MetadataListItem>
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
