import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { AccreditationStandardsTable } from "@/components/accreditation-standards-table";
import { CoverageGapsCallout } from "@/components/coverage-gaps-callout";
import { FitDistributionChart } from "@/components/charts/fit-distribution-chart";
import { getAccreditorTiers, getDomainHubData, getTrendsForDomain, hasSalesBrief } from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

export default async function DomainStandardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  const { standardsCrosswalk, accreditationDoc } = getDomainHubData(entry.domain, slug);
  const trendCount = getTrendsForDomain(entry.domain).length;

  return (
    <Section padding={6} dividers={["bottom"]}>
      <Stack gap={5}>
        <Stack gap={1}>
          <Heading level={2}>Standards</Heading>
          {accreditationDoc?.standards_document ? (
            <Text type="supporting">
              {accreditationDoc.standards_document.title} {accreditationDoc.standards_document.version_or_year}
            </Text>
          ) : null}
        </Stack>

        {!standardsCrosswalk || standardsCrosswalk.researchStatus === "unresearched" || !accreditationDoc?.standards?.length ? (
          <EmptyState
            title="No standards mapped yet"
            description={accreditationDoc?.research_status_note ?? "This section populates once accreditation research lands for this domain."}
          />
        ) : (
          <>
            <Stack gap={3}>
              <ProgressBar
                label="Exxat compliance"
                hasValueLabel
                value={standardsCrosswalk.rows.filter((r) => (r.exxat_compliance ?? "").toLowerCase() === "compliant").length}
                max={standardsCrosswalk.rows.length}
              />
              <ProgressBar
                label="Competitor research coverage"
                hasValueLabel
                value={standardsCrosswalk.ratedCompetitorCellCount}
                max={standardsCrosswalk.totalCompetitorCellCount || 1}
              />
            </Stack>
            <MetadataList columns={2}>
              <MetadataListItem label="Standards tracked">{standardsCrosswalk.rows.length}</MetadataListItem>
              <MetadataListItem label="Competitor cells rated">
                {standardsCrosswalk.ratedCompetitorCellCount} / {standardsCrosswalk.totalCompetitorCellCount}
              </MetadataListItem>
            </MetadataList>
            <CoverageGapsCallout
              ratedCount={standardsCrosswalk.ratedCompetitorCellCount}
              totalCount={standardsCrosswalk.totalCompetitorCellCount}
              domain={entry.domain}
              trendCount={trendCount}
            />
            {standardsCrosswalk.competitors.length === 0 ? (
              <Text type="supporting" size="sm" color="secondary">
                No competitor research yet covers this domain — the table below shows only the Prism column.
              </Text>
            ) : null}
            <FitDistributionChart docs={[accreditationDoc]} />
            <AccreditationStandardsTable
              standardsCrosswalk={standardsCrosswalk}
              slug={slug}
              hasWinBrief={hasSalesBrief(slug)}
            />
          </>
        )}

        {accreditationDoc?.licensure_or_gme_layer?.length ? (
          <Stack gap={3}>
            <Heading level={2}>Licensure / GME / association layer</Heading>
            <Grid columns={{ minWidth: 260 }} gap={3}>
              {accreditationDoc.licensure_or_gme_layer.map((b, i) => (
                <Card key={i}>
                  <Stack gap={1}>
                    {/* DENSITY-OK: b.body is the licensure body's short name (e.g. "AOA"), not prose */}
                    <Text type="body" weight="semibold">
                      {b.body}
                    </Text>
                    <Text type="supporting" maxLines={3}>
                      {b.what_it_governs}
                    </Text>
                    <Text type="supporting" maxLines={3}>
                      {b.relevance_to_product}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </Grid>
          </Stack>
        ) : null}
      </Stack>
    </Section>
  );
}
