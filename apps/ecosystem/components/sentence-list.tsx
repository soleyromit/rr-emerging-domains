import { Stack } from "@astryxdesign/core/Stack";
import { Icon, type IconName } from "@astryxdesign/core/Icon";
import { Divider } from "@astryxdesign/core/Divider";
import { FieldBlock } from "@/components/field-block";
import { RelatedFlowsPreview } from "@/components/related-flows-preview";
import { pickThemeIcon } from "@/lib/theme-icon";
import type { ResolvedRelatedFlow } from "@/lib/content";

// A plain string keeps every existing plain-string[] caller (top_tasks,
// tools_touched, sources, ...) compiling and rendering unchanged. The object form
// unlocks related_flows for object-shaped fields (e.g. lens gaps_prism_can_exploit
// once converted from flat strings to {claim, related_flows}).
export type SentenceListItem = string | { text: string; relatedFlows?: ResolvedRelatedFlow[] };

// For string[] fields that are full sentences, not short tags — e.g. role
// tools_touched (68-236 chars) was rendered as Badge chips despite holding
// full sentences, and top_tasks/gaps_prism_can_exploit/sources have the same
// shape. A themed icon gives each row a scan anchor; FieldBlock (not a bare
// ListItem label, which has no truncation tooltip) gives it a real clamp+expand.
export function SentenceList({
  items,
  maxLines = 2,
  fallbackIcon = "info",
}: {
  items?: SentenceListItem[];
  maxLines?: number;
  fallbackIcon?: IconName;
}) {
  if (!items?.length) return null;
  return (
    <Stack gap={0}>
      {items.map((raw, i) => {
        const entry = typeof raw === "string" ? { text: raw, relatedFlows: undefined } : raw;
        return (
          <Stack key={i} gap={2}>
            {i > 0 ? <Divider variant="subtle" /> : null}
            <Stack direction="horizontal" gap={2} vAlign="start" paddingBlock={2}>
              <Icon icon={pickThemeIcon(entry.text, fallbackIcon)} size="sm" color="secondary" />
              <Stack gap={1.5} width="100%">
                <FieldBlock text={entry.text} maxLines={maxLines} />
                <RelatedFlowsPreview items={entry.relatedFlows} />
              </Stack>
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}
