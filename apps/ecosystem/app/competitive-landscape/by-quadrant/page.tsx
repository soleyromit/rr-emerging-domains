import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Badge } from "@astryxdesign/core/Badge";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { CompetitorQuadrantChart } from "@/components/charts/competitor-quadrant-chart";
import { DomainFilterNotice, resolveDomainFilter } from "@/components/competitive-landscape-filter";
import { getFeatureComparisonForDomain, listCompetitors } from "@/lib/content";
import { buildCompetitorQuadrant, countByRegion } from "@/lib/competitor-quadrant";
import { COMPETITOR_QUADRANT_REGIONS } from "@/lib/competitor-quadrant-model";

// The by-quadrant pivot of /competitive-landscape — the same researched
// `depth_vs_prism` judgments its two sibling pivots slice by competitor (../page.tsx)
// and by pillar (../by-pillar/page.tsx), placed instead on two named axes so the answer
// a reader leaves with is the NAME of the box a vendor is in.
//
// A real route segment, not a `?view=` query param: the three pivots are mutually
// exclusive views of one subject, which is the shape the tab shell in ../layout.tsx
// (and /product, and /standards, and the domain hub) already uses. `?domain=` stays a
// query param on top of it for the same reason it does on the other two — an orthogonal
// narrowing, carried across a pivot switch by components/competitive-landscape-tabs.tsx.
export default async function CompetitiveLandscapeByQuadrantPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const filter = resolveDomainFilter(query.domain);

  // Same narrowing as the by-competitor pivot, delegated to the same function for the
  // same reason: getFeatureComparisonForDomain already owns the "MD" vs. "Medicine"
  // abbreviation map and the both-directions substring check.
  const all = listCompetitors();
  const competitors = filter
    ? (() => {
        const inDomain = new Set(getFeatureComparisonForDomain(filter.domain).competitors.map((c) => c.slug));
        return all.filter((c) => inDomain.has(c.slug));
      })()
    : all;

  const quadrant = buildCompetitorQuadrant(competitors);
  const counts = countByRegion(quadrant.points);
  const plotted = quadrant.points.length;
  const researched = plotted + quadrant.unassessed.length;

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Market"
            title={
              plotted === 0
                ? "No vendor has a verified pillar judgment in this slice yet"
                : // The count is the "Displacement threats" region alone, so the headline has to
                  // say the whole predicate that region stands for. A vendor in "Split decisions"
                  // also leads Prism on `majority` or more pillars — it is only excluded because
                  // Prism leads it on `majority` or more too. Without the trailing clause the
                  // sentence is true today purely because that region happens to be empty, and
                  // would go quietly wrong the first time a vendor lands in it.
                  `${counts.displacement} of ${plotted} assessed vendors lead Prism on ${quadrant.majority} or more of its six pillars while Prism leads them on fewer`
            }
            description={`Two named axes, both counts of the same researched depth judgments the other two pivots read: the pillars Prism leads (rated "behind" or "Prism-only") against the pillars the vendor leads (rated "ahead of Prism"). No score and no weighting — each of the six canonical pillars is counted once, on the side the research already put it.`}
          />
          {filter ? <DomainFilterNotice filter={filter} clearHref="/competitive-landscape/by-quadrant" /> : null}
          {plotted > 0 ? (
            <>
              <Takeaway
                title={`${counts.displacement} vendors in Displacement threats, ${counts["home-turf"]} on Prism's home turf, ${counts.split} genuinely split`}
              >
                Of {researched} researched vendors in this slice, {plotted} carry at least one verified pillar
                judgment and are plotted. {counts.displacement} of them lead Prism on {quadrant.majority} or more of
                the six canonical pillars while Prism leads them on fewer; {counts["home-turf"]} sit the other way
                round; {counts.narrow} contest fewer than {quadrant.majority} pillars either way.{" "}
                {quadrant.unassessed.length > 0
                  ? `The remaining ${quadrant.unassessed.length} are named below the chart rather than drawn at the origin — "nothing verified yet" is not the same claim as "competes on nothing."`
                  : ""}
              </Takeaway>
              <MetadataList columns={4}>
                {COMPETITOR_QUADRANT_REGIONS.map((r) => (
                  <MetadataListItem key={r.key} label={r.name}>
                    {counts[r.key]} of {plotted}
                  </MetadataListItem>
                ))}
              </MetadataList>
            </>
          ) : null}
        </Stack>
      </Section>

      {plotted === 0 ? (
        <Section padding={6}>
          <EmptyState
            title="Nothing to place on the quadrant yet"
            description="A vendor appears here once its feature teardown rates at least one of the six canonical pillars against Prism. This isn't a gap in the plot — it's the honest current state of research for this slice."
          />
        </Section>
      ) : (
        <>
          <Section padding={6} dividers={["bottom"]}>
            <Stack gap={3}>
              <Heading level={2}>How to read this</Heading>
              <Text type="supporting">
                The dividers sit at {quadrant.majority} pillars — half the canonical set — on both axes, so a vendor
                crosses only by leading a majority of what was assessed.
              </Text>
              <Stack direction="horizontal" gap={5} wrap="wrap">
                {COMPETITOR_QUADRANT_REGIONS.map((r) => (
                  <Stack key={r.key} gap={1} maxWidth={280}>
                    <Stack direction="horizontal" gap={2} vAlign="center">
                      <span
                        aria-hidden="true"
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          background: r.fill,
                          border: "1px solid var(--color-border)",
                          flexShrink: 0,
                        }}
                      />
                      <Text type="body" weight="semibold">
                        {r.name}
                      </Text>
                      <Badge variant="neutral" label={String(counts[r.key])} />
                    </Stack>
                    <Text type="supporting" size="xsm">
                      {r.meaning}
                    </Text>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Section>

          <Section padding={6} dividers={quadrant.unassessed.length > 0 ? ["bottom"] : undefined}>
            <Stack gap={3}>
              <Heading level={2}>
                {filter ? `${filter.domain}'s vendors, placed` : "Every researched vendor, placed"}
              </Heading>
              {/* keyed on the active filter so switching domains REMOUNTS the chart —
                  components/charts/plot-figure.tsx draws once inside an empty-dep
                  useEffect, exactly as the two sibling pivots' charts document. */}
              <CompetitorQuadrantChart
                key={filter?.slug ?? "all"}
                points={quadrant.points}
                threshold={quadrant.threshold}
                pillarCount={quadrant.pillarCount}
              />
            </Stack>
          </Section>

          {quadrant.unassessed.length > 0 ? (
            <Section padding={6}>
              <Stack gap={3}>
                <Stack gap={1}>
                  <Heading level={2}>Researched, not yet placeable ({quadrant.unassessed.length})</Heading>
                  <Text type="supporting">
                    These vendors have a dossier but no verified depth judgment on any of the six canonical pillars
                    yet, so there is no honest coordinate for them. Open one to see what has been researched.
                  </Text>
                </Stack>
                <Stack direction="horizontal" gap={4} wrap="wrap">
                  {quadrant.unassessed.map((v) => (
                    <Link key={v.slug} href={v.href} color="accent" hasUnderline>
                      {v.competitor}
                    </Link>
                  ))}
                </Stack>
              </Stack>
            </Section>
          ) : null}
        </>
      )}
    </Stack>
  );
}
