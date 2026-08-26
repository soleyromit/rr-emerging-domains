"use client";

import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./plot-figure";
import type { FeatureMap } from "@/lib/content";

const STATUS_COLOR: Record<string, string> = {
  leading: "var(--color-icon-green)",
  behind: "var(--color-icon-red)",
  opportunity: "var(--color-icon-blue)",
};
const STATUS_LABEL: Record<string, string> = {
  leading: "Prism leads",
  behind: "Competitor leads",
  opportunity: "Whitespace opportunity",
};

export function FeatureMapHeatmap({ featureMaps }: { featureMaps: FeatureMap[] }) {
  const rows = featureMaps.flatMap((fm) =>
    fm.pillars.map((p) => ({
      domain: fm.domain,
      pillar: p.pillar,
      status: p.status,
      statusLabel: STATUS_LABEL[p.status],
      leader: p.leader ?? "",
    }))
  );

  const pillars = Array.from(new Set(rows.map((r) => r.pillar)));
  const domains = featureMaps.map((f) => f.domain);

  return (
    <PlotFigure
      className="w-full"
      options={(width) => ({
        width,
        height: pillars.length * 56 + 60,
        marginLeft: 220,
        marginBottom: 40,
        padding: 0.06,
        x: { domain: domains, label: null },
        y: { domain: pillars, label: null },
        color: {
          domain: ["leading", "behind", "opportunity"],
          range: [STATUS_COLOR.leading, STATUS_COLOR.behind, STATUS_COLOR.opportunity],
          legend: true,
          tickFormat: (d: string) => STATUS_LABEL[d],
        },
        marks: [
          Plot.cell(rows, {
            x: "domain",
            y: "pillar",
            fill: "status",
            rx: 6,
            inset: 3,
            tip: true,
            title: (d: any) => `${d.pillar} · ${d.domain}\n${d.statusLabel}${d.leader ? `\nLeader: ${d.leader}` : ""}`,
          }),
        ],
      })}
    />
  );
}
