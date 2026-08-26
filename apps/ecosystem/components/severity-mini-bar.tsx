import { Stack } from "@astryxdesign/core/Stack";
import { SEVERITY_ORDER, SEVERITY_COLOR, SEVERITY_LABEL, type GapSeverity } from "@/lib/severity";

// A compact proportional colored-segment row summarizing a set of gap-severity
// counts — the "at a glance" companion to SeverityDistributionChart's full bar
// chart, sized to sit inside a small diagram node (JourneyStepper, FlowDiagram)
// rather than its own chart section.
export function SeverityMiniBar({ counts }: { counts: Partial<Record<GapSeverity, number>> }) {
  const total = SEVERITY_ORDER.reduce((sum, k) => sum + (counts[k] ?? 0), 0);
  if (total === 0) return null;
  return (
    <Stack
      direction="horizontal"
      gap={0}
      width="100%"
      height={6}
      style={{ borderRadius: 3, overflow: "hidden" }}
      aria-label={SEVERITY_ORDER.filter((k) => counts[k]).map((k) => `${counts[k]} ${SEVERITY_LABEL[k]}`).join(", ")}
    >
      {SEVERITY_ORDER.filter((k) => counts[k]).map((k) => (
        <div
          key={k}
          style={{ flexGrow: counts[k], backgroundColor: SEVERITY_COLOR[k], height: "100%" }}
        />
      ))}
    </Stack>
  );
}
