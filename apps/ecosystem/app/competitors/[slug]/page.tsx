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
import { listCompetitors, getCompetitor } from "@/lib/content";

export function generateStaticParams() {
  return listCompetitors().map((c) => ({ slug: c.slug }));
}

export default async function CompetitorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) notFound();

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
          {competitor.sources?.length ? (
            <Collapsible defaultIsOpen={false} trigger={`Sources (${competitor.sources.length})`}>
              <List hasDividers density="compact">
                {competitor.sources.map((s, i) => (
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
          ) : null}
        </Stack>
      </Section>
    </Stack>
  );
}
