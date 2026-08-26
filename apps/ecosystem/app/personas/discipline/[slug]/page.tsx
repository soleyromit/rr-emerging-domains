import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { DisciplineChip } from "@/components/discipline-chip";
import { FieldBlock } from "@/components/field-block";
import { PersonaSpecList } from "@/components/persona-spec-list";
import { ProseItemList } from "@/components/prose-item-list";
import { SentenceList } from "@/components/sentence-list";
import { listDisciplinePersonas, getDisciplinePersona, resolveRelatedFlows } from "@/lib/content";

export function generateStaticParams() {
  return listDisciplinePersonas().map((p) => ({ slug: p.slug }));
}

export default async function DisciplinePersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const persona = getDisciplinePersona(slug);
  if (!persona) notFound();

  const jtbdItems = (persona.jtbd ?? []).map((j) => ({
    primary: j.job,
    secondary: j.evidence_or_rationale,
    secondaryLabel: "Evidence / rationale",
    relatedFlows: resolveRelatedFlows(j.related_flows),
  }));

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Breadcrumbs>
            <BreadcrumbItem href="/personas">Personas</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{persona.persona_name}</BreadcrumbItem>
          </Breadcrumbs>
          <Stack gap={2}>
            <DisciplineChip subject={persona.domain} />
            <PageHeader eyebrow="Discipline persona" title={persona.persona_name ?? persona.domain} />
          </Stack>
          <MetadataList columns={4}>
            <MetadataListItem label="Pressure points">{persona.accreditation_pressure?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Current tools">{persona.current_tools?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Jobs to be done">{persona.jtbd?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Sources cited">{persona.sources?.length ?? 0}</MetadataListItem>
          </MetadataList>
          {persona.archetype_summary ? (
            // DENSITY-OK: dedicated persona detail page — the archetype summary is
            // this page's whole reason to exist, shown in full, not the index card's
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
    </Stack>
  );
}
