import { Stack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";

export interface ClinicalEducationTimelineStage {
  when: string;
  label: string;
  headlineStat: string;
  detail: string;
}

// Same hand-composed Card+chevron idiom as charts/flow-diagram.tsx and
// charts/journey-stepper.tsx — the repo's established "shape of the whole
// thing before the deep dive" pattern — applied to a domain's own clinical-
// education structure instead of a flow/journey. Not a Plot/SVG chart: this is
// a small, fixed, hand-authored sequence (2-4 stages), not statistically
// encoded data, so it doesn't belong in the chart library.
export function ClinicalEducationTimeline({ stages }: { stages: ClinicalEducationTimelineStage[] }) {
  if (!stages.length) return null;
  return (
    <Stack direction="horizontal" wrap="nowrap" isScrollable gap={0} vAlign="stretch" paddingBlockEnd={2}>
      {stages.map((stage, i) => (
        <Stack key={stage.label} direction="horizontal" gap={0} vAlign="center" style={{ flexShrink: 0 }}>
          <Card variant="default" padding={3}>
            <Stack gap={1.5} width={220}>
              <Text type="label" color="secondary" size="xsm">
                {stage.when}
              </Text>
              <Text type="body" weight="semibold" size="sm">
                {stage.label}
              </Text>
              <Badge variant="blue" label={stage.headlineStat} />
              <Text type="supporting" size="xsm" maxLines={4}>
                {stage.detail}
              </Text>
            </Stack>
          </Card>
          {i < stages.length - 1 ? (
            <Icon icon="chevronRight" size="sm" color="secondary" aria-hidden="true" />
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
}
