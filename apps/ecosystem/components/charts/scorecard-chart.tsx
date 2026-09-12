"use client";

import * as Plot from "@observablehq/plot";
import { Grid } from "@astryxdesign/core/Grid";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { PlotFigure } from "./plot-figure";
import { disciplineColorVar } from "@/lib/discipline-meta";
import type { Scorecard } from "@/lib/content";

export function ScorecardChart({ scorecard, totals }: { scorecard: Scorecard; totals: Record<string, number> }) {
  const domains = Object.keys(totals);
  const totalRows = domains.map((d) => ({ domain: d, total: totals[d] }));

  const breakdownRows = scorecard.criteria.flatMap((c) =>
    domains.map((d) => ({
      domain: d,
      criterion: c.name,
      contribution: (c.weight ?? 0) * (c.scores?.[d] ?? 0),
    }))
  );

  return (
    <Grid columns={{ minWidth: 360 }} gap={6}>
      <Stack gap={2}>
        <Text type="label">Weighted total (out of 5)</Text>
        <PlotFigure
          className="w-full"
          options={(width) => ({
            width,
            height: 220,
            marginLeft: 90,
            x: { label: "Weighted score", domain: [0, 5] },
            y: { label: null },
            marks: [
              // Each bar in this domain's own accent (same DO purple/Pharmacy
              // teal/Dentistry orange/Medicine cyan as DisciplineChip and the
              // domain hub header) instead of one flat accent color — a
              // reader who's learned that color language on any other page
              // recognizes it here too, rather than re-reading every label.
              Plot.barX(totalRows, {
                y: "domain",
                x: "total",
                fill: (d: { domain: string }) => disciplineColorVar(d.domain),
                sort: { y: "-x" },
                tip: true,
              }),
              Plot.text(totalRows, {
                y: "domain",
                x: "total",
                text: (d: any) => d.total.toFixed(2),
                dx: 18,
                fontSize: 11,
              }),
              Plot.ruleX([0]),
            ],
          })}
        />
      </Stack>
      <Stack gap={2}>
        <Text type="label">Contribution by criterion</Text>
        <PlotFigure
          className="w-full"
          options={(width) => ({
            width,
            height: 220,
            marginLeft: 90,
            x: { label: "Weighted contribution" },
            y: { label: null },
            color: { legend: true, scheme: "cool" },
            marks: [
              Plot.barX(breakdownRows, {
                y: "domain",
                x: "contribution",
                fill: "criterion",
                sort: { y: "-x" },
                tip: true,
              }),
              Plot.ruleX([0]),
            ],
          })}
        />
      </Stack>
    </Grid>
  );
}
