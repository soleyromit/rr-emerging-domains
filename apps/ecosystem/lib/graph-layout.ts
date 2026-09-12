import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
  // `d3`, not `d3-force`. The force subpackage is what's actually used, but only `d3`
  // (and `@types/d3`) is a declared dependency of this app — importing the subpackage
  // directly would rely on a hoisted transitive that nothing here promises will stay
  // hoisted. Nothing in this file reaches the browser: it is called from a server
  // component, so pulling d3's full re-export graph costs the client bundle nothing.
} from "d3";
import {
  DISSECTION_NODE_TYPES,
  type DissectionGraph,
  type DissectionNodeType,
} from "@/lib/dissection-graph-model";

// Coordinates for lib/dissection-graph.ts's output. Pure, synchronous, and
// server-safe: the simulation is stepped a fixed number of times and stopped, never
// animated, so the same graph always produces byte-identical coordinates and the
// initial server render is the final one (no layout flash, no d3 in the browser
// bundle). See DESIGN.md's "one sanctioned exception" paragraph for why d3-force is
// allowed here and nowhere else.
//
// What the simulation actually decides is the ORDER of nodes within their lane —
// link/charge/collide forces pull connected nodes level with each other so the edge
// layer has as few crossings as it can. It does NOT decide final pixels: a
// deterministic pass afterwards snaps every node onto its lane's evenly spaced slots
// and centres the lane in the canvas. That is on purpose. An unconstrained force
// layout can park a node outside its container — the graph equivalent of the fixed
// pixel widths that overflowed in Task 5.1 — and "it converged" is not the same claim
// as "every node is inside the box". Here the box is what assigns the coordinates, so
// out-of-bounds is unrepresentable rather than unlikely.

/** Card geometry. The renderer must use exactly these — they are what the bounding
 * box is computed from, so a component that sized its cards differently would be the
 * one thing that could push content outside the container. */
export const NODE_WIDTH = 156;
export const NODE_HEIGHT = 56;
const LANE_GAP = 44;
const ROW_GAP = 12;
const PAD = 16;
const MIN_HEIGHT = 220;
const TICKS = 400;

export interface GraphLayoutNode {
  id: string;
  /** Centre of the node card, in layout coordinates. */
  x: number;
  y: number;
}

export interface GraphLayoutLane {
  type: DissectionNodeType;
  /** Centre x of every card in this lane. */
  x: number;
  count: number;
}

export interface GraphLayout {
  /** Intrinsic size of the drawing. The renderer sizes its canvas to exactly this and
   * lets the surrounding container scroll — every coordinate below is inside it. */
  width: number;
  height: number;
  nodeWidth: number;
  nodeHeight: number;
  /** Only lanes that really have nodes, left to right. A domain with no trends gets no
   * empty trend column reserving space for nothing. */
  lanes: GraphLayoutLane[];
  nodes: GraphLayoutNode[];
}

/** Deterministic PRNG handed to the simulation via `randomSource`, so d3-force's
 * internal jiggle (used when two nodes land on exactly the same coordinate) cannot
 * make the layout differ between two renders of identical data. Seeded from the node
 * ids themselves — same graph, same seed, same picture. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(ids: string[]): number {
  let h = 2166136261;
  for (const id of ids) {
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  laneIndex: number;
  laneX: number;
  homeY: number;
}

type SimLink = SimulationLinkDatum<SimNode>;

/**
 * Typed lanes, left to right: persona | standard | competitor | pillar | trend.
 *
 * The order is chosen to put each relationship's two ends as close together as
 * possible. Competitor is the hub — it is the only type that touches all four others
 * — so it sits in the middle. Of the seven relationships, four land between adjacent
 * lanes (persona-standard, standard-competitor, pillar-competitor, trend-pillar) and
 * only three span two lanes (persona-competitor, standard-pillar, trend-competitor).
 * Every other ordering of the five types leaves at least one relationship spanning
 * three lanes, which is the arrangement that reads as a tangle.
 */
export function layoutDissectionGraph(graph: DissectionGraph): GraphLayout {
  const activeTypes = DISSECTION_NODE_TYPES.filter((t) => graph.nodes.some((n) => n.type === t));
  const laneIndexOf = new Map(activeTypes.map((t, i) => [t, i]));

  const width = activeTypes.length
    ? PAD * 2 + activeTypes.length * NODE_WIDTH + (activeTypes.length - 1) * LANE_GAP
    : PAD * 2 + NODE_WIDTH;
  const laneX = (i: number) => PAD + NODE_WIDTH / 2 + i * (NODE_WIDTH + LANE_GAP);

  const byLane = activeTypes.map((t) => graph.nodes.filter((n) => n.type === t));
  const tallest = byLane.reduce((m, l) => Math.max(m, l.length), 0);
  const laneSpan = (count: number) => (count ? count * (NODE_HEIGHT + ROW_GAP) - ROW_GAP : 0);
  const height = Math.max(MIN_HEIGHT, laneSpan(tallest) + PAD * 2);

  if (!graph.nodes.length) {
    return { width, height, nodeWidth: NODE_WIDTH, nodeHeight: NODE_HEIGHT, lanes: [], nodes: [] };
  }

  // Initial positions: lane centre x, evenly spread y in the builder's own node order.
  // Explicit, so d3-force never falls back to its phyllotaxis placement (which would
  // be deterministic too, but would ignore the lanes entirely).
  const simNodes: SimNode[] = graph.nodes.map((n) => {
    const li = laneIndexOf.get(n.type) ?? 0;
    const rank = byLane[li].findIndex((m) => m.id === n.id);
    const span = laneSpan(byLane[li].length);
    const homeY = (height - span) / 2 + NODE_HEIGHT / 2 + rank * (NODE_HEIGHT + ROW_GAP);
    return { id: n.id, laneIndex: li, laneX: laneX(li), homeY, x: laneX(li), y: homeY };
  });
  const index = new Map(simNodes.map((n) => [n.id, n]));
  const simLinks: SimLink[] = graph.edges
    .filter((e) => index.has(e.source) && index.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  const sim = forceSimulation<SimNode>(simNodes)
    .randomSource(mulberry32(seedFrom(graph.nodes.map((n) => n.id))))
    .force(
      "link",
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        // Links pull vertically only (x is pinned below), so the useful distance is
        // "level with each other", not the lane pitch.
        .distance(NODE_HEIGHT + ROW_GAP)
        .strength(0.14),
    )
    .force("charge", forceManyBody<SimNode>().strength(-26))
    // Strength 1: the lane assignment is the layout's contract, not a suggestion.
    .force("x", forceX<SimNode>((d) => d.laneX).strength(1))
    // Weak: enough to stop a lightly linked node drifting to an extreme, not enough to
    // override what the links want.
    .force("y", forceY<SimNode>((d) => d.homeY).strength(0.04))
    .force("collide", forceCollide<SimNode>((NODE_HEIGHT + ROW_GAP) / 2).strength(0.9).iterations(2))
    .stop();
  for (let i = 0; i < TICKS; i++) sim.tick();

  // The simulation's only surviving output: the order of ids within each lane.
  const nodes: GraphLayoutNode[] = [];
  const lanes: GraphLayoutLane[] = [];
  activeTypes.forEach((type, li) => {
    const members = byLane[li]
      .map((n) => index.get(n.id)!)
      .sort((a, z) => (a.y ?? 0) - (z.y ?? 0) || a.id.localeCompare(z.id));
    const span = laneSpan(members.length);
    const top = (height - span) / 2;
    members.forEach((m, rank) => {
      nodes.push({
        id: m.id,
        x: laneX(li),
        y: top + NODE_HEIGHT / 2 + rank * (NODE_HEIGHT + ROW_GAP),
      });
    });
    lanes.push({ type, x: laneX(li), count: members.length });
  });

  return { width, height, nodeWidth: NODE_WIDTH, nodeHeight: NODE_HEIGHT, lanes, nodes };
}
