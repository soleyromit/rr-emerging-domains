import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Link } from "@astryxdesign/core/Link";
import { Icon } from "@astryxdesign/core/Icon";
import { List, ListItem } from "@astryxdesign/core/List";
import { Divider } from "@astryxdesign/core/Divider";
import { ExxatComplianceBadge, StandardsRatingBadge, ThreatBadge } from "@/components/fit-badge";
import { CompetitorLogo } from "@/components/competitor-logo";
import { SourceList } from "@/components/source-list";
import type {
  StandardsCrosswalkForDomain,
  StandardsCrosswalkCompetitorCell,
  CompetitorLandscapeDomain,
} from "@/lib/content";

const RATING_RANK: Record<string, number> = { "fully-meeting": 3, "partially-meeting": 2, "not-meeting": 1 };

function bestRated(cells: StandardsCrosswalkCompetitorCell[]): StandardsCrosswalkCompetitorCell | undefined {
  return [...cells].sort((a, b) => (RATING_RANK[b.rating] ?? 0) - (RATING_RANK[a.rating] ?? 0))[0];
}

// The chain header on each gap card, at a glance, before the reading below:
// [Standard] -> [Exxat: Gap] -> [Competitor: rating]. Same Card+chevron idiom
// as charts/flow-diagram.tsx, at a smaller scale, for a 2-3 node chain instead
// of a multi-step sequence. Only the single best-rated competitor gets a node
// (not every rated one) — a real branch here would invent structure the data
// doesn't have, same reasoning flow-diagram.tsx documents for its own steps.
function GapChain({
  title,
  compliance,
  best,
}: {
  title: string;
  compliance?: string;
  best?: StandardsCrosswalkCompetitorCell;
}) {
  return (
    <Stack direction="horizontal" gap={0} vAlign="center" wrap="wrap">
      <Card variant="muted" padding={2}>
        <Text type="body" weight="semibold" size="xsm" maxLines={1} style={{ maxWidth: 160 }}>
          {title}
        </Text>
      </Card>
      <Icon icon="chevronRight" size="sm" color="secondary" aria-hidden="true" />
      <Card variant="red" padding={2}>
        <ExxatComplianceBadge compliance={compliance} />
      </Card>
      {best ? (
        <>
          <Icon icon="chevronRight" size="sm" color="secondary" aria-hidden="true" />
          <Card variant="green" padding={2}>
            <Stack direction="horizontal" gap={1.5} vAlign="center">
              <CompetitorLogo slug={best.slug} competitor={best.competitor} size={16} />
              <Text type="body" weight="semibold" size="xsm" maxLines={1} style={{ maxWidth: 120 }}>
                {best.competitor}
              </Text>
            </Stack>
          </Card>
        </>
      ) : null}
    </Stack>
  );
}

// Answers, in one flat scroll with no tab-switching and no "Show detail" clicks
// required for the headline fact, the three questions this page kept getting asked
// despite the data already existing two tabs over: is Exxat compliant with each
// standard, if not who covers it and via which named product/feature, and who else
// is active in this market. The Standards/Competitors tabs still hold the full
// depth (every standard, every pillar, full rationale/evidence) — this is the
// answer key, not a replacement for them.
export function ExxatGapAnswer({
  standardsCrosswalk,
  landscapeEntry,
  slug,
}: {
  standardsCrosswalk: StandardsCrosswalkForDomain | null;
  landscapeEntry: CompetitorLandscapeDomain | null;
  slug: string;
}) {
  if (!standardsCrosswalk?.rows.length) return null;

  const rows = standardsCrosswalk.rows;
  const total = rows.length;
  const compliantCount = rows.filter((r) => (r.exxat_compliance ?? "").toLowerCase() === "compliant").length;
  const gapRows = rows.filter((r) => {
    const c = (r.exxat_compliance ?? "").toLowerCase();
    return c === "gap" || c === "partial";
  });
  const ratedGapCount = gapRows.filter((r) => r.competitors.some((c) => c.rating && c.rating !== "unresearched")).length;

  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text type="label" color="secondary" size="sm">
          Where Exxat stands vs. the market
        </Text>
        <Text type="body" color="secondary">
          Exxat meets <b>{compliantCount} of {total}</b> {standardsCrosswalk.accreditor.split("(")[0].trim()} standards
          today.
          {gapRows.length
            ? ` The ${gapRows.length} gap${gapRows.length > 1 ? "s" : ""} below — ${ratedGapCount} already ${ratedGapCount === 1 ? "has" : "have"} a real, sourced competitor covering it.`
            : " No gaps are currently rated for this accreditor."}
        </Text>
      </Stack>

      {gapRows.length ? (
        <Stack gap={3}>
          {gapRows.map((row) => {
            const rated = row.competitors.filter((c) => c.rating && c.rating !== "unresearched");
            return (
              <Card key={row.element_id} variant="default">
                <Stack gap={2}>
                  {/* GapChain's own header card already carries the title and
                      the Exxat compliance badge — repeating both again right
                      below it was pure restatement, not added information.
                      The element_id (the standard's formal citation) is the
                      only thing worth keeping here. */}
                  <GapChain
                    title={row.element_title || row.element_id}
                    compliance={row.exxat_compliance}
                    best={bestRated(rated)}
                  />
                  <Text type="supporting" size="xsm" color="secondary">
                    {row.element_id}
                  </Text>
                  {row.exxat_compliance_rationale || row.gap_notes ? (
                    <Text type="supporting" size="sm" color="secondary">
                      {row.exxat_compliance_rationale || row.gap_notes}
                    </Text>
                  ) : null}

                  {row.researchSources.length ? (
                    <Stack gap={1}>
                      <Text type="label" color="secondary" size="xsm">
                        What the literature says
                      </Text>
                      <SourceList sources={row.researchSources} />
                    </Stack>
                  ) : null}

                  {rated.length ? (
                    <Stack gap={1.5} style={{ paddingTop: 4 }}>
                      {rated.map((c) => (
                        <Stack key={c.slug} gap={1}>
                          <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                            <Text type="body" size="sm" color="secondary">
                              →
                            </Text>
                            <CompetitorLogo slug={c.slug} competitor={c.competitor} size={20} />
                            <Link href={`/competitors/${c.slug}`} color="accent" hasUnderline>
                              {c.competitor}
                            </Link>
                            <StandardsRatingBadge rating={c.rating} />
                            {c.competitorFeatureRef ? (
                              <Text type="supporting" size="sm">
                                via <b>{c.competitorFeatureRef}</b>
                              </Text>
                            ) : null}
                          </Stack>
                          {c.rationale ? (
                            <Text
                              type="supporting"
                              size="xsm"
                              color="secondary"
                              maxLines={3}
                              style={{ paddingLeft: 28 }}
                            >
                              {c.rationale}
                            </Text>
                          ) : null}
                          {c.sources.length ? (
                            <div style={{ paddingLeft: 28 }}>
                              <SourceList sources={c.sources} />
                            </div>
                          ) : null}
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Text type="supporting" size="sm" color="secondary" style={{ fontStyle: "italic" }}>
                      No competitor confirmed against this specific standard yet — unresearched, not "nobody solves it."
                    </Text>
                  )}
                  {/* This card only ever listed the rated slice — the rest of
                      row.competitors (often most of them) just vanished, with
                      nothing telling a reader they were even considered. Named
                      here in one compact line rather than full cards, since
                      this is the bite-sized answer key, not the exhaustive
                      Standards tab (which does give each one its own card). */}
                  {row.competitors.length > rated.length ? (
                    <Text type="supporting" size="xsm" color="secondary" style={{ paddingTop: rated.length ? 4 : 0 }}>
                      Not yet researched against this standard:{" "}
                      {row.competitors
                        .filter((c) => !c.rating || c.rating === "unresearched")
                        .map((c) => c.competitor)
                        .join(", ")}
                    </Text>
                  ) : null}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      ) : null}

      <Text type="label" color="secondary" size="xsm">
        <Link href={`/domains/${slug}/standards`} color="accent" hasUnderline>
          See all {total} standards, including the {compliantCount} Exxat already meets →
        </Link>
      </Text>

      {landscapeEntry?.competitors.length ? (
        <>
          <Divider />
          <Stack gap={2}>
            <Text type="label" color="secondary" size="sm">
              Who else is active in this market
            </Text>
            <List hasDividers>
              {landscapeEntry.competitors.slice(0, 5).map((c) => (
                <ListItem
                  key={c.slug}
                  href={`/competitors/${c.slug}`}
                  label={
                    <Stack direction="horizontal" gap={2} vAlign="center">
                      <CompetitorLogo slug={c.slug} competitor={c.competitor} size={20} />
                      <Text type="body" weight="semibold">
                        {c.competitor}
                      </Text>
                    </Stack>
                  }
                  description={<Text type="supporting" size="sm" maxLines={2}>{c.rationale}</Text>}
                  endContent={<ThreatBadge threat={c.threat} />}
                />
              ))}
            </List>
            <Text type="label" color="secondary" size="xsm">
              <Link href={`/domains/${slug}/competitors`} color="accent" hasUnderline>
                See the full pillar-by-pillar feature comparison →
              </Link>
            </Text>
          </Stack>
        </>
      ) : null}
    </Stack>
  );
}
