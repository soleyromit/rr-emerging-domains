"use client";

import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./plot-figure";
import type { PrismPillar } from "@/lib/content";

export function PrismFeaturesChart({ pillars }: { pillars: PrismPillar[] }) {
  const rows = pillars.map((p) => ({
    pillar: p.name,
    count: p.features?.length ?? 0,
    status: p.status,
  }));

  return (
    <PlotFigure
      className="w-full"
      options={(width) => ({
        width,
        height: 220,
        marginLeft: 210,
        x: { label: "Confirmed features" },
        y: { label: null },
        color: {
          domain: ["shipped", "roadmap"],
          range: ["var(--color-icon-green)", "var(--color-icon-yellow)"],
          legend: true,
          tickFormat: (d: string) => (d === "shipped" ? "Shipped pillar" : "Roadmap pillar"),
        },
        marks: [
          Plot.barX(rows, { y: "pillar", x: "count", fill: "status", sort: { y: "-x" }, tip: true }),
          Plot.text(rows, { y: "pillar", x: "count", text: (d: any) => String(d.count), dx: 14, fontSize: 11 }),
          Plot.ruleX([0]),
        ],
      })}
    />
  );
}
