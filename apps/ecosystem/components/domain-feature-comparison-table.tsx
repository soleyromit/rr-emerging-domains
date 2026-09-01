"use client";

import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { DepthBadge } from "@/components/fit-badge";
import { FieldBlock } from "@/components/field-block";
import { stripFileCitations } from "@/lib/strip-file-citations";
import type { FeatureComparisonForDomain } from "@/lib/content";

interface FeatureRow extends Record<string, unknown> {
  _id: string;
  pillar: string;
  cells: FeatureComparisonForDomain["rows"][number]["cells"];
}

// "use client" because Table's columns carry renderCell closures, which can't cross
// the server→client prop boundary — see app/domains/[slug]/competitors/page.tsx.
export function DomainFeatureComparisonTable({ featureComparison }: { featureComparison: FeatureComparisonForDomain }) {
  const rows: FeatureRow[] = featureComparison.rows.map((r) => ({ _id: r.pillar, pillar: r.pillar, cells: r.cells }));

  return (
    <Table<FeatureRow>
      data={rows}
      idKey="_id"
      density="balanced"
      textOverflow="wrap"
      verticalAlign="top"
      columns={[
        {
          key: "pillar",
          header: "Pillar",
          width: pixel(200),
          renderCell: (row) => (
            <Text type="body" weight="semibold">
              {row.pillar}
            </Text>
          ),
        },
        ...featureComparison.competitors.map((c) => ({
          key: c.slug,
          header: c.competitor,
          width: proportional(1),
          renderCell: (row: FeatureRow) => {
            const cell = row.cells.find((cc) => cc.slug === c.slug);
            if (!cell?.depth) return <Text type="supporting" color="secondary">—</Text>;
            const hasDetail = !!(cell.capability || cell.evidence);
            return (
              <Stack gap={1.5}>
                <DepthBadge depth={cell.depth} />
                {hasDetail ? (
                  <Collapsible trigger="Detail" defaultIsOpen={false}>
                    <Stack gap={2}>
                      {cell.capability ? (
                        <FieldBlock
                          label="Capability"
                          text={stripFileCitations(cell.capability)}
                          type="supporting"
                          maxLines={4}
                        />
                      ) : null}
                      {cell.evidence ? (
                        <FieldBlock
                          label="Evidence"
                          text={stripFileCitations(cell.evidence)}
                          type="supporting"
                          maxLines={4}
                        />
                      ) : null}
                    </Stack>
                  </Collapsible>
                ) : null}
              </Stack>
            );
          },
        })),
      ]}
    />
  );
}
