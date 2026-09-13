"use client";

import * as Plot from "@observablehq/plot";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PlotFigure } from "./plot-figure";
import type { Competitor } from "@/lib/content";
// The vocabulary module, not lib/content.ts — see lib/competitor-depth.ts's own comment
// for why a client component cannot import the latter at runtime.
import { DEPTH_ORDER, normalizeDepth, type DepthVsPrism } from "@/lib/competitor-depth";

const DEPTH_COLOR: Record<DepthVsPrism, string> = {
  behind: "var(--color-icon-green)",
  "at-parity": "var(--color-icon-yellow)",
  ahead: "var(--color-icon-red)",
  "prism-only": "var(--color-icon-blue)",
  unknown: "var(--color-icon-gray)",
};

export function CompetitorDepthChart({ competitors }: { competitors: Competitor[] }) {
  const rows = competitors.flatMap((c) =>
    (c.feature_teardown ?? []).map((f) => ({
      competitor: c.competitor,
      depth: normalizeDepth(f.depth_vs_prism),
      pillar: f.pillar,
    }))
  );

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No feature teardown data yet"
        description="This chart populates once competitor research lands in content/competitors/."
      />
    );
  }

  return (
    <PlotFigure
      className="w-full"
      options={(width) => ({
        width,
        height: Math.max(220, competitors.length * 34),
        marginLeft: 220,
        marginRight: 20,
        x: { label: "Pillars assessed" },
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
              {
                y: "competitor",
                fill: "depth",
                order: "sum",
                tip: true,
                sort: { y: "-x" },
              }
            )
          ),
          Plot.ruleX([0]),
        ],
      })}
    />
  );
}
