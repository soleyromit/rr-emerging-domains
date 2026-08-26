import { Stack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { SeverityMiniBar } from "@/components/severity-mini-bar";
import { SEVERITY_ORDER, type GapSeverity } from "@/lib/severity";

export interface JourneyStepperStage {
  index: number;
  label: string;
  severityCounts: Partial<Record<GapSeverity, number>>;
  elementCount: number;
  gapCount: number;
  /** Only set when a flow file maps to this stage — an unmapped stage renders
   * as a plain, non-interactive card rather than a broken link. */
  flowSlug?: string;
  /** Required whenever flowSlug is set — the click target's accessible label
   * and the link text are always the flow's real name, never its slug. */
  flowName?: string;
}

// The most zoomed-out view of a journey: one node per stage, connected by neutral
// sequence arrows, each colored by its worst-case element severity. Hand-composed
// from existing design-system primitives (not a Plot/SVG chart, not a graph-layout
// library) — this is a navigational overview with real click targets, not a
// statistically-encoded plot. See UI-DENSITY-PATTERNS.md's hierarchy section.
export function JourneyStepper({ stages }: { stages: JourneyStepperStage[] }) {
  if (!stages.length) return null;
  return (
    <Stack direction="horizontal" wrap="nowrap" isScrollable gap={0} vAlign="stretch" paddingBlockEnd={2}>
      {stages.map((stage, i) => (
        <Stack key={stage.index} direction="horizontal" gap={0} vAlign="center" style={{ flexShrink: 0 }}>
          <StageNode stage={stage} />
          {i < stages.length - 1 ? (
            <Icon icon="chevronRight" size="sm" color="secondary" aria-hidden="true" />
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
}

function StageNode({ stage }: { stage: JourneyStepperStage }) {
  const content = (
    <Stack gap={1.5} width={200}>
      <Text type="label" color="secondary" size="xsm">
        Stage {stage.index + 1}
      </Text>
      <Text type="body" weight="semibold" size="sm" maxLines={2}>
        {stage.label}
      </Text>
      <SeverityMiniBar counts={stage.severityCounts} />
      <Badge
        variant="neutral"
        label={
          stage.gapCount > 0
            ? `${stage.gapCount} of ${stage.elementCount} need attention`
            : `${stage.elementCount} elements`
        }
      />
    </Stack>
  );

  if (stage.flowSlug && stage.flowName) {
    return (
      <ClickableCard label={stage.flowName} href={`/flows/${stage.flowSlug}`} padding={3}>
        {content}
      </ClickableCard>
    );
  }
  return (
    <Card variant="muted" padding={3}>
      {content}
    </Card>
  );
}
