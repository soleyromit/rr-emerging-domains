"use client";

import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { GapSeverityBadge } from "@/components/fit-badge";
import { FieldBlock } from "@/components/field-block";
import { stripFileCitations } from "@/lib/strip-file-citations";
import type { FlowElement, FlowStep } from "@/lib/content";

interface ElementRow extends Record<string, unknown> {
  _id: string;
  element: string;
  type?: string;
  accreditation_citation?: string;
  competitor_equivalent?: string;
  gap_severity?: string;
  gap_note?: string;
}

function FlowElementsTable({ elements }: { elements: FlowElement[] }) {
  const rows: ElementRow[] = elements.map((e, i) => ({ ...e, _id: `${e.element}-${i}` }));
  return (
    <Table<ElementRow>
      data={rows}
      idKey="_id"
      density="balanced"
      textOverflow="wrap"
      verticalAlign="top"
      columns={[
        {
          key: "element",
          header: "Field / button / column",
          width: proportional(1),
          renderCell: (row) => (
            <Stack gap={0.5}>
              <Text type="body" weight="semibold">
                {stripFileCitations(row.element)}
              </Text>
              {row.type ? <Text type="supporting">{stripFileCitations(row.type)}</Text> : null}
            </Stack>
          ),
        },
        {
          key: "accreditation_citation",
          header: "Accreditation citation",
          width: proportional(1),
          renderCell: (row) => (
            <Text type="supporting" maxLines={2}>
              {stripFileCitations(row.accreditation_citation) || "—"}
            </Text>
          ),
        },
        {
          key: "competitor_equivalent",
          header: "Competitor equivalent",
          width: proportional(1.3),
          renderCell: (row) => (
            <Text type="supporting" maxLines={2}>
              {stripFileCitations(row.competitor_equivalent) || "—"}
            </Text>
          ),
        },
        {
          key: "gap_severity",
          header: "Gap",
          width: pixel(160),
          renderCell: (row) => (
            <Stack gap={1}>
              <GapSeverityBadge severity={row.gap_severity} />
              <FieldBlock
                id={`${row._id}-gap-note`}
                text={stripFileCitations(row.gap_note)}
                type="supporting"
                triggerLabel="Read full note"
              />
            </Stack>
          ),
        },
      ]}
    />
  );
}

// Step id used as the Collapsible value — exported so the parent CollapsibleGroup can
// set which step opens by default (see journey-stage-section.tsx).
export function flowStepId(index: number) {
  return `step-${index}`;
}

export function FlowStepDetail({ step, index }: { step: FlowStep; index: number }) {
  const elementCount = step.elements?.length ?? 0;
  const gapCount = (step.elements ?? []).filter(
    (e) => e.gap_severity === "gap" || e.gap_severity === "configure-needed"
  ).length;

  return (
    <Card padding={0}>
      <Collapsible
        value={flowStepId(index)}
        trigger={
          <Stack gap={1} width="100%">
            <Stack direction="horizontal" hAlign="between" gap={2} wrap="wrap">
              <Text type="body" weight="semibold">
                {index + 1}. {step.screen}
              </Text>
              <Stack direction="horizontal" gap={1.5}>
                <Badge variant="neutral" label={`${elementCount} field${elementCount === 1 ? "" : "s"}`} />
                {gapCount > 0 ? (
                  <Badge variant="warning" label={`${gapCount} need${gapCount === 1 ? "s" : ""} attention`} />
                ) : null}
              </Stack>
            </Stack>
            {step.navigation_path ? (
              <Text type="supporting" size="xsm">
                {step.navigation_path}
              </Text>
            ) : null}
          </Stack>
        }
      >
        <Stack gap={3} paddingBlockStart={2}>
          {step.action ? (
            <Text type="supporting" maxLines={3}>
              {stripFileCitations(step.action)}
            </Text>
          ) : null}
          {step.confirmed_by ? (
            <Collapsible
              value={`src-${index}`}
              defaultIsOpen={false}
              trigger={
                <Text type="label" color="secondary" size="sm">
                  Source
                </Text>
              }
            >
              <Text type="supporting" size="xsm">
                {stripFileCitations(step.confirmed_by)}
              </Text>
            </Collapsible>
          ) : null}
          {step.elements?.length ? <FlowElementsTable elements={step.elements} /> : null}
        </Stack>
      </Collapsible>
    </Card>
  );
}
