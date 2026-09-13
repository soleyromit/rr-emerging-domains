"use client";

import * as Plot from "@observablehq/plot";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PlotFigure } from "./plot-figure";

export type VerdictTone = "lead" | "hold" | "behind";

const TONE_ORDER: VerdictTone[] = ["lead", "hold", "behind"];
const TONE_LABEL: Record<VerdictTone, string> = { lead: "Lead", hold: "Hold", behind: "Behind" };
// Same colors as the Badge variants this page already uses (BADGE_BY_TONE in
// app/go-to-market/page.tsx), so the chart visually matches the badges.
const TONE_COLOR: Record<VerdictTone, string> = {
  lead: "var(--color-icon-green)",
  hold: "var(--color-icon-yellow)",
  behind: "var(--color-icon-red)",
};

export interface VerdictRow {
  stage: string;
  tone: VerdictTone;
}

// One horizontal bar per stage, colored by verdict — the aggregate view of the
// page's per-stage lead/hold/behind badges, visible before opening any collapsible.
export function VerdictDistributionChart({ rows }: { rows: VerdictRow[] }) {
  if (rows.length === 0) {
    return <EmptyState title="No verdicts parsed yet" />;
  }

  return (
    <PlotFigure
      className="w-full"
      options={(width) => ({
        width,
        height: Math.max(120, rows.length * 34),
        marginLeft: 260,
        marginRight: 20,
        x: { label: null, domain: [0, 1] },
        y: { label: null },
        color: {
          domain: TONE_ORDER,
          range: TONE_ORDER.map((d) => TONE_COLOR[d]),
          legend: true,
          tickFormat: (d: string) => TONE_LABEL[d as VerdictTone] ?? d,
        },
        marks: [
          Plot.barX(rows, { x: () => 1, y: "stage", fill: "tone", tip: true }),
          Plot.ruleX([0]),
        ],
      })}
    />
  );
}
