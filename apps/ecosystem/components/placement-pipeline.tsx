import { Stack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { IconTile, type PillVariant } from "@/components/status-pill";
import { SlotIcon, WishlistIcon, AssistIcon, ReviewIcon, PublishIcon, PlacementIcon } from "@/components/concept-icons";
import type { ComponentType } from "react";

interface PipelineNode {
  kicker: string;
  title: string;
  detail: string;
  Icon: ComponentType<{ size?: number }>;
  variant: PillVariant;
}

const NODES: PipelineNode[] = [
  {
    kicker: "01 · Capacity",
    title: "Slot Setup",
    detail: 'A site confirms availability (Slot Request), or an admin manually enters "Number of Offers" per batch.',
    Icon: SlotIcon,
    variant: "warning",
  },
  {
    kicker: "02 · Preference",
    title: "Wishlist Opens",
    detail: "Each student ranks preferred slots, settings, or locations before matching runs.",
    Icon: WishlistIcon,
    variant: "neutral",
  },
  {
    kicker: "03 · Match",
    title: "Placement Assist",
    detail: "A batch solver scores scarce specialties higher, weighs distance, and outputs suggestions — never final.",
    Icon: AssistIcon,
    variant: "neutral",
  },
  {
    kicker: "04 · Decision",
    title: "Admin Reviews & Creates",
    detail: "A person confirms every match. Nothing from Placement Assist is auto-committed.",
    Icon: ReviewIcon,
    variant: "neutral",
  },
  {
    kicker: "05 · Reveal",
    title: "Publish",
    detail: "A separate, explicit click. Until this, the match is invisible to the student — even though it exists.",
    Icon: PublishIcon,
    variant: "neutral",
  },
  {
    kicker: "06 · Record",
    title: "Placement",
    detail: "The assignment of record: one student, one site, one preceptor, dated.",
    Icon: PlacementIcon,
    variant: "success",
  },
];

// The "how a Placement gets made" overview: one illustrated node per
// checkpoint, same zoomed-out-first idiom as JourneyStepper/FlowDiagram
// (Stack/Card/Icon, a reading order rather than a general graph) — see
// UI-DENSITY-PATTERNS.md. Each node carries its own pictogram (concept-icons)
// rather than relying on text alone to distinguish six steps at a glance.
export function PlacementPipeline() {
  return (
    <Stack gap={3}>
      <Stack
        direction="horizontal"
        wrap="nowrap"
        isScrollable
        gap={0}
        vAlign="stretch"
        paddingBlockEnd={2}
        aria-label="How a Placement gets made — six checkpoints"
      >
        {NODES.map((node, i) => (
          <Stack key={node.title} direction="horizontal" gap={0} vAlign="center" style={{ flexShrink: 0 }}>
            <Card variant="default" padding={3}>
              <Stack gap={2} width={210}>
                <IconTile variant={node.variant}>
                  <node.Icon size={20} />
                </IconTile>
                <Stack gap={0.5}>
                  <Text type="label" color="secondary" size="xsm">
                    {node.kicker}
                  </Text>
                  <Text type="body" weight="semibold" size="base">
                    {node.title}
                  </Text>
                </Stack>
                <Text type="supporting" size="sm" maxLines={5}>
                  {node.detail}
                </Text>
              </Stack>
            </Card>
            {i < NODES.length - 1 ? <Icon icon="chevronRight" size="sm" color="secondary" aria-hidden="true" /> : null}
          </Stack>
        ))}
      </Stack>

      <Card variant="transparent" padding={3}>
        <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
          <IconTile variant="neutral">
            <ReviewIcon size={18} />
          </IconTile>
          <Text type="supporting" size="sm">
            Some programs skip steps 02–03 entirely: <b>Student Self-Placement</b> lets a student originate their own
            match directly — an admin still chooses &ldquo;requires approval&rdquo; or &ldquo;auto-approve,&rdquo;
            but there&rsquo;s never a Wishlist or an Assist run.
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
}
