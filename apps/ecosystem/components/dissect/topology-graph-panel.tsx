"use client";

import { useState } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import { Takeaway } from "@/components/takeaway";
import { TopologyGraph, EDGE_KIND_COLOR } from "@/components/dissect/topology-graph";
import { TopologyGraphTree } from "@/components/dissect/topology-graph-tree";
import {
  DISSECTION_EDGE_KINDS,
  EDGE_KIND_LABEL,
  NODE_TYPE_LABEL,
  describeIncidentEdge,
  type DissectionEdgeKind,
  type DissectionGraph,
  // See topology-graph.tsx: the vocabulary module, not the content-reading one.
} from "@/lib/dissection-graph-model";
import type { GraphLayout } from "@/lib/graph-layout";

// The `standards-map` section of a domain's Dissection tab. Client component for the
// same reason dissection-matrix.tsx and sales-reference-matrix.tsx are: the page is a
// server component, the graph needs local selection state, and props crossing the RSC
// boundary have to be plain data. Both the graph AND its coordinates are computed
// server-side (lib/dissection-graph.ts + lib/graph-layout.ts) and arrive here as
// numbers, so d3-force never reaches the browser bundle.
//
// SPARSITY, and the threshold. Every one of the four dissected domains has real edges
// here — unlike Task 5.1's feature-comparison matrix, which is genuinely empty for
// three of them — because two of the seven sources (standards-competitor-ratings.yaml
// and trends/*.yaml) cover all four. But "not empty" is a long way from "reads as a
// map". Two gates, both on real counts and both stated to the reader rather than
// silently applied:
//   - 0 nodes -> no drawing at all. A canvas with nothing on it is a claim that there
//     is nothing to see, which is true, and it should say so in words.
//   - fewer than 6 nodes, or fewer than 2 of the 7 relationship kinds -> the drawing
//     still renders (the edges are real and deleting them would hide researched
//     evidence) but above a warning that says out loud it is too thin to read
//     topologically and points at the list underneath instead.
// 6 nodes is the point below which the five typed lanes stop being lanes — at least
// one lane holds a single card and the picture carries no more information than a
// sentence would. No domain trips either gate today (the thinnest, DO, has 16 nodes
// across 6 kinds); they exist so a fifth domain with one rated standard does not get a
// near-empty canvas presented as a topology.
const MIN_NODES_FOR_A_READABLE_MAP = 6;
const MIN_KINDS_FOR_A_READABLE_MAP = 2;

// WIDTH, and where the drawing stops being a drawing. The map has an intrinsic pixel
// width, not a fluid one: five lanes of NODE_WIDTH = 156 plus four 44px gaps plus
// padding is 988px for a domain that uses all five types (lib/graph-layout.ts:42-47).
// Inside this page's content column a 720px viewport leaves roughly 620px of it
// visible, so a reader at that width is looking at under two-thirds of the picture
// through a horizontal scrollbar — at which point the spatial arrangement, the only
// thing a drawing offers over a list, is exactly what they cannot see. Below this, the
// tree IS the map rather than a fallback beneath it.
//
// 720 is a chosen number, not an inherited one: there is no breakpoint token in this
// design system and no other responsive switch anywhere in this app to align with, so
// there is nothing to be consistent with yet. It is the first, and it is stated here
// once rather than inlined in a query string.
const TREE_ONLY_MAX_WIDTH = 720;

export function TopologyGraphPanel({
  graph,
  layout,
  domainLabel,
}: {
  graph: DissectionGraph;
  layout: GraphLayout;
  domainLabel: string;
}) {
  const presentKinds = DISSECTION_EDGE_KINDS.filter((k) => graph.edgesByKind[k] > 0);
  const [visibleKinds, setVisibleKinds] = useState<ReadonlySet<DissectionEdgeKind>>(
    () => new Set(presentKinds),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // serverDefault `false` = render the drawing on the server. There is no server-side
  // width hint available here (no UA parsing in this app), so this is a stated
  // assumption rather than knowledge: the desktop variant is the majority case for this
  // internal research app, and the pre-hydration render of it is not broken on a phone
  // either — the drawing's own container already scrolls horizontally rather than
  // widening the page. A narrow viewport swaps to the tree on hydration.
  const treeIsPrimary = useMediaQuery(`(max-width: ${TREE_ONLY_MAX_WIDTH}px)`, false);

  if (!graph.nodes.length) {
    return (
      <EmptyState
        title="No relationships to map yet"
        description={`Nothing in this repo yet connects a ${domainLabel} accreditation standard, competitor, Prism pillar, persona or market trend to another. The seven relationships this map draws all come from lenses that have not been filled in for ${domainLabel} — until one is, there is no topology here, and a diagram of nothing is not one.`}
      />
    );
  }

  const thin =
    graph.nodes.length < MIN_NODES_FOR_A_READABLE_MAP || presentKinds.length < MIN_KINDS_FOR_A_READABLE_MAP;

  const selected = selectedId ? graph.nodes.find((n) => n.id === selectedId) ?? null : null;
  const selectedEdges = selected
    ? graph.edges.filter(
        (e) => (e.source === selected.id || e.target === selected.id) && visibleKinds.has(e.kind),
      )
    : [];
  const labelOf = new Map(graph.nodes.map((n) => [n.id, n.label]));

  const toggle = (kind: DissectionEdgeKind) => {
    setVisibleKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };

  return (
    <Stack gap={3}>
      {/* Two captions, because one of them would be false in the other variant: there
          are no columns and no clickable cards when the drawing is not on screen, and
          "click" is the wrong verb on a phone. Both state the same real counts. */}
      <Text type="supporting" maxLines={5}>
        {treeIsPrimary
          ? `${graph.nodes.length} entities and ${graph.edges.length} relationships, every one of them a field that already exists in this repo's content — no relationship here was researched for this map. The drawing needs more width than this screen has, so the same graph is listed below instead: entities grouped by what they are, each one expandable to the ${presentKinds.length} relationship${presentKinds.length === 1 ? "" : "s"} really present for ${domainLabel}. Tap a relationship above to isolate it.`
          : `${graph.nodes.length} entities and ${graph.edges.length} relationships, every one of them a field that already exists in this repo's content — no relationship here was researched for this map. Each of the five columns is one kind of entity; each line is one of ${presentKinds.length} relationship${presentKinds.length === 1 ? "" : "s"} really present for ${domainLabel}. Click a relationship below to isolate it, or a card to trace what it connects to.`}
      </Text>

      {/* The sparsity gate is a gate on the DRAWING, not on the evidence: five mostly
          empty lanes read as broken, which is why the warning exists. A short list is
          just a short list, so the tree-primary variant does not carry it. */}
      {thin && !treeIsPrimary ? (
        <Takeaway
          status="warning"
          title={`Too thin to read as a map — ${graph.nodes.length} entities across ${presentKinds.length} relationship${presentKinds.length === 1 ? "" : "s"}`}
        >
          <Text type="supporting" maxLines={3}>
            {`Everything drawn below is real and sourced, but at this size the picture says no more than the list does. Treat it as the few connections ${domainLabel} actually has on record, not as this domain's shape.`}
          </Text>
        </Takeaway>
      ) : null}

      {/* Legend and filter in one control: the colour key a reader needs to decode the
          lines is the same thing they click to isolate one relationship, so there is no
          decorative legend sitting next to a separate set of switches. Counts are real. */}
      <Stack direction="horizontal" gap={2} wrap="wrap">
        {presentKinds.map((kind) => {
          const on = visibleKinds.has(kind);
          return (
            <button
              key={kind}
              type="button"
              onClick={() => toggle(kind)}
              aria-pressed={on}
              style={{ padding: 0, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
            >
              <Card variant={on ? "muted" : "transparent"} padding={2}>
                <Stack direction="horizontal" gap={1.5} vAlign="center">
                  <span
                    aria-hidden="true"
                    style={{
                      width: 14,
                      height: 3,
                      borderRadius: 2,
                      background: on ? EDGE_KIND_COLOR[kind] : "var(--color-icon-disabled)",
                      flexShrink: 0,
                    }}
                  />
                  <Text type="supporting" size="xsm" color={on ? "primary" : "secondary"} maxLines={1}>
                    {`${EDGE_KIND_LABEL[kind]} (${graph.edgesByKind[kind]})`}
                  </Text>
                </Stack>
              </Card>
            </button>
          );
        })}
      </Stack>

      {treeIsPrimary ? (
        // Below TREE_ONLY_MAX_WIDTH the tree is the map, not a secondary view of it —
        // there is no toggle to find and nothing collapsed, because a reader on a phone
        // should not have to opt in to the only rendering that fits their screen.
        <TopologyGraphTree graph={graph} visibleKinds={visibleKinds} />
      ) : (
        <>
          <TopologyGraph
            graph={graph}
            layout={layout}
            visibleKinds={visibleKinds}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {/* The same graph in words, one click away and closed by default. It is the
              drawing's text equivalent in the literal sense — this is what a screen
              reader, or anyone who finds a 60-node picture hard to parse, reads instead
              of the SVG (which is aria-hidden, because a line layer says nothing). No
              `value` prop: this is a standalone uncontrolled Collapsible, deliberately
              NOT joined to the page's CollapsibleGroup accordion, so opening it cannot
              close the section it lives inside. */}
          <Collapsible
            defaultIsOpen={false}
            trigger={`Read the map as a list — all ${graph.nodes.length} entities and what each one connects to, in words`}
          >
            <TopologyGraphTree graph={graph} visibleKinds={visibleKinds} />
          </Collapsible>
        </>
      )}

      {/* The node-click affordance for now: what this entity is really connected to, in
          words. Task 5.5 replaces this block with the five per-type detail panels; the
          selection state and the graph's node shape are what it will build on.
          Suppressed in the tree-primary variant: selection is set by clicking a card in
          the drawing, so a card left over from a wider viewport would sit there with
          nothing on screen able to change or dismiss it — and the tree already says
          everything it says. */}
      {selected && !treeIsPrimary ? (
        <Card variant="muted" padding={3}>
          <Stack gap={2}>
            <Text type="body" weight="semibold">
              {`${NODE_TYPE_LABEL[selected.type]} · ${selected.label}`}
            </Text>
            {selected.sublabel ? (
              <Text type="supporting" size="sm" color="secondary" maxLines={3}>
                {selected.sublabel}
              </Text>
            ) : null}
            {selectedEdges.length ? (
              <Stack gap={1}>
                {selectedEdges.map((e) => (
                  <Text key={e.id} type="supporting" size="sm" maxLines={2}>
                    {/* Shared with the tree's connection leaves, so the same
                        relationship reads identically whichever way it was reached. */}
                    {describeIncidentEdge(e, selected.id, labelOf)}
                  </Text>
                ))}
              </Stack>
            ) : (
              <Text type="supporting" size="sm" color="secondary">
                Every relationship this entity has is currently switched off above.
              </Text>
            )}
          </Stack>
        </Card>
      ) : null}

      {/* Real values from real fields that name something other than one of the six core
          pillars — an intelligence-layer capability, a vendor's own module, a dated
          release. Drawing them as pillar edges would invent a mapping no content file
          makes; dropping them silently would hide researched data. So: named here. */}
      {graph.unmappedCapabilityRefs.length ? (
        <Text type="supporting" size="sm" color="secondary" maxLines={4}>
          {`${graph.unmappedCapabilityRefs.length} capability reference${
            graph.unmappedCapabilityRefs.length === 1 ? "" : "s"
          } in this domain's content name something real that is not one of the six core pillars, so they are not drawn as pillar links: ${graph.unmappedCapabilityRefs
            .map((u) => `"${u.ref}" (${u.from})`)
            .join("; ")}.`}
        </Text>
      ) : null}
    </Stack>
  );
}
