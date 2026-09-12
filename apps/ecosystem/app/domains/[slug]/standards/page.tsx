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
import { dissectNodeHref, dissectionNodeId, dissectionNodeIds } from "@/lib/dissection-links";

export default async function DomainStandardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  const { standardsCrosswalk, accreditationDoc } = getDomainHubData(entry.domain, slug);
  const trendCount = getTrendsForDomain(entry.domain).length;

  // One `?node=standard:…` link per element that really IS a node on this domain's
  // Dissection map. Built here rather than in the table because the graph is read from
  // content/ on the server and the table is a client component. Sparse by construction:
  // an element the competitor-ratings lens never rates has no node, gets no entry, and
  // its detail panel shows no map link.
  const dissectNodeIds = dissectionNodeIds(slug, entry.domain);
  const dissectHrefByElementId = Object.fromEntries(
    (standardsCrosswalk?.rows ?? []).flatMap((row) => {
      const href = dissectNodeHref(slug, dissectNodeIds, dissectionNodeId.standard(entry.domain, row.element_id));
      return href ? [[row.element_id, href] as const] : [];
    })
  );

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
              {/* Two different figures, deliberately. The bar counts any element a
                  reader can follow somewhere from — a curated use case OR an existing
                  flow/journey that names it. The metadata item below counts only the
                  curated ones. Showing the broader number under the word "use case"
                  (as this bar used to) made the scan layer claim 14/20 for Pharmacy
                  while the detail panel says "computed — not a curated use case" on
                  three of those rows. */}
              <ProgressBar
                label="Standards with a use case or existing reference"
                hasValueLabel
                value={standardsCrosswalk.standardsWithUseCaseOrReferenceCount}
                max={standardsCrosswalk.rows.length}
              />
            </Stack>
            <MetadataList columns={3}>
              <MetadataListItem label="Standards tracked">{standardsCrosswalk.rows.length}</MetadataListItem>
              <MetadataListItem label="Competitor cells rated">
                {standardsCrosswalk.ratedCompetitorCellCount} / {standardsCrosswalk.totalCompetitorCellCount}
              </MetadataListItem>
              <MetadataListItem label="Standards with a curated use case">
                {standardsCrosswalk.standardsWithCuratedUseCaseCount} / {standardsCrosswalk.rows.length}
              </MetadataListItem>
            </MetadataList>
            <CoverageGapsCallout
              ratedCount={standardsCrosswalk.ratedCompetitorCellCount}
              totalCount={standardsCrosswalk.totalCompetitorCellCount}
              domain={entry.domain}
              trendCount={trendCount}
              directionalCount={standardsCrosswalk.directionalRatingCount}
            />
            {/* Pharmacy-gated as well as directional-gated: the attribution below names
                a specific pharmacy domain expert on a specific date, so it must never
                render on another domain's page just because that domain later acquires
                its own directional rating. The domain-generic "N directional" sentence
                lives inside CoverageGapsCallout above and is unaffected. */}
            {slug === "pharmacy" && standardsCrosswalk.directionalRatingCount > 0 ? (
              <Text type="supporting" size="sm" color="secondary">
                Ratings marked <strong>Directional</strong> are a first-pass read of public vendor
                material, not element-by-element verification. Exxat&apos;s pharmacy domain expert
                stated on 4 September 2026 that a real pharmacy standards-gap study has never been
                run, and that the working &ldquo;25% gap&rdquo; figure is &ldquo;research that
                remains to be done.&rdquo; These ratings are the starting point for that audit, not
                its result.
              </Text>
            ) : null}
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
              dissectHrefByElementId={dissectHrefByElementId}
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
