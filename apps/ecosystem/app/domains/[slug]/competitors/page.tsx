import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { List, ListItem } from "@astryxdesign/core/List";
import { ThreatBadge } from "@/components/fit-badge";
import { FeatureDepthChart } from "@/components/charts/feature-depth-chart";
import { FeatureTeardownMatrix } from "@/components/feature-teardown-matrix";
import { CompetitorLogo } from "@/components/competitor-logo";
import { humanizeSourceRef, stripFileCitations } from "@/lib/strip-file-citations";
import { SentenceList } from "@/components/sentence-list";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import {
  getAccreditorTiers,
  getDissectionManifest,
  getDomainHubData,
  getFeatureComparisonMatrixForDomain,
} from "@/lib/content";
import { dissectHref } from "@/lib/dissection-links";

const VISIBLE_COMPETITOR_COUNT = 4;

export default async function DomainCompetitorsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  const { landscapeEntry, featureComparison } = getDomainHubData(entry.domain, slug);
  const visibleCompetitors = landscapeEntry?.competitors.slice(0, VISIBLE_COMPETITOR_COUNT) ?? [];
  const overflowCompetitors = landscapeEntry?.competitors.slice(VISIBLE_COMPETITOR_COUNT) ?? [];

  // The pillar × competitor cross-tab under the chart below is FeatureTeardownMatrix —
  // the same feature_teardown data the retired hand-rolled DomainFeatureComparisonTable
  // showed (Phase 6), re-expressed through the app's generic ComparisonMatrix, with the
  // capability/evidence/source each cell's drill-down now carries that the old table
  // never rendered. Every word of it also still renders in full on /competitors/{slug},
  // which each row of the list above and each column header of the matrix links to.
  //
  // The card below points at the Dissection tab's matrix, which is a
  // DIFFERENT lens (per-capability, hand-authored, with an explicit Exxat verdict) —
  // so its trigger copy states that lens's own real cell count rather than implying it
  // absorbed the teardown grid. It is only rendered where a manifest exists; the
  // Dissection tab for the other 9 routed domains has no matrix to arrive at.
  const dissectionManifest = getDissectionManifest(slug);
  const dissectionMatrix = dissectionManifest ? getFeatureComparisonMatrixForDomain(entry.domain) : null;

  return (
    <>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Text type="label" color="secondary" size="sm">
            Competitor landscape
          </Text>
          {landscapeEntry?.note ? (
            <Text type="body" size="sm" color="secondary" maxLines={2}>
              {/* competitor-landscape.yaml's per-domain `note` cross-references the sibling
                  lens file by name for an unresearched discipline ("See the 'Counseling'
                  entry in lenses/accreditor-tiers.yaml"). First-paint visible. */}
              {stripFileCitations(landscapeEntry.note)}
            </Text>
          ) : null}
          {!landscapeEntry?.competitors.length ? (
            <EmptyState
              title="No researched competitors active in this domain yet"
              description="This isn't a gap in the table — it's the honest current state of research for this domain."
            />
          ) : (
            <Stack gap={3}>
              <List hasDividers>
                {visibleCompetitors.map((c) => (
                  <ListItem
                    key={c.slug}
                    href={`/competitors/${c.slug}`}
                    startContent={<CompetitorLogo slug={c.slug} competitor={c.competitor} size={28} />}
                    label={c.competitor}
                    description={<Text type="supporting" size="sm" maxLines={2}>{stripFileCitations(c.rationale)}</Text>}
                    endContent={<ThreatBadge threat={c.threat} />}
                  />
                ))}
              </List>
              {overflowCompetitors.length ? (
                <Collapsible trigger={`Show ${overflowCompetitors.length} more competitors`} defaultIsOpen={false}>
                  <List hasDividers>
                    {overflowCompetitors.map((c) => (
                      <ListItem
                        key={c.slug}
                        href={`/competitors/${c.slug}`}
                        startContent={<CompetitorLogo slug={c.slug} competitor={c.competitor} size={28} />}
                        label={c.competitor}
                        description={<Text type="supporting" size="sm" maxLines={2}>{stripFileCitations(c.rationale)}</Text>}
                        endContent={<ThreatBadge threat={c.threat} />}
                      />
                    ))}
                  </List>
                </Collapsible>
              ) : null}
              {landscapeEntry.sources?.length ? (
                <Stack gap={1}>
                  <Text type="label" color="secondary" size="xsm">
                    Sources
                  </Text>
                  <SentenceList items={landscapeEntry.sources.map(humanizeSourceRef)} maxLines={2} fallbackIcon="copy" />
                </Stack>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Section>

      <Section padding={6}>
        <Stack gap={3}>
          <Text type="label" color="secondary" size="sm">
            Feature comparison
          </Text>
          {featureComparison.competitors.length === 0 ? (
            <EmptyState
              title="No researched competitors active in this domain yet"
              description="This isn't a gap in the table — it's the honest current state of research for this domain."
            />
          ) : (
            <Stack gap={4}>
              {/* Two lenses on the same feature_teardown data, deliberately both kept:
                  the chart answers "how does each competitor stack up overall" (one bar
                  per competitor, pillar dimension collapsed), the matrix answers "who is
                  ahead on THIS pillar" (the cross-tab the chart structurally cannot
                  show). Chart first as the scan layer, grid below it for the row-by-row
                  read, with each cell's capability/evidence/source one click deeper. */}
              <FeatureDepthChart domain={featureComparison} />
              <FeatureTeardownMatrix comparison={featureComparison} />
              <Text type="supporting" size="sm" color="secondary">
                Each competitor&apos;s full pillar-by-pillar teardown — every capability, depth
                rating and the evidence behind it — is also on that competitor&apos;s own page,
                linked from each column header and from the list above.
              </Text>
              {dissectionMatrix ? (
                <ClickableCard href={dissectHref(slug)} label="Dissection">
                  <Stack gap={1.5}>
                    <Text type="body" weight="semibold">
                      Compare them capability by capability on the Dissection tab
                    </Text>
                    <Text type="supporting">
                      {dissectionMatrix.rows.length
                        ? `${dissectionMatrix.cellCount} researched cells across ${dissectionMatrix.rows.length} capabilities, each with its own rationale, evidence strength and sources — plus an Exxat verdict per row, which the depth chart above does not carry.`
                        : `No capability has been rated for ${entry.domain} in that lens yet — the tab says so plainly, and shows the incumbent set and topology map instead.`}
                    </Text>
                  </Stack>
                </ClickableCard>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Section>
    </>
  );
}
