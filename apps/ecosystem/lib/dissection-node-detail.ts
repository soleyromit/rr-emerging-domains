import {
  competitorScopeNote,
  type DissectionGraph,
  type DissectionNode,
} from "@/lib/dissection-graph";
import { stripFileCitations } from "@/lib/strip-file-citations";
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
    // Both are capability-map prose rendered in the pillar panel. They are clean today by
    // content accident, not by design — nothing stopped a file citation being written into
    // either. Sanitized at the builder, like the trend and competitor notes above, so the
    // panel cannot be the one surface that forgets. Plain variant, not the Markdown one:
    // these are YAML scalars, not documents.
    notes: stripFileCitations(pillar?.notes),
    whyItMatters: stripFileCitations(pillar?.why_it_matters),
    // A feature's `detail` is the same kind of capability-map prose as `notes` above and
    // renders in the same panel, so it needs the same treatment — it was the one field
    // here that still leaked a raw citation ("...the competitive-comparability 'Gap' in
    // gap-analysis.md, which is about cross-SITE statistics..." on the Heatmap Report
    // feature). `name` is a short product noun ("Placement Clearance"), never a citation,
    // but it costs nothing to route it through the same guard.
    features: (pillar?.features ?? [])
      .filter((f) => f.name)
      .map((f) => ({
        ...f,
        name: stripFileCitations(f.name) ?? f.name,
        detail: stripFileCitations(f.detail) ?? f.detail,
      })),
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
      // Discipline-persona prose, and the last two unsanitized fields feeding a Dissection
      // panel. Both leak today: discipline-crna.yaml's archetype_summary cites
      // "CRNAVideosTranscripts.md" bare, and its switching_trigger cites
      // "../accreditation/coa.yaml" and "../accreditation/coca.yaml" — the prefixed form
      // that has always matched the regex, so this is a missing call site, not a regex gap.
      // discipline-dentistry.yaml and discipline-pa.yaml leak in archetype_summary too, and
      // discipline-pt.yaml in switching_trigger. Sanitized at the builder, matching
      // pillarDetail and trendDetail above, so the panel cannot be the surface that forgets.
      archetypeSummary: stripFileCitations(p?.archetype_summary),
      switchingTrigger: stripFileCitations(p?.switching_trigger),
      // The fifth field, and the one the first pass through this function missed: the two
      // scalars above are plain strings and were easy to spot, while this is an array of
      // {point, detail} objects and reads like structure rather than prose. It is prose —
      // six of the discipline personas cite their accreditor file inside `detail`, and the
      // Dentistry node's "Accreditation pressure" panel rendered the literal
      // "[../accreditation/coda.yaml licensure_or_gme_layer]" on screen.
      accreditationPressure: (p?.accreditation_pressure ?? []).map((pt) => ({
        ...pt,
        point: stripFileCitations(pt.point) ?? pt.point,
        detail: stripFileCitations(pt.detail) ?? pt.detail,
      })),
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
          // `read` is the lens file's own sentence about this role, rendered verbatim in
          // the panel. No lens file cites a filename in a `read` today (checked across all
          // of content/personas/lens-*.yaml), but it is free-text research prose of exactly
          // the shape that acquires one, and it renders through the same panel as the
          // fields above.
          .map((r) => ({
            competitorSlug: lens.slug,
            competitor: lens.competitor,
            read: stripFileCitations(r.read) ?? r.read,
          })),
      )
    : [];

  return {
    type: "persona",
    key: node.key,
    kind: "role",
    name: role?.role_name ?? node.label,
    appliesAcrossDomains: role?.applies_across_domains ?? [],
    // No role persona cites a filename here today; same field shape and same panel as the
    // discipline fields above, so it gets the same guard rather than waiting to become the
    // seventh site somebody trips over.
    dayInTheLifeSummary: stripFileCitations(role?.day_in_the_life_summary),
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
    detail: stripFileCitations(t?.detail),
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
