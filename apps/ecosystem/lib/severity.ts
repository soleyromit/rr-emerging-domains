// The gap-severity vocabulary/color mapping, shared by every chart and diagram that
// visualizes flow-element severity — SeverityDistributionChart, JourneyStepper,
// FlowDiagram, and SeverityMiniBar all import from here instead of re-declaring it.
export type GapSeverity = "none" | "cosmetic" | "configure-needed" | "gap";

export const SEVERITY_ORDER: GapSeverity[] = ["none", "cosmetic", "configure-needed", "gap"];

export const SEVERITY_LABEL: Record<GapSeverity, string> = {
  none: "No gap",
  cosmetic: "Cosmetic",
  "configure-needed": "Configure needed",
  gap: "Gap",
};

export const SEVERITY_COLOR: Record<GapSeverity, string> = {
  none: "var(--color-icon-green)",
  cosmetic: "var(--color-icon-cyan)",
  "configure-needed": "var(--color-icon-yellow)",
  gap: "var(--color-icon-red)",
};

export function normalizeSeverity(s?: string): GapSeverity {
  const key = (s ?? "").toLowerCase().trim();
  return (SEVERITY_ORDER as string[]).includes(key) ? (key as GapSeverity) : "none";
}

// The highest-ranked severity present in a list — used to roll a stage's or a flow's
// many elements up to one badge/color. Empty input reads as "none" (nothing to worry
// about), not "unrated" — callers that need to distinguish "no data" should check
// length themselves before calling this.
export function worstSeverity(values: (string | undefined)[]): GapSeverity {
  let worst: GapSeverity = "none";
  let worstRank = 0;
  for (const v of values) {
    const normalized = normalizeSeverity(v);
    const rank = SEVERITY_ORDER.indexOf(normalized);
    if (rank > worstRank) {
      worst = normalized;
      worstRank = rank;
    }
  }
  return worst;
}
