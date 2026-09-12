// The vocabulary of the Dissection tab's topology map: what a node is, what an edge
// is, and the words the UI uses for both.
//
// Split out from lib/dissection-graph.ts for one hard reason, not for tidiness. That
// file reads content/ through lib/content.ts, which imports `node:fs`; the client
// components need these label maps at RUNTIME (not as types), and importing them from
// there dragged `node:fs` into the browser chunk and failed the Turbopack build
// outright. Everything here is data with zero imports, so both sides can have it.
// lib/dissection-graph.ts re-exports the whole module, so server code can keep
// importing one name.

export type DissectionNodeType = "standard" | "competitor" | "pillar" | "persona" | "trend";

export type DissectionEdgeKind =
  | "standard-competitor"
  | "standard-persona"
  | "standard-pillar"
  | "pillar-competitor"
  | "trend-competitor"
  | "trend-pillar"
  | "persona-competitor";

export interface DissectionNode {
  /** `${type}:${key}` — unique across types, stable across renders and domains. */
  id: string;
  type: DissectionNodeType;
  /** Identity within the type: a competitor/persona slug, a canonical pillar name,
   * a trend id, or `${domain}::${element_id}` for a standard (element ids repeat
   * across accreditors, so the domain has to be part of a standard's identity). */
  key: string;
  /** Display name — a resolved competitor/persona name where one exists, never a
   * raw slug (UI-DENSITY-PATTERNS.md). */
  label: string;
  /** One line of real source detail: the trend's own sentence, the persona's kind,
   * the competitor's category. Seeds Task 5.5's detail panels. */
  sublabel?: string;
  /** Edges incident on this node, counted after dedup. Drives nothing in the layout;
   * it is what the panel shows when a node is selected. */
  degree: number;
}

export interface DissectionEdge {
  /** `${kind}|${source}|${target}` — deduped on exactly this. */
  id: string;
  kind: DissectionEdgeKind;
  /** DissectionNode.id, not an index — survives sorting and filtering. */
  source: string;
  target: string;
  /** The source row's own words for this link where it has any (a rating value, the
   * vendor's capability name, the Exxat feature under a pillar). Never a paraphrase. */
  label?: string;
  /** How many real source rows produced this same pair. 3 means three separate rated
   * standards said it, not that the relationship is three times as strong. */
  weight: number;
  /** True when the edge is implied by two other edges in this graph rather than
   * stated directly by one source row — see dissection-graph.ts's pillar-competitor
   * block for the only case. */
  derived?: boolean;
}

/** A real `exxat_ref` / `capability_ref` / `competitor_feature_ref` string that names
 * something real but is NOT one of the 6 core pillars, so it cannot become a pillar
 * edge without inventing a mapping. Surfaced in the UI rather than dropped. */
export interface UnmappedCapabilityRef {
  ref: string;
  /** Which file's field said it, in human words. */
  from: string;
}

export interface DissectionGraph {
  /** The canonical domain label ("Pharmacy"), as the lenses spell it. */
  domain: string;
  nodes: DissectionNode[];
  edges: DissectionEdge[];
  nodesByType: Record<DissectionNodeType, number>;
  edgesByKind: Record<DissectionEdgeKind, number>;
  unmappedCapabilityRefs: UnmappedCapabilityRef[];
}

/** Left-to-right lane order, and the order nodes sort in. See layoutDissectionGraph's
 * doc comment for why competitor sits in the middle. */
export const DISSECTION_NODE_TYPES: DissectionNodeType[] = [
  "persona",
  "standard",
  "competitor",
  "pillar",
  "trend",
];

export const DISSECTION_EDGE_KINDS: DissectionEdgeKind[] = [
  "standard-competitor",
  "standard-persona",
  "standard-pillar",
  "pillar-competitor",
  "trend-competitor",
  "trend-pillar",
  "persona-competitor",
];

/** Plain-English name for each relationship — used in the legend and in the
 * selected-node caption, so the UI never shows the raw kind string. */
export const EDGE_KIND_LABEL: Record<DissectionEdgeKind, string> = {
  "standard-competitor": "Standard rated against a competitor",
  "standard-persona": "Standard affects a persona",
  "standard-pillar": "Standard met by a pillar",
  "pillar-competitor": "Competitor has a capability in a pillar",
  "trend-competitor": "Trend addressed by a competitor",
  "trend-pillar": "Trend answered by an Exxat pillar",
  "persona-competitor": "Competitor implicitly serves a persona",
};

export const NODE_TYPE_LABEL: Record<DissectionNodeType, string> = {
  standard: "Standard",
  competitor: "Competitor",
  pillar: "Pillar",
  persona: "Persona",
  trend: "Trend",
};
