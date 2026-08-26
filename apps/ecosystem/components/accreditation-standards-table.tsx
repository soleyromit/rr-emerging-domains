"use client";

import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { FitBadge } from "@/components/fit-badge";
import { FieldBlock } from "@/components/field-block";
import type { AccreditationStandard } from "@/lib/content";

interface StandardRow extends Record<string, unknown> {
  element_id: string;
  element_title?: string;
  evidence_programs_must_produce?: string;
  required_software_behavior?: string;
  prism_fit?: string;
  prism_fit_rationale?: string;
  gap_notes?: string;
}

export function AccreditationStandardsTable({ standards }: { standards: AccreditationStandard[] }) {
  return (
    <Table<StandardRow>
      data={standards as StandardRow[]}
      idKey={(row) => row.element_id}
      density="balanced"
      textOverflow="wrap"
      verticalAlign="top"
      columns={[
        {
          key: "element_id",
          header: "Element",
          width: pixel(180),
          renderCell: (row) => (
            <Stack gap={0.5}>
              <Text type="body" weight="semibold" size="sm">
                {row.element_id}
              </Text>
              {row.element_title ? <Text type="supporting" size="xsm">{row.element_title}</Text> : null}
            </Stack>
          ),
        },
        {
          key: "evidence_programs_must_produce",
          header: "Evidence required",
          width: proportional(1.4),
          renderCell: (row) => (
            <FieldBlock text={row.evidence_programs_must_produce} type="supporting" maxLines={3} />
          ),
        },
        {
          key: "required_software_behavior",
          header: "Required software behavior",
          width: proportional(1.4),
          renderCell: (row) => (
            <FieldBlock text={row.required_software_behavior} type="supporting" maxLines={3} />
          ),
        },
        {
          key: "prism_fit",
          header: "Prism fit",
          width: pixel(180),
          renderCell: (row) => (
            <Stack gap={1}>
              <FitBadge fit={row.prism_fit} />
              <FieldBlock text={row.prism_fit_rationale} type="supporting" size="xsm" maxLines={3} />
            </Stack>
          ),
        },
        {
          key: "gap_notes",
          header: "Gap notes",
          width: proportional(1),
          renderCell: (row) => (
            <FieldBlock text={row.gap_notes} type="supporting" maxLines={3} />
          ),
        },
      ]}
    />
  );
}
