import {
  dissectionInScopeIncumbents,
  getCapabilityMap,
  getStandardsCompetitorRatings,
  getStandardsUseCases,
  getTrendsForDomain,
  listCompetitorLensPersonas,
  listCompetitors,
  listDisciplinePersonas,
  listRolePersonas,
  roleNameMatches,
  type DissectionManifest,
} from "@/lib/content";
import {
  DISSECTION_EDGE_KINDS,
  DISSECTION_NODE_TYPES,
  type DissectionEdge,
  type DissectionEdgeKind,
  type DissectionGraph,
  type DissectionNode,
  type DissectionNodeType,
  type UnmappedCapabilityRef,
} from "@/lib/dissection-graph-model";

// The topology behind a domain's Dissection tab: five kinds of real entity
// (standard, competitor, pillar, persona, trend) and the seven relationships that
// ALREADY exist between them across content/. Nothing here is new research — every
// edge is one field of one already-committed YAML file, named in the comment above
// the loop that reads it. If a relationship is not in content/, it is not in this
// graph; there is no inference step and no default edge.
//
// Deliberately plain data — no React, no d3, no DOM. lib/graph-layout.ts turns this
// into coordinates and components/dissect/* renders it, so this file stays testable
// on its own and Tasks 5.4 (tree view) and 5.5 (node detail panels) can consume the
// same shape without pulling in a layout engine they don't need.
//
// The node/edge vocabulary itself lives in lib/dissection-graph-model.ts (which has no
// imports at all) and is re-exported here, so a client component can have the label
// maps without this file's node:fs-backed content reads following them into the
// browser bundle. Server code can keep importing everything from this one name.
export * from "@/lib/dissection-graph-model";

// ---------------------------------------------------------------------------
// Pillar normalization
// ---------------------------------------------------------------------------

/** The result of matching a free-text capability reference against
 * content/prism/capability-map.yaml. `pillar` null means the string names something
 * real that is not a core pillar — an intelligence-layer capability, a competitor's
 * own module, a dated release. Those are reported, not coerced. */
export interface PillarRefMatch {
  pillar: string | null;
  /** Set when the ref matched a named FEATURE under a pillar rather than the pillar
   * itself ("Slot Request" -> Clinical & Experiential Education). Kept so the edge
   * can still say the specific thing the source said. */
  feature?: string;
}

/** Three real fields carry pillar-ish strings, in three different spellings:
 *   - standards-competitor-ratings.yaml `competitor_feature_ref` — a pillar name,
 *     sometimes suffixed with Prism roadmap detail ("Exam Management (Prism roadmap
 *     Q2 2027)"), so exact equality always fails on those.
 *   - standards-use-cases.yaml `prism_feature_ref` — canonical pillar names verbatim.
 *   - trends/*.yaml `exxat_ref` / `addressed_by_competitors[].capability_ref` — often
 *     a feature name one level BELOW a pillar ("Slot Request", "Personnel compliance"),
 *     and sometimes something that is not under a pillar at all ("Competency Tracking"
 *     is an intelligence-layer capability; "MSPE letter generation" is a competitor's
 *     own module).
 * One matcher for all three: prefix-match a pillar name, else prefix-match a pillar's
 * feature name and return its parent, else report no match. No fuzzy scoring and no
 * hand-written alias table — a mapping this file invented would be a claim no content
 * file makes. */
export function normalizePillarRef(ref?: string | null): PillarRefMatch {
  if (!ref) return { pillar: null };
  const map = getCapabilityMap();
  const pillars = map?.core_ring?.pillars ?? [];
  for (const p of pillars) {
    if (ref.startsWith(p.name)) return { pillar: p.name };
  }
  for (const p of pillars) {
    for (const f of p.features ?? []) {
      if (f.name && ref.startsWith(f.name)) return { pillar: p.name, feature: f.name };
    }
  }
  return { pillar: null };
}

/** The 6 core pillars in capability-map.yaml's own order — the pillar lane renders in
 * this order rather than alphabetically, so it reads the way the product map does. */
export function canonicalPillarOrder(): string[] {
  return (getCapabilityMap()?.core_ring?.pillars ?? []).map((p) => p.name);
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

interface Builder {
  nodes: Map<string, DissectionNode>;
  edges: Map<string, DissectionEdge>;
  unmapped: Map<string, UnmappedCapabilityRef>;
}

function addNode(b: Builder, type: DissectionNodeType, key: string, label: string, sublabel?: string): string {
  const id = `${type}:${key}`;
  const existing = b.nodes.get(id);
  if (existing) {
    // First writer wins on the label, but a later pass may be the one that knows the
    // sublabel (a competitor seen first as a rating column, later as a trend answer).
    if (!existing.sublabel && sublabel) existing.sublabel = sublabel;
    return id;
  }
  b.nodes.set(id, { id, type, key, label, sublabel, degree: 0 });
  return id;
}

function addEdge(
  b: Builder,
  kind: DissectionEdgeKind,
  source: string,
  target: string,
  label?: string,
  derived?: boolean,
) {
  const id = `${kind}|${source}|${target}`;
  const existing = b.edges.get(id);
  if (existing) {
    existing.weight += 1;
    // Keep the first label rather than concatenating: two rating rows citing the same
    // pillar for the same vendor are two pieces of evidence for one edge, and joining
    // their strings would produce a sentence neither file wrote.
    return;
  }
  b.edges.set(id, { id, kind, source, target, label, weight: 1, derived });
}

function noteUnmapped(b: Builder, ref: string | null | undefined, from: string) {
  if (!ref) return;
  const key = `${from}|${ref}`;
  if (!b.unmapped.has(key)) b.unmapped.set(key, { ref, from });
}

/**
 * Assemble the whole topology for one domain. Pure with respect to content/: the same
 * domain over the same committed files always returns the same graph, in the same
 * order — no Date, no randomness, no iteration over an unordered object.
 *
 * @param domain  canonical label as the lenses spell it ("Pharmacy", "DO", "Dentistry",
 *                "Medicine") — the same value app/domains/[slug]/dissect/page.tsx reads
 *                off accreditor-tiers.yaml.
 * @param manifest the domain's dissection manifest, used only to scope competitors to
 *                the in-scope incumbent set (the same scoping Task 5.1's matrix uses).
 */
export function buildDissectionGraph(domain: string, manifest: DissectionManifest): DissectionGraph {
  const b: Builder = { nodes: new Map(), edges: new Map(), unmapped: new Map() };

  const competitorNames = new Map(listCompetitors().map((c) => [c.slug, c]));
  const roleNames = new Map(listRolePersonas().map((p) => [`role-${p.slug}`, p.role_name]));
  const disciplineNames = new Map(
    listDisciplinePersonas().map((p) => [`discipline-${p.slug}`, p.persona_name ?? p.domain]),
  );
  const inScope = new Set(dissectionInScopeIncumbents(manifest).map((i) => i.competitor_slug));

  const competitorNode = (slug: string) => {
    const c = competitorNames.get(slug);
    return addNode(b, "competitor", slug, c?.competitor ?? slug, c?.category);
  };
  const personaNode = (slug: string) => {
    // persona_relevance and audience both hold a personas/*.yaml filename with no
    // extension, and the directory really does mix two kinds — role-* (a job) and
    // discipline-* (a whole domain's archetype). Both are legitimate personas here.
    const label = roleNames.get(slug) ?? disciplineNames.get(slug) ?? slug;
    const kindNote = slug.startsWith("discipline-") ? "Discipline archetype" : "Role";
    return addNode(b, "persona", slug, label, kindNote);
  };
  const pillarNode = (name: string) => addNode(b, "pillar", name, name);
  const standardNode = (elementId: string) =>
    addNode(b, "standard", `${domain}::${elementId}`, elementId);

  // --- 1/2/3/4: content/lenses/standards-competitor-ratings.yaml -------------
  // One entry is a (domain, element_id, competitor_slug) triple, and carries
  // persona_relevance[] and competitor_feature_ref alongside. A single pass over it
  // therefore yields four of the seven relationships.
  for (const r of getStandardsCompetitorRatings()?.ratings ?? []) {
    if (r.domain !== domain) continue;
    const sid = standardNode(r.element_id);
    const cid = competitorNode(r.competitor_slug);
    addEdge(b, "standard-competitor", sid, cid, r.rating);

    for (const p of r.persona_relevance ?? []) {
      addEdge(b, "standard-persona", sid, personaNode(p));
    }

    const match = normalizePillarRef(r.competitor_feature_ref);
    if (match.pillar) {
      const pid = pillarNode(match.pillar);
      addEdge(b, "standard-pillar", sid, pid, match.feature ?? r.competitor_feature_ref);
      // The one DERIVED edge kind in this graph, and labelled as such in the legend.
      // competitor_feature_ref names the competitor's own capability that meets this
      // standard, so (pillar, competitor) is real — but it is exactly the two edges
      // above composed through the standard node, deduped. It earns its place because
      // it collapses ~31 Pharmacy rating rows into a handful of "who plays in which
      // pillar" pairs, which is the coarse question a topology map answers and the
      // per-cell matrix above it does not. It is NOT the same data as Task 5.1's
      // feature-comparison matrix: that reads a different lens file
      // (feature-comparison-matrix.yaml) at capability granularity with its own
      // ratings, and is empty for 3 of the 4 domains.
      addEdge(b, "pillar-competitor", pid, cid, match.feature, true);
    } else {
      noteUnmapped(b, r.competitor_feature_ref, "a competitor rating's feature reference");
    }
  }

  // --- 1/2 supplement: content/lenses/standards-use-cases.yaml ---------------
  // Pharmacy-only today (23 of 23 entries). Read as an ADDITIONAL source for the same
  // two relationships, never as the primary one: a domain with real persona_relevance
  // edges above must not look emptier because it has no curated use cases here.
  for (const u of getStandardsUseCases()?.use_cases ?? []) {
    if (u.domain !== domain) continue;
    const sid = standardNode(u.element_id);
    for (const a of u.audience ?? []) {
      addEdge(b, "standard-persona", sid, personaNode(a));
    }
    const match = normalizePillarRef(u.prism_feature_ref);
    if (match.pillar) {
      addEdge(b, "standard-pillar", sid, pillarNode(match.pillar), match.feature ?? u.prism_feature_ref);
    } else {
      noteUnmapped(b, u.prism_feature_ref, "a curated use case's Prism feature reference");
    }
  }

  // --- 5/6: content/trends/<domain>.yaml -------------------------------------
  for (const t of getTrendsForDomain(domain)) {
    let used = false;
    for (const ref of t.addressedByCompetitors) {
      const cid = competitorNode(ref.slug);
      addEdge(b, "trend-competitor", addNode(b, "trend", t.id, t.trend, t.detail), cid, ref.capabilityRef);
      used = true;
      // The competitor's OWN name for what addresses the trend. Where it resolves to a
      // core pillar this is a second, independent source for pillar-competitor — same
      // claim ("this vendor has a capability in this pillar"), different file. Where it
      // doesn't ("MSPE letter generation"), it stays on the trend edge's label and is
      // reported below rather than forced into a pillar.
      const capMatch = normalizePillarRef(ref.capabilityRef);
      if (capMatch.pillar) {
        addEdge(b, "pillar-competitor", pillarNode(capMatch.pillar), cid, capMatch.feature ?? ref.capabilityRef, true);
      } else {
        noteUnmapped(b, ref.capabilityRef, "a trend's competitor capability reference");
      }
    }
    // exxat_ref is only a coverage claim when Exxat actually covers it. On an
    // "unaddressed" trend the same field holds a sentence about what Prism does NOT
    // do — rendering that as a trend->pillar edge would assert the opposite of what
    // the file says.
    if (t.exxat_status === "shipped" || t.exxat_status === "roadmap") {
      const match = normalizePillarRef(t.exxat_ref);
      if (match.pillar) {
        addEdge(
          b,
          "trend-pillar",
          addNode(b, "trend", t.id, t.trend, t.detail),
          pillarNode(match.pillar),
          match.feature ?? t.exxat_ref ?? undefined,
        );
        used = true;
      } else {
        noteUnmapped(b, t.exxat_ref, "a trend's Exxat capability reference");
      }
    }
    // A trend with neither a competitor nor a resolvable pillar has no edge, so it is
    // not a node — an isolated dot on a topology map says nothing and reads as noise.
    void used;
  }

  // --- 7: content/personas/lens-*.yaml ---------------------------------------
  // Six vendor-lens files, each with the same 5 short role names. They are not
  // domain-scoped, so scope them the way Task 5.1 scopes its incumbent columns: only
  // a competitor in THIS domain's in-scope incumbent set gets an edge.
  for (const lens of listCompetitorLensPersonas()) {
    if (!inScope.has(lens.slug)) continue;
    const cid = competitorNode(lens.slug);
    for (const r of lens.how_they_implicitly_serve_roles ?? []) {
      // Short name ("Program Admin") vs. role-*.yaml's long role_name — content.ts
      // already owns this mismatch; do not write a second matcher.
      const match = listRolePersonas().find((p) => roleNameMatches(r.role, p.role_name));
      if (!match) continue;
      addEdge(b, "persona-competitor", personaNode(`role-${match.slug}`), cid, r.role);
    }
  }

  // --- finalize --------------------------------------------------------------
  const edges = [...b.edges.values()].sort((a, z) => a.id.localeCompare(z.id));
  for (const e of edges) {
    const s = b.nodes.get(e.source);
    const t = b.nodes.get(e.target);
    if (s) s.degree += 1;
    if (t) t.degree += 1;
  }

  const pillarOrder = canonicalPillarOrder();
  const typeRank = new Map(DISSECTION_NODE_TYPES.map((t, i) => [t, i]));
  const nodes = [...b.nodes.values()]
    // Drop anything that ended up with no edge at all. Today nothing does (every node
    // is created by an edge-producing branch), but a future source could add one, and
    // an unconnected dot on a topology map is a shape with no meaning.
    .filter((n) => n.degree > 0)
    .sort((a, z) => {
      const byType = (typeRank.get(a.type) ?? 9) - (typeRank.get(z.type) ?? 9);
      if (byType) return byType;
      if (a.type === "pillar") {
        const d = pillarOrder.indexOf(a.key) - pillarOrder.indexOf(z.key);
        if (d) return d;
      }
      return a.label.localeCompare(z.label) || a.id.localeCompare(z.id);
    });

  const nodesByType = Object.fromEntries(DISSECTION_NODE_TYPES.map((t) => [t, 0])) as Record<
    DissectionNodeType,
    number
  >;
  for (const n of nodes) nodesByType[n.type] += 1;
  const edgesByKind = Object.fromEntries(DISSECTION_EDGE_KINDS.map((k) => [k, 0])) as Record<
    DissectionEdgeKind,
    number
  >;
  for (const e of edges) edgesByKind[e.kind] += 1;

  return {
    domain,
    nodes,
    edges,
    nodesByType,
    edgesByKind,
    unmappedCapabilityRefs: [...b.unmapped.values()].sort((a, z) => a.ref.localeCompare(z.ref)),
  };
}
