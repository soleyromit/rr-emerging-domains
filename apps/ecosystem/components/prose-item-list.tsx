import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import type { IconName } from "@astryxdesign/core/Icon";
import { IconFactCard } from "@/components/icon-fact-card";
import { ReferencesList } from "@/components/references-list";
import { pickThemeIcon } from "@/lib/theme-icon";
import { buildCitationRegistry } from "@/lib/citations";
import type { ResolvedRelatedFlow } from "@/lib/content";

export interface ProseItem {
  primary: string;
  /** A second, genuinely separate prose field (e.g. jtbd's evidence_or_rationale)
   * — NOT a short citation. Mutually exclusive with `reference` in practice
   * (no field in this content has both). */
  secondary?: string;
  secondaryLabel?: string;
  /** A real per-item reference (e.g. an accreditation standard citation) —
   * rendered as a numbered Citation, never fabricated for a field with none. */
  reference?: string;
  /** Already-resolved related_flows for this item, if any — see lib/content.ts's
   * resolveRelatedFlows. Absent/empty renders nothing. */
  relatedFlows?: ResolvedRelatedFlow[];
}

// Icon-led fact cards for fields whose "headline" is really the first idea of
// the primary text itself (jtbd's `job`, role top_pains' `pain`) — there's no
// separate short label to pull out the way PersonaSpecList's `point` is one.
export function ProseItemList({ items, fallbackIcon = "checkDouble" }: { items?: ProseItem[]; fallbackIcon?: IconName }) {
  if (!items?.length) return null;
  const citations = buildCitationRegistry(items.map((i) => i.reference));
  const referenceList = citations.list();
  return (
    <Stack gap={3}>
      <Grid columns={{ minWidth: 320 }} gap={3}>
        {items.map((item, i) => {
          const number = citations.numberFor(item.reference);
          return (
            <IconFactCard
              key={i}
              icon={pickThemeIcon(item.primary, fallbackIcon)}
              text={item.primary}
              maxLines={3}
              secondaryText={item.secondary}
              secondaryLabel={item.secondaryLabel}
              citation={number && item.reference ? { number, source: { title: item.reference } } : undefined}
              relatedFlows={item.relatedFlows}
            />
          );
        })}
      </Grid>
      {referenceList.length ? <ReferencesList items={referenceList} /> : null}
    </Stack>
  );
}
