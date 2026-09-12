import { Stack } from "@astryxdesign/core/Stack";
import { Card, type CardVariant } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Icon } from "@astryxdesign/core/Icon";

export interface EntryChainNode {
  label: string;
  text: string;
  variant?: CardVariant;
}

// The Trigger -> Lead -> Concede answer to "why would this university switch,
// what do we open with, and what do we honestly not have yet" — same 3-node
// chevron-chain idiom as exxat-gap-answer.tsx's GapChain, just carrying full
// sentences (switching_trigger, a SALES.md opening, an objection's honest-gap
// line) instead of GapChain's badge-sized labels, so nodes get more room to
// breathe (clamped body text, not single-line truncation). A missing node is
// dropped, never padded with placeholder text — 2 real nodes beat 3 where one
// is invented, same rule DESIGN.md states for GapChain itself.
export function EntryChain({ nodes }: { nodes: (EntryChainNode | undefined)[] }) {
  const real = nodes.filter((n): n is EntryChainNode => !!n?.text);
  if (!real.length) return null;

  return (
    <Stack direction="horizontal" gap={0} wrap="wrap" vAlign="stretch">
      {real.map((node, i) => (
        <Stack key={node.label} direction="horizontal" gap={2} vAlign="center" style={{ flex: "1 1 220px" }}>
          <Card variant={node.variant ?? "muted"} padding={3} style={{ flex: 1 }}>
            <Stack gap={1}>
              <Text type="label" color="secondary" size="xsm">
                {node.label}
              </Text>
              <Text type="body" size="sm" maxLines={3}>
                {node.text}
              </Text>
            </Stack>
          </Card>
          {i < real.length - 1 ? (
            <Icon icon="chevronRight" size="md" color="secondary" aria-hidden="true" />
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
}
