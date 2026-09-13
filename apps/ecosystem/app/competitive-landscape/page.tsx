import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { DisciplineChip } from "@/components/discipline-chip";
import { CompetitorDepthChart } from "@/components/charts/competitor-depth-chart";
import { CompetitorScanTable } from "@/components/competitor-scan-table";
import { DomainFilterNotice, resolveDomainFilter } from "@/components/competitive-landscape-filter";
import { CompetitorLogoGrid } from "@/components/competitor-logo-grid";
import type { CompetitorLogoGridEntry } from "@/components/competitor-logo-grid";
import { leadSentence } from "@/lib/text";
import { stripFileCitations } from "@/lib/strip-file-citations";
import {
  getCompetitorLandscape,
  getCompetitorThreatRollup,
  getFeatureComparisonForDomain,
  listCompetitors,
  THREAT_RANK,
} from "@/lib/content";

// The by-competitor pivot of /competitive-landscape — one competitor, all six
// pillars. Was /competitors (now a permanent redirect here, see next.config.ts).
// Its sibling pivot, by-pillar/page.tsx, slices the same market the other way.
export default async function CompetitiveLandscapePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const filter = resolveDomainFilter(query.domain);

  // Copy before sorting. Safe either way today — listCompetitors() ends in a .map(), so
  // the array it hands back is already a throwaway — but lib/content.ts now memoizes its
  // YAML readers in production, and this was the one call site in the app sorting an
  // accessor's return value in place. Push the memo up one level (cache listCompetitors
  // itself) and the bare .sort() would start reordering shared state for every later
  // reader; the spread makes that a non-event.
  const all = [...listCompetitors()].sort((a, b) => a.competitor.localeCompare(b.competitor));

  // Domain narrowing delegates to getFeatureComparisonForDomain rather than
  // re-deriving a domains_served match here: that function already owns the
  // "MD" vs. "Medicine" abbreviation map and the both-directions substring check
  // for descriptive entries like "Education/Teacher Prep", and it is the same
  // filter the domain hub's Competitors tab applies. Two implementations of that
  // matching would be one implementation and one future bug.
  const competitors = filter
    ? (() => {
        const inDomain = new Set(getFeatureComparisonForDomain(filter.domain).competitors.map((c) => c.slug));
        return all.filter((c) => inDomain.has(c.slug));
      })()
    : all;

  // Threat banding for the teardown grid. `threat` is a per-domain synthesis judgment in
  // lenses/competitor-landscape.yaml, so which reading applies depends on the filter:
  //
  //  - filtered  -> that domain's own rating and its own rationale, read straight from
  //                 the landscape entry. No derivation, no rollup.
  //  - unfiltered -> the HIGHEST rating the vendor holds in any researched domain, which
  //                 is a computed aggregate and is labelled as one on the page. Anything
  //                 else would have to either invent a global rating or pick one domain's
  //                 arbitrarily. A vendor no domain has rated (examsoft, influx today)
  //                 lands in the grid's explicit unrated band rather than being dropped
  //                 or silently sorted to the bottom of a "low" group.
  const domainThreats = filter
    ? new Map(
        (getCompetitorLandscape()?.domains.find((d) => d.domain === filter.domain)?.competitors ?? []).map(
          (c) => [c.slug, c] as const,
        ),
      )
    : null;
  const rollup = filter ? null : getCompetitorThreatRollup();

  const gridEntries: CompetitorLogoGridEntry[] = competitors.map((c) => {
    const rated = domainThreats?.get(c.slug);
    const threat = rated?.threat ?? rollup?.[c.slug]?.threat;
    // Filtered, the rationale IS the reason for the band, so it is the most useful line.
    // Unfiltered there is no single rationale (a vendor can be rated in six domains), so
    // the vendor's own category stays, as it did before this grid replaced the plain one.
    //
    // Rationale and category are NOT run through leadSentence: both are already one
    // sentence, and leadSentence splits on a period, so CORE's rationale ("CORE claims
    // 90% of U.S. pharmacy programs partner with them — …") rendered as the four words
    // "CORE claims 90% of U.S." on the Pharmacy filter. The grid tile's own two-line
    // clamp is what shortens these, and it clamps without amputating a claim mid-fact.
    // exxat_opportunity is a genuine multi-sentence paragraph, so it still gets a lead.
    const note = rated?.rationale
      ? stripFileCitations(rated.rationale)
      : c.category
        ? stripFileCitations(c.category)
        : undefined;
    // The "where Prism can win here" lead the card this grid replaced carried as its own
    // second line. Kept, so the grid is not a net loss of information: it fell back to
    // the vendor's first strength when no opportunity was written, and still does.
    const signal = c.exxat_opportunity
      ? stripFileCitations(leadSentence(c.exxat_opportunity))
      : c.strengths?.[0]
        ? stripFileCitations(leadSentence(c.strengths[0].claim))
        : undefined;
    return {
      slug: c.slug,
      competitor: c.competitor,
      logo_asset: c.logo_asset,
      threat,
      note,
      secondaryNote: note === signal ? undefined : signal,
      meta: (c.domains_served ?? []).length ? (
        <Stack direction="horizontal" gap={1.5} wrap="wrap">
          {(c.domains_served ?? []).map((d) => (
            <DisciplineChip key={d} subject={d} />
          ))}
        </Stack>
      ) : undefined,
    };
  });

  // Order inside the page mirrors the banding, so the DOM order and the visual order
  // agree for a keyboard/screen-reader pass through the grid.
  gridEntries.sort(
    (a, b) =>
      (THREAT_RANK[b.threat?.toLowerCase() ?? ""] ?? 0) - (THREAT_RANK[a.threat?.toLowerCase() ?? ""] ?? 0) ||
      a.competitor.localeCompare(b.competitor),
  );

  const groupCaption = filter
    ? `Banded by each vendor's researched threat rating in ${filter.domain}, with that domain's own rationale.`
    : "Banded by the highest threat rating each vendor holds in any researched domain — a rollup across domains, not a single global rating. Scope to one domain to see that domain's own rating and its rationale.";

  // A vendor can be rated in another domain and still be unrated in the one on screen, so
  // the filtered view cannot reuse the cross-domain "no domain has rated these" wording.
  const unratedCaption = filter
    ? `Researched as active in ${filter.domain}, but not rated in its landscape entry`
    : undefined;

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Market"
            title="Every incumbent already ships what Prism's 2027 roadmap promises — but none of them enforce compliance"
            description="Feature-level teardown per competitor, judged against Prism's real pillars. Every claim below is sourced."
          />
          {filter ? <DomainFilterNotice filter={filter} clearHref="/competitive-landscape" /> : null}
          {/* The takeaway is a hand-authored claim about the FULL vendor set ("all six
              MD/DO-serving vendors"), so it is shown only unfiltered. Leaving it up over a
              two-competitor domain slice would restate a market-wide finding as if it were
              evidence about that slice — the blanket-coverage failure this repo has already
              fixed once elsewhere. */}
          {filter ? null : (
            <Takeaway title="Accreditors want enforcement; competitors ship reporting — that's Prism's most defensible platform claim">
              All six MD/DO-serving vendors ship surveys, and most ship some accreditation reporting — areas where
              Prism is still pre-roadmap. But not one publicly documents a hard <em>block</em> the way several
              accreditors now require (e.g. a preceptor-orientation gate, a 2:1 ratio cap). That&apos;s a capability
              Compliance Management already has, just not extended past students. Three vendors are also mid-acquisition
              right now (New Innovations↔QGenda, Leo↔Elentra, MedHub↔Ascend) — real switching windows.
            </Takeaway>
          )}
        </Stack>
      </Section>

      {competitors.length === 0 ? (
        <Section padding={6}>
          <EmptyState
            title="No researched competitors active in this domain yet"
            description="This isn't a gap in the table — it's the honest current state of research for this domain."
          />
        </Section>
      ) : (
        <>
          <Section padding={6} dividers={["bottom"]}>
            <Stack gap={3}>
              <Heading level={2}>Depth vs. Prism, by competitor</Heading>
              <Text type="supporting">
                Count of assessed pillars per depth judgment: behind Prism, at parity, ahead of Prism, or Prism-only.
              </Text>
              {/* keyed on the active filter so switching domains REMOUNTS the chart.
                  components/charts/plot-figure.tsx renders its Plot inside a useEffect
                  with an empty dep array, so a chart that stays mounted keeps the data
                  it first drew: without this key, "Show all domains" leaves the previous
                  domain's bars on screen under a correct, updated heading. Fixed here
                  rather than in PlotFigure because that dep array is deliberate and
                  shared by every chart in the app — this page is simply the first caller
                  that ever changes a chart's data without a remount. */}
              <CompetitorDepthChart key={filter?.slug ?? "all"} competitors={competitors} />
            </Stack>
          </Section>

          <Section padding={6} dividers={["bottom"]}>
            <Stack gap={3}>
              <Heading level={2}>At a glance</Heading>
              <Text type="supporting">Every competitor&apos;s single biggest strength and weakness, in one scan — no expanding required.</Text>
              <CompetitorScanTable competitors={competitors} />
            </Stack>
          </Section>

          <Section padding={6}>
            <Stack gap={3}>
              <Stack gap={1}>
                <Heading level={2}>Full teardowns ({competitors.length})</Heading>
                <Text type="supporting">Open a competitor for company facts, full strengths/weaknesses, and the sourced feature-by-feature dossier.</Text>
              </Stack>
              <CompetitorLogoGrid
                entries={gridEntries}
                groupCaption={groupCaption}
                unratedCaption={unratedCaption}
                minTileWidth={264}
              />
            </Stack>
          </Section>
        </>
      )}
    </Stack>
  );
}
