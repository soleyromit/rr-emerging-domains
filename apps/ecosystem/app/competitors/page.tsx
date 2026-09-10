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
import { leadSentence } from "@/lib/text";
import { listCompetitors } from "@/lib/content";

export default function CompetitorsPage() {
  const competitors = listCompetitors().sort((a, b) => a.competitor.localeCompare(b.competitor));

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Market"
            title="Every incumbent already ships what Prism's 2027 roadmap promises — but none of them enforce compliance"
            description="Feature-level teardown per competitor, judged against Prism's real pillars. Every claim below is sourced."
          />
          <Takeaway title="Accreditors want enforcement; competitors ship reporting — that's Prism's most defensible platform claim">
            All six MD/DO-serving vendors ship surveys, and most ship some accreditation reporting — areas where
            Prism is still pre-roadmap. But not one publicly documents a hard <em>block</em> the way several
            accreditors now require (e.g. a preceptor-orientation gate, a 2:1 ratio cap). That&apos;s a capability
            Compliance Management already has, just not extended past students. Three vendors are also mid-acquisition
            right now (New Innovations↔QGenda, Leo↔Elentra, MedHub↔Ascend) — real switching windows.
          </Takeaway>
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Heading level={2}>Depth vs. Prism, by competitor</Heading>
          <Text type="supporting">
            Count of assessed pillars per depth judgment: behind Prism, at parity, ahead of Prism, or Prism-only.
          </Text>
          <CompetitorDepthChart competitors={competitors} />
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Heading level={2}>At a glance</Heading>
          <Text type="supporting">Every competitor's single biggest strength and weakness, in one scan — no expanding required.</Text>
          {competitors.length ? <CompetitorScanTable competitors={competitors} /> : null}
        </Stack>
      </Section>

      <Section padding={6}>
        <Stack gap={3}>
          <Stack gap={1}>
            <Heading level={2}>Full teardowns ({competitors.length})</Heading>
            <Text type="supporting">Open a competitor for company facts, full strengths/weaknesses, and the sourced feature-by-feature dossier.</Text>
          </Stack>
          {competitors.length === 0 ? (
            <EmptyState title="No competitor teardowns yet" description="This view populates as content/competitors/*.yaml fills in." />
          ) : (
            <Grid columns={{ minWidth: 320 }} gap={4}>
              {competitors.map((c) => {
                const signal = c.exxat_opportunity
                  ? leadSentence(c.exxat_opportunity)
                  : c.strengths?.[0]
                    ? leadSentence(c.strengths[0].claim)
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
          )}
        </Stack>
      </Section>
    </Stack>
  );
}
