"use client";

import * as Plot from "@observablehq/plot";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Badge } from "@astryxdesign/core/Badge";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PlotFigure } from "./plot-figure";

export type VerdictTone = "lead" | "hold" | "behind";

const TONE_ORDER: VerdictTone[] = ["lead", "hold", "behind"];
const TONE_LABEL: Record<VerdictTone, string> = { lead: "Lead", hold: "Hold", behind: "Behind" };
// Same colors as the Badge variants this page already uses (BADGE_BY_TONE in
// app/go-to-market/page.tsx), so the chart visually matches the badges.
const TONE_COLOR: Record<VerdictTone, string> = {
  lead: "var(--color-icon-green)",
  hold: "var(--color-icon-yellow)",
  behind: "var(--color-icon-red)",
};

export interface VerdictRow {
  /** The positioning brief's own stage label, e.g. "3. Compliance clearance gate". */
  stage: string;
  tone: VerdictTone;
  /** The verdict cell verbatim, e.g. `Lead (upgraded from "conditional")`. */
  verdict?: string;
  /** 1-8, parsed off the stage label — drawn inside the dot and repeated in the key. */
  stageNumber?: number;
  /** Verified elements in this stage's element-level flow file. */
  elementCount?: number;
  /** Of those, how many carry an `accreditation_citation`. The x axis. */
  citedElements?: number;
  /** Of those, the percentage rated `gap` or `configure-needed`. The y axis. */
  gapShare?: number;
  /** The flow this stage was verified against — every point links to it. */
  flowSlug?: string;
  flowName?: string;
}

// ---------------------------------------------------------------------------
// A named two-axis quadrant, not a bar per stage.
//
// This used to be one bar per rotation stage colored by verdict — which showed the
// count of leads and nothing else, because every bar was the same length by
// construction (`x: () => 1`). The Gartner Magic Quadrant / G2 Grid mechanism this
// replaces it with is two NAMED axes and four NAMED regions: the takeaway is which box
// a stage is in, and the box has a name a reader repeats in a meeting.
//
// Both axes are real, already-computed metrics off the SAME element-level flow files the
// positioning brief's own guardrail says a lead claim must be earned from — the
// `accreditation_citation` and `gap_severity` fields that app/journeys/[slug],
// components/flow-detail.tsx and lib/content.ts's use-case index already count. Nothing
// is scored, weighted, or invented here.
//
// Deliberately NOT shared with the competitive-landscape quadrant
// (components/charts/competitor-quadrant-chart.tsx): different content, different axes,
// different regions. They share a visual grammar, not an implementation.
// ---------------------------------------------------------------------------

interface Region {
  name: string;
  meaning: string;
  fill: string;
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const REGIONS: Region[] = [
  {
    name: "Fund the build",
    meaning: "Accreditors cite this stage heavily and most of its verified elements are a gap or need configuring.",
    fill: "var(--color-background-red)",
    corner: "top-right",
  },
  {
    name: "Lead with this",
    meaning: "Accreditors cite it heavily and Prism already covers most of it — the safest ground in the room.",
    fill: "var(--color-background-green)",
    corner: "bottom-right",
  },
  {
    name: "Quiet debt",
    meaning: "Fewer citations, but most elements still unbuilt — real work, low external pressure so far.",
    fill: "var(--color-background-yellow)",
    corner: "top-left",
  },
  {
    // Named for what the two axes actually measure, not for a business conclusion:
    // fewer cited elements is partly how deeply the stage has been verified, so
    // "low stakes" would assert more than the data carries.
    name: "Lower pressure",
    meaning: "Fewer cited elements and less of it missing — lower measured pressure on either axis.",
    fill: "var(--color-background-muted)",
    corner: "bottom-left",
  },
];

interface Point extends VerdictRow {
  x: number;
  y: number;
  href: string;
  label: string;
  region: string;
}

const GAP_DIVIDER = 50;

function regionFor(x: number, y: number, xDivider: number): string {
  const heavy = x >= xDivider;
  const gappy = y >= GAP_DIVIDER;
  if (heavy && gappy) return "Fund the build";
  if (heavy) return "Lead with this";
  if (gappy) return "Quiet debt";
  return "Lower pressure";
}

export function VerdictDistributionChart({ rows }: { rows: VerdictRow[] }) {
  if (rows.length === 0) {
    return <EmptyState title="No verdicts parsed yet" />;
  }

  // A stage is plottable only when it has a real element-level flow behind it. One
  // without is dropped and counted below rather than parked at (0, 0), which would
  // read as "nothing cited, nothing missing" — a claim the absence of a file cannot make.
  const plottable = rows.filter(
    (r) => r.flowSlug && typeof r.citedElements === "number" && typeof r.gapShare === "number"
  );
  const dropped = rows.length - plottable.length;

  if (plottable.length === 0) {
    return (
      <EmptyState
        title="No element-level flow behind these verdicts yet"
        description="A stage is placed on the quadrant once the flow file it was verified against exists."
      />
    );
  }

  // The vertical divider is the average across the stages actually plotted, stated on
  // the chart — there is no external threshold for "a lot of cited elements", so the
  // honest split is this set's own centre of gravity rather than a made-up round number.
  const xDivider =
    plottable.reduce((sum, r) => sum + (r.citedElements ?? 0), 0) / plottable.length;

  const points: Point[] = plottable.map((r, i) => {
    const x = r.citedElements ?? 0;
    const y = r.gapShare ?? 0;
    return {
      ...r,
      x,
      y,
      href: `/flows/${r.flowSlug}`,
      label: String(r.stageNumber ?? i + 1),
      region: regionFor(x, y, xDivider),
    };
  });

  const xMax = Math.max(...points.map((p) => p.x));
  const lo = 0;
  const hi = Math.ceil((xMax * 1.12) / 10) * 10;

  const boxes = REGIONS.map((r) => {
    const left = r.corner === "top-left" || r.corner === "bottom-left";
    const top = r.corner === "top-left" || r.corner === "top-right";
    return {
      ...r,
      x1: left ? lo : xDivider,
      x2: left ? xDivider : hi,
      y1: top ? GAP_DIVIDER : 0,
      y2: top ? 100 : GAP_DIVIDER,
      tx: left ? lo + hi * 0.015 : hi - hi * 0.015,
      ty: top ? 98 : 2,
      anchor: (left ? "start" : "end") as "start" | "end",
    };
  });

  return (
    <Stack gap={3}>
      <PlotFigure
        className="w-full"
        options={(width) => ({
          width,
          height: Math.max(360, Math.min(520, width * 0.6)),
          marginLeft: 64,
          marginRight: 28,
          marginTop: 28,
          marginBottom: 52,
          x: { label: "Accreditation-cited elements verified at this stage", domain: [lo, hi], grid: true },
          y: {
            label: "Verified elements rated a gap or configure-needed (%)",
            domain: [0, 100],
            grid: true,
            tickFormat: (d: number) => `${d}%`,
          },
          color: {
            domain: TONE_ORDER,
            range: TONE_ORDER.map((d) => TONE_COLOR[d]),
            legend: true,
            tickFormat: (d: string) => TONE_LABEL[d as VerdictTone] ?? d,
          },
          marks: [
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
            Plot.ruleX([xDivider], { strokeOpacity: 0.5, strokeDasharray: "4 3" }),
            Plot.ruleY([GAP_DIVIDER], { strokeOpacity: 0.5, strokeDasharray: "4 3" }),
            Plot.dot(points, {
              x: "x",
              y: "y",
              r: 11,
              fill: "tone",
              stroke: "var(--color-background-card)",
              strokeWidth: 1.5,
              href: "href",
              target: "_self",
              channels: {
                Stage: "stage",
                Verdict: (d: Point) => d.verdict ?? TONE_LABEL[d.tone],
                Quadrant: "region",
                // The flow's real name, never its file slug — the rule every label in
                // this app follows (UI-DENSITY-PATTERNS.md, "no raw filenames").
                "Verified against": (d: Point) => d.flowName ?? "—",
                "Elements verified": "elementCount",
                "Accreditation-cited": "citedElements",
                "Gap or configure-needed": (d: Point) => `${d.y}%`,
              },
              tip: { format: { x: false, y: false, fill: false, r: false } },
            }),
            // The stage number sits ABOVE its dot rather than inside it: the dot wears
            // the verdict colour, and there is no single text colour that stays legible
            // on green, amber and red at once. Outside, it inherits the plot's own text
            // colour and reads in either theme.
            Plot.text(points, {
              x: "x",
              y: "y",
              text: "label",
              dy: -17,
              fontSize: 12,
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
        This quadrant is a summary, not the evidence. Each point is a click through to the element-level flow the
        verdict was verified against — the screens, the cited standard and the gap note behind both coordinates —
        and the full verdict, its caveats and what changed at verification are in the map below. Colour is the
        brief&apos;s own verdict, position is the element evidence; where the two disagree, read the row before
        repeating either. The vertical divider is this set&apos;s own average ({Math.round(xDivider)} cited
        elements), not an external benchmark; the horizontal one is half the verified elements.
        {dropped > 0
          ? ` ${dropped} stage${dropped === 1 ? "" : "s"} in the map below ${dropped === 1 ? "has" : "have"} no element-level flow file yet and ${dropped === 1 ? "is" : "are"} not plotted.`
          : ""}
      </Text>
      <Stack gap={2}>
        <Text type="label" color="secondary" size="sm">
          Every plotted stage, by quadrant
        </Text>
        <Stack gap={1.5}>
          {points.map((p) => (
            // No separate number column here, unlike the competitor quadrant's key: the
            // brief numbers its own stages ("3. Compliance clearance gate"), and that
            // leading number IS the label drawn on the dot.
            <Stack key={p.stage} direction="horizontal" gap={2} vAlign="center" wrap="wrap">
              <Link href={p.href} color="accent" hasUnderline>
                {p.stage}
              </Link>
              <Badge
                variant={p.tone === "lead" ? "success" : p.tone === "hold" ? "warning" : "error"}
                label={TONE_LABEL[p.tone]}
              />
              <Text type="supporting" size="xsm">
                {p.region} — {p.citedElements} of {p.elementCount} elements carry an accreditation citation, {p.y}%
                rated a gap or configure-needed
              </Text>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
