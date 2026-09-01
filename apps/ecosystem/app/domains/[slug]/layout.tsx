import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { PageHeader } from "@/components/page-header";
import { DisciplineChip } from "@/components/discipline-chip";
import { DomainHubTabs } from "@/components/domain-hub-tabs";
import { getAccreditorTiers } from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

// Single hub per discipline: accreditor structure, full standards table, competitor
// landscape, and discipline persona all live under this one route as sibling tabs
// (page.tsx = Overview, standards/, competitors/, persona/) instead of four
// separate pages (/domains/[slug], /accreditation/[domain], /crosswalk's embedded
// view, /personas/discipline/[slug]) that duplicated and never cross-linked each
// other. generateStaticParams lives here once — Next.js propagates it to every
// sibling page nested under this dynamic segment.
export function generateStaticParams() {
  const domains = getAccreditorTiers()?.domains ?? [];
  return domains
    .map((d) => matchDisciplineMeta(d.domain)?.slug)
    .filter((slug): slug is string => !!slug)
    .map((slug) => ({ slug }));
}

export default async function DomainHubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Breadcrumbs>
            <BreadcrumbItem href="/domains">Domains</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{entry.domain}</BreadcrumbItem>
          </Breadcrumbs>
          <Stack direction="horizontal" gap={2} vAlign="center">
            <DisciplineChip subject={entry.domain} />
            <PageHeader
              eyebrow="Domain"
              title={entry.domain}
              description="Accreditor structure, standards, competitors, and persona — everything about this domain in one place."
            />
          </Stack>
          <DomainHubTabs slug={slug} />
        </Stack>
      </Section>
      {children}
    </Stack>
  );
}
