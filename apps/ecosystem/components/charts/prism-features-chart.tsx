"use client";

import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./plot-figure";
/**
 * Exactly the three scalars the bars need — deliberately NOT PrismPillar.
 *
 * This is a client component, so its props are serialized into the flight payload and sent
 * to every browser. Typed as PrismPillar it was handed the whole capability-map pillar
 * objects, and the six raw content filenames left in /product's served bytes after the render
 * sites on that page were sanitized were all in THIS prop: the `notes`, `why_it_matters` and
 * `features[].detail` prose, shipped in full so a bar chart could call `.length` on an array.
 *
 * Narrowing the type is the fix and also the guard: the projection now has to happen at the
 * call site, and a future field added to PrismPillar cannot silently ride along.
 */
interface PillarBar {
  name: string;
  featureCount: number;
  status: string;
}

export function PrismFeaturesChart({ pillars }: { pillars: PillarBar[] }) {
  const rows = pillars.map((p) => ({
    pillar: p.name,
    count: p.featureCount,
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
