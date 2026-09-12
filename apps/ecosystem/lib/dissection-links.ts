import { getDissectionManifest } from "@/lib/content";
import { buildDissectionGraph } from "@/lib/dissection-graph";

// The WRITE side of the Dissection tab's `?node=` deep links (Phase 6). The READ side
// lives in app/domains/[slug]/dissect/page.tsx, which validates an arriving `?node=`
// against that domain's real graph and ignores anything that does not resolve.
//
// Every link this module builds is checked against the SAME graph before it is
// returned, so the two halves cannot drift: a caller either gets a URL that is known
// to open a node, or it gets `undefined` and renders no link at all. That asymmetry is
// the point — an unresolvable `?node=` is not a broken page (the read side degrades to
// the ordinary tab), it is a link that promises a destination and silently does not
// deliver it, which is the "dead end" this plan's cross-linking rule exists to prevent.
//
// Why node existence has to be CHECKED rather than assumed: buildDissectionGraph drops
// every node that ends with degree 0, so a trend with no competitor and no resolvable
// pillar, a persona nothing cites, or a standard with no competitor rating simply is
// not in the graph — even though the entity is real and has its own page elsewhere.
//
// No cache here, deliberately: nothing else in lib/content.ts caches either, and a
// module-level memo would mean a content edit stops changing the app until the dev
// server restarts. The cost is one graph build per rendering page, the same build the
// Dissection tab itself already does.

/** The Dissection tab itself, with no node selected. The honest fallback for a caller
 * whose specific node does not exist — the tab is a real page for every routed domain
 * (it renders a named "not dissected yet" state where there is no manifest). */
export function dissectHref(routeSlug: string): string {
  return `/domains/${routeSlug}/dissect`;
}

/** Node ids, spelled exactly as lib/dissection-graph.ts's own addNode() call sites
 * spell them. Kept beside the link builders so a caller never hand-concatenates a
 * `type:key` string and gets the separator or the domain prefix subtly wrong. */
export const dissectionNodeId = {
  /** `standard:{canonical domain label}::{element_id}` — note the DOMAIN label
   * ("Pharmacy"), not the route slug, and the double colon. */
  standard: (domainLabel: string, elementId: string) => `standard:${domainLabel}::${elementId}`,
  competitor: (slug: string) => `competitor:${slug}`,
  /** The personas/*.yaml filename minus extension, e.g. "discipline-pharmacy". */
  persona: (personaFileSlug: string) => `persona:${personaFileSlug}`,
  /** The trend's own `id` from content/trends/<domain>.yaml. */
  trend: (trendId: string) => `trend:${trendId}`,
  /** The exact canonical pillar name string. */
  pillar: (pillarName: string) => `pillar:${pillarName}`,
} as const;

/** Every node id in one domain's real graph. Empty when the domain has no manifest,
 * which is 9 of the 13 routed domains today — those have no graph to link into at all,
 * and a caller that gets an empty set should render no `?node=` links rather than a
 * row of links that all resolve to nothing. */
export function dissectionNodeIds(routeSlug: string, domainLabel: string): ReadonlySet<string> {
  const manifest = getDissectionManifest(routeSlug);
  if (!manifest) return new Set();
  return new Set(buildDissectionGraph(domainLabel, manifest).nodes.map((n) => n.id));
}

/** A deep link that is guaranteed to open `nodeId`, or `undefined` when that node is
 * not in this domain's graph. Callers render nothing on `undefined`. */
export function dissectNodeHref(
  routeSlug: string,
  nodeIds: ReadonlySet<string>,
  nodeId: string,
): string | undefined {
  return nodeIds.has(nodeId) ? `${dissectHref(routeSlug)}?node=${encodeURIComponent(nodeId)}` : undefined;
}
