import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PersonaSpecList } from "@/components/persona-spec-list";
import { ProseItemList } from "@/components/prose-item-list";
import { SentenceList } from "@/components/sentence-list";
import { FieldBlock } from "@/components/field-block";
import { getAccreditorTiers, getDomainHubData, resolveRelatedFlows } from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

export default async function DomainPersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  const { disciplinePersona: persona } = getDomainHubData(entry.domain, slug);

  if (!persona) {
    return (
      <Section padding={6}>
        <EmptyState title="No discipline persona yet" description="Populates as research completes for this domain." />
      </Section>
    );
  }

  const jtbdItems = (persona.jtbd ?? []).map((j) => ({
    primary: j.job,
    secondary: j.evidence_or_rationale,
    secondaryLabel: "Evidence / rationale",
    relatedFlows: resolveRelatedFlows(j.related_flows),
  }));

  return (
    <>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <MetadataList columns={4}>
            <MetadataListItem label="Pressure points">{persona.accreditation_pressure?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Current tools">{persona.current_tools?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Jobs to be done">{persona.jtbd?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Sources cited">{persona.sources?.length ?? 0}</MetadataListItem>
          </MetadataList>
          {persona.archetype_summary ? (
            // DENSITY-OK: dedicated persona tab — shown in full, not an index card's
            // 3-line teaser
            <Text type="body">{persona.archetype_summary}</Text>
          ) : null}
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Grid columns={{ minWidth: 340 }} gap={5}>
          {persona.accreditation_pressure?.length ? (
            <Stack gap={2}>
              <Text type="label" color="secondary">
                Accreditation pressure ({persona.accreditation_pressure.length})
              </Text>
              <PersonaSpecList
                items={persona.accreditation_pressure.map((p) => ({ label: p.point, text: p.detail }))}
                fallbackIcon="clock"
              />
            </Stack>
          ) : null}
          {persona.current_tools?.length ? (
            <Stack gap={2}>
              <Text type="label" color="secondary">
                Current tools ({persona.current_tools.length})
              </Text>
              <PersonaSpecList
                items={persona.current_tools.map((p) => ({ label: p.point, text: p.detail }))}
                fallbackIcon="wrench"
              />
            </Stack>
          ) : null}
        </Grid>
      </Section>

      {jtbdItems.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={3}>
            <Text type="label" color="secondary">
              Jobs to be done ({jtbdItems.length})
            </Text>
            <ProseItemList items={jtbdItems} />
          </Stack>
        </Section>
      ) : null}

      {persona.switching_trigger ? (
        <Section padding={6} dividers={["bottom"]}>
          <Card variant="pink" padding={4}>
            <Stack gap={2}>
              <Text type="label" weight="semibold" size="sm">
                Switching trigger
              </Text>
              <FieldBlock text={persona.switching_trigger} maxLines={4} triggerLabel="Read the full section" />
            </Stack>
          </Card>
        </Section>
      ) : null}

      {persona.sources?.length ? (
        <Section padding={6}>
          <Collapsible defaultIsOpen={false} trigger={`Sources (${persona.sources.length})`}>
            <SentenceList items={persona.sources} maxLines={2} fallbackIcon="copy" />
          </Collapsible>
        </Section>
      ) : null}
    </>
  );
}
