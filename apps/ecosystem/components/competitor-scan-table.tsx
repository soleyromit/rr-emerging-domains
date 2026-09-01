"use client";

import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Link } from "@astryxdesign/core/Link";
import type { Competitor } from "@/lib/content";

interface ScanRow extends Record<string, unknown> {
  slug: string;
  competitor: string;
  category?: string;
  domains_served: string[];
  strength?: string;
  weakness?: string;
}

export function CompetitorScanTable({ competitors }: { competitors: Competitor[] }) {
  const rows: ScanRow[] = competitors.map((c) => ({
    slug: c.slug,
    competitor: c.competitor,
    category: c.category,
    domains_served: c.domains_served ?? [],
    strength: c.strengths?.[0]?.claim,
    weakness: c.weaknesses?.[0]?.claim,
  }));

  return (
    <Table<ScanRow>
      data={rows}
      idKey={(row) => row.slug}
      density="balanced"
      textOverflow="wrap"
      verticalAlign="top"
      columns={[
        {
          key: "competitor",
          header: "Competitor",
          width: pixel(200),
          renderCell: (row) => (
            <Stack gap={0.5}>
              <Link href={`/competitors/${row.slug}`} type="body" weight="semibold" color="accent" hasUnderline>
                {row.competitor}
              </Link>
              <Stack direction="horizontal" gap={1} wrap="wrap">
                {row.domains_served.map((d) => (
                  <Badge key={d} variant="neutral" label={d} />
                ))}
              </Stack>
            </Stack>
          ),
        },
        {
          key: "strength",
          header: "Biggest strength",
          width: proportional(1),
          renderCell: (row) => (
            <Text type="supporting" maxLines={2}>
              {row.strength}
            </Text>
          ),
        },
        {
          key: "weakness",
          header: "Biggest weakness",
          width: proportional(1),
          renderCell: (row) => (
            <Text type="supporting" maxLines={2}>
              {row.weakness}
            </Text>
          ),
        },
      ]}
    />
  );
}
