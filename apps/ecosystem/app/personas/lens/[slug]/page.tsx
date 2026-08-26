import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { ComparisonCardGrid } from "@/components/comparison-card-grid";
import { SentenceList, type SentenceListItem } from "@/components/sentence-list";
import {
  listCompetitorLensPersonas,
  getCompetitorLensPersona,
  listRolePersonas,
  roleNameMatches,
  resolveRelatedFlows,
} from "@/lib/content";

export function generateStaticParams() {
  return listCompetitorLensPersonas().map((l) => ({ slug: l.slug }));
}

export default async function CompetitorLensPersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lens = getCompetitorLensPersona(slug);
  if (!lens) notFound();

  // lens role names are the short form ("Dean"); role-*.yaml's role_name is the
  // long form ("Dean / Program Director") — see roleNameMatches for why this
  // isn't an exact match.
  const rolePersonas = listRolePersonas();
  const findRoleSlug = (shortName: string) =>
    rolePersonas.find((r) => roleNameMatches(shortName, r.role_name))?.slug;

  const gapItems: SentenceListItem[] = (lens.gaps_prism_can_exploit ?? []).map((g) =>
    typeof g === "string"
      ? g
      : { text: g.claim, relatedFlows: resolveRelatedFlows(g.related_flows) }
  );

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Breadcrumbs>
            <BreadcrumbItem href="/personas">Personas</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{lens.competitor}</BreadcrumbItem>
          </Breadcrumbs>
          <PageHeader eyebrow="Competitor lens" title={lens.competitor} />
          <MetadataList columns={2}>
            <MetadataListItem label="Roles profiled">{lens.how_they_implicitly_serve_roles?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Exploitable gaps">{lens.gaps_prism_can_exploit?.length ?? 0}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      {lens.how_they_implicitly_serve_roles?.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={3}>
            <Text type="label" color="secondary">
              How {lens.competitor} implicitly serves each role
            </Text>
            <ComparisonCardGrid
              items={lens.how_they_implicitly_serve_roles.map((r) => {
                const roleSlug = findRoleSlug(r.role);
                return {
                  key: r.role,
                  label: roleSlug ? (
                    <Link href={`/personas/role/${roleSlug}`} type="body" weight="semibold" color="accent" hasUnderline>
                      {r.role}
                    </Link>
                  ) : (
                    <Text type="body" weight="semibold">
                      {r.role}
                    </Text>
                  ),
                  text: r.read,
                  relatedFlows: resolveRelatedFlows(r.related_flows),
                };
              })}
            />
          </Stack>
        </Section>
      ) : null}

      {lens.gaps_prism_can_exploit?.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={2}>
            <Text type="label" color="secondary">
              Gaps Prism can exploit ({lens.gaps_prism_can_exploit.length})
            </Text>
            <SentenceList items={gapItems} maxLines={3} fallbackIcon="funnel" />
          </Stack>
        </Section>
      ) : null}

      {lens.sources?.length ? (
        <Section padding={6}>
          <Collapsible defaultIsOpen={false} trigger={`Sources (${lens.sources.length})`}>
            <SentenceList items={lens.sources} maxLines={2} fallbackIcon="copy" />
          </Collapsible>
        </Section>
      ) : null}
    </Stack>
  );
}
