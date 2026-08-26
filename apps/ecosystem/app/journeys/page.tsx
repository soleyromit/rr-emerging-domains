import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Badge } from "@astryxdesign/core/Badge";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { listJourneys, getFlowsByStageForJourney } from "@/lib/content";

export default function JourneysPage() {
  const journeys = listJourneys();

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Customer"
            title="Evidence gets lost at two points — intake and findings — across every domain"
            description="Stage by stage, cross-referencing current state, gaps, accreditation, competitors, and — where researched — discipline-level variance. Open a journey for the full element-level walkthrough."
          />
          <Takeaway title="The two-clock problem">
            Every self-study runs on a 7-10 year cycle and an annual/interim obligation at the same time, and all
            four accreditors now write the continuous clock into the standard itself. A build scoped as a
            document generator solves the final assembly stage and misses the two stages where evidence actually
            disappears: no crosswalk exists at intake, and nothing records that a finding caused an action.
          </Takeaway>
        </Stack>
      </Section>

      <Section padding={6}>
        {journeys.length === 0 ? (
          <EmptyState title="No journeys mapped yet" description="Populates as research completes." />
        ) : (
          <Grid columns={{ minWidth: 340 }} gap={4}>
            {journeys.map((j) => {
              const flowCount = Object.keys(getFlowsByStageForJourney(j.slug)).length;
              const stageCount = j.stages?.length ?? 0;
              const hasDisciplineVariance = (j.stages ?? []).some((s) => s.discipline_variance);
              return (
                <ClickableCard key={j.slug} href={`/journeys/${j.slug}`} label={j.journey_name}>
                  <Stack gap={3}>
                    <Stack gap={1}>
                      <Heading level={3}>{j.journey_name}</Heading>
                      <Text type="supporting">{stageCount} stages</Text>
                    </Stack>
                    <Stack direction="horizontal" gap={1.5} wrap="wrap">
                      {(j.domain_scope ?? []).map((d) => (
                        <Badge key={d} variant="neutral" label={d} />
                      ))}
                      {hasDisciplineVariance ? <Badge variant="info" label="+ 8 disciplines" /> : null}
                    </Stack>
                    <Text type="supporting" size="xsm">
                      {flowCount > 0
                        ? `${flowCount} of ${stageCount} stages have element-level flow evidence`
                        : "No flow-level evidence written yet"}
                    </Text>
                  </Stack>
                </ClickableCard>
              );
            })}
          </Grid>
        )}
      </Section>
    </Stack>
  );
}
