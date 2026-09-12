"use client";

import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Stack } from "@astryxdesign/core/Stack";
import {
  NODE_TYPE_LABEL,
  type DissectionEdge,
  type DissectionEdgeKind,
  type DissectionGraph,
  type DissectionNodeType,
  // Not "@/lib/dissection-graph": that module reads content/ through node:fs, and a
  // runtime import of it from a client component puts node:fs in the browser chunk
  // (Turbopack fails the build outright). The vocabulary module has no imports.
} from "@/lib/dissection-graph-model";
import type { GraphLayout } from "@/lib/graph-layout";

// The drawing itself: absolutely positioned design-system Cards for the nodes, one
// plain SVG line layer for the edges. No diagramming library renders anything here —
// d3-force ran server-side and is gone by now; every coordinate arrives as a number in
// props (see DESIGN.md's sanctioned-exception paragraph).
//
// Two SVG layers, not one. The dim layer sits BEHIND the cards, so a line that passes
// a lane it doesn't stop at is occluded rather than appearing to touch a card it has
// nothing to do with. The highlight layer sits ABOVE them and holds only the selected
// node's edges, so "what is this actually connected to" is answerable by looking,
// which is the whole reason to draw a topology rather than list it.

/** One colour per node type, reused for the lane header badge, the node card tint and
 * the legend — so the reader learns the five categories once. */
const NODE_TYPE_TONE: Record<DissectionNodeType, "purple" | "blue" | "orange" | "teal" | "cyan"> = {
  persona: "purple",
  standard: "blue",
  competitor: "orange",
  pillar: "teal",
  trend: "cyan",
};

/** One colour per relationship, matching the legend chips in the panel above. */
export const EDGE_KIND_COLOR: Record<DissectionEdgeKind, string> = {
  "standard-competitor": "var(--color-icon-blue)",
  "standard-persona": "var(--color-icon-purple)",
  "standard-pillar": "var(--color-icon-teal)",
  "pillar-competitor": "var(--color-icon-gray)",
  "trend-competitor": "var(--color-icon-cyan)",
  "trend-pillar": "var(--color-icon-green)",
  "persona-competitor": "var(--color-icon-orange)",
};

/** Room above the drawing for the lane headers. Part of the container's height, so the
 * headers cannot be pushed outside it. */
const HEADER_HEIGHT = 34;

function edgeEndpoints(
  e: DissectionEdge,
  pos: Map<string, { x: number; y: number }>,
  halfWidth: number,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const a = pos.get(e.source);
  const z = pos.get(e.target);
  if (!a || !z) return null;
  // Stop at the card's edge, not its centre: a line that visibly enters a card reads
  // as "into this box", which is exactly what it means.
  const [left, right] = a.x <= z.x ? [a, z] : [z, a];
  return { x1: left.x + halfWidth, y1: left.y, x2: right.x - halfWidth, y2: right.y };
}

export function TopologyGraph({
  graph,
  layout,
  visibleKinds,
  selectedId,
  onSelect,
}: {
  graph: DissectionGraph;
  layout: GraphLayout;
  /** Relationship kinds the legend currently has switched on. */
  visibleKinds: ReadonlySet<DissectionEdgeKind>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const pos = new Map(layout.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const shown = graph.edges.filter((e) => visibleKinds.has(e.kind));
  const incident = selectedId ? shown.filter((e) => e.source === selectedId || e.target === selectedId) : [];
  const connected = new Set<string>(selectedId ? [selectedId] : []);
  for (const e of incident) {
    connected.add(e.source);
    connected.add(e.target);
  }

  const halfW = layout.nodeWidth / 2;
  const totalHeight = layout.height + HEADER_HEIGHT;

  return (
    // The scroll container is the reason this cannot overflow the page: the drawing has
    // an intrinsic width in pixels (5 lanes never fit a phone), so it scrolls inside its
    // own box the way every wide table in this app does, rather than widening the page.
    <div style={{ overflowX: "auto", overflowY: "hidden", maxWidth: "100%" }}>
      <div style={{ position: "relative", width: layout.width, height: totalHeight }}>
        {layout.lanes.map((lane) => (
          <div
            key={lane.type}
            style={{
              position: "absolute",
              left: lane.x - halfW,
              top: 0,
              width: layout.nodeWidth,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Badge variant={NODE_TYPE_TONE[lane.type]} label={`${NODE_TYPE_LABEL[lane.type]} · ${lane.count}`} />
          </div>
        ))}

        <svg
          width={layout.width}
          height={layout.height}
          style={{ position: "absolute", left: 0, top: HEADER_HEIGHT, zIndex: 0, pointerEvents: "none" }}
          aria-hidden="true"
        >
          {shown.map((e) => {
            const p = edgeEndpoints(e, pos, halfW);
            if (!p) return null;
            return (
              <line
                key={e.id}
                x1={p.x1}
                y1={p.y1}
                x2={p.x2}
                y2={p.y2}
                stroke={EDGE_KIND_COLOR[e.kind]}
                strokeWidth={1}
                // Derived edges (see dissection-graph.ts) are dashed everywhere they
                // appear, so a reader can tell a stated relationship from an implied one
                // without consulting the legend.
                strokeDasharray={e.derived ? "3 3" : undefined}
                opacity={selectedId ? 0.1 : 0.33}
              />
            );
          })}
        </svg>

        {graph.nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          const dimmed = selectedId !== null && !connected.has(n.id);
          const selected = selectedId === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelect(selected ? null : n.id)}
              // The full label, for the ones the card has to clamp (trend sentences run
              // well past two lines at this width), plus the manifest's own reason a
              // vendor is out of scope — the card itself only has room for the flag.
              title={`${NODE_TYPE_LABEL[n.type]}: ${n.label}${n.outOfScope && n.sublabel ? `\n${n.sublabel}` : ""}`}
              aria-pressed={selected}
              style={{
                position: "absolute",
                left: p.x - halfW,
                top: HEADER_HEIGHT + p.y - layout.nodeHeight / 2,
                width: layout.nodeWidth,
                height: layout.nodeHeight,
                padding: 0,
                margin: 0,
                border: "none",
                background: "none",
                textAlign: "left",
                cursor: "pointer",
                zIndex: 1,
                opacity: dimmed ? 0.3 : 1,
              }}
            >
              <Card
                // Out-of-scope vendors drop out of the competitor tone into neutral
                // grey. The tint is what says "this is one of the domain's five
                // competitors" at a glance, so a vendor the manifest rules out must not
                // wear it — the card keeps its place and its edges, and says why.
                variant={n.outOfScope ? "gray" : NODE_TYPE_TONE[n.type]}
                padding={2}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  outline: selected ? "2px solid var(--color-accent)" : undefined,
                  outlineOffset: 1,
                }}
              >
                <Stack gap={0.5}>
                  <Text type="body" size="xsm" weight="semibold" maxLines={n.outOfScope ? 1 : 2}>
                    {n.label}
                  </Text>
                  {n.outOfScope ? (
                    <Text type="label" size="xsm" color="secondary" maxLines={1}>
                      Not a target
                    </Text>
                  ) : null}
                </Stack>
              </Card>
            </button>
          );
        })}

        {/* Only the selected node's edges, drawn over the cards so they are fully
            traceable end to end. */}
        <svg
          width={layout.width}
          height={layout.height}
          style={{ position: "absolute", left: 0, top: HEADER_HEIGHT, zIndex: 2, pointerEvents: "none" }}
          aria-hidden="true"
        >
          {incident.map((e) => {
            const p = edgeEndpoints(e, pos, halfW);
            if (!p) return null;
            return (
              <line
                key={e.id}
                x1={p.x1}
                y1={p.y1}
                x2={p.x2}
                y2={p.y2}
                stroke={EDGE_KIND_COLOR[e.kind]}
                strokeWidth={2}
                strokeDasharray={e.derived ? "4 3" : undefined}
                opacity={0.95}
              />
            );
          })}
        </svg>
      </div>

      {/* The accessible equivalent of the drawing above — an SVG line layer says
          nothing to a screen reader, and the node buttons alone do not say what they
          connect to. Visually hidden, not absent. */}
      <div style={{ width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
        <ul>
          {graph.nodes.map((n) => (
            <li key={n.id}>
              {NODE_TYPE_LABEL[n.type]}: {n.label}
              {n.outOfScope ? " (not a target for this domain)" : ""} — {n.degree} connection
              {n.degree === 1 ? "" : "s"}
              <ul>
                {graph.edges
                  .filter((e) => e.source === n.id || e.target === n.id)
                  .map((e) => {
                    const other = nodeById.get(e.source === n.id ? e.target : e.source);
                    return other ? <li key={e.id}>{other.label}</li> : null;
                  })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
