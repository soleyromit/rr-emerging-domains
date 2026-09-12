"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { TreeList, type TreeListItemData } from "@astryxdesign/core/TreeList";
import { EDGE_KIND_COLOR } from "@/components/dissect/topology-graph";
import {
  DISSECTION_NODE_TYPES,
  NODE_TYPE_LABEL,
  describeIncidentEdge,
  type DissectionEdgeKind,
  type DissectionGraph,
  // The vocabulary module, never "@/lib/dissection-graph" — that one reaches content/
  // through node:fs and a runtime import of it from a client component fails the
  // Turbopack build outright (it already did once, in Task 5.3).
} from "@/lib/dissection-graph-model";

// The same graph as the drawing next door, read out instead of laid out.
//
// Nothing here is new data: every item below is a node or an edge of the exact
// DissectionGraph the spatial map renders, in the order buildDissectionGraph already
// sorted them. The point is that a topology has two legible forms and only one of them
// needs a thousand pixels of width. Three levels, matching the graph's own vocabulary:
//
//   type (5 lanes)  ->  entity (a card in that lane)  ->  relationship (a line)
//
// Type order is DISSECTION_NODE_TYPES, the same left-to-right lane order the layout
// uses (persona, standard, competitor, pillar, trend — competitor in the middle because
// it is the only type that touches all four others). A type with no nodes in this
// domain is skipped entirely, matching layoutDissectionGraph's "only lanes that really
// have nodes" rule: four roots, not five with an empty one.
//
// TWO HONESTY FLAGS THE DRAWING CARRIES, AND SO MUST THIS. The graph distinguishes a
// derived edge (dashed line) from a stated one, and an out-of-scope competitor (grey
// card, "Not a target") from one of the domain's real incumbents. A list that flattened
// either distinction would present an implied relationship, or a vendor the manifest
// rules out, as an equally solid fact. So: the connection swatch is dashed exactly when
// the line is (and describeIncidentEdge says so in words), and an out-of-scope entity
// keeps its badge and the manifest's own reason.

/** The line-segment key from the drawing, at list scale — same colour per relationship
 * kind (EDGE_KIND_COLOR, not a second palette), same dash for a derived edge. Decorative
 * only: describeIncidentEdge already names the kind and flags derivation in text. */
function EdgeSwatch({ kind, derived }: { kind: DissectionEdgeKind; derived?: boolean }) {
  const color = EDGE_KIND_COLOR[kind];
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 14,
        height: 3,
        borderRadius: 2,
        flexShrink: 0,
        background: derived
          ? `repeating-linear-gradient(to right, ${color} 0 3px, transparent 3px 6px)`
          : color,
      }}
    />
  );
}

export function TopologyGraphTree({
  graph,
  visibleKinds,
  selectedId,
  onSelect,
}: {
  graph: DissectionGraph;
  /** The legend's current filter. The tree honours it for the same reason the drawing
   * does: the legend chips sit above BOTH renderings, and on a narrow screen the tree is
   * the only thing they could act on — chips that did nothing would be a broken control,
   * not a simplification. Entity counts are unaffected; only the connection lines under
   * an entity are, and an entity whose lines are filtered out says so. */
  visibleKinds: ReadonlySet<DissectionEdgeKind>;
  /** The SAME selection the drawing uses — one state, two renderings. Task 5.4 left this
   * unwired on purpose, judging it Task 5.5's call to design once there was something for
   * a click to open; there is now. Tapping an entity row opens its detail panel, and the
   * chevron still expands that entity's connections (TreeListItem routes a row click to
   * `onClick` and keeps the toggle on its own button, so the two do not fight). Without
   * this a phone reader — for whom the tree IS the map, not a fallback — could see every
   * entity and open none of them. */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const labelOf = new Map(graph.nodes.map((n) => [n.id, n.label]));

  const items: TreeListItemData[] = DISSECTION_NODE_TYPES.flatMap((type) => {
    const nodes = graph.nodes.filter((n) => n.type === type);
    if (!nodes.length) return [];

    const notTargets = nodes.filter((n) => n.outOfScope).length;

    return [
      {
        id: `type:${type}`,
        label: `${NODE_TYPE_LABEL[type]} (${nodes.length})`,
        // Said at the top of the group as well as on each card, because the count a
        // reader carries away from a collapsed group ("5 competitors") is wrong if some
        // of them are not competitors this domain is trying to beat.
        description: notTargets
          ? `${notTargets} of ${nodes.length} rated here but not a target for this domain`
          : undefined,
        // Level 1 open, level 2 closed: the useful landing state is "what entities does
        // this domain have", with each entity's relationships one click away. Expanding
        // everything would dump ~200 lines on a phone.
        isExpanded: true,
        children: nodes.map((n) => {
          const incident = graph.edges.filter((e) => e.source === n.id || e.target === n.id);
          const shown = incident.filter((e) => visibleKinds.has(e.kind));
          const connections =
            shown.length === incident.length
              ? `${incident.length} connection${incident.length === 1 ? "" : "s"}`
              : `${shown.length} of ${incident.length} connections — the rest are switched off in the filter above`;

          return {
            id: n.id,
            label: n.label,
            // The entity's own one line of source detail (a trend's sentence, a
            // persona's kind, a vendor's category — and, for an out-of-scope vendor,
            // the manifest's own reason) sits after the count rather than replacing it.
            description: [connections, n.sublabel].filter(Boolean).join(" · "),
            endContent: n.outOfScope ? <Badge variant="gray" label="Not a target" /> : undefined,
            // Same toggle semantics as the drawing's cards: clicking the selected entity
            // again clears it, so the panel has a second way to be dismissed.
            onClick: () => onSelect(selectedId === n.id ? null : n.id),
            isSelected: selectedId === n.id,
            // Connection rows are leaves on purpose: TreeList only draws an expand
            // toggle when `children` is present, and a relationship has nothing under it.
            children: shown.map((e) => ({
              // The same edge appears under both of its endpoints, so the edge id alone
              // would collide as a React key.
              id: `${n.id}|${e.id}`,
              label: describeIncidentEdge(e, n.id, labelOf),
              startContent: <EdgeSwatch kind={e.kind} derived={e.derived} />,
            })),
          };
        }),
      },
    ];
  });

  // Defensive only: TopologyGraphPanel's EmptyState already owns the zero-node case for
  // the whole section, so this never fires today.
  if (!items.length) return null;

  return (
    <TreeList
      items={items}
      density="compact"
      header={`${graph.nodes.length} entities grouped by what they are — select one to open its detail, or use its chevron to see what it connects to`}
    />
  );
}
