import type { ReactNode } from "react";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { FieldBlock } from "@/components/field-block";
import { RelatedFlowsPreview } from "@/components/related-flows-preview";
import type { ResolvedRelatedFlow } from "@/lib/content";

export interface ComparisonCardItem {
  key: string;
  label: ReactNode;
  text: string;
  /** Already-resolved related_flows for this item, if any. Absent/empty renders
   * nothing — see components/related-flows-preview.tsx. */
  relatedFlows?: ResolvedRelatedFlow[];
}

// Real comparison columns, not a Table: text runs 680-1,336 chars across the
// verified cases this backs (5 competitor lenses × the same 5 roles, always),
// and a fixed-height table row can't cleanly host that spread without
// clipping the shorter cells or forcing the taller ones down. Independent
// card heights instead — used both directions: lens page shows 5 role
// columns, role page shows N competitor columns.
export function ComparisonCardGrid({ items, maxLines = 4 }: { items: ComparisonCardItem[]; maxLines?: number }) {
  if (!items.length) return null;
  return (
    <Grid columns={{ minWidth: 240 }} gap={3}>
      {items.map((item) => (
        <Card key={item.key} padding={3}>
          <Stack gap={2}>
            {typeof item.label === "string" ? (
              <Text type="body" weight="semibold">
                {item.label}
              </Text>
            ) : (
              item.label
            )}
            <FieldBlock text={item.text} type="supporting" maxLines={maxLines} />
            <RelatedFlowsPreview items={item.relatedFlows} />
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
