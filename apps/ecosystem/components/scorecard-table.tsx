"use client";

import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import type { ScorecardCriterion } from "@/lib/content";

interface CriterionRow extends Record<string, unknown> {
  name: string;
  weight: number;
  scores: Record<string, number>;
  rationale: Record<string, string>;
}

function scoreCell(domain: string) {
  return (row: CriterionRow) => (
    <Stack gap={0.5}>
      <Text type="body" weight="semibold">
        {row.scores?.[domain] ?? 0}
      </Text>
      <Text type="supporting" maxLines={4}>
        {row.rationale?.[domain]}
      </Text>
    </Stack>
  );
}

export function ScorecardTable({
  criteria,
  domains,
}: {
  criteria: ScorecardCriterion[];
  domains: string[];
}) {
  return (
    <Table<CriterionRow>
      data={criteria as CriterionRow[]}
      idKey={(row) => row.name}
      density="balanced"
      textOverflow="wrap"
      verticalAlign="top"
      columns={[
        {
          key: "name",
          header: "Criterion (weight)",
          width: pixel(220),
          renderCell: (row) => (
            <Stack gap={0.5}>
              <Text type="body" weight="semibold">
                {row.name}
              </Text>
              <Text type="supporting">
                weight {(row.weight * 100).toFixed(0)}%
              </Text>
            </Stack>
          ),
        },
        ...domains.map((d) => ({
          key: d,
          header: d,
          width: proportional(1),
          renderCell: scoreCell(d),
        })),
      ]}
    />
  );
}
