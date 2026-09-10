"use client";

import * as Plot from "@observablehq/plot";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PlotFigure } from "./plot-figure";
import type { FeatureComparisonForDomain } from "@/lib/content";

const DEPTH_ORDER = ["behind", "at-parity", "ahead", "prism-only", "unknown"];
const DEPTH_COLOR: Record<string, string> = {
  behind: "var(--color-icon-green)",
  "at-parity": "var(--color-icon-yellow)",
  ahead: "var(--color-icon-red)",
  "prism-only": "var(--color-icon-blue)",
  unknown: "var(--color-icon-gray)",
};

function normalizeDepth(d?: string) {
  if (!d) return "unknown";
  const lower = d.toLowerCase();
  return DEPTH_ORDER.find((k) => lower.includes(k)) ?? "unknown";
}

// Same visual convention as CompetitorDepthChart (used on /competitors/[slug]), but
// sourced from a single domain's already-computed FeatureComparisonForDomain rows
// instead of a full Competitor object — this lens only has the cell-level data, not
// each competitor's complete feature_teardown.
export function FeatureDepthChart({ domain }: { domain: FeatureComparisonForDomain }) {
  const rows = domain.rows.flatMap((r) =>
    r.cells
      .filter((c) => c.depth)
      .map((c) => ({ competitor: c.competitor, depth: normalizeDepth(c.depth), pillar: r.pillar }))
  );

  if (rows.length === 0) {
    return <EmptyState title="No rated cells yet" description="This chart populates once feature_teardown data is rated for this domain's competitors." />;
  }

  return (
    <PlotFigure
      className="w-full"
      options={(width) => ({
        width,
        height: Math.max(160, domain.competitors.length * 34),
        marginLeft: 220,
        marginRight: 20,
        x: { label: "Pillars rated" },
        y: { label: null },
        color: {
          domain: DEPTH_ORDER,
          range: DEPTH_ORDER.map((d) => DEPTH_COLOR[d]),
          legend: true,
        },
        marks: [
          Plot.barX(
            rows,
            Plot.groupY(
              { x: "count" },
              { y: "competitor", fill: "depth", order: "sum", tip: true, sort: { y: "-x" } }
            )
          ),
          Plot.ruleX([0]),
        ],
      })}
    />
  );
}
