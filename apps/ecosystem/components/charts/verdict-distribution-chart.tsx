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
  /** Of those, how many actually name an accreditation standard. Shown, not plotted. */
  citedElements?: number;
  /** `citedElements` as a percentage of `elementCount`. The x axis. */
  citedShare?: number;
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
// Both axes are SHARES of the same denominator, deliberately. An earlier version plotted
// the raw count of cited elements, which made the x position track how many elements a
// flow file happens to have — a 104-element flow outscored a 66-element one on volume
// alone, so the divider mostly separated thoroughly-annotated flows from thinly-annotated
// ones rather than heavily-cited stages from lightly-cited ones. Normalising removes that
// confound; it does not turn either axis into a business score, which is why the region
// names below describe the two measurements rather than prescribing an action.
//
// Deliberately NOT shared with the competitive-landscape quadrant
// (components/charts/competitor-quadrant-chart.tsx): different content, different axes,
// different regions. They share a visual grammar, not an implementation.
// ---------------------------------------------------------------------------

// Keyed the way lib/competitor-quadrant-model.ts keys its regions: the assignment
// function returns a key from this union, never a display string, so renaming a region
// is one edit and a typo is a type error rather than a point that silently belongs to no
// region.
type VerdictRegion = "cited-unbuilt" | "cited-covered" | "less-cited-unbuilt" | "less-cited-covered";

interface Region {
  key: VerdictRegion;
  name: string;
  meaning: string;
  fill: string;
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

// The names describe the two measured shares and nothing beyond them. An earlier pass
// called these "Fund the build" and "Lead with this" — business verbs the axes cannot
// carry, since one of them is "how much of this flow file cites a standard" and the
// other is Prism's own gap rating. Which stage to fund is a decision the row underneath
// supports; the quadrant only says where the two percentages put it.
const REGIONS: Region[] = [
  {
    key: "cited-unbuilt",
    name: "Cited and unbuilt",
    meaning:
      "Most of this stage's elements name an accreditation standard, and most are still rated a gap or configure-needed.",
    fill: "var(--color-background-red)",
    corner: "top-right",
  },
  {
    key: "cited-covered",
    name: "Cited and covered",
    meaning:
      "Most elements name a standard and most are already covered — the best-evidenced ground, subject to the row's own caveats.",
    fill: "var(--color-background-green)",
    corner: "bottom-right",
  },
  {
    key: "less-cited-unbuilt",
    name: "Less cited, unbuilt",
    meaning:
      "A smaller share cites a standard, but most elements are still a gap or need configuring.",
    fill: "var(--color-background-yellow)",
    corner: "top-left",
  },
  {
    key: "less-cited-covered",
    name: "Less cited, covered",
    meaning: "A smaller share cites a standard and less of it is missing — lower reading on both measures.",
    fill: "var(--color-background-muted)",
    corner: "bottom-left",
  },
];

const REGION_NAME = Object.fromEntries(REGIONS.map((r) => [r.key, r.name])) as Record<
  VerdictRegion,
  string
>;

interface Point extends VerdictRow {
  x: number;
  y: number;
  href: string;
  label: string;
  region: VerdictRegion;
  regionName: string;
}

const GAP_DIVIDER = 50;

function regionFor(x: number, y: number, xDivider: number): VerdictRegion {
  const cited = x >= xDivider;
  const gappy = y >= GAP_DIVIDER;
  if (cited && gappy) return "cited-unbuilt";
  if (cited) return "cited-covered";
  if (gappy) return "less-cited-unbuilt";
  return "less-cited-covered";
}

export function VerdictDistributionChart({ rows }: { rows: VerdictRow[] }) {
  if (rows.length === 0) {
    return <EmptyState title="No verdicts parsed yet" />;
  }

  // A stage is plottable only when it has a real element-level flow behind it AND that
  // flow has elements to take a percentage of. Either way it is dropped and counted
  // below rather than parked at (0, 0), which would read as "nothing cited, nothing
  // missing" — a claim neither a missing file nor an empty one can make.
  const plottable = rows.filter(
    (r) => r.flowSlug && typeof r.citedShare === "number" && typeof r.gapShare === "number"
  );
  // Split by WHY, because the two cases need different words: a stage with no flow file
  // at all is un-verified, while one whose flow file has no elements is verified to an
  // empty trace. The old sentence said "no element-level flow file yet" for both.
  const droppedNoFlow = rows.filter((r) => !r.flowSlug).length;
  const droppedNoElements = rows.length - plottable.length - droppedNoFlow;

  if (plottable.length === 0) {
    return (
      <EmptyState
        title="No element-level flow behind these verdicts yet"
        description="A stage is placed on the quadrant once the flow file it was verified against exists and carries elements."
      />
    );
  }

  // The vertical divider is the average across the stages actually plotted, stated on
  // the chart — there is no external threshold for "a heavily cited stage", so the
  // honest split is this set's own centre of gravity rather than a made-up round number.
  const xDivider = plottable.reduce((sum, r) => sum + (r.citedShare ?? 0), 0) / plottable.length;

  const points: Point[] = plottable.map((r, i) => {
    const x = r.citedShare ?? 0;
    const y = r.gapShare ?? 0;
    const region = regionFor(x, y, xDivider);
    return {
      ...r,
      x,
      y,
      href: `/flows/${r.flowSlug}`,
      label: String(r.stageNumber ?? i + 1),
      region,
      regionName: REGION_NAME[region],
    };
  });

  // Both axes are percentages, so both run the full 0-100 — no data-derived upper bound
  // to pad, and therefore no way for an empty or all-zero set to collapse the domain to
  // [0, 0] the way a `Math.ceil(max * 1.12)` bound could. A truncated percentage axis
  // would also exaggerate the distances between stages, which is the opposite of what
  // this normalisation is for.
  const lo = 0;
  const hi = 100;

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
          x: {
            label: "Verified elements naming an accreditation standard (%)",
            domain: [lo, hi],
            grid: true,
            tickFormat: (d: number) => `${d}%`,
          },
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
                Quadrant: "regionName",
                // The flow's real name, never its file slug — the rule every label in
                // this app follows (UI-DENSITY-PATTERNS.md, "no raw filenames").
                "Verified against": (d: Point) => d.flowName ?? "—",
                "Elements verified": "elementCount",
                "Naming a standard": (d: Point) => `${d.citedElements} of ${d.elementCount} (${d.x}%)`,
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
        repeating either. Both axes are percentages of the same verified elements, so a longer flow file does not
        move a stage rightward for being longer — but a citation share still counts how much of a stage has been
        annotated against a standard, not how hard an accreditor leans on it. The vertical divider is this
        set&apos;s own average ({Math.round(xDivider)}% of elements naming a standard), not an external benchmark;
        the horizontal one is half the verified elements. An element whose citation field says &ldquo;None…&rdquo;
        is counted as not citing a standard.
        {droppedNoFlow > 0
          ? ` ${droppedNoFlow} stage${droppedNoFlow === 1 ? "" : "s"} in the map below ${droppedNoFlow === 1 ? "has" : "have"} no element-level flow file yet and ${droppedNoFlow === 1 ? "is" : "are"} not plotted.`
          : ""}
        {droppedNoElements > 0
          ? ` ${droppedNoElements} ${droppedNoElements === 1 ? "has a flow file with no elements in it, so there is nothing to take a percentage of" : "have flow files with no elements in them, so there is nothing to take a percentage of"}.`
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
                {p.regionName} — {p.x}% of its {p.elementCount} verified elements name an accreditation standard (
                {p.citedElements} of {p.elementCount}), {p.y}% rated a gap or configure-needed
              </Text>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
