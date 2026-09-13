"use client";

import * as Plot from "@observablehq/plot";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PlotFigure } from "./plot-figure";
// Types only: lib/competitor-quadrant.ts imports lib/content.ts, which reads content/
// through node:fs. A type-only import is erased, so nothing of it reaches the browser.
import type { CompetitorQuadrantPoint } from "@/lib/competitor-quadrant";
// A runtime import, and safe to be one — the vocabulary module has no imports at all.
import {
  COMPETITOR_QUADRANT_REGIONS,
  COMPETITOR_QUADRANT_REGION_NAME,
} from "@/lib/competitor-quadrant-model";

// Two NAMED axes and four NAMED regions, the Gartner Magic Quadrant / G2 Grid
// mechanism: what a reader carries away is the name of the box a vendor is in, not a
// coordinate. Neither axis is a score — both are counts of the same already-researched
// `depth_vs_prism` judgments the by-competitor pivot stacks as bars, so a dot can always
// be walked back to the pillar rows that put it there.
//
// Deliberately NOT shared with the go-to-market verdict quadrant
// (components/charts/verdict-distribution-chart.tsx): that one plots rotation stages on
// accreditation citations vs. verified gap load, off entirely different content. The two
// share a visual grammar, not an implementation.

const REGION_NAME = COMPETITOR_QUADRANT_REGION_NAME;

export function CompetitorQuadrantChart({
  points,
  threshold,
  pillarCount,
}: {
  points: CompetitorQuadrantPoint[];
  threshold: number;
  pillarCount: number;
}) {
  if (points.length === 0) {
    return (
      <EmptyState
        title="No verified pillar judgments yet"
        description="A vendor is plotted once its feature teardown rates at least one of the six pillars against Prism."
      />
    );
  }

  const lo = -0.5;
  const hi = pillarCount + 0.5;
  const ticks = Array.from({ length: pillarCount + 1 }, (_, i) => i);
  const inset = 0.3;

  const boxes = COMPETITOR_QUADRANT_REGIONS.map((r) => {
    const left = r.corner === "top-left" || r.corner === "bottom-left";
    const top = r.corner === "top-left" || r.corner === "top-right";
    return {
      ...r,
      x1: left ? lo : threshold,
      x2: left ? threshold : hi,
      y1: top ? threshold : lo,
      y2: top ? hi : threshold,
      tx: left ? lo + inset : hi - inset,
      ty: top ? hi - inset : lo + inset,
      anchor: (left ? "start" : "end") as "start" | "end",
    };
  });

  const fanned = points.some((p) => p.plotX !== p.prismLeads || p.plotY !== p.competitorLeads);

  return (
    <Stack gap={3}>
      <PlotFigure
        className="w-full"
        options={(width) => ({
          width,
          height: Math.max(360, Math.min(520, width * 0.62)),
          marginLeft: 64,
          marginRight: 28,
          marginTop: 28,
          marginBottom: 52,
          // Both axes are whole pillars. The half-unit domain padding (which keeps a dot
          // sitting on 0 or 6 off the frame edge) otherwise makes Plot infer a decimal
          // tick format — "6.0 pillars" is not a thing this data can mean.
          x: {
            label: `Pillars Prism leads — rated "behind" or "Prism-only"`,
            domain: [lo, hi],
            ticks,
            tickFormat: (d: number) => String(d),
            grid: true,
          },
          y: {
            label: `Pillars the vendor leads — rated "ahead of Prism"`,
            domain: [lo, hi],
            ticks,
            tickFormat: (d: number) => String(d),
            grid: true,
          },
          marks: [
            // Region backgrounds first, so gridlines and points draw over them.
            ...boxes.flatMap((b) => [
              Plot.rect([b], { x1: "x1", x2: "x2", y1: "y1", y2: "y2", fill: b.fill, fillOpacity: 0.55 }),
              Plot.text([b], {
                x: "tx",
                y: "ty",
                text: "name",
                textAnchor: b.anchor,
                lineAnchor: b.corner.startsWith("top") ? "top" : "bottom",
                fontSize: 12,
                fontWeight: 600,
              }),
            ]),
            Plot.ruleX([threshold], { strokeOpacity: 0.5, strokeDasharray: "4 3" }),
            Plot.ruleY([threshold], { strokeOpacity: 0.5, strokeDasharray: "4 3" }),
            Plot.dot(points, {
              x: "plotX",
              y: "plotY",
              r: 11,
              fill: "var(--color-accent)",
              stroke: "var(--color-background-card)",
              strokeWidth: 1.5,
              href: "href",
              target: "_self",
              channels: {
                Vendor: "competitor",
                Quadrant: (d: CompetitorQuadrantPoint) => REGION_NAME[d.region],
                "Pillars Prism leads": "prismLeads",
                "Pillars they lead": "competitorLeads",
                "Pillars at parity": "atParity",
                "Pillars with a verified judgment": "assessed",
              },
              // The drawn coordinate can be a fanned decimal; the true counts are already
              // in the channels above, so showing x/y again would only invite reading a
              // tie-breaking offset as data.
              tip: { format: { x: false, y: false, r: false } },
            }),
            Plot.text(points, {
              x: "plotX",
              y: "plotY",
              text: (d: CompetitorQuadrantPoint) => String(d.index),
              fill: "var(--color-on-accent)",
              fontSize: 11,
              fontWeight: 700,
              href: "href",
              target: "_self",
            }),
          ],
        })}
      />
      {/* The Gartner disclosure, stated the way Gartner states it: the picture is the
          summary, the row underneath is the evidence. */}
      <Text type="supporting" size="xsm">
        This quadrant is a summary, not the evidence. Each point is a click through to that vendor&apos;s full
        teardown — the pillar-by-pillar capability, depth judgment and source behind every count plotted here.
        Read it before quoting a position.
        {fanned
          ? " Vendors landing on the same pair of counts are fanned out slightly so each stays visible and clickable; the numbers in the key are the real ones."
          : ""}
      </Text>
      <Stack gap={2}>
        <Text type="label" color="secondary" size="sm">
          Every plotted vendor, by quadrant
        </Text>
        <Stack gap={1.5}>
          {points.map((p) => (
            <Stack key={p.slug} direction="horizontal" gap={2} vAlign="center" wrap="wrap">
              <Text type="label" size="xsm" color="secondary">
                {p.index}.
              </Text>
              <Link href={p.href} color="accent" hasUnderline>
                {p.competitor}
              </Link>
              <Text type="supporting" size="xsm">
                {REGION_NAME[p.region]} — Prism leads {p.prismLeads}, {p.competitor} leads {p.competitorLeads},{" "}
                {p.atParity} at parity, of {p.assessed} pillar{p.assessed === 1 ? "" : "s"} verified
              </Text>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
