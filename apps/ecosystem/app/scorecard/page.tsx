import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Banner } from "@astryxdesign/core/Banner";
import { PageHeader } from "@/components/page-header";
import { ScorecardChart } from "@/components/charts/scorecard-chart";
import { ScorecardTable } from "@/components/scorecard-table";
import { getScorecard, computeWeightedTotals, scorecardDomains } from "@/lib/content";

export default function ScorecardPage() {
  const scorecard = getScorecard();

  if (!scorecard) {
    return (
      <Section padding={6}>
        <Text type="supporting">No scorecard found.</Text>
      </Section>
    );
  }

  // Single source of truth for this page's domain list — the table and the placeholder
  // check both read it, so neither can drift from the data or from each other.
  const domains = scorecardDomains(scorecard);
  const totals = computeWeightedTotals(scorecard, domains);
  const isPlaceholder = scorecard.criteria.every((c) => domains.every((d) => (c.scores?.[d] ?? 0) === 0));

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Strategy"
            title={
              scorecard.actual_gtm_target
                ? `${scorecard.actual_gtm_target} is the confirmed first domain to enter`
                : scorecard.recommended_beachhead
                  ? `${scorecard.recommended_beachhead} is the recommended beachhead`
                  : "Where-to-play scorecard"
            }
            description={
              <>
                Borrowed from Lafley &amp; Martin&apos;s <em>Playing to Win</em> — score each domain, don&apos;t
                just list them. Weights sum to 100%.
              </>
            }
          />
          {isPlaceholder ? (
            <Banner status="warning" title="Scores are still placeholders" description="This view will fill in once the synthesis pass completes." />
          ) : (
            <Stack gap={3}>
              {scorecard.actual_gtm_target ? (
                <Card variant="blue">
                  <Stack gap={2}>
                    <Text type="label" color="secondary">
                      Confirmed GTM target{scorecard.actual_gtm_target_decided ? ` — ${scorecard.actual_gtm_target_decided}` : ""}
                    </Text>
                    <Text type="body" maxLines={6}>
                      {scorecard.actual_gtm_target_rationale}
                    </Text>
                  </Stack>
                </Card>
              ) : null}
              {scorecard.recommended_beachhead ? (
                <Card variant="pink">
                  <Stack gap={2}>
                    <Text type="label" color="secondary">
                      {scorecard.actual_gtm_target ? "What the scorecard's own math says wins" : "Why it wins"}
                    </Text>
                    <Text type="body" maxLines={3}>
                      {scorecard.rationale}
                    </Text>
                  </Stack>
                </Card>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Heading level={2}>Weighted scorecard</Heading>
          <ScorecardChart scorecard={scorecard} totals={totals} />
        </Stack>
      </Section>

      <Section padding={6}>
        <Stack gap={3}>
          <Stack gap={1}>
            <Heading level={2}>Scoring detail</Heading>
            <Text type="supporting">1–5 per criterion per domain, with rationale.</Text>
          </Stack>
          <ScorecardTable criteria={scorecard.criteria} domains={domains} />
        </Stack>
      </Section>
    </Stack>
  );
}
