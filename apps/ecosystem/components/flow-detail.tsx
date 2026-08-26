"use client";

import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Stack } from "@astryxdesign/core/Stack";
import { FlowStepDetail, flowStepId } from "@/components/flow-step-detail";
import { SeverityDistributionChart } from "@/components/charts/severity-distribution-chart";
import type { Flow } from "@/lib/content";

// The single "given a Flow, render its screen-by-screen element evidence" block —
// used both nested inside a journey stage (journey-stage-section.tsx) and on the
// standalone /flows/[slug] page. One implementation, two call sites.
export function FlowDetail({ flow }: { flow?: Flow }) {
  if (!flow?.steps?.length) {
    return (
      <EmptyState
        title="No flow file mapped to this stage yet"
        description="Screen-by-screen verification hasn't been written for this stage."
      />
    );
  }

  const allElements = flow.steps.flatMap((s) => s.elements ?? []);
  const gapCount = allElements.filter(
    (e) => e.gap_severity === "gap" || e.gap_severity === "configure-needed"
  ).length;

  return (
    <Stack gap={3}>
      <MetadataList columns={3}>
        <MetadataListItem label="Steps">{flow.steps.length}</MetadataListItem>
        <MetadataListItem label="Elements">{allElements.length}</MetadataListItem>
        <MetadataListItem label="Need attention">{gapCount}</MetadataListItem>
      </MetadataList>
      <SeverityDistributionChart
        rows={flow.steps.flatMap((step) =>
          (step.elements ?? []).map((el) => ({ label: step.screen, severity: el.gap_severity }))
        )}
      />
      <CollapsibleGroup type="multiple" hasDividers={false} defaultValue={[flowStepId(0)]}>
        <Stack gap={3}>
          {flow.steps.map((step, i) => (
            <FlowStepDetail key={i} step={step} index={i} />
          ))}
        </Stack>
      </CollapsibleGroup>
    </Stack>
  );
}
