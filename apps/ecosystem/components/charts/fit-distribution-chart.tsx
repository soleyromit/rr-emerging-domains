"use client";

import * as Plot from "@observablehq/plot";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PlotFigure } from "./plot-figure";

/**
 * The structural minimum this chart reads — deliberately NOT `AccreditationDoc`.
 * Its two callers reach the same `content/accreditation/*.yaml` standards by two
 * different routes: `/domains/[slug]/standards` passes the `AccreditationDoc`
 * itself, and `/go-to-market`'s "what is missing" step passes
 * `getStandardsCrosswalkForDomain()`'s rows (which ARE that doc's `standards[]`,
 * carrying the same `prism_fit`). Typing the minimum lets both feed one chart
 * without either side casting or the crosswalk faking a `slug` it has no use for.
 */
interface FitDistributionSeries {
  accreditor: string;
  domain: string;
  standards?: { prism_fit?: string }[];
}

const FIT_ORDER = ["Transfer", "Configure", "Build", "Gap", "unknown"];
const FIT_COLOR: Record<string, string> = {
  Transfer: "var(--color-icon-green)",
  Configure: "var(--color-icon-yellow)",
  Build: "var(--color-icon-blue)",
  Gap: "var(--color-icon-red)",
  unknown: "var(--color-icon-gray)",
};

function normalizeFit(f?: string) {
  if (!f) return "unknown";
  return FIT_ORDER.find((k) => f.toLowerCase().includes(k.toLowerCase())) ?? "unknown";
}

export function FitDistributionChart({ docs }: { docs: FitDistributionSeries[] }) {
  const rows = docs.flatMap((doc) =>
    (doc.standards ?? []).map((s) => ({
      accreditor: `${doc.accreditor.split("(")[0].trim()} · ${doc.domain}`,
      fit: normalizeFit(s.prism_fit),
    }))
  );

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No standards mapped yet"
        description="This chart populates once accreditation research lands in content/accreditation/."
      />
    );
  }

  return (
    <PlotFigure
      className="w-full"
      options={(width) => ({
        width,
        height: Math.max(160, docs.length * 60),
        marginLeft: 150,
        marginRight: 20,
        x: { label: "Standards / elements mapped" },
        y: { label: null },
        color: { domain: FIT_ORDER, range: FIT_ORDER.map((d) => FIT_COLOR[d]), legend: true },
        marks: [
          Plot.barX(
            rows,
            Plot.groupY(
              { x: "count" },
              { y: "accreditor", fill: "fit", order: FIT_ORDER, tip: true }
            )
          ),
          Plot.ruleX([0]),
        ],
      })}
    />
  );
}
