import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Badge } from "@astryxdesign/core/Badge";
import { Divider } from "@astryxdesign/core/Divider";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PageHeader } from "@/components/page-header";
import { JourneyStageSection } from "@/components/journey-stage-section";
import { SeverityDistributionChart } from "@/components/charts/severity-distribution-chart";
import { JourneyStepper } from "@/components/charts/journey-stepper";
import { listJourneys, getJourney, getFlowsByStageForJourney } from "@/lib/content";

export function generateStaticParams() {
  return listJourneys().map((j) => ({ slug: j.slug }));
}

export default async function JourneyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journey = getJourney(slug);
  if (!journey) notFound();

  const flowsByStage = getFlowsByStageForJourney(slug);
  const stages = journey.stages ?? [];
  const hasDisciplineVariance = stages.some((s) => s.discipline_variance);

  const allFlows = Object.values(flowsByStage);
  const allElements = allFlows.flatMap((f) => f.steps?.flatMap((s) => s.elements ?? []) ?? []);
  const gapCount = allElements.filter(
    (e) => e.gap_severity === "gap" || e.gap_severity === "configure-needed"
  ).length;
  const severityByStage = stages.flatMap((stage, i) => {
    const flow = flowsByStage[i + 1];
    if (!flow) return [];
    const label = /^\d+[.)]/.test(stage.stage.trim()) ? stage.stage : `${i + 1}. ${stage.stage}`;
    return (flow.steps ?? []).flatMap((s) => (s.elements ?? []).map((e) => ({ label, severity: e.gap_severity })));
  });

  const stepperStages = stages.map((stage, i) => {
    const flow = flowsByStage[i + 1];
    const elements = flow?.steps?.flatMap((s) => s.elements ?? []) ?? [];
    const label = /^\d+[.)]/.test(stage.stage.trim()) ? stage.stage : `${i + 1}. ${stage.stage}`;
    const severityCounts: Record<string, number> = {};
    for (const e of elements) {
      const key = e.gap_severity ?? "none";
      severityCounts[key] = (severityCounts[key] ?? 0) + 1;
    }
    return {
      index: i,
      label,
      severityCounts,
      elementCount: elements.length,
      gapCount: elements.filter((e) => e.gap_severity === "gap" || e.gap_severity === "configure-needed").length,
      flowSlug: flow?.slug,
      flowName: flow?.flow_name,
    };
  });

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Breadcrumbs>
            <BreadcrumbItem href="/journeys">Journeys</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{journey.journey_name}</BreadcrumbItem>
          </Breadcrumbs>
          <PageHeader
            eyebrow="Journey"
            title={journey.journey_name}
            description={`${stages.length} stages · citing ${Object.keys(flowsByStage).length} element-level flow file${
              Object.keys(flowsByStage).length === 1 ? "" : "s"
            }`}
          />
          {journey.persona ? (
            <Stack gap={1}>
              <Text type="label" color="secondary">
                Persona
              </Text>
              <Text type="body">{journey.persona}</Text>
            </Stack>
          ) : null}
          <Stack direction="horizontal" gap={1.5} wrap="wrap">
            {(journey.domain_scope ?? []).map((d) => (
              <Badge key={d} variant="neutral" label={d} />
            ))}
            {hasDisciplineVariance ? (
              <Badge variant="info" label="8 existing disciplines mapped" />
            ) : null}
          </Stack>

          <MetadataList columns={4}>
            <MetadataListItem label="Stages">{stages.length}</MetadataListItem>
            <MetadataListItem label="Element-level flow files">{allFlows.length}</MetadataListItem>
            <MetadataListItem label="Elements verified">{allElements.length}</MetadataListItem>
            <MetadataListItem label="Need attention">{gapCount}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      {stepperStages.length > 0 ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={3}>
            <Heading level={2}>The shape of this journey</Heading>
            <JourneyStepper stages={stepperStages} />
          </Stack>
        </Section>
      ) : null}

      {severityByStage.length > 0 ? (
        <Section padding={6} dividers={["bottom"]} variant="muted">
          <Stack gap={3}>
            <Heading level={2}>Where the gaps are, stage by stage</Heading>
            <SeverityDistributionChart rows={severityByStage} />
          </Stack>
        </Section>
      ) : null}

      <Section padding={6} variant="muted">
        <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />
      </Section>

      <Section padding={6}>
        {stages.length === 0 ? (
          <EmptyState title="No stages mapped yet" />
        ) : (
          <CollapsibleGroup type="multiple" hasDividers>
            {stages.map((stage, i) => (
              <Collapsible
                key={i}
                value={String(i)}
                defaultIsOpen={i === 0}
                trigger={/^\d+[.)]/.test(stage.stage.trim()) ? stage.stage : `${i + 1}. ${stage.stage}`}
              >
                <Stack paddingBlockStart={4}>
                  <JourneyStageSection stage={stage} index={i} flow={flowsByStage[i + 1]} />
                </Stack>
              </Collapsible>
            ))}
          </CollapsibleGroup>
        )}
      </Section>
    </Stack>
  );
}
