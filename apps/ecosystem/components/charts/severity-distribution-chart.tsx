"use client";

import * as Plot from "@observablehq/plot";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PlotFigure } from "./plot-figure";
import { SEVERITY_ORDER, SEVERITY_LABEL, SEVERITY_COLOR, normalizeSeverity, type GapSeverity } from "@/lib/severity";

export interface SeverityRow {
  label: string;
  severity?: string;
}

// Horizontal stacked bar of gap-severity counts, grouped by an arbitrary label (a stage,
// a discipline, a journey). Same visual language as FitDistributionChart on the
// accreditation pages, so severity reads the same way everywhere in the app.
export function SeverityDistributionChart({ rows, height }: { rows: SeverityRow[]; height?: number }) {
  if (rows.length === 0) {
    return <EmptyState title="No element-level data yet" />;
  }

  const truncate = (s: string) => (s.length > 42 ? `${s.slice(0, 41).trim()}…` : s);
  const truncatedRows = rows.map((r) => ({ ...r, label: truncate(r.label) }));
  const groups = Array.from(new Set(truncatedRows.map((r) => r.label)));

  return (
    <PlotFigure
      className="w-full"
      options={(width) => ({
        width,
        height: height ?? Math.max(120, groups.length * 34),
        marginLeft: 280,
        marginRight: 20,
        x: { label: "Elements" },
        y: { label: null },
        color: {
          domain: SEVERITY_ORDER,
          range: SEVERITY_ORDER.map((d) => SEVERITY_COLOR[d]),
          legend: true,
          tickFormat: (d: string) => SEVERITY_LABEL[d as GapSeverity] ?? d,
        },
        marks: [
          Plot.barX(
            truncatedRows.map((r) => ({ label: r.label, severity: normalizeSeverity(r.severity) })),
            Plot.groupY({ x: "count" }, { y: "label", fill: "severity", order: SEVERITY_ORDER, tip: true })
          ),
          Plot.ruleX([0]),
        ],
      })}
    />
  );
}
