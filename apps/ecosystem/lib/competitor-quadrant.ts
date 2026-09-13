// The by-quadrant pivot's arithmetic: where each researched vendor sits when the
// pillars Prism wins are plotted against the pillars the vendor wins.
//
// SERVER-ONLY. It imports values (not just types) from lib/content.ts, which reads
// content/ through node:fs — a runtime import of this module from a client component
// would put node:fs in the browser chunk. The chart component imports only the TYPES
// below, which are erased at compile time.
//
// Both axes are counts of the SAME already-researched field every other competitive
// surface reads — `feature_teardown[].depth_vs_prism`, the field
// components/charts/competitor-depth-chart.tsx stacks and
// getFeatureComparisonForDomain() puts in its grid cells. Nothing new is authored here
// and no score is invented: a pillar is counted once, on the side the research already
// put it.
import { CANONICAL_PILLAR_ORDER, normalizePillarName, type Competitor } from "@/lib/content";
import { normalizeDepth } from "@/lib/competitor-depth";
import type { CompetitorQuadrantRegion } from "@/lib/competitor-quadrant-model";

export type { CompetitorQuadrantRegion };

export interface CompetitorQuadrantPoint {
  slug: string;
  competitor: string;
  /** The full teardown — every point on the plot links here. */
  href: string;
  /** 1-based label drawn inside the dot and repeated in the key under the chart. */
  index: number;
  /** Canonical pillars rated `behind` or `prism-only` — Prism wins these. */
  prismLeads: number;
  /** Canonical pillars rated `ahead` — the vendor wins these. */
  competitorLeads: number;
  /** Canonical pillars rated `at-parity` — neither side wins. */
  atParity: number;
  /** Canonical pillars carrying any verified judgment (the other three added up). */
  assessed: number;
  region: CompetitorQuadrantRegion;
  /**
   * Where the dot is actually drawn. Identical to (prismLeads, competitorLeads) unless
   * several vendors share one integer coordinate, in which case the group is fanned out
   * on a small circle around it — both axes are whole pillar counts, so exact ties are
   * common and a hidden dot is an unclickable dot. The tooltip and the key always show
   * the true counts; the chart says the fan happened.
   */
  plotX: number;
  plotY: number;
}

export interface CompetitorQuadrantVendor {
  slug: string;
  competitor: string;
  href: string;
}

export interface CompetitorQuadrantData {
  points: CompetitorQuadrantPoint[];
  /**
   * Researched vendors whose teardown carries no verified pillar judgment at all
   * (every canonical pillar `unknown`/"unable to verify"). Deliberately NOT plotted at
   * the origin: "nobody has verified a pillar yet" and "this vendor competes on
   * nothing" are different claims, and the origin would assert the second one.
   */
  unassessed: CompetitorQuadrantVendor[];
  /** Pillars a side must win to cross into the upper/right half — half of the six. */
  majority: number;
  /** Where the divider is DRAWN: between the two counts, so `majority` lands inside. */
  threshold: number;
  /** The canonical pillar set both axes are counted out of. */
  pillarCount: number;
}

/** Half the canonical pillar set: a vendor needs 3 of 6 to cross a divider. */
const MAJORITY = Math.ceil(CANONICAL_PILLAR_ORDER.length / 2);
/** Drawn between the counts, so a vendor sitting exactly on 3 lands inside the region. */
const DIVIDER = MAJORITY - 0.5;
/** Fan radius for tied coordinates, in pillar units (~30px at the plot's usual width). */
const FAN_RADIUS = 0.3;

function regionFor(prismLeads: number, competitorLeads: number): CompetitorQuadrantRegion {
  const prismStrong = prismLeads >= MAJORITY;
  const competitorStrong = competitorLeads >= MAJORITY;
  if (prismStrong && competitorStrong) return "split";
  if (competitorStrong) return "displacement";
  if (prismStrong) return "home-turf";
  return "narrow";
}

export function buildCompetitorQuadrant(competitors: Competitor[]): CompetitorQuadrantData {
  const unassessed: CompetitorQuadrantVendor[] = [];
  const scored: Omit<CompetitorQuadrantPoint, "index" | "plotX" | "plotY">[] = [];

  for (const c of competitors) {
    // Restricted to the six cross-comparable pillars for the same reason
    // getFeatureComparisonForDomain() restricts its rows: a competitor file can carry a
    // one-off analysis entry that is not a Prism pillar at all (medhub.yaml's
    // "not a Prism pillar — DO-specific positioning"), and counting it would move a dot
    // on evidence the other vendors were never assessed against.
    const seen = new Set<string>();
    let prismLeads = 0;
    let competitorLeads = 0;
    let atParity = 0;
    for (const f of c.feature_teardown ?? []) {
      const pillar = normalizePillarName(f.pillar);
      if (!CANONICAL_PILLAR_ORDER.includes(pillar) || seen.has(pillar)) continue;
      seen.add(pillar);
      const depth = normalizeDepth(f.depth_vs_prism);
      if (depth === "behind" || depth === "prism-only") prismLeads += 1;
      else if (depth === "ahead") competitorLeads += 1;
      else if (depth === "at-parity") atParity += 1;
    }
    const assessed = prismLeads + competitorLeads + atParity;
    const vendor = { slug: c.slug, competitor: c.competitor, href: `/competitors/${c.slug}` };
    if (assessed === 0) {
      unassessed.push(vendor);
      continue;
    }
    scored.push({ ...vendor, prismLeads, competitorLeads, atParity, assessed, region: regionFor(prismLeads, competitorLeads) });
  }

  // Numbered in reading order — the key under the chart is sorted the same way, so
  // finding dot 7 in the list is scanning, not searching.
  scored.sort(
    (a, b) =>
      b.competitorLeads - a.competitorLeads ||
      a.prismLeads - b.prismLeads ||
      a.competitor.localeCompare(b.competitor)
  );

  const tiedCounts = new Map<string, number>();
  for (const s of scored) {
    const key = `${s.prismLeads},${s.competitorLeads}`;
    tiedCounts.set(key, (tiedCounts.get(key) ?? 0) + 1);
  }
  const placed = new Map<string, number>();

  const points: CompetitorQuadrantPoint[] = scored.map((s, i) => {
    const key = `${s.prismLeads},${s.competitorLeads}`;
    const total = tiedCounts.get(key) ?? 1;
    const nth = placed.get(key) ?? 0;
    placed.set(key, nth + 1);
    // Single occupant: drawn exactly on its counts. Otherwise evenly spaced on a small
    // circle, starting at the top, so the group reads as one cluster at one coordinate.
    const angle = (2 * Math.PI * nth) / total - Math.PI / 2;
    return {
      ...s,
      index: i + 1,
      plotX: total === 1 ? s.prismLeads : s.prismLeads + FAN_RADIUS * Math.cos(angle),
      plotY: total === 1 ? s.competitorLeads : s.competitorLeads + FAN_RADIUS * Math.sin(angle),
    };
  });

  unassessed.sort((a, b) => a.competitor.localeCompare(b.competitor));

  return {
    points,
    unassessed,
    majority: MAJORITY,
    threshold: DIVIDER,
    pillarCount: CANONICAL_PILLAR_ORDER.length,
  };
}

/** Region counts for the page's headline and metadata row. */
export function countByRegion(points: CompetitorQuadrantPoint[]): Record<CompetitorQuadrantRegion, number> {
  const counts: Record<CompetitorQuadrantRegion, number> = {
    displacement: 0,
    split: 0,
    "home-turf": 0,
    narrow: 0,
  };
  for (const p of points) counts[p.region] += 1;
  return counts;
}
