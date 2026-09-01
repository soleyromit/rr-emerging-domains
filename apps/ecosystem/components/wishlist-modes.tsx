import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";

interface Mode {
  rank: string;
  name: string;
  scope: string;
  exclusive?: boolean;
}

const MODES: Mode[] = [
  { rank: "Mode 1", name: "Settings-based", scope: "Ranks clinical settings. Used for electives." },
  { rank: "Mode 2", name: "Slot-based", scope: "Ranks specific admin-built Slots directly. Used for core rotations." },
  { rank: "Mode 3", name: "Location-based", scope: "Ranks clinical sites by location, program-process dependent." },
  {
    rank: "Mode 4 · PT / PTA / OT / OTA only",
    name: "Exxat One Availability-Based",
    scope: "Inverts the order: ranks live external site availabilities before any Slot or request even exists.",
    exclusive: true,
  },
];

// "Wishlist" reads as one feature but is four different ranking mechanics —
// this makes the count and the exclusivity of mode 4 visible at a glance.
export function WishlistModes() {
  return (
    <Grid columns={{ minWidth: 210 }} gap={3}>
      {MODES.map((m) => (
        <Card key={m.name} variant={m.exclusive ? "blue" : "muted"} padding={3}>
          <Stack gap={1}>
            <Text type="label" color="secondary" size="xsm">
              {m.rank}
            </Text>
            <Text type="body" weight="semibold" size="sm">
              {m.name}
            </Text>
            <Text type="supporting" size="xsm">
              {m.scope}
            </Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
