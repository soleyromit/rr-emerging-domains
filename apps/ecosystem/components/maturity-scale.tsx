import { Stack } from "@astryxdesign/core/Stack";
import { Badge } from "@astryxdesign/core/Badge";
import { Icon } from "@astryxdesign/core/Icon";

const STEPS: { key: string; label: string; activeVariant: "neutral" | "info" | "success" }[] = [
  { key: "unaddressed", label: "Unaddressed", activeVariant: "neutral" },
  { key: "roadmap", label: "Roadmap", activeVariant: "info" },
  { key: "shipped", label: "Shipped", activeVariant: "success" },
];

// A trend's exxat_status is a position on a path, not an isolated fact — this
// makes that path visible (all 3 stops, one lit) instead of a single standalone
// badge that says where it is today but not what "further along" would mean.
export function MaturityScale({ status }: { status?: string }) {
  const activeIndex = Math.max(
    STEPS.findIndex((s) => s.key === status),
    0
  );
  return (
    <Stack direction="horizontal" gap={1} vAlign="center" wrap="wrap">
      {STEPS.map((step, i) => (
        <Stack key={step.key} direction="horizontal" gap={1} vAlign="center">
          <Badge
            variant={i === activeIndex ? step.activeVariant : "neutral"}
            label={step.label}
            style={i === activeIndex ? undefined : { opacity: 0.4 }}
          />
          {i < STEPS.length - 1 ? <Icon icon="chevronRight" size="sm" color="secondary" aria-hidden="true" /> : null}
        </Stack>
      ))}
    </Stack>
  );
}
