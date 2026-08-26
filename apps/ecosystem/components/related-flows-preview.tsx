"use client";

import { HoverCard } from "@astryxdesign/core/HoverCard";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Icon } from "@astryxdesign/core/Icon";
import { Link } from "@astryxdesign/core/Link";
import { GapSeverityBadge } from "@/components/fit-badge";
import { FieldBlock } from "@/components/field-block";
import { stripFileCitations } from "@/lib/strip-file-citations";
import type { ResolvedRelatedFlow } from "@/lib/content";

// Inline "connects to a live Prism flow" indicator for a jtbd/top_pain/lens point.
// One compact chip per related flow, always showing the flow's full descriptive
// name — never its filename/slug (see UI-DENSITY-PATTERNS.md's "no partial URLs"
// rule). Hovering (or tapping, on touch — HoverCard's touchTrigger="auto" handles
// that) previews the competitor's vs. Prism's actual solve for the cited element
// before committing to a full navigation. Renders nothing when there's nothing to
// connect to — callers never need their own emptiness guard.
export function RelatedFlowsPreview({ items }: { items?: ResolvedRelatedFlow[] }) {
  if (!items?.length) return null;
  return (
    <Stack direction="horizontal" gap={1.5} wrap="wrap">
      {items.map((item, i) => (
        <HoverCard
          key={`${item.flow.slug}-${i}`}
          placement="below"
          alignment="start"
          label={`Connects to flow: ${item.flow.flow_name}`}
          content={<RelatedFlowPreviewCard item={item} />}
        >
          <Stack
            direction="horizontal"
            gap={1}
            vAlign="center"
            paddingInline={1.5}
            paddingBlock={0.5}
            style={{ borderRadius: 6, border: "1px solid var(--color-border)", cursor: "default" }}
          >
            <Icon icon="externalLink" size="xsm" color="secondary" />
            <Text type="supporting" size="xsm" color="secondary">
              {item.flow.flow_name}
            </Text>
          </Stack>
        </HoverCard>
      ))}
    </Stack>
  );
}

function RelatedFlowPreviewCard({ item }: { item: ResolvedRelatedFlow }) {
  return (
    <Stack gap={2} maxWidth={320} padding={3}>
      <Text type="label" color="secondary" size="xsm">
        Connects to a live Prism flow
      </Text>
      <Text type="body" weight="semibold" size="sm">
        {item.flow.flow_name}
      </Text>
      {item.journeyContext ? (
        <Text type="supporting" size="xsm">
          {item.journeyContext.journey.journey_name}
          {item.journeyContext.stage ? ` — ${item.journeyContext.stage.stage}` : ""}
        </Text>
      ) : null}
      {item.element ? (
        <Stack gap={2}>
          <GapSeverityBadge severity={item.element.gap_severity} />
          <Stack gap={1}>
            <Text type="label" color="secondary" size="xsm">
              Competitor&apos;s solve
            </Text>
            <FieldBlock
              text={stripFileCitations(item.element.competitor_equivalent)}
              type="supporting"
              size="xsm"
              maxLines={2}
            />
          </Stack>
          <Stack gap={1}>
            <Text type="label" color="secondary" size="xsm">
              Prism&apos;s solve
            </Text>
            <FieldBlock text={stripFileCitations(item.element.data_shown)} type="supporting" size="xsm" maxLines={2} />
            <FieldBlock text={stripFileCitations(item.element.gap_note)} type="supporting" size="xsm" maxLines={2} />
          </Stack>
        </Stack>
      ) : null}
      <Link href={`/flows/${item.flow.slug}`} size="sm" color="accent" hasUnderline>
        View full flow →
      </Link>
    </Stack>
  );
}
