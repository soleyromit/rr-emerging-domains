import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Blockquote } from "@astryxdesign/core/Blockquote";
import { Divider } from "@astryxdesign/core/Divider";
import { DepthBadge } from "@/components/fit-badge";
import { SourceLine } from "@/components/source-line";
import { stripFileCitations } from "@/lib/strip-file-citations";
import type { CompetitorFeature } from "@/lib/content";

// evidence (245-570 chars) and source are 100% populated across every
// feature_teardown row but were never rendered anywhere before this —
// components/competitor-feature-table.tsx only showed pillar/capability/depth.
// A Table cell can't hold evidence at this length without re-truncating it,
// so this renders one block per row instead, handling 6 vs 7 rows via .map()
// rather than a fixed grid. Blockquote's inline-start rule visually separates
// "why we believe this" (evidence, sourced) from "what they claim"
// (capability) and "our judgment" (depth badge).
export function CompetitorFeatureDossier({ features }: { features: CompetitorFeature[] }) {
  return (
    <Stack gap={4}>
      {features.map((f, i) => (
        <Stack key={`${f.pillar}-${i}`} gap={2}>
          {i > 0 ? <Divider variant="subtle" /> : null}
          <Stack direction="horizontal" hAlign="between" vAlign="center" gap={2} wrap="wrap">
            <Text type="body" weight="semibold">
              {f.pillar}
            </Text>
            <DepthBadge depth={f.depth_vs_prism} />
          </Stack>
          {f.competitor_capability ? (
            // DENSITY-OK: dedicated competitor detail page — capability text is the
            // page's own content, not a compact table preview
            <Text type="body" size="sm">
              {stripFileCitations(f.competitor_capability)}
            </Text>
          ) : null}
          {f.evidence ? (
            <Blockquote cite={<SourceLine source={f.source} />}>
              <Text type="supporting" size="sm">
                {stripFileCitations(f.evidence)}
              </Text>
            </Blockquote>
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
}
