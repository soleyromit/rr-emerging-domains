"use client";

import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { Link } from "@astryxdesign/core/Link";
import { KeyFindingList } from "@/components/key-finding-list";
import { DisciplineVarianceList } from "@/components/discipline-variance-list";
import { FlowDetail } from "@/components/flow-detail";
import { FieldBlock } from "@/components/field-block";
import type { Flow, JourneyStage } from "@/lib/content";

// Every long-form prose field in a stage (the four original narrative fields, plus
// domain/discipline variance) gets the SAME treatment via FieldBlock: a one-line clamp
// with a tooltip, expandable on demand. Nothing renders as an unclamped paragraph,
// anywhere on this page.

export function JourneyStageSection({
  stage,
  flow,
}: {
  stage: JourneyStage;
  index: number;
  flow?: Flow;
}) {
  return (
    <Stack gap={5}>
      {stage.key_findings?.length ? (
        <Stack gap={2}>
          <Text type="label" color="secondary">
            Key findings — scan first, expand a section below only if you need the detail
          </Text>
          <KeyFindingList findings={stage.key_findings} />
        </Stack>
      ) : null}

      <Stack gap={3}>
        <FieldBlock label="Current state in Prism" text={stage.current_state_in_prism} />
        <FieldBlock label="Pain / gap" text={stage.pain_or_gap} />
        <FieldBlock label="Accreditation link" text={stage.accreditation_link} />
        <FieldBlock label="Competitor comparison" text={stage.competitor_comparison} />
      </Stack>

      {stage.domain_variance || stage.discipline_variance || stage.discipline_notes?.length ? (
        <Stack gap={3}>
          <FieldBlock
            label="Domain variance (DO · Pharmacy · Dentistry · Medicine)"
            text={stage.domain_variance}
          />
          {stage.discipline_notes?.length ? (
            <DisciplineVarianceList notes={stage.discipline_notes} />
          ) : (
            <FieldBlock
              label="Discipline variance (PT/PTA · OT/OTA · PA · SLP · Nursing · Social Work · Teacher Ed · CRNA)"
              text={stage.discipline_variance}
            />
          )}
        </Stack>
      ) : null}

      <Divider />

      <Stack gap={3}>
        <Stack direction="horizontal" hAlign="between" gap={2} wrap="wrap">
          <Text type="label" color="secondary">
            Element-level evidence
          </Text>
          {flow ? (
            <Link href={`/flows/${flow.slug}`} size="sm" color="accent" hasUnderline>
              Open as standalone page →
            </Link>
          ) : null}
        </Stack>
        <FlowDetail flow={flow} />
      </Stack>
    </Stack>
  );
}
