import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { List, ListItem } from "@astryxdesign/core/List";
import { Link } from "@astryxdesign/core/Link";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { CompetitorCompanyFacts } from "@/components/competitor-company-facts";
import { CompetitorProsCons } from "@/components/competitor-pros-cons";
import { CompetitorFeatureDossier } from "@/components/competitor-feature-dossier";
import { CompetitorDepthChart } from "@/components/charts/competitor-depth-chart";
import { ComparisonCardGrid } from "@/components/comparison-card-grid";
import { SentenceList, type SentenceListItem } from "@/components/sentence-list";
import { DisciplineChip } from "@/components/discipline-chip";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import {
  listCompetitors,
  getCompetitor,
  getCompetitorLensPersona,
  listRolePersonas,
  roleNameMatches,
  resolveRelatedFlows,
} from "@/lib/content";

export function generateStaticParams() {
  return listCompetitors().map((c) => ({ slug: c.slug }));
}

export default async function CompetitorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) notFound();

  // Competitor "lens" content — how this competitor implicitly serves each role,
  // and where Prism can exploit a gap. Merged in from the retired /personas/lens
  // pages so "lens" no longer needs to exist as a separate, confusingly-named page.
  const lens = getCompetitorLensPersona(slug);
  const rolePersonas = listRolePersonas();
  const findRoleSlug = (shortName: string) =>
    rolePersonas.find((r) => roleNameMatches(shortName, r.role_name))?.slug;
  const gapItems: SentenceListItem[] = (lens?.gaps_prism_can_exploit ?? []).map((g) =>
    typeof g === "string" ? g : { text: g.claim, relatedFlows: resolveRelatedFlows(g.related_flows) }
  );

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Breadcrumbs>
            <BreadcrumbItem href="/competitors">Competitors</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{competitor.competitor}</BreadcrumbItem>
          </Breadcrumbs>
          <PageHeader
            eyebrow={(competitor.domains_served ?? []).join(" · ")}
            title={competitor.competitor}
            description={competitor.category}
          />
          {competitor.domains_served?.length ? (
            <Stack gap={1}>
              <Text type="label" color="secondary" size="xsm">
                Compared in
              </Text>
              <Stack direction="horizontal" gap={1.5} wrap="wrap">
                {competitor.domains_served.map((d) => {
                  const routeSlug = matchDisciplineMeta(d)?.slug;
                  const chip = <DisciplineChip subject={d} />;
                  return routeSlug ? (
                    <Link key={d} href={`/domains/${routeSlug}/competitors`}>
                      {chip}
                    </Link>
                  ) : (
                    <span key={d}>{chip}</span>
                  );
                })}
              </Stack>
            </Stack>
          ) : null}
          <CompetitorCompanyFacts company={competitor.company} />
          <MetadataList columns={2}>
            <MetadataListItem label="Strengths">{competitor.strengths?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Weaknesses">{competitor.weaknesses?.length ?? 0}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <CompetitorProsCons strengths={competitor.strengths} weaknesses={competitor.weaknesses} />
      </Section>

      {competitor.feature_teardown?.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={4}>
            <Text type="label" color="secondary">
              Feature teardown ({competitor.feature_teardown.length})
            </Text>
            <CompetitorDepthChart competitors={[competitor]} />
            <CompetitorFeatureDossier features={competitor.feature_teardown} />
          </Stack>
        </Section>
      ) : null}

      {lens?.how_they_implicitly_serve_roles?.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={3}>
            <Text type="label" color="secondary">
              How {competitor.competitor} implicitly serves each role
            </Text>
            <ComparisonCardGrid
              items={lens.how_they_implicitly_serve_roles.map((r) => {
                const roleSlug = findRoleSlug(r.role);
                return {
                  key: r.role,
                  label: roleSlug ? (
                    <Link href={`/roles/${roleSlug}`} type="body" weight="semibold" color="accent" hasUnderline>
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

      {lens?.gaps_prism_can_exploit?.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={2}>
            <Text type="label" color="secondary">
              Gaps Prism can exploit ({lens.gaps_prism_can_exploit.length})
            </Text>
            <SentenceList items={gapItems} maxLines={3} fallbackIcon="funnel" />
          </Stack>
        </Section>
      ) : null}

      {competitor.exxat_opportunity ? (
        <Section padding={6} dividers={["bottom"]}>
          <Card variant="pink" padding={4}>
            <Stack gap={2}>
              <Text type="label" weight="semibold" size="sm">
                Exxat opportunity
              </Text>
              {/* DENSITY-OK: one continuous per-competitor argument — CONTENT-DENSITY.md's
                  "genuinely one continuous argument" exception, shown in full */}
              <Text type="body">{competitor.exxat_opportunity}</Text>
            </Stack>
          </Card>
        </Section>
      ) : null}

      <Section padding={6}>
        <Stack gap={4}>
          <Grid columns={{ minWidth: 320 }} gap={4}>
            {competitor.retention_anchor ? (
              <Stack gap={1}>
                <Text type="label" color="secondary" size="xsm">
                  Retention anchor
                </Text>
                <Text type="body" size="sm">
                  {competitor.retention_anchor}
                </Text>
              </Stack>
            ) : null}
            {competitor.pricing_signal ? (
              <Stack gap={1}>
                <Text type="label" color="secondary" size="xsm">
                  Pricing signal
                </Text>
                <Text type="body" size="sm">
                  {competitor.pricing_signal}
                </Text>
              </Stack>
            ) : null}
          </Grid>
          {competitor.last_researched ? (
            <Text type="supporting" size="xsm">
              Last researched {competitor.last_researched}
            </Text>
          ) : null}
          {(() => {
            const allSources = Array.from(new Set([...(competitor.sources ?? []), ...(lens?.sources ?? [])]));
            return allSources.length ? (
              <Collapsible defaultIsOpen={false} trigger={`Sources (${allSources.length})`}>
                <List hasDividers density="compact">
                  {allSources.map((s, i) => (
                    <ListItem
                      key={i}
                      label={
                        s.startsWith("http") ? (
                          <Link href={s} isExternalLink size="sm">
                            {s}
                          </Link>
                        ) : (
                          <Text type="supporting" size="sm">
                            {s}
                          </Text>
                        )
                      }
                    />
                  ))}
                </List>
              </Collapsible>
            ) : null;
          })()}
        </Stack>
      </Section>
    </Stack>
  );
}
