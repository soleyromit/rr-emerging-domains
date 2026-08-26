import { Stack } from "@astryxdesign/core/Stack";
import { Citation } from "@astryxdesign/core/Citation";
import { Text } from "@astryxdesign/core/Text";
import type { CitationEntry } from "@/lib/citations";

// A real footnote reference list — the numbered badges next to fact cards
// resolve here, like a research paper's bibliography, instead of a scattered
// "View source" link per row.
export function ReferencesList({ items }: { items: CitationEntry[] }) {
  if (!items.length) return null;
  return (
    <Stack gap={2}>
      <Text type="label" color="secondary" size="xsm">
        References
      </Text>
      <Stack gap={1.5}>
        {items.map((item) => (
          <Stack key={item.number} direction="horizontal" gap={2} vAlign="start">
            <Citation number={item.number} source={item.source} variant="number" />
            <Text type="supporting" size="xsm">
              {item.source.title}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
