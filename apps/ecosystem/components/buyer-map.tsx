import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import type { SalesBriefBuyer } from "@/lib/sales-brief";

// §B of a domain's SALES.md brief — who signs, and why. Always 3 rows in the
// source (Dean, Compliance/Accreditation Liaison, Clinical Coordinator) across
// all 4 domains, so a fixed small grid — not a scrolling table — keeps "who's
// in the room" in the scan layer rather than behind a click.
export function BuyerMap({ buyers }: { buyers: SalesBriefBuyer[] }) {
  if (!buyers.length) return null;
  return (
    <Grid columns={{ minWidth: 220 }} gap={3}>
      {buyers.map((b) => (
        <Card key={b.role} variant="muted" padding={3}>
          <Stack gap={1.5}>
            <Text type="body" weight="semibold" maxLines={1}>
              {b.role}
            </Text>
            <Text type="supporting" size="sm" maxLines={2}>
              {b.motivation}
            </Text>
            <Text type="label" color="secondary" size="xsm" maxLines={1}>
              {b.budgetRole}
            </Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
