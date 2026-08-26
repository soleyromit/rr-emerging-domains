import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { PageHeader } from "@/components/page-header";
import { DomainHubSections } from "@/components/domain-hub-sections";
import { getAccreditorTiers, getDomainHubData } from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

export function generateStaticParams() {
  const domains = getAccreditorTiers()?.domains ?? [];
  return domains
    .map((d) => matchDisciplineMeta(d.domain)?.slug)
    .filter((slug): slug is string => !!slug)
    .map((slug) => ({ slug }));
}

export default async function DomainPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Breadcrumbs>
            <BreadcrumbItem href="/lenses">Lenses</BreadcrumbItem>
            <BreadcrumbItem href="/domains">Domains</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{entry.domain}</BreadcrumbItem>
          </Breadcrumbs>
          <PageHeader
            eyebrow="Domain"
            title={entry.domain}
            description="Accreditor structure, competitor landscape, feature comparison, and standards crosswalk — everything about this domain, one scroll, no tabs."
          />
        </Stack>
      </Section>

      <Section padding={6}>
        <DomainHubSections domain={entry.domain} data={getDomainHubData(entry.domain)} />
      </Section>
    </Stack>
  );
}
