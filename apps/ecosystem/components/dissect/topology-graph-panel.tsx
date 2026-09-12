"use client";

import { useState } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Link } from "@astryxdesign/core/Link";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import { Takeaway } from "@/components/takeaway";
import { TopologyGraph, EDGE_KIND_COLOR } from "@/components/dissect/topology-graph";
import { TopologyGraphTree } from "@/components/dissect/topology-graph-tree";
import { StandardDetail } from "@/components/dissect/standard-detail-panel";
import { CompetitorDetailPanel } from "@/components/dissect/competitor-detail-panel";
import { PillarDetailPanel } from "@/components/dissect/pillar-detail-panel";
import { PersonaDetailPanel } from "@/components/dissect/persona-detail-panel";
import { TrendDetailPanel } from "@/components/dissect/trend-detail-panel";
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
// Type-only, so lib/content.ts's node:fs import is erased rather than followed into the
// browser chunk — the same reason accreditation-standards-table.tsx imports its row type
// this way. The VALUES are built on the server and arrive as props.
import type { DissectionNodeDetailMap } from "@/lib/dissection-node-detail";

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
  domainSlug,
  details,
  hasWinBrief = false,
  initialSelectedNodeId,
}: {
  graph: DissectionGraph;
  layout: GraphLayout;
  domainLabel: string;
  /** The URL segment for this domain — every panel's cross-links are built from it. */
  domainSlug: string;
  /** Every node's real content, built server-side (lib/dissection-node-detail.ts) and
   * shipped as plain data. See that file for why it is props and not a fetch. */
  details: DissectionNodeDetailMap;
  /** Passed through to the extracted StandardDetail, which shows a "How we win" link
   * only for a domain that really has a sales brief. */
  hasWinBrief?: boolean;
  /** A `?node=<id>` deep link, ALREADY validated against this graph's real nodes by the
   * page (an id that matches nothing arrives as undefined). Seeds the selection so a
   * cold-pasted URL opens on its node with nothing clicked. */
  initialSelectedNodeId?: string;
}) {
  const presentKinds = DISSECTION_EDGE_KINDS.filter((k) => graph.edgesByKind[k] > 0);
  const [visibleKinds, setVisibleKinds] = useState<ReadonlySet<DissectionEdgeKind>>(
    () => new Set(presentKinds),
  );
  // Seeded from the deep link on FIRST render only, then owned by the reader's clicks —
  // a later click must not be undone by the URL it arrived from.
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedNodeId ?? null);
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
  const detail = selected ? details[selected.id] : undefined;
  const selectedEdges = selected
    ? graph.edges.filter(
        (e) => (e.source === selected.id || e.target === selected.id) && visibleKinds.has(e.kind),
      )
    : [];
  const labelOf = new Map(graph.nodes.map((n) => [n.id, n.label]));

  // "How this connects on the map", built once and handed to whichever panel is open.
  //
  // It lives here rather than inside a panel because the map's edge vocabulary is the
  // graph's, not a content panel's: describeIncidentEdge is the single sentence
  // generator the drawing's selection, the tree's connection leaves and now these
  // panels all call, so the same relationship reads identically whichever of the three
  // a reader arrives through — and the `derived` disclosure ("implied by the two edges
  // it composes") cannot go missing from one of them.
  //
  // Two renderings of the same body, differing only in how they join the accordion: the
  // four shell panels take it as the last member of their own CollapsibleGroup, while
  // the extracted StandardDetail — which this task must not restructure — gets it as a
  // standalone Collapsible underneath.
  const connectionsBody = selectedEdges.length ? (
    <Stack gap={1}>
      {selectedEdges.map((e) => (
        <Text key={e.id} type="supporting" size="sm" maxLines={2}>
          {describeIncidentEdge(e, selectedId ?? "", labelOf)}
        </Text>
      ))}
    </Stack>
  ) : (
    <Text type="supporting" size="sm" color="secondary">
      Every relationship this entity has is currently switched off above.
    </Text>
  );
  const connectionsTrigger = selectedEdges.length
    ? `How this connects on the map (${selectedEdges.length} relationship${selectedEdges.length === 1 ? "" : "s"})`
    : "How this connects on the map";

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
          ? `${graph.nodes.length} entities and ${graph.edges.length} relationships, every one of them a field that already exists in this repo's content — no relationship here was researched for this map. The drawing needs more width than this screen has, so the same graph is listed below instead: entities grouped by what they are, each one expandable to the ${presentKinds.length} relationship${presentKinds.length === 1 ? "" : "s"} really present for ${domainLabel}. Tap a relationship above to isolate it, or an entity below to open what this repo holds on it.`
          : `${graph.nodes.length} entities and ${graph.edges.length} relationships, every one of them a field that already exists in this repo's content — no relationship here was researched for this map. Each of the five columns is one kind of entity; each line is one of ${presentKinds.length} relationship${presentKinds.length === 1 ? "" : "s"} really present for ${domainLabel}. Click a relationship below to isolate it, or a card to open what this repo holds on that entity.`}
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
        <TopologyGraphTree
          graph={graph}
          visibleKinds={visibleKinds}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
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
            <TopologyGraphTree
              graph={graph}
              visibleKinds={visibleKinds}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </Collapsible>
        </>
      )}

      {/* WHAT A NODE CLICK OPENS. Five real panels, one per entity type, each reading
          the same content/ files the edges into that node were built from — this is the
          block the committed placeholder said Task 5.5 would replace.

          It renders in BOTH variants now, unlike the placeholder. The placeholder was
          suppressed on narrow screens for a real reason ("a card left over from a wider
          viewport would sit there with nothing on screen able to change or dismiss it"),
          and both halves of that are now false: the tree sets selection too, so a tree
          reader can change it, and the header below carries a Close control, so anyone
          can dismiss it. Suppressing it would instead mean a phone reader can reach every
          entity in the tree and open none of them — strictly less capability from the
          rendering that exists BECAUSE their screen is small. */}
      {selected ? (
        <Card variant="muted" padding={3}>
          <Stack gap={3}>
            <Stack direction="horizontal" gap={3} hAlign="between" vAlign="center" wrap="wrap">
              <Text type="label" color="secondary" size="xsm">
                {NODE_TYPE_LABEL[selected.type]}
              </Text>
              <Link color="accent" hasUnderline onClick={() => setSelectedId(null)}>
                Close
              </Link>
            </Stack>

            {detail ? (
              // One switch, five panels. `detail` is keyed by the same node id the graph
              // and tree select on, so there is no second lookup and no way for the panel
              // to be about a different entity than the highlighted card.
              detail.type === "standard" ? (
                <Stack gap={4}>
                  {detail.row ? (
                    // NOT a second rendering of a standard: this is the exact panel
                    // /domains/{slug}/standards opens for the same row, extracted in this
                    // task so both surfaces share it.
                    <StandardDetail row={detail.row} slug={domainSlug} hasWinBrief={hasWinBrief} />
                  ) : (
                    <Text type="supporting" size="sm" color="secondary" maxLines={4}>
                      {`${detail.elementId} is rated in this domain's competitor-ratings lens, but no element with that id appears in ${domainLabel}'s accreditation document as this repo holds it — so there is no standard to open. The relationship on the map is real; the element id behind it no longer resolves.`}
                    </Text>
                  )}
                  {/* Standalone, deliberately not joined to StandardDetail's own
                      CollapsibleGroup: that group is an extraction this task keeps
                      byte-identical, and adding a member to it would be a change to
                      /domains/{slug}/standards as well. */}
                  <Collapsible defaultIsOpen={false} trigger={connectionsTrigger}>
                    {connectionsBody}
                  </Collapsible>
                </Stack>
              ) : detail.type === "competitor" ? (
                <CompetitorDetailPanel
                  detail={detail}
                  domainSlug={domainSlug}
                  domainLabel={domainLabel}
                  connections={
                    <Collapsible value="connections" trigger={connectionsTrigger}>
                      {connectionsBody}
                    </Collapsible>
                  }
                />
              ) : detail.type === "pillar" ? (
                <PillarDetailPanel
                  detail={detail}
                  domainSlug={domainSlug}
                  domainLabel={domainLabel}
                  connections={
                    <Collapsible value="connections" trigger={connectionsTrigger}>
                      {connectionsBody}
                    </Collapsible>
                  }
                />
              ) : detail.type === "persona" ? (
                <PersonaDetailPanel
                  detail={detail}
                  domainSlug={domainSlug}
                  domainLabel={domainLabel}
                  connections={
                    <Collapsible value="connections" trigger={connectionsTrigger}>
                      {connectionsBody}
                    </Collapsible>
                  }
                />
              ) : (
                <TrendDetailPanel
                  detail={detail}
                  domainSlug={domainSlug}
                  domainLabel={domainLabel}
                  connections={
                    <Collapsible value="connections" trigger={connectionsTrigger}>
                      {connectionsBody}
                    </Collapsible>
                  }
                />
              )
            ) : (
              // Cannot happen today — the details map is built from these same nodes —
              // but a node with no detail must read as an absence, not as a blank card.
              <Text type="supporting" size="sm" color="secondary" maxLines={3}>
                {`${selected.label} is on this map, but nothing in this repo carries any further detail about it.`}
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
