import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Divider } from "@astryxdesign/core/Divider";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { FlowDetail } from "@/components/flow-detail";
import { FlowDiagram, buildFlowDiagramSteps } from "@/components/charts/flow-diagram";
import { SentenceList } from "@/components/sentence-list";
import { listFlows, getFlowBySlug, getJourneyContextForFlow } from "@/lib/content";

export function generateStaticParams() {
  return listFlows().map((f) => ({ slug: f.slug }));
}

export default async function FlowDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const flow = getFlowBySlug(slug);
  if (!flow) notFound();

  const journeyContext = getJourneyContextForFlow(flow);
  const stepCount = flow.steps?.length ?? 0;
  const elementCount = flow.steps?.flatMap((s) => s.elements ?? []).length ?? 0;
  const diagramSteps = buildFlowDiagramSteps(flow.steps ?? []);

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Breadcrumbs>
            <BreadcrumbItem href="/journeys">Journeys</BreadcrumbItem>
            {journeyContext ? (
              <BreadcrumbItem href={`/journeys/${journeyContext.journey.slug}`}>
                {journeyContext.journey.journey_name}
              </BreadcrumbItem>
            ) : null}
            <BreadcrumbItem isCurrent>{journeyContext?.stage?.stage ?? flow.flow_name}</BreadcrumbItem>
          </Breadcrumbs>
          <PageHeader
            eyebrow={
              journeyContext
                ? `Flow · Stage ${journeyContext.stageNumber} of ${journeyContext.journey.stages?.length ?? "?"}`
                : "Element-level flow"
            }
            title={flow.flow_name}
            description={flow.persona ? `Persona: ${flow.persona}` : undefined}
          />
          <MetadataList columns={4}>
            <MetadataListItem label="Steps">{stepCount}</MetadataListItem>
            <MetadataListItem label="Elements verified">{elementCount}</MetadataListItem>
            <MetadataListItem label="Sources cited">{flow.sources?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Last verified">{flow.last_verified ?? "—"}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      {diagramSteps.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <FlowDiagram flowName={flow.flow_name} steps={diagramSteps} />
        </Section>
      ) : null}

      <Section padding={6} variant="muted">
        <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <FlowDetail flow={flow} />
      </Section>

      {flow.sources?.length ? (
        <Section padding={6}>
          <Collapsible defaultIsOpen={false} trigger={`Sources (${flow.sources.length})`}>
            <SentenceList items={flow.sources} maxLines={2} fallbackIcon="copy" />
          </Collapsible>
        </Section>
      ) : null}
    </Stack>
  );
}
