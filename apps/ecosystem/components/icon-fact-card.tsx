import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Icon, type IconName } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { Citation } from "@astryxdesign/core/Citation";
import { FieldBlock } from "@/components/field-block";
import { RelatedFlowsPreview } from "@/components/related-flows-preview";
import type { CitationSourceInput } from "@/lib/citations";
import type { ResolvedRelatedFlow } from "@/lib/content";

export interface IconFactCardProps {
  icon: IconName;
  /** A short label distinct from `text` (e.g. a pressure point's `point`).
   * Omit when the field has no separate headline — `text` starts right
   * after the icon instead of repeating a truncated copy of itself. */
  headline?: string;
  text: string;
  maxLines?: number;
  /** A second, genuinely separate prose field (e.g. jtbd's evidence_or_rationale) —
   * NOT a short citation. Rendered as its own smaller clamped block. */
  secondaryText?: string;
  secondaryLabel?: string;
  /** A real per-item reference (e.g. an accreditation standard citation) —
   * never fabricated for a field that has none. */
  citation?: { number: number; source: CitationSourceInput };
  /** Already-resolved related_flows for this item, if any. Absent/empty renders
   * nothing — see components/related-flows-preview.tsx. */
  relatedFlows?: ResolvedRelatedFlow[];
}

// The unit of the "icon-led fact card" pattern: a themed icon + (when the
// content has one) a short always-visible headline, then a firmly
// line-clamped body with a real click-through for the rest — never a bare
// paragraph. A numbered Citation badge appears only when the underlying
// content actually carries a per-item source; never fabricated for fields
// that don't have one.
export function IconFactCard({
  icon,
  headline,
  text,
  maxLines = 2,
  secondaryText,
  secondaryLabel,
  citation,
  relatedFlows,
}: IconFactCardProps) {
  const citationRow = citation ? (
    <Stack direction="horizontal" gap={1} vAlign="center">
      <Citation number={citation.number} source={citation.source} variant="number" />
      <Text type="supporting" size="xsm">
        {citation.source.title}
      </Text>
    </Stack>
  ) : null;

  return (
    <Card variant="muted" padding={3}>
      {headline ? (
        <Stack gap={1.5}>
          <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
            <Icon icon={icon} size="sm" color="secondary" />
            <Text type="body" weight="semibold" size="sm">
              {headline}
            </Text>
          </Stack>
          <FieldBlock text={text} type="supporting" size="sm" maxLines={maxLines} triggerLabel="Read the full note" />
          {citationRow}
          <RelatedFlowsPreview items={relatedFlows} />
        </Stack>
      ) : (
        <Stack direction="horizontal" gap={2} vAlign="start">
          <Icon icon={icon} size="sm" color="secondary" />
          <Stack gap={1.5} width="100%">
            <FieldBlock text={text} type="body" size="sm" maxLines={maxLines} triggerLabel="Read the full note" />
            {secondaryText ? (
              <FieldBlock
                label={secondaryLabel}
                text={secondaryText}
                type="supporting"
                size="xsm"
                maxLines={2}
                triggerLabel="Read the full note"
              />
            ) : null}
            {citationRow}
            <RelatedFlowsPreview items={relatedFlows} />
          </Stack>
        </Stack>
      )}
    </Card>
  );
}
