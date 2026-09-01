import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { IconTile, type PillVariant } from "@/components/status-pill";
import { SlotIcon, WishlistIcon, AssistIcon, PlacementIcon, ReviewIcon } from "@/components/concept-icons";
import type { ComponentType } from "react";

interface Term {
  Icon: ComponentType<{ size?: number }>;
  variant: PillVariant;
  tag: string;
  term: string;
  definition: string;
  field: string;
}

const TERMS: Term[] = [
  {
    Icon: SlotIcon,
    variant: "warning",
    tag: "Capacity",
    term: "Slot",
    definition:
      "A batch of available seats at a site, for one course/rotation/setting — not one seat. Capacity is declared, not measured.",
    field: 'Field: "Number of Offers" — manually entered per batch. No rolling 3-year average exists anywhere in the system.',
  },
  {
    Icon: WishlistIcon,
    variant: "neutral",
    tag: "Preference",
    term: "Wishlist",
    definition:
      "A student's ranked list of preferred slots, settings, or locations, submitted before matching runs. Four possible modes.",
    field: "Reported back as: % who got 1st / 2nd / 3rd / 4th choice.",
  },
  {
    Icon: AssistIcon,
    variant: "neutral",
    tag: "Matching",
    term: "Placement Assist",
    definition:
      "The matching engine: staged batches, difficulty-weighted scarce specialties, distance scoring, overlap guards. A constraint solver, not a lottery.",
    field: "Full self-service: PT-PTA & OT-OTA only — every other discipline files a support ticket.",
  },
  {
    Icon: PlacementIcon,
    variant: "success",
    tag: "Record",
    term: "Placement",
    definition:
      "The assignment of record — one student, one site, one preceptor, dated. Created by Assist + admin, or by self-placement.",
    field: "Match ≠ visible: a Publish step gates student visibility, separate from creation.",
  },
  {
    Icon: ReviewIcon,
    variant: "neutral",
    tag: "Bypass",
    term: "Student Self-Placement",
    definition: "A student originates their own placement directly, instead of ranking a Wishlist against admin-built Slots.",
    field: "Admin choice: requires approval vs. auto-approve on submission.",
  },
];

// Five flashcards, one per core term — a colored icon tile first (the shape
// and tint of the icon are the fast read), plain definition second, the
// actual field/setting name last so the card doubles as a lookup.
export function TermFlashcards() {
  return (
    <Grid columns={{ minWidth: 260 }} gap={3}>
      {TERMS.map((t) => (
        <Card key={t.term} variant="default" padding={4}>
          <Stack gap={3}>
            <Stack direction="horizontal" hAlign="between" vAlign="start" gap={2}>
              <IconTile variant={t.variant}>
                <t.Icon size={24} />
              </IconTile>
              <Text type="label" color="secondary" size="xsm">
                {t.tag}
              </Text>
            </Stack>
            <Text type="body" weight="semibold" size="lg">
              {t.term}
            </Text>
            <Text type="supporting" size="sm">
              {t.definition}
            </Text>
            <Divider />
            <Text type="supporting" size="xsm" color="secondary">
              {t.field}
            </Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
