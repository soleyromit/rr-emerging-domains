"use client";

import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { FieldBlock } from "@/components/field-block";
import { FitBadge, StandardsRatingBadge } from "@/components/fit-badge";
import type { StandardsCrosswalkForDomain, StandardsCrosswalkRow } from "@/lib/content";

interface StandardRow extends Record<string, unknown> {
  _id: string;
  row: StandardsCrosswalkRow;
}

// Wilson's own crosswalk-grid ask (2026-08-26 call), extracted so it's reusable both
// nested inside a domain's full hub (domain-hub-sections.tsx) and as its own always-
// visible matrix on /crosswalk — the standalone, scannable "rows are standards,
// columns are competitors" artifact he asked for, not something buried behind a click
// to expand a domain first.
export function StandardsCrosswalkTable({ standardsCrosswalk }: { standardsCrosswalk: StandardsCrosswalkForDomain | null }) {
  if (!standardsCrosswalk) {
    return (
      <EmptyState
        title="No accreditation data yet for this domain"
        description="This domain has no researched accreditation file in this repo yet."
      />
    );
  }

  const standardRows: StandardRow[] = standardsCrosswalk.rows.map((r) => ({ _id: r.element_id, row: r }));

  return (
    <Table<StandardRow>
      data={standardRows}
      idKey="_id"
      density="balanced"
      textOverflow="wrap"
      verticalAlign="top"
      columns={[
        {
          key: "standard",
          header: "Standard",
          width: pixel(240),
          renderCell: (r) => (
            <Stack gap={0.5}>
              <Text type="body" weight="semibold" size="sm">
                {r.row.element_id}
              </Text>
              {r.row.element_title ? (
                <Text type="supporting" size="xsm" color="secondary">
                  {r.row.element_title}
                </Text>
              ) : null}
            </Stack>
          ),
        },
        {
          key: "prism",
          header: "Prism",
          width: pixel(180),
          renderCell: (r) => (
            <Stack gap={1.5}>
              <FitBadge fit={r.row.prism_fit} />
              {r.row.prism_fit_rationale ? (
                <Collapsible trigger="Why" defaultIsOpen={false}>
                  <FieldBlock text={r.row.prism_fit_rationale} type="supporting" size="xsm" maxLines={4} />
                </Collapsible>
              ) : null}
            </Stack>
          ),
        },
        ...standardsCrosswalk.competitors.map((c) => ({
          key: c.slug,
          header: c.competitor,
          width: proportional(1),
          renderCell: (r: StandardRow) => {
            const cell = r.row.competitors.find((cc) => cc.slug === c.slug);
            return <StandardsRatingBadge rating={cell?.rating} />;
          },
        })),
      ]}
    />
  );
}
