import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { List, ListItem } from "@astryxdesign/core/List";
import { ThreatBadge } from "@/components/fit-badge";
import { FeatureDepthChart } from "@/components/charts/feature-depth-chart";
import { DomainFeatureComparisonTable } from "@/components/domain-feature-comparison-table";
import { humanizeSourceRef } from "@/lib/strip-file-citations";
import { SentenceList } from "@/components/sentence-list";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import { getAccreditorTiers, getDomainHubData } from "@/lib/content";

const VISIBLE_COMPETITOR_COUNT = 4;

export default async function DomainCompetitorsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  const { landscapeEntry, featureComparison } = getDomainHubData(entry.domain, slug);
  const visibleCompetitors = landscapeEntry?.competitors.slice(0, VISIBLE_COMPETITOR_COUNT) ?? [];
  const overflowCompetitors = landscapeEntry?.competitors.slice(VISIBLE_COMPETITOR_COUNT) ?? [];

  return (
    <>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Text type="label" color="secondary" size="sm">
            Competitor landscape
          </Text>
          {landscapeEntry?.note ? (
            <Text type="body" size="sm" color="secondary" maxLines={2}>
              {landscapeEntry.note}
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
                    label={c.competitor}
                    description={<Text type="supporting" size="sm" maxLines={2}>{c.rationale}</Text>}
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
                        label={c.competitor}
                        description={<Text type="supporting" size="sm" maxLines={2}>{c.rationale}</Text>}
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
              <DomainFeatureComparisonTable featureComparison={featureComparison} />
              <FeatureDepthChart domain={featureComparison} />
            </Stack>
          )}
        </Stack>
      </Section>
    </>
  );
}
