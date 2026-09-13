import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { DisciplineChip } from "@/components/discipline-chip";
import { CompetitorDepthChart } from "@/components/charts/competitor-depth-chart";
import { CompetitorScanTable } from "@/components/competitor-scan-table";
import { DomainFilterNotice, resolveDomainFilter } from "@/components/competitive-landscape-filter";
import { leadSentence } from "@/lib/text";
import { stripFileCitations } from "@/lib/strip-file-citations";
import { getFeatureComparisonForDomain, listCompetitors } from "@/lib/content";

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
              <Grid columns={{ minWidth: 320 }} gap={4}>
                {competitors.map((c) => {
                  const signal = c.exxat_opportunity
                    ? stripFileCitations(leadSentence(c.exxat_opportunity))
                    : c.strengths?.[0]
                      ? stripFileCitations(leadSentence(c.strengths[0].claim))
                      : undefined;
                  return (
                    <ClickableCard key={c.slug} href={`/competitors/${c.slug}`} label={c.competitor}>
                      <Stack gap={2}>
                        <Heading level={3}>{c.competitor}</Heading>
                        {c.category ? (
                          <Text type="supporting" size="xsm" maxLines={2}>
                            {c.category}
                          </Text>
                        ) : null}
                        <Stack direction="horizontal" gap={1.5} wrap="wrap">
                          {(c.domains_served ?? []).map((d) => (
                            <DisciplineChip key={d} subject={d} />
                          ))}
                        </Stack>
                        {signal ? (
                          <Text type="supporting" size="xsm" maxLines={2}>
                            {signal}
                          </Text>
                        ) : null}
                      </Stack>
                    </ClickableCard>
                  );
                })}
              </Grid>
            </Stack>
          </Section>
        </>
      )}
    </Stack>
  );
}
