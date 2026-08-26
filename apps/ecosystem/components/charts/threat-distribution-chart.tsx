"use client";

import * as Plot from "@observablehq/plot";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PlotFigure } from "./plot-figure";

const THREAT_ORDER = ["low", "medium", "high"];
const THREAT_LABEL: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };
// Same red/yellow/green convention as SeverityDistributionChart/FitDistributionChart —
// severity reads the same way everywhere in this app.
const THREAT_COLOR: Record<string, string> = {
  low: "var(--color-icon-green)",
  medium: "var(--color-icon-yellow)",
  high: "var(--color-icon-red)",
};

export interface ThreatRow {
  domain: string;
  threat: string;
}

// One horizontal bar per domain, colored by highest-threat competitor found there —
// the "at a glance, where's the real competitive pressure" view this lens exists for.
export function ThreatDistributionChart({ rows }: { rows: ThreatRow[] }) {
  if (rows.length === 0) return <EmptyState title="No competitor data yet" />;

  return (
    <PlotFigure
      className="w-full"
      options={(width) => ({
        width,
        height: Math.max(140, rows.length * 30),
        marginLeft: 200,
        marginRight: 20,
        x: { label: "Competitors" },
        y: { label: null },
        color: {
          domain: THREAT_ORDER,
          range: THREAT_ORDER.map((d) => THREAT_COLOR[d]),
          legend: true,
          tickFormat: (d: string) => THREAT_LABEL[d] ?? d,
        },
        marks: [
          Plot.barX(
            rows,
            Plot.groupY(
              { x: "count" },
              { y: "domain", fill: "threat", order: THREAT_ORDER, tip: true, sort: { y: "-x" } }
            )
          ),
          Plot.ruleX([0]),
        ],
      })}
    />
  );
}
