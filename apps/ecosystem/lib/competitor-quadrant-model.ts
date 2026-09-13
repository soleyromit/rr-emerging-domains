// The by-quadrant pivot's vocabulary: the four named regions, what each one means, and
// the tint it wears.
//
// A pure vocabulary module with NO imports, split from lib/competitor-quadrant.ts (which
// reads content/ through lib/content.ts) for the reason lib/dissection-graph-model.ts is
// split from lib/dissection-graph.ts: the chart is a client component and the page is a
// server component, and both need these names. A "use client" module's exports are
// client references on the server, so the names cannot live in the chart either — this
// module is the one place both sides can import the same strings from.

export type CompetitorQuadrantRegion = "displacement" | "split" | "home-turf" | "narrow";

export interface CompetitorQuadrantRegionMeta {
  key: CompetitorQuadrantRegion;
  /** The takeaway a reader remembers — the Gartner/G2 mechanism is the region's NAME. */
  name: string;
  meaning: string;
  /** Region tint, matching this app's green = Prism's win / red = a competitor's win. */
  fill: string;
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export const COMPETITOR_QUADRANT_REGIONS: CompetitorQuadrantRegionMeta[] = [
  {
    key: "displacement",
    name: "Displacement threats",
    meaning: "They lead Prism on half its pillars or more, and Prism leads them on fewer than half.",
    fill: "var(--color-background-red)",
    corner: "top-left",
  },
  {
    key: "split",
    name: "Split decisions",
    meaning: "Both sides lead on half the pillars or more — the deal turns on which pillars the buyer weighs.",
    fill: "var(--color-background-yellow)",
    corner: "top-right",
  },
  {
    key: "home-turf",
    name: "Prism's home turf",
    meaning: "Prism leads on half the pillars or more, and they lead on fewer than half.",
    fill: "var(--color-background-green)",
    corner: "bottom-right",
  },
  {
    key: "narrow",
    name: "Narrow overlap",
    meaning: "Neither side leads on half the pillars — a partial footprint, a partial contest.",
    fill: "var(--color-background-muted)",
    corner: "bottom-left",
  },
];

export const COMPETITOR_QUADRANT_REGION_NAME = Object.fromEntries(
  COMPETITOR_QUADRANT_REGIONS.map((r) => [r.key, r.name])
) as Record<CompetitorQuadrantRegion, string>;
