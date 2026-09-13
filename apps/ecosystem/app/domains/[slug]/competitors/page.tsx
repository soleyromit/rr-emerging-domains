import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { CompetitorLogoGrid } from "@/components/competitor-logo-grid";
import type { CompetitorLogoGridEntry } from "@/components/competitor-logo-grid";
import { humanizeSourceRef, stripFileCitations } from "@/lib/strip-file-citations";
import { SentenceList } from "@/components/sentence-list";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import {
  getAccreditorTiers,
  getDissectionManifest,
  getDomainHubData,
  getFeatureComparisonMatrixForDomain,
  listCompetitors,
  listFeatureMaps,
  THREAT_RANK,
} from "@/lib/content";
import { dissectHref } from "@/lib/dissection-links";

// The threat bands that stay open in the scan layer. Everything below them collapses,
// which is the same density discipline the old flat "first 4, rest behind a Collapsible"
// split enforced — but cut on the reading that actually matters (how dangerous a vendor
// is here) instead of on list position. Across all 13 domains no band exceeds 5 vendors,
// so an open High+Medium pair stays scannable.
const OPEN_THREAT_BANDS = new Set(["high", "medium"]);

// Band labels, highest first, for the scan-layer caption. The caption has to name the
// bands that are actually on screen: on most domains the scan layer holds only High and
// Medium and the rest of the list is collapsed below it, so a caption claiming "every
// vendor" would sit over a partial grid (DO shows 1 of 6 vendors open).
const BAND_LABELS: [key: string, label: string][] = [
  ["high", "High"],
  ["medium", "Medium"],
  ["low", "Low"],
];

function joinPhrases(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export default async function DomainCompetitorsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  const { landscapeEntry, featureComparison } = getDomainHubData(entry.domain, slug);

  // The landscape lens carries the name/slug/threat/rationale but not the logo, which is
  // declared per competitor in content/competitors/<slug>.yaml. Join them here, on the
  // server, so the grid draws the real mark where one has been sourced and falls back to
  // initials where none has — never a broken image, and never a slug rendered as text.
  const logoAssets = new Map(listCompetitors().map((c) => [c.slug, c.logo_asset] as const));
  const threatRank = (t?: string) => THREAT_RANK[t?.toLowerCase().trim() ?? ""] ?? 0;
  const toEntry = (c: { slug: string; competitor: string; threat: string; rationale: string }) =>
    ({
      slug: c.slug,
      competitor: c.competitor,
      logo_asset: logoAssets.get(c.slug),
      threat: c.threat,
      note: stripFileCitations(c.rationale),
    }) satisfies CompetitorLogoGridEntry;

  const ranked = [...(landscapeEntry?.competitors ?? [])].sort((a, b) => threatRank(b.threat) - threatRank(a.threat));
  const isOpenBand = (t?: string) => OPEN_THREAT_BANDS.has(t?.toLowerCase().trim() ?? "");
  // Nine of the 13 domains have a high- or medium-rated vendor. Where none does (today
  // Occupational Therapy, whose one researched competitor is rated low), splitting on the
  // band would leave the scan layer empty above a collapsed section — so that domain
  // shows its whole, short list open instead of hiding all of it behind a trigger.
  const anyOpenBand = ranked.some((c) => isOpenBand(c.threat));
  const visibleCompetitors = (anyOpenBand ? ranked.filter((c) => isOpenBand(c.threat)) : ranked).map(toEntry);
  const overflowCompetitors = (anyOpenBand ? ranked.filter((c) => !isOpenBand(c.threat)) : []).map(toEntry);

  // The caption is written against what this domain actually renders open, not against the
  // full researched set: only where nothing is collapsed can it claim to cover every
  // vendor — true today on Medicine (6 vendors, none rated low), and on any domain whose
  // whole list stays open through the !anyOpenBand branch above. Where a band IS collapsed
  // (Pharmacy hides 2 of its 5, DO 1 of 6, Dentistry 1 of 3) it names the bands actually
  // open and counts what is behind the toggle, so the sentence is true on every domain.
  const logoNote =
    "A vendor with no logo has no legitimately-sourced one yet, not a broken image.";
  const shownBands = BAND_LABELS.filter(([key]) =>
    visibleCompetitors.some((c) => c.threat?.toLowerCase().trim() === key),
  ).map(([, label]) => label);
  const gridCaption = !overflowCompetitors.length
    ? `Every vendor researched as active in ${entry.domain}, banded by its threat rating here and shown with its own mark. ${logoNote}`
    : // Suspended hyphen, so two bands read "High- and Medium-threat vendors".
      `${
        shownBands.length
          ? `${joinPhrases(shownBands.map((l, i) => (i < shownBands.length - 1 ? `${l}-` : l)))}-threat`
          : "The highest-rated"
      } ${visibleCompetitors.length === 1 ? "vendor" : "vendors"} researched as active in ${
        entry.domain
      }, shown with ${visibleCompetitors.length === 1 ? "its" : "each vendor's"} own mark — the remaining ${
        overflowCompetitors.length === 1 ? "one sits" : `${overflowCompetitors.length} sit`
      } behind the toggle below. ${logoNote}`;

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
            <Stack gap={4}>
              <CompetitorLogoGrid
                entries={visibleCompetitors}
                groupCaption={gridCaption}
              />
              {overflowCompetitors.length ? (
                <Collapsible
                  trigger={`Show ${overflowCompetitors.length} lower-threat ${overflowCompetitors.length === 1 ? "competitor" : "competitors"}`}
                  defaultIsOpen={false}
                >
                  <CompetitorLogoGrid
                    entries={overflowCompetitors}
                    groupCaption={`Researched as active in ${entry.domain}, but rated a narrower or weaker footprint here.`}
                  />
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
