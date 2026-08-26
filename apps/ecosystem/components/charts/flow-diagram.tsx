import { Stack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { SeverityMiniBar } from "@/components/severity-mini-bar";
import type { GapSeverity } from "@/lib/severity";
import type { FlowElement, FlowStep } from "@/lib/content";

export interface FlowDiagramStep {
  index: number;
  screen: string;
  navigationPath?: string;
  /** true when navigationPath starts with "Any screen" — a persistent/global-access
   * item, not a sequential step. Flagged rather than given an invented graph edge. */
  isGlobal: boolean;
  elementCount: number;
  severityCounts: Partial<Record<GapSeverity, number>>;
  competitorComparableCount: number;
}

function hasComparableCompetitorEvidence(el: FlowElement): boolean {
  return !!el.competitor_equivalent && !/not comparable/i.test(el.competitor_equivalent);
}

export function buildFlowDiagramSteps(steps: FlowStep[]): FlowDiagramStep[] {
  return steps.map((step, index) => {
    const elements = step.elements ?? [];
    const severityCounts: Partial<Record<GapSeverity, number>> = {};
    for (const el of elements) {
      const key = (el.gap_severity ?? "none") as GapSeverity;
      severityCounts[key] = (severityCounts[key] ?? 0) + 1;
    }
    return {
      index,
      screen: step.screen,
      navigationPath: step.navigation_path,
      isGlobal: /^any screen/i.test(step.navigation_path ?? ""),
      elementCount: elements.length,
      severityCounts,
      competitorComparableCount: elements.filter(hasComparableCompetitorEvidence).length,
    };
  });
}

// One node per steps[] entry, in documented order — deliberately NOT a general
// graph: real flow content has alternate-path steps (e.g. "standard login" vs
// "SSO") and global/persistent-UI steps sitting as plain array entries with no
// edge field to disambiguate. Rendering this as an authored reading order
// ("Screens in this flow, in documented order," not "user path") is the honest
// answer — inventing branch-detection heuristics would assert structure the
// content doesn't. See UI-DENSITY-PATTERNS.md's hierarchy section.
export function FlowDiagram({ flowName, steps }: { flowName: string; steps: FlowDiagramStep[] }) {
  if (!steps.length) return null;
  return (
    <Stack gap={2}>
      <Text type="label" color="secondary" size="xsm">
        Screens in this flow, in documented order — scroll to see the rest →
      </Text>
      <Stack
        direction="horizontal"
        wrap="nowrap"
        isScrollable
        gap={0}
        vAlign="stretch"
        paddingBlockEnd={2}
        aria-label={`${flowName} — screen sequence`}
      >
        {steps.map((step, i) => (
          <Stack key={step.index} direction="horizontal" gap={0} vAlign="center" style={{ flexShrink: 0 }}>
            <StepNode step={step} />
            {i < steps.length - 1 && !step.isGlobal ? (
              <Icon icon="chevronRight" size="sm" color="secondary" aria-hidden="true" />
            ) : null}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function StepNode({ step }: { step: FlowDiagramStep }) {
  return (
    <Card variant={step.isGlobal ? "muted" : "default"} padding={3}>
      <Stack gap={1.5} width={200}>
        <Text type="body" weight="semibold" size="sm" maxLines={2}>
          {step.index + 1}. {step.screen}
        </Text>
        {step.navigationPath ? (
          <Text type="supporting" size="xsm" maxLines={2}>
            {step.navigationPath}
          </Text>
        ) : null}
        <SeverityMiniBar counts={step.severityCounts} />
        <Stack direction="horizontal" gap={1} wrap="wrap">
          {step.isGlobal ? (
            <Badge variant="neutral" label="Available from any screen" />
          ) : (
            <Badge
              variant="neutral"
              label={`${step.competitorComparableCount} of ${step.elementCount} elements compared`}
            />
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
