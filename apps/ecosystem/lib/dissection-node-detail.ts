import {
  competitorScopeNote,
  type DissectionGraph,
  type DissectionNode,
} from "@/lib/dissection-graph";
import {
  getCapabilityMap,
  getCompetitor,
  getDisciplinePersona,
  getRolePersona,
  getStandardsCrosswalkForDomain,
  getTrendsForDomain,
  listCompetitorLensPersonas,
  roleNameMatches,
  type Competitor,
  type DissectionManifest,
  type PressurePoint,
  type SourceRegistryEntry,
  type StandardsCrosswalkRow,
} from "@/lib/content";

// What a Dissection topology node opens INTO: one plain-data record per node, built
// on the server from the same content/ files the graph's edges were built from.
//
// Why it is built here and shipped as props rather than fetched on click. Everything
// under components/dissect/ that holds selection state is a client component (the
// graph needs onClick), and every source below reaches content/ through lib/content.ts,
// which imports node:fs — the exact import that failed the Turbopack build outright in
// Task 5.3. There is no route handler to call either; this app is statically rendered
// with no client-side data layer. So the page computes every node's detail once, on the
// server, and the panels render plain objects. That also means a panel can never show a
// spinner or a half-loaded state: if a node is on screen, its detail is already here.
//
// NOTHING IN THIS FILE RESEARCHES ANYTHING. Every field below is copied off a YAML file
// that is already committed, and a field the content does not have comes back undefined
// or empty rather than filled in — the panels render "no X recorded" in that case and
// say which file would have carried it. A missing roadmap, an empty
// addressed_by_competitors, a persona with no top_tasks are all real states of this
// repo's content today and are meant to reach the screen as such.

/** A resolved competitor lens read of one role — "how this vendor implicitly serves
 * this person", in the lens file's own words. */
export interface PersonaCompetitorRead {
  competitorSlug: string;
  competitor: string;
  read: string;
}

export interface CompetitorNodeDetail {
  type: "competitor";
  slug: string;
  name: string;
  category?: string;
  domainsServed: string[];
  company?: Competitor["company"];
  featureTeardown: NonNullable<Competitor["feature_teardown"]>;
  /** True when this domain's manifest does not count the vendor as an incumbent. */
  outOfScope: boolean;
  /** The manifest's own reason, when outOfScope. Shared with the graph node's sublabel
   * via competitorScopeNote so the two can't disagree. */
  scopeNote?: string;
  /** False when content/competitors/{slug}.yaml has no file at all — the vendor is
   * named by a rating or a trend but has never been written up. Honest, and real: the
   * panel says so instead of rendering an empty dossier. */
  hasDossier: boolean;
}

export interface PillarNodeDetail {
  type: "pillar";
  name: string;
  status?: string;
  notes?: string;
  whyItMatters?: string;
  features: { name: string; detail: string }[];
  /** capability-map.yaml carries `target` on a roadmap pillar and a `roadmap` object
   * beside it. Today that object holds only `{target, source_id}` and every real
   * source_id is null — i.e. the dates are stated by the map itself and cited to
   * nothing. Both halves are surfaced; the panel says the citation is missing rather
   * than presenting an uncited date as sourced. */
  roadmapTarget?: string;
  roadmapSourceId?: string | null;
  hasRoadmap: boolean;
  /** False when no pillar in capability-map.yaml carries this exact name. Cannot happen
   * today (the graph's pillar keys ARE that file's names) but a rename would make it
   * possible, and a silently blank panel would read as "this pillar has nothing". */
  found: boolean;
}

export interface PersonaNodeDetail {
  type: "persona";
  /** "role-dean" / "discipline-pharmacy" — the persona file's own name, which is what
   * persona_relevance[] and audience[] really contain and therefore what the graph
   * node's key really is. Both kinds appear for real: Pharmacy's graph has five role-*
   * personas AND discipline-pharmacy. */
  key: string;
  kind: "role" | "discipline";
  name: string;
  /** Role personas. */
  appliesAcrossDomains: string[];
  dayInTheLifeSummary?: string;
  topTasks: string[];
  competitorReads: PersonaCompetitorRead[];
  /** Discipline personas. */
  archetypeSummary?: string;
  switchingTrigger?: string;
  accreditationPressure: PressurePoint[];
  found: boolean;
}

export interface TrendNodeDetail {
  type: "trend";
  id: string;
  trend: string;
  detail?: string;
  exxatStatus: string;
  exxatRef?: string | null;
  addressedBy: { slug: string; competitor?: string; capabilityRef?: string; source?: SourceRegistryEntry }[];
  sources: SourceRegistryEntry[];
  found: boolean;
}

export interface StandardNodeDetail {
  type: "standard";
  elementId: string;
  /** The SAME row object /domains/{slug}/standards renders, from the same
   * getStandardsCrosswalkForDomain call — so the graph opens that page's already-built
   * StandardDetail panel rather than a second, thinner rendering of the same standard.
   * Null when the crosswalk has no row for this element id (the ratings lens can name
   * an element the accreditation document does not list). */
  row: StandardsCrosswalkRow | null;
}

export type DissectionNodeDetail =
  | CompetitorNodeDetail
  | PillarNodeDetail
  | PersonaNodeDetail
  | TrendNodeDetail
  | StandardNodeDetail;

/** node.id -> detail. Keyed by the full `${type}:${key}` id, so a lookup can never
 * confuse a competitor slug with a persona slug that happens to match. */
export type DissectionNodeDetailMap = Record<string, DissectionNodeDetail>;

function competitorDetail(
  node: DissectionNode,
  domain: string,
  manifest: DissectionManifest,
): CompetitorNodeDetail {
  const c = getCompetitor(node.key);
  return {
    type: "competitor",
    slug: node.key,
    name: c?.competitor ?? node.label,
    category: c?.category,
    domainsServed: c?.domains_served ?? [],
    company: c?.company,
    featureTeardown: c?.feature_teardown ?? [],
    outOfScope: !!node.outOfScope,
    scopeNote: competitorScopeNote(domain, manifest, node.key),
    hasDossier: !!c,
  };
}

function pillarDetail(node: DissectionNode): PillarNodeDetail {
  // The graph's pillar key IS capability-map.yaml's own `name` string (see
  // dissection-graph.ts's pillarNode), so this is an exact match, not a normalization.
  const pillar = (getCapabilityMap()?.core_ring?.pillars ?? []).find((p) => p.name === node.key);
  const roadmap = pillar?.roadmap;
  return {
    type: "pillar",
    name: node.key,
    status: pillar?.status,
    notes: pillar?.notes,
    whyItMatters: pillar?.why_it_matters,
    features: (pillar?.features ?? []).filter((f) => f.name),
    roadmapTarget: roadmap?.target ?? pillar?.target,
    roadmapSourceId: roadmap?.source_id ?? null,
    hasRoadmap: !!roadmap || !!pillar?.target,
    found: !!pillar,
  };
}

function personaDetail(node: DissectionNode): PersonaNodeDetail {
  const isDiscipline = node.key.startsWith("discipline-");
  const bare = node.key.replace(/^(role|discipline)-/, "");

  if (isDiscipline) {
    const p = getDisciplinePersona(bare);
    return {
      type: "persona",
      key: node.key,
      kind: "discipline",
      name: p?.persona_name ?? p?.domain ?? node.label,
      appliesAcrossDomains: [],
      topTasks: [],
      competitorReads: [],
      archetypeSummary: p?.archetype_summary,
      switchingTrigger: p?.switching_trigger,
      accreditationPressure: p?.accreditation_pressure ?? [],
      found: !!p,
    };
  }

  const role = getRolePersona(bare);
  // The persona-competitor EDGE kind, made concrete. dissection-graph.ts builds those
  // edges by matching a lens file's short role name against role_name with
  // roleNameMatches; this reads the SAME pairing back out and keeps the lens's own
  // `read` sentence, so the panel shows the text behind the edge rather than restating
  // the edge. Deliberately NOT scoped to this domain's incumbents: the lens files are
  // not domain-scoped, and the panel labels the list as "every vendor lens on file",
  // which is what it is. (The graph's edges ARE scoped — that difference is stated in
  // the panel's own copy.)
  const competitorReads: PersonaCompetitorRead[] = role
    ? listCompetitorLensPersonas().flatMap((lens) =>
        (lens.how_they_implicitly_serve_roles ?? [])
          .filter((r) => roleNameMatches(r.role, role.role_name))
          .map((r) => ({ competitorSlug: lens.slug, competitor: lens.competitor, read: r.read })),
      )
    : [];

  return {
    type: "persona",
    key: node.key,
    kind: "role",
    name: role?.role_name ?? node.label,
    appliesAcrossDomains: role?.applies_across_domains ?? [],
    dayInTheLifeSummary: role?.day_in_the_life_summary,
    topTasks: role?.top_tasks ?? [],
    competitorReads,
    accreditationPressure: [],
    found: !!role,
  };
}

function trendDetail(node: DissectionNode, domain: string): TrendNodeDetail {
  const t = getTrendsForDomain(domain).find((e) => e.id === node.key);
  return {
    type: "trend",
    id: node.key,
    trend: t?.trend ?? node.label,
    detail: t?.detail,
    exxatStatus: t?.exxat_status ?? "unknown",
    exxatRef: t?.exxat_ref,
    addressedBy: (t?.addressedByCompetitors ?? []).map((r) => ({
      slug: r.slug,
      competitor: r.competitor,
      capabilityRef: r.capabilityRef,
      source: r.source,
    })),
    sources: t?.sources ?? [],
    found: !!t,
  };
}

/**
 * Every node's detail for one domain's graph, in one pass.
 *
 * The four per-type readers above each hit lib/content.ts's own memoized readers, and
 * the standards crosswalk — by far the largest of them — is read ONCE here and indexed,
 * not re-read per standard node. A standard node's key is `${domain}::${element_id}`
 * (element ids repeat across accreditors, so the domain is part of the identity); the
 * index below is keyed on the element id alone because the crosswalk is already
 * domain-scoped by the time it gets here.
 */
export function buildDissectionNodeDetails(
  graph: DissectionGraph,
  manifest: DissectionManifest,
): DissectionNodeDetailMap {
  const crosswalk = getStandardsCrosswalkForDomain(graph.domain);
  const rowByElementId = new Map((crosswalk?.rows ?? []).map((r) => [r.element_id, r]));

  const out: DissectionNodeDetailMap = {};
  for (const node of graph.nodes) {
    switch (node.type) {
      case "competitor":
        out[node.id] = competitorDetail(node, graph.domain, manifest);
        break;
      case "pillar":
        out[node.id] = pillarDetail(node);
        break;
      case "persona":
        out[node.id] = personaDetail(node);
        break;
      case "trend":
        out[node.id] = trendDetail(node, graph.domain);
        break;
      case "standard": {
        const elementId = node.key.slice(node.key.indexOf("::") + 2);
        out[node.id] = { type: "standard", elementId, row: rowByElementId.get(elementId) ?? null };
        break;
      }
    }
  }
  return out;
}
