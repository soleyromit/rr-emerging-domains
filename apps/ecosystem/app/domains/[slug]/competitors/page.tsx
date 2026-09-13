import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { List, ListItem } from "@astryxdesign/core/List";
import { ThreatBadge } from "@/components/fit-badge";
import { CompetitorLogo } from "@/components/competitor-logo";
import { humanizeSourceRef, stripFileCitations } from "@/lib/strip-file-citations";
import { SentenceList } from "@/components/sentence-list";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import {
  getAccreditorTiers,
  getDissectionManifest,
  getDomainHubData,
  getFeatureComparisonMatrixForDomain,
  listFeatureMaps,
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

  // 2026-09-13 nav consolidation: the depth chart and the pillar × competitor
  // cross-tab (FeatureDepthChart + FeatureTeardownMatrix) that used to render in
  // full here are gone, replaced by the summary card below. This tab keeps only
  // what is genuinely domain-specific — the threat-ranked landscape list above,
  // which exists nowhere else — and hands the cross-domain comparison to
  // /competitive-landscape, where both pivots of it now live.
  //
  // No content became unreachable in the move: every cell of that grid was drawn
  // from each competitor's own feature_teardown, and each competitor's full
  // pillar-by-pillar teardown still renders on /competitors/{slug}, which every
  // row of the list above links to.
  //
  // The card below points at the Dissection tab's matrix, which is a
  // DIFFERENT lens (per-capability, hand-authored, with an explicit Exxat verdict) —
  // so its trigger copy states that lens's own real cell count rather than implying it
  // absorbed the teardown grid. It is only rendered where a manifest exists; the
  // Dissection tab for the other 9 routed domains has no matrix to arrive at.
  const dissectionManifest = getDissectionManifest(slug);
  const dissectionMatrix = dissectionManifest ? getFeatureComparisonMatrixForDomain(entry.domain) : null;

  // Counts for the summary card are read from the SAME source its link opens
  // (content/feature-map/*.yaml via listFeatureMaps, which is what
  // /competitive-landscape/by-pillar renders), not from the teardown grid this tab
  // used to draw. A preview that counted a different dataset than the page it
  // opens is a link that lies about its destination.
  const featureMap = listFeatureMaps().find((fm) => matchDisciplineMeta(fm.domain)?.slug === slug) ?? null;
  const pillarCounts = { leading: 0, behind: 0, opportunity: 0 };
  for (const p of featureMap?.pillars ?? []) pillarCounts[p.status] += 1;

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
              {/* The pivot in the href follows the data, not a fixed default. Only the
                  four feature-map domains have pillar cells to show, so for the other
                  nine this card would otherwise open a by-pillar view whose only content
                  is its own empty state — a link that reads like a destination and
                  arrives at nothing. Those domains DO have competitors (that is the
                  branch we are inside), so they get the by-competitor pivot, which is
                  one tab click from the other either way. */}
              <ClickableCard
                href={
                  featureMap
                    ? `/competitive-landscape/by-pillar?domain=${slug}`
                    : `/competitive-landscape?domain=${slug}`
                }
                label={`${entry.domain} competitive landscape`}
              >
                <Stack gap={1.5}>
                  <Text type="body" weight="semibold">
                    {featureMap
                      ? `See ${entry.domain} pillar by pillar on the competitive landscape`
                      : `See ${entry.domain} on the competitive landscape`}
                  </Text>
                  <Text type="supporting" maxLines={3}>
                    {featureMap
                      ? `${pillarCounts.leading} pillars where Prism leads, ${pillarCounts.behind} where a named competitor leads, and ${pillarCounts.opportunity} nobody has built yet — each with the reasoning and the specific opening, scoped to ${entry.domain} and switchable to the by-competitor view.`
                      : `The ${featureComparison.competitors.length === 1 ? "one researched competitor" : `${featureComparison.competitors.length} researched competitors`} active in ${entry.domain}, each with a full teardown against Prism's pillars. No pillar × domain map has been researched for ${entry.domain} yet, so that pivot is empty for it.`}
                  </Text>
                </Stack>
              </ClickableCard>
              <Text type="supporting" size="sm" color="secondary">
                Each competitor&apos;s full pillar-by-pillar teardown — every capability, depth
                rating and the evidence behind it — is on that competitor&apos;s own page, linked
                from the list above.
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
