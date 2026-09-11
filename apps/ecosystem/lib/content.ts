import fs from "node:fs";
import path from "node:path";
import { load as loadYaml } from "js-yaml";
import matter from "gray-matter";
import { matchDisciplineMeta } from "./discipline-meta";

// content/ lives one level above apps/ecosystem, at the repo root.
const CONTENT_ROOT = path.join(process.cwd(), "..", "..", "content");

function readYamlFile<T = any>(relPath: string): T | null {
  const full = path.join(CONTENT_ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  try {
    const raw = fs.readFileSync(full, "utf8");
    return loadYaml(raw) as T;
  } catch {
    return null;
  }
}

function readYamlDir<T = any>(relDir: string): { slug: string; data: T }[] {
  const full = path.join(CONTENT_ROOT, relDir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_TEMPLATE"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(full, f), "utf8");
      let data: T | null = null;
      try {
        data = loadYaml(raw) as T;
      } catch {
        data = null;
      }
      return { slug: f.replace(/\.yaml$/, ""), data: data as T };
    })
    .filter((entry) => entry.data != null);
}

export function readMarkdownFile(relPath: string): string | null {
  const full = path.join(CONTENT_ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  const raw = fs.readFileSync(full, "utf8");
  return matter(raw).content.trim();
}

// ---------- typed accessors ----------

export interface PrismPillarFeature {
  name: string;
  detail: string;
}

export interface PrismPillar {
  name: string;
  status: "shipped" | "roadmap";
  target?: string;
  notes?: string;
  why_it_matters?: string;
  features?: PrismPillarFeature[];
}

export interface CapabilityMap {
  product: string;
  tagline: string;
  sources: string[];
  last_updated: string;
  core_ring: { description: string; pillars: PrismPillar[] };
  intelligence_layer: { description: string; capabilities: string[] };
  exxat_advantage_layer: { description: string; items: string[] };
  served_today?: { note: string };
  open_questions_for_phase_2?: string[];
}

export function getCapabilityMap(): CapabilityMap | null {
  return readYamlFile<CapabilityMap>("prism/capability-map.yaml");
}

export interface CompetitorFeature {
  pillar: string;
  competitor_capability?: string;
  depth_vs_prism?: string;
  evidence?: string;
  source?: string;
}

export interface Competitor {
  competitor: string;
  slug: string;
  domains_served: string[];
  category?: string;
  company?: { founded?: string; hq?: string; ownership?: string };
  feature_teardown?: CompetitorFeature[];
  strengths?: { claim: string; source?: string }[];
  weaknesses?: { claim: string; source?: string }[];
  retention_anchor?: string;
  exxat_opportunity?: string;
  pricing_signal?: string;
  last_researched?: string;
  sources?: string[];
}

export function listCompetitors(): Competitor[] {
  return readYamlDir<Competitor>("competitors").map((e) => e.data);
}

export function getCompetitor(slug: string): Competitor | null {
  return listCompetitors().find((c) => c.slug === slug) ?? null;
}

export interface AccreditationStandard {
  element_id: string;
  element_title?: string;
  evidence_programs_must_produce?: string;
  required_software_behavior?: string;
  prism_fit?: "Transfer" | "Configure" | "Build" | "Gap" | string;
  prism_fit_rationale?: string;
  exxat_compliance?: "compliant" | "partial" | "gap" | "not-applicable" | string;
  exxat_compliance_rationale?: string;
  gap_notes?: string;
  source?: string;
  /** source ids into content/sources/registry.yaml — peer-reviewed/analyst
   * literature backing this standard's real-world difficulty, distinct from
   * `source` (the accreditor's own standards document). */
  research_sources?: string[];
}

export interface AccreditationDoc {
  accreditor: string;
  slug: string;
  domain: string;
  governs?: string;
  research_status?: "unresearched";
  research_status_note?: string;
  standards_document?: { title?: string; version_or_year?: string; url?: string };
  standards?: AccreditationStandard[];
  licensure_or_gme_layer?: { body: string; what_it_governs?: string; relevance_to_product?: string; source?: string }[];
  last_researched?: string | null;
}

export function listAccreditation(): AccreditationDoc[] {
  return readYamlDir<AccreditationDoc>("accreditation").map((e) => e.data);
}

export function getAccreditationForDomain(domainLabel: string): AccreditationDoc[] {
  return listAccreditation().filter((a) =>
    a.domain?.toLowerCase().includes(domainLabel.toLowerCase())
  );
}

export interface DomainProfile {
  domain: string;
  full_name: string;
  credential?: string;
  program_length_years?: number;
  market?: { program_count?: string; program_count_trend?: string; total_enrollment?: string; sources?: string[] };
  standards_bodies?: { name: string; type: string }[];
  clinical_education_shape?: string;
  distinctive_pain_points?: { claim: string; source?: string }[];
  sources?: string[];
}

export function listDomains(): DomainProfile[] {
  return readYamlDir<DomainProfile>("domains").map((e) => e.data);
}

export interface PressurePoint {
  point: string;
  detail: string;
}

// Optional cross-reference from a jtbd/top_pain/lens point to the flows/*.yaml
// element(s) that verify it — navigational metadata, not a citation (see
// ARCHITECTURE.md's "related_flows is navigation, not a citation" note). Bare flow
// filename, no ../flows/ prefix — resolved programmatically, not read by a human.
export interface RelatedFlow {
  flow: string;
  step?: string;
  element?: string;
}

export interface DisciplinePersona {
  slug: string;
  domain: string;
  persona_name?: string;
  archetype_summary?: string;
  accreditation_pressure?: PressurePoint[];
  current_tools?: PressurePoint[];
  jtbd?: { job: string; evidence_or_rationale?: string; related_flows?: RelatedFlow[] }[];
  switching_trigger?: string;
  sources?: string[];
}

export interface RolePersona {
  slug: string;
  role_name: string;
  applies_across_domains?: string[];
  day_in_the_life_summary?: string;
  top_tasks?: string[];
  top_pains?: { pain: string; accreditation_link?: string; source?: string; related_flows?: RelatedFlow[] }[];
  tools_touched?: string[];
  sources?: string[];
}

export interface CompetitorLensPersona {
  slug: string;
  competitor: string;
  how_they_implicitly_serve_roles?: { role: string; read: string; related_flows?: RelatedFlow[] }[];
  // Defensive union: today's real content is still a flat string[]; the content
  // rewrite converts it to {claim, detail, related_flows} objects. Both shapes must
  // render correctly regardless of which lands first — see sentence-list.tsx.
  gaps_prism_can_exploit?: (string | { claim: string; detail?: string; related_flows?: RelatedFlow[] })[];
  sources?: string[];
}

export function listDisciplinePersonas(): DisciplinePersona[] {
  return readYamlDir<DisciplinePersona>("personas")
    .filter((e) => e.slug.startsWith("discipline-"))
    .map((e) => ({ ...e.data, slug: e.slug.replace(/^discipline-/, "") }));
}

export function getDisciplinePersona(slug: string): DisciplinePersona | null {
  return listDisciplinePersonas().find((p) => p.slug === slug) ?? null;
}

export function listRolePersonas(): RolePersona[] {
  return readYamlDir<RolePersona>("personas")
    .filter((e) => e.slug.startsWith("role-"))
    .map((e) => ({ ...e.data, slug: e.slug.replace(/^role-/, "") }));
}

export function getRolePersona(slug: string): RolePersona | null {
  return listRolePersonas().find((p) => p.slug === slug) ?? null;
}

export function listCompetitorLensPersonas(): CompetitorLensPersona[] {
  return readYamlDir<CompetitorLensPersona>("personas")
    .filter((e) => e.slug.startsWith("lens-"))
    .map((e) => ({ ...e.data, slug: e.slug.replace(/^lens-/, "") }));
}

export function getCompetitorLensPersona(slug: string): CompetitorLensPersona | null {
  return listCompetitorLensPersonas().find((p) => p.slug === slug) ?? null;
}

// lens-*.yaml's `role` field uses short names ("Dean", "Program Admin") while
// role-*.yaml's `role_name` is the long form ("Dean / Program Director",
// "Program Administrator (Academic Program Manager / Program Coordinator)") —
// an exact match against role_name always fails. Every word in the short form
// appears as a substring somewhere in the long form (verified against all 5
// pairs), so match on that instead of equality.
export function roleNameMatches(shortName: string, fullName: string): boolean {
  const haystack = fullName.toLowerCase();
  const words = shortName.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  return words.length > 0 && words.every((w) => haystack.includes(w));
}

// Every lens-*.yaml file's how_they_implicitly_serve_roles covers the same 5 role
// names every time — this is a real, verified cross-reference, not an assumption.
export function getCompetitorReadsForRole(roleName: string) {
  return listCompetitorLensPersonas().flatMap((l) =>
    (l.how_they_implicitly_serve_roles ?? [])
      .filter((r) => roleNameMatches(r.role, roleName))
      .map((r) => ({
        competitor: l.competitor,
        slug: l.slug,
        read: r.read,
        relatedFlows: resolveRelatedFlows(r.related_flows),
      }))
  );
}

export interface KeyFinding {
  subject: string; // a domain or discipline code/label, matched via lib/discipline-meta
  headline: string;
  severity?: string; // gap_severity vocabulary: none | cosmetic | configure-needed | gap
  detail?: string;
}

// One discipline's slice of a stage's discipline_variance prose, split out of the single
// long string so each discipline can be read (or skipped) on its own. The prose field is
// kept alongside it — journeys without discipline_notes still render from it.
export interface DisciplineVarianceNote {
  subject: string; // a domain or discipline code/label, matched via lib/discipline-meta
  detail: string;
}

export interface JourneyStage {
  stage: string;
  current_state_in_prism?: string;
  pain_or_gap?: string;
  accreditation_link?: string;
  competitor_comparison?: string;
  domain_variance?: string;
  discipline_variance?: string;
  discipline_notes?: DisciplineVarianceNote[];
  key_findings?: KeyFinding[];
}

export interface Journey {
  slug: string;
  journey_name: string;
  domain_scope?: string[];
  persona?: string;
  stages?: JourneyStage[];
  sources?: string[];
}

// Journeys were authored across several sessions and drifted on what to call the
// "how this stage differs per domain/discipline" field — domain_variance,
// domain_differences, domain_divergence, domain_structural_differences all show up
// for the same concept. Normalize at read time rather than rewrite content mid-flight.
const DOMAIN_VARIANCE_ALIASES = ["domain_variance", "domain_differences", "domain_divergence", "domain_structural_differences"];
const DISCIPLINE_VARIANCE_ALIASES = ["discipline_variance", "discipline_differences", "discipline_divergence"];

function normalizeStage(stage: any): JourneyStage {
  const normalized = { ...stage };
  if (!normalized.domain_variance) {
    const key = DOMAIN_VARIANCE_ALIASES.find((k) => stage[k]);
    if (key) normalized.domain_variance = stage[key];
  }
  if (!normalized.discipline_variance) {
    const key = DISCIPLINE_VARIANCE_ALIASES.find((k) => stage[k]);
    if (key) normalized.discipline_variance = stage[key];
  }
  return normalized;
}

export function listJourneys(): Journey[] {
  return readYamlDir<Journey>("journeys").map((e) => ({
    ...e.data,
    slug: e.slug,
    stages: (e.data.stages ?? []).map(normalizeStage),
  }));
}

export function getJourney(slug: string): Journey | null {
  return listJourneys().find((j) => j.slug === slug) ?? null;
}

// ---------- flows (Level 3 — element-level verification underneath a journey stage) ----------

export interface FlowElement {
  element: string;
  type?: string;
  data_shown?: string;
  gates_on?: string[];
  accreditation_citation?: string;
  competitor_equivalent?: string;
  gap_severity?: "none" | "cosmetic" | "configure-needed" | "gap" | string;
  gap_note?: string;
}

export interface FlowStep {
  screen: string;
  navigation_path?: string;
  action?: string;
  confirmed_by?: string;
  elements?: FlowElement[];
}

export interface Flow {
  slug: string;
  flow_name: string;
  maps_to_journey?: string;
  persona?: string;
  steps?: FlowStep[];
  sources?: string[];
  last_verified?: string;
}

export function listFlows(): Flow[] {
  return readYamlDir<Flow>("flows").map((e) => ({ ...e.data, slug: e.slug }));
}

// "rotation-lifecycle.yaml, stage 3" -> { journeySlug: "rotation-lifecycle", stageNumber: 3 }
// Exported so getJourneyContextForFlow (the inverse lookup) reuses this one parser
// instead of duplicating the regex.
export function parseMapsToJourney(mapsTo?: string): { journeySlug: string; stageNumber: number } | null {
  if (!mapsTo) return null;
  const match = mapsTo.match(/^([a-z0-9-]+)\.yaml,\s*stage\s*(\d+)/i);
  if (!match) return null;
  return { journeySlug: match[1], stageNumber: Number(match[2]) };
}

// Flows for one journey, keyed by 1-indexed stage number.
export function getFlowsByStageForJourney(journeySlug: string): Record<number, Flow> {
  const byStage: Record<number, Flow> = {};
  for (const flow of listFlows()) {
    const parsed = parseMapsToJourney(flow.maps_to_journey);
    if (parsed && parsed.journeySlug === journeySlug) {
      byStage[parsed.stageNumber] = flow;
    }
  }
  return byStage;
}

export function getFlowBySlug(slug: string): Flow | null {
  return listFlows().find((f) => f.slug === slug) ?? null;
}

export interface DisciplineJourneyStage {
  index: number; // 0-based, matches the journey's own stage order
  stageLabel: string;
  headline?: string; // present when sourced from a key_finding, absent for a plain discipline_note
  disciplineDetail: string;
  flowSlug?: string;
  flowName?: string;
}

// Journeys are cross-domain narratives; a domain page wants only the stages
// where that domain/discipline actually has something written, not the full
// 8-stage journey — this is what makes the journey content visible from
// inside a domain tab instead of only reachable via the separate top-level
// Journeys nav. Discipline-specific content lands in one of two fields
// depending on how that journey was authored: a plain discipline_notes
// {subject, detail} entry, or a key_findings {subject, headline, detail}
// entry (the richer, headline-bearing shape — e.g. rotation-lifecycle.yaml's
// Pharmacy callouts) — check both rather than assuming one.
export function getJourneyStagesForDiscipline(journeySlug: string, subject: string): DisciplineJourneyStage[] {
  const journey = getJourney(journeySlug);
  if (!journey?.stages) return [];
  const flowsByStage = getFlowsByStageForJourney(journeySlug);
  const out: DisciplineJourneyStage[] = [];
  journey.stages.forEach((stage, i) => {
    const finding = (stage.key_findings ?? []).find((f) => f.subject === subject);
    const note = (stage.discipline_notes ?? []).find((n) => n.subject === subject);
    if (!finding && !note) return;
    const flow = flowsByStage[i + 1];
    out.push({
      index: i,
      stageLabel: stage.stage,
      headline: finding?.headline,
      disciplineDetail: finding?.detail ?? note?.detail ?? "",
      flowSlug: flow?.slug,
      flowName: flow?.flow_name,
    });
  });
  return out;
}

export interface FlowJourneyContext {
  journey: Journey;
  stageNumber: number;
  stage?: JourneyStage;
}

// Resolves a flow back to the journey stage it verifies — the inverse of
// getFlowsByStageForJourney. Returns null (never throws) when maps_to_journey is
// missing, malformed, or names a journey that doesn't exist — a flow page must
// still render with a degraded breadcrumb, not crash.
export function getJourneyContextForFlow(flow: Flow): FlowJourneyContext | null {
  const parsed = parseMapsToJourney(flow.maps_to_journey);
  if (!parsed) return null;
  const journey = getJourney(parsed.journeySlug);
  if (!journey) return null;
  return { journey, stageNumber: parsed.stageNumber, stage: journey.stages?.[parsed.stageNumber - 1] };
}

// Case/whitespace-insensitive exact match against a flow's element labels — the only
// identifier a FlowElement has (no stable ID exists in the schema).
export function findFlowElement(
  flow: Flow,
  elementLabel: string
): { element: FlowElement; stepIndex: number } | undefined {
  const target = elementLabel.trim().toLowerCase();
  const steps = flow.steps ?? [];
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const match = (steps[stepIndex].elements ?? []).find((e) => e.element.trim().toLowerCase() === target);
    if (match) return { element: match, stepIndex };
  }
  return undefined;
}

// ---------- related_flows resolution (consumed by jtbd / top_pains / lens fields) ----------

export interface ResolvedRelatedFlow {
  flow: Flow;
  journeyContext: FlowJourneyContext | null;
  element?: FlowElement;
  stepIndex?: number;
}

// Resolves one ref to real data. Returns null (never throws) when the referenced
// flow file doesn't exist — a stale/typo'd content reference degrades to "this one
// entry doesn't render" rather than a build failure. An element that doesn't match
// still resolves the flow (a flow-level-only preview) rather than dropping the
// whole entry.
export function resolveRelatedFlow(ref: RelatedFlow): ResolvedRelatedFlow | null {
  const slug = ref.flow.replace(/\.yaml$/i, "");
  const flow = getFlowBySlug(slug);
  if (!flow) return null;
  const found = ref.element ? findFlowElement(flow, ref.element) : undefined;
  return { flow, journeyContext: getJourneyContextForFlow(flow), element: found?.element, stepIndex: found?.stepIndex };
}

export function resolveRelatedFlows(refs?: RelatedFlow[]): ResolvedRelatedFlow[] {
  return (refs ?? []).map(resolveRelatedFlow).filter((r): r is ResolvedRelatedFlow => r != null);
}

export interface ScorecardCriterion {
  name: string;
  weight: number;
  scores: Record<string, number>;
  rationale: Record<string, string>;
}

export interface Scorecard {
  criteria: ScorecardCriterion[];
  recommended_beachhead?: string;
  rationale?: string;
  actual_gtm_target?: string;
  actual_gtm_target_rationale?: string;
  actual_gtm_target_decided?: string;
  last_updated?: string;
}

export function getScorecard(): Scorecard | null {
  return readYamlFile<Scorecard>("scorecard/where-to-play.yaml");
}

export function computeWeightedTotals(sc: Scorecard): Record<string, number> {
  const domains = ["DO", "Pharmacy", "Dentistry", "Medicine"];
  const totals: Record<string, number> = {};
  for (const d of domains) {
    totals[d] = sc.criteria.reduce((sum, c) => sum + (c.weight ?? 0) * (c.scores?.[d] ?? 0), 0);
  }
  return totals;
}

export type FeatureMapStatus = "leading" | "behind" | "opportunity";

export interface FeatureMapPillar {
  pillar: string;
  status: FeatureMapStatus;
  leader?: string | null;
  summary: string;
  opportunity: string;
  sources?: string[];
}

export interface FeatureMap {
  domain: string;
  pillars: FeatureMapPillar[];
}

const FEATURE_MAP_SLUGS = ["do", "pharmacy", "dentistry", "medicine"];

export function listFeatureMaps(): FeatureMap[] {
  return FEATURE_MAP_SLUGS.map((slug) => readYamlFile<FeatureMap>(`feature-map/${slug}.yaml`)).filter(
    (f): f is FeatureMap => f != null
  );
}

// ---------- lenses (Level 2 reframings — rows×columns quick-scan views for leadership) ----------

// Wilson's stated priority (2026-08-26 call): deepen the domains Prism already has
// real footing in — PA/OT ~50% penetration, Nursing 5-8% — before the 4 new expansion
// domains. "We already have footing in there... having the same analysis will be
// helpful." Applied to every lens's domain ordering, not just the standards crosswalk.
// Pharmacy leads — confirmed 2026-09-10 as the first GTM target, ahead of DO
// (the where-to-play scorecard's own analytical pick — see
// scorecard/where-to-play.yaml's `actual_gtm_target` field). Existing/legacy
// discipline priority (PA/OT/Nursing) kept after the 4 expansion domains.
export const PRIORITY_DOMAINS = [
  "Pharmacy",
  "DO",
  "Dentistry",
  "Medicine",
  "Physician Assistant",
  "Occupational Therapy",
  "Nursing",
];

export function sortDomainsByPriority<T>(items: T[], getDomain: (item: T) => string): T[] {
  const rank = (domain: string) => {
    const i = PRIORITY_DOMAINS.indexOf(domain);
    return i === -1 ? PRIORITY_DOMAINS.length : i;
  };
  return [...items].sort((a, b) => rank(getDomain(a)) - rank(getDomain(b)));
}

export interface AccreditorTierEntry {
  domain: string;
  programmatic_accreditor: string;
  consortium_note?: string;
  regional_accreditor: boolean;
  state_licensure_variation: "confirmed" | "unconfirmed" | string;
  notes?: string;
  sources?: string[];
}

export interface AccreditorTiers {
  last_updated: string;
  domains: AccreditorTierEntry[];
}

export function getAccreditorTiers(): AccreditorTiers | null {
  return readYamlFile<AccreditorTiers>("lenses/accreditor-tiers.yaml");
}

export interface CompetitorThreatEntry {
  competitor: string;
  slug: string;
  threat: "high" | "medium" | "low" | string;
  rationale: string;
}

export interface CompetitorLandscapeDomain {
  domain: string;
  competitors: CompetitorThreatEntry[];
  note?: string;
  sources?: string[];
}

export interface CompetitorLandscape {
  last_updated: string;
  domains: CompetitorLandscapeDomain[];
}

export function getCompetitorLandscape(): CompetitorLandscape | null {
  return readYamlFile<CompetitorLandscape>("lenses/competitor-landscape.yaml");
}

// Competitor files use "MD" for Medicine (matching their own domains_served
// convention) while the rest of the app (personas, journeys, lenses above) says
// "Medicine" — normalize once here rather than editing 9+ existing competitor files.
// Some domains_served entries are also more descriptive than the canonical domain
// name (e.g. "Education/Teacher Prep" vs. "Teacher Education") — matchesDomain below
// does a case-insensitive substring check in both directions to cover that, so this
// map only needs to handle genuine abbreviation mismatches, not phrasing variance.
const DOMAIN_TO_COMPETITOR_CODE: Record<string, string> = {
  Medicine: "MD",
};

function matchesDomain(served: string, domain: string): boolean {
  const a = served.toLowerCase();
  const b = domain.toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

function normalizePillarName(pillar: string): string {
  // Strip a trailing "(Prism roadmap ...)"-style annotation some competitor files
  // bake into the pillar name itself, so the same pillar groups together across files.
  return pillar.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export const CANONICAL_PILLAR_ORDER = [
  "Clinical & Experiential Education",
  "Compliance Management",
  "Curriculum Mapping",
  "Surveys & Course Evaluations",
  "Exam Management",
  "Accreditation Management",
];

export interface FeatureComparisonCell {
  competitor: string;
  slug: string;
  capability?: string;
  depth?: string;
  evidence?: string;
  source?: string;
}

export interface FeatureComparisonRow {
  pillar: string;
  cells: FeatureComparisonCell[];
}

export interface FeatureComparisonForDomain {
  domain: string;
  competitors: { competitor: string; slug: string }[];
  rows: FeatureComparisonRow[];
}

// Reuses each competitor's already-researched, already-cited feature_teardown —
// no new per-cell content to author. Scoped to competitors whose domains_served
// includes this domain, matching Wilson's vendor-comparison-chart format (feature/
// pillar rows × competitor columns) but grounded in this repo's existing citations
// instead of an uncited internal X-mark sheet.
export function getFeatureComparisonForDomain(domain: string): FeatureComparisonForDomain {
  const code = DOMAIN_TO_COMPETITOR_CODE[domain] ?? domain;
  const competitors = listCompetitors().filter((c) =>
    (c.domains_served ?? []).some((s) => matchesDomain(s, code) || matchesDomain(s, domain))
  );
  // Restricted to the 6 canonical, cross-comparable pillars — a competitor file can
  // carry a one-off analysis entry that isn't really a "pillar" at all (e.g.
  // medhub.yaml's "not a Prism pillar — DO-specific positioning"), and including
  // those here would render a nonsense row nobody else has data for.
  const pillars = new Set<string>();
  for (const c of competitors) {
    for (const f of c.feature_teardown ?? []) {
      const normalized = normalizePillarName(f.pillar);
      if (CANONICAL_PILLAR_ORDER.includes(normalized)) pillars.add(normalized);
    }
  }
  const orderedPillars = CANONICAL_PILLAR_ORDER.filter((p) => pillars.has(p));
  const rows: FeatureComparisonRow[] = orderedPillars.map((pillar) => ({
    pillar,
    cells: competitors.map((c) => {
      const match = (c.feature_teardown ?? []).find((f) => normalizePillarName(f.pillar) === pillar);
      return {
        competitor: c.competitor,
        slug: c.slug,
        capability: match?.competitor_capability,
        depth: match?.depth_vs_prism,
        evidence: match?.evidence,
        source: match?.source,
      };
    }),
  }));
  return {
    domain,
    competitors: competitors.map((c) => ({ competitor: c.competitor, slug: c.slug })),
    rows,
  };
}

// Canonical lens domain name -> accreditation/*.yaml file slug.
const DOMAIN_TO_ACCREDITATION_SLUG: Record<string, string> = {
  DO: "coca",
  Pharmacy: "acpe",
  Dentistry: "coda",
  Medicine: "lcme",
  Nursing: "nursing",
  "Teacher Education": "caep",
  "Social Work": "cswe",
  "Physical Therapy": "capte",
  "Occupational Therapy": "acote",
  "Physician Assistant": "arc-pa",
  "Speech-Language Pathology": "caa-asha",
  CRNA: "coa",
  Counseling: "counseling",
};

export function fitCounts(doc?: AccreditationDoc) {
  const counts = { Transfer: 0, Configure: 0, Gap: 0 };
  for (const s of doc?.standards ?? []) {
    const fit = (s.prism_fit ?? "").toLowerCase();
    if (fit.includes("transfer")) counts.Transfer += 1;
    else if (fit.includes("configure")) counts.Configure += 1;
    else if (fit.includes("gap")) counts.Gap += 1;
  }
  return counts;
}

export interface StandardsCompetitorRatingEntry {
  domain: string;
  element_id: string;
  competitor_slug: string;
  rating: "not-meeting" | "partially-meeting" | "fully-meeting";
  rationale?: string;
  source?: string;
  competitor_feature_ref?: string;
  sources?: { source_id: string }[];
  persona_relevance?: string[];
  /** Added 2026-09-10. Present only on first-pass ratings read off public vendor
   * material rather than verified element by element. The existing verified
   * entries deliberately omit it. Enforced in check_content_density.py's
   * check_standards_ratings_integrity(): "directional" requires evidence_note. */
  evidence_strength?: "directional";
  /** What the directional rating actually rests on — required whenever
   * evidence_strength is "directional". */
  evidence_note?: string;
}

export interface StandardsCompetitorRatings {
  last_updated: string;
  ratings: StandardsCompetitorRatingEntry[];
}

// Sparse Level 2 lens — see content/lenses/standards-competitor-ratings.yaml's own
// header comment. Absence of an entry is the "unresearched" state, not an error.
export function getStandardsCompetitorRatings(): StandardsCompetitorRatings | null {
  return readYamlFile<StandardsCompetitorRatings>("lenses/standards-competitor-ratings.yaml");
}

// ---------- standards use cases (Level 2 lens + computed fallback) ----------

// content/lenses/standards-use-cases.yaml — added 2026-09-10, structural sibling of
// standards-competitor-ratings.yaml above: sparse, keyed by (domain, element_id),
// citing accreditation/*.yaml downward by element_id and carrying related_flows as
// the already-tolerated Level 2 -> Level 3 navigational pointer (see
// content/ARCHITECTURE.md). Absence of an entry is the "not curated yet" state, not
// an error — the computed join below fills the remaining elements as a distinctly
// labeled fallback.
export type StandardUseCaseStatus = "proposed" | "in-flight" | "documented" | "no-fit-yet";

export interface StandardUseCaseEntry {
  domain: string;
  element_id: string;
  use_case: string;
  status: StandardUseCaseStatus | string;
  audience?: string[];
  detail?: string;
  related_flows?: RelatedFlow[];
  /** One of capability-map.yaml's 6 top-level pillar names verbatim — which Exxat
   * capability actually does the work this use case describes. Optional: omitted
   * only when status is "no-fit-yet" and no pillar addresses it. */
  prism_feature_ref?: string;
  sources?: { source_id: string }[];
}

export interface StandardsUseCasesDoc {
  last_updated: string;
  use_cases: StandardUseCaseEntry[];
}

export function getStandardsUseCases(): StandardsUseCasesDoc | null {
  return readYamlFile<StandardsUseCasesDoc>("lenses/standards-use-cases.yaml");
}

/** One curated use case, resolved for rendering. */
export interface StandardUseCase {
  useCase: string;
  status: StandardUseCaseStatus | string;
  audience: string[];
  detail?: string;
  relatedFlows: ResolvedRelatedFlow[];
  prismFeatureRef?: string;
  sources: SourceRegistryEntry[];
}

/** One computed (not curated) reference: an existing flow or journey whose own
 * accreditation prose already names this element. Zero authoring — it's a reverse
 * lookup over research that already exists. */
export interface ComputedUseCaseMatch {
  kind: "flow" | "journey";
  /** flow_name or journey_name — never a slug or filename (UI-DENSITY-PATTERNS.md). */
  label: string;
  href: string;
  context?: string;
}

// Standard 3 Key Element 3.3.a alone matches 9 flow files; rendering all of them
// buries the curated entries above. Cap the rendered list and report the remainder
// as a count.
export const COMPUTED_USE_CASE_MATCH_CAP = 4;

// Matching is deliberately strict: the FULL element_id string ("Standard 3, Key
// Element 3.3.a") AND the accreditor's short name must both appear in the same prose
// field. Loosening to bare numbers would false-positive across accreditors — COCA and
// LCME both use "Standard N, Element N.N" numbering, and CODA reuses "Standard N,
// Element N-N". Verified 2026-09-10: the accreditor-name guard changes nothing for
// ACPE (still 12 of 20 elements covered, still 9 flows for 3.3.a) while removing the
// cross-accreditor collision risk.
//
// The id must also END on a token boundary. A bare substring test made every citation
// of CODA "Standard 2, Element 2-24" also count as evidence for "Standard 2, Element
// 2-2" — the one such collision among the 173 element_ids in content/accreditation/,
// and it was live (Dentistry's 2-2 row absorbed 6 matches belonging only to 2-24).
//
// The lookahead rejects a following ALPHANUMERIC only. A following hyphen must stay
// legal: flows cite ACPE ranges as "Standard 3, Key Element 3.3.a-e" / "3.3.a-d", and
// that range genuinely covers 3.3.a — rejecting "-" here silently dropped a real
// 3.3.a match (verified 2026-09-10). The digit rule still kills the CODA collision,
// because there the extra character is the digit in "2-2" + "4", not a range dash.
// Everything else — period, comma, quote, paren, space, end-of-string — still matches,
// so "...Key Element 3.3.a." at the end of a sentence is unaffected. Escaping keeps
// "3.3.a" matching literally rather than as a wildcard pattern ("3x3xa").
function elementProseHit(prose: string | undefined, elementId: string, accreditorShort: string): boolean {
  if (!prose) return false;
  const escaped = elementId.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
  if (!new RegExp(`${escaped}(?![0-9A-Za-z])`).test(prose)) return false;
  return !accreditorShort || prose.includes(accreditorShort);
}

/** "ACPE (Accreditation Council for Pharmacy Education)" -> "ACPE". Derived from the
 * accreditation file's own `accreditor` field rather than a hand-kept map, so a new
 * accreditor file needs no code change. */
export function accreditorShortName(doc: AccreditationDoc): string {
  return (doc.accreditor ?? "").split("(")[0].trim();
}

/** One pass over flows + journeys for every element at once. Built as an index
 * rather than a per-element function because the naive shape re-reads all 41 flow
 * files and all 5 journey files once per element (20x on the pharmacy page). */
export function buildComputedUseCaseIndex(
  elementIds: string[],
  accreditorShort: string
): Map<string, ComputedUseCaseMatch[]> {
  const index = new Map<string, ComputedUseCaseMatch[]>();
  for (const id of elementIds) index.set(id, []);

  for (const flow of listFlows()) {
    const prose = (flow.steps ?? []).flatMap((s) =>
      (s.elements ?? []).map((e) => e.accreditation_citation ?? "")
    );
    if (!prose.length) continue;
    let ctxResolved: FlowJourneyContext | null | undefined;
    for (const id of elementIds) {
      if (!prose.some((p) => elementProseHit(p, id, accreditorShort))) continue;
      if (ctxResolved === undefined) ctxResolved = getJourneyContextForFlow(flow);
      index.get(id)!.push({
        kind: "flow",
        label: flow.flow_name,
        href: `/flows/${flow.slug}`,
        context: ctxResolved
          ? `${ctxResolved.journey.journey_name} — stage ${ctxResolved.stageNumber}`
          : undefined,
      });
    }
  }

  for (const journey of listJourneys()) {
    (journey.stages ?? []).forEach((stage, i) => {
      for (const id of elementIds) {
        if (!elementProseHit(stage.accreditation_link, id, accreditorShort)) continue;
        index.get(id)!.push({
          kind: "journey",
          label: journey.journey_name,
          href: `/journeys/${journey.slug}`,
          context: `Stage ${i + 1} — ${stage.stage}`,
        });
      }
    });
  }

  return index;
}

/** Orders and de-duplicates one element's computed matches before the cap is applied.
 *
 * Three things this fixes, all of them only visible once the list is capped at
 * COMPUTED_USE_CASE_MATCH_CAP:
 *
 * 1. buildComputedUseCaseIndex walks flows before journeys, so the raw array is always
 *    "every flow match, then every journey match". Any element with 4+ flow matches
 *    therefore never showed a journey at all — the CORE-to-Exxat migration journey
 *    cites 10 ACPE elements and was reaching the rendered list on 2 of them. Journeys
 *    go first here: a journey is the more valuable read (it's the end-to-end story the
 *    flow is a step of), and a flow that loses its slot is still reachable from the
 *    journey page that contains it. Flows then fill whatever slots remain.
 *
 * 2. A flow already shown as a curated `related_flows` chip directly above the computed
 *    list restated itself inside it (2.2.d spent 2 of its 4 slots that way). Curated
 *    hrefs are filtered out — the chip above is strictly richer, since it renders the
 *    matched element's own prose.
 *
 * 3. A journey that names the same element on several stages pushed one entry per
 *    stage. Harmless while journeys were starved at the end of the list; with journeys
 *    first it would spend 3 of 4 slots on one journey (3.3.a) and emit duplicate React
 *    keys in the renderer. First occurrence wins, so the earliest stage's context is
 *    the one kept.
 *
 * The returned length is what `computedMatchTotal` should report, so the "N more" line
 * counts only references a reader can't already see.
 */
export function rankComputedUseCaseMatches(
  allComputed: ComputedUseCaseMatch[],
  useCases: StandardUseCase[]
): ComputedUseCaseMatch[] {
  const curatedHrefs = new Set(
    useCases.flatMap((u) => u.relatedFlows.map((r) => `/flows/${r.flow.slug}`))
  );
  const seen = new Set<string>();
  const ordered = [
    ...allComputed.filter((m) => m.kind === "journey"),
    ...allComputed.filter((m) => m.kind !== "journey"),
  ];
  return ordered.filter((m) => {
    if (curatedHrefs.has(m.href) || seen.has(m.href)) return false;
    seen.add(m.href);
    return true;
  });
}

export interface SourceRegistryEntry {
  id: string;
  title?: string;
  url?: string;
  type?: "webinar" | "doc" | "press" | "product-page" | "analyst" | "other" | string;
  publisher?: string;
  date?: string;
  what_it_supports?: string;
  accessed?: string;
}

export interface SourcesRegistry {
  sources: SourceRegistryEntry[];
}

// content/sources/registry.yaml — Level 0.5 normalized citation registry, added
// 2026-09-09 alongside the standards x competitor crosswalk research pass, so a
// webinar can carry publisher/date/type metadata a bare `source:` string can't.
export function getSourcesRegistry(): SourcesRegistry | null {
  return readYamlFile<SourcesRegistry>("sources/registry.yaml");
}

function resolveSourceIds(ids: { source_id: string }[] | undefined): SourceRegistryEntry[] {
  if (!ids?.length) return [];
  const registry = getSourcesRegistry()?.sources ?? [];
  const bySid = new Map(registry.map((s) => [s.id, s]));
  return ids.map((s) => bySid.get(s.source_id)).filter((s): s is SourceRegistryEntry => Boolean(s));
}

function resolveSourceIdStrings(ids: string[] | undefined): SourceRegistryEntry[] {
  if (!ids?.length) return [];
  const registry = getSourcesRegistry()?.sources ?? [];
  const bySid = new Map(registry.map((s) => [s.id, s]));
  return ids.map((id) => bySid.get(id)).filter((s): s is SourceRegistryEntry => Boolean(s));
}

export interface StandardsCrosswalkCompetitorCell {
  competitor: string;
  slug: string;
  rating: "not-meeting" | "partially-meeting" | "fully-meeting" | "unresearched";
  rationale?: string;
  source?: string;
  competitorFeatureRef?: string;
  sources: SourceRegistryEntry[];
  /** "directional" = first-pass read of public vendor material, not element-by-element
   * verification. Absent on the pre-existing verified entries, by design. */
  evidenceStrength?: "directional";
  evidenceNote?: string;
}

export interface StandardsCrosswalkRow {
  element_id: string;
  element_title?: string;
  evidence_programs_must_produce?: string;
  required_software_behavior?: string;
  prism_fit?: string;
  prism_fit_rationale?: string;
  exxat_compliance?: string;
  exxat_compliance_rationale?: string;
  gap_notes?: string;
  personaRelevance: string[];
  /** Resolved from `research_sources` — peer-reviewed/analyst literature
   * backing this standard's real-world difficulty, always an array. */
  researchSources: SourceRegistryEntry[];
  competitors: StandardsCrosswalkCompetitorCell[];
  /** Curated entries from lenses/standards-use-cases.yaml. Rendered first. */
  useCases: StandardUseCase[];
  /** Computed fallback, already capped at COMPUTED_USE_CASE_MATCH_CAP. */
  computedMatches: ComputedUseCaseMatch[];
  /** Uncapped count, so the UI can say "N more" honestly. */
  computedMatchTotal: number;
}

export interface StandardsCrosswalkForDomain {
  domain: string;
  accreditor: string;
  standardsDocument?: { title?: string; url?: string };
  competitors: { competitor: string; slug: string }[];
  rows: StandardsCrosswalkRow[];
  researchStatus?: "unresearched";
  ratedCompetitorCellCount: number;
  totalCompetitorCellCount: number;
  /** Rows with at least one curated use case OR at least one computed match. Must be
   * labelled as such in the UI: a computed match is an existing flow/journey that names
   * the element, NOT a use case anyone wrote. Labelling this "standards with a use case"
   * made the scan layer claim 14/20 for Pharmacy where the detail panel's own copy says
   * "computed — not a curated use case" on 3 of them. */
  standardsWithUseCaseOrReferenceCount: number;
  /** Strict subset: rows with at least one CURATED use case from
   * lenses/standards-use-cases.yaml. This is the "someone wrote this down" number. */
  standardsWithCuratedUseCaseCount: number;
  /** Subset of ratedCompetitorCellCount carrying evidence_strength: "directional". */
  directionalRatingCount: number;
}

// Wilson's explicit ask (2026-08-26 call): "the accreditation being able to go
// through all the standards and say, where do we meet versus the competitors meet...
// similar to what we have in the feature crosswalk grid... but with each of the
// standards... not meeting it, partially meeting it, fully meeting it." Rows are
// individual accreditation elements (not pillars, unlike getFeatureComparisonForDomain
// above), columns are competitors. The Prism column is always real, cited data (each
// accreditation/*.yaml's own prism_fit). Competitor cells pull from the sparse
// lenses/standards-competitor-ratings.yaml lens where a real, sourced rating exists,
// and fall back to "unresearched" — never a fabricated rating — everywhere else.
export function getStandardsCrosswalkForDomain(domain: string): StandardsCrosswalkForDomain | null {
  const accreditationSlug = DOMAIN_TO_ACCREDITATION_SLUG[domain];
  if (!accreditationSlug) return null;
  const doc = listAccreditation().find((a) => a.slug === accreditationSlug);
  if (!doc) return null;

  const code = DOMAIN_TO_COMPETITOR_CODE[domain] ?? domain;
  const competitors = listCompetitors().filter((c) =>
    (c.domains_served ?? []).some((s) => matchesDomain(s, code) || matchesDomain(s, domain))
  );

  const ratingsIndex = new Map(
    (getStandardsCompetitorRatings()?.ratings ?? [])
      .filter((r) => r.domain === domain)
      .map((r) => [`${r.element_id}|${r.competitor_slug}`, r])
  );

  // Curated use cases, grouped by element. Sparse — most elements have none.
  const useCasesByElement = new Map<string, StandardUseCase[]>();
  for (const u of getStandardsUseCases()?.use_cases ?? []) {
    if (u.domain !== domain) continue;
    const list = useCasesByElement.get(u.element_id) ?? [];
    list.push({
      useCase: u.use_case,
      status: u.status,
      audience: u.audience ?? [],
      detail: u.detail,
      relatedFlows: resolveRelatedFlows(u.related_flows),
      prismFeatureRef: u.prism_feature_ref,
      sources: resolveSourceIds(u.sources),
    });
    useCasesByElement.set(u.element_id, list);
  }

  // Computed fallback — one pass over flows/journeys for all elements at once.
  const elementIds = (doc.standards ?? []).map((s) => s.element_id);
  const computedIndex = buildComputedUseCaseIndex(elementIds, accreditorShortName(doc));

  let ratedCompetitorCellCount = 0;
  let directionalRatingCount = 0;
  let standardsWithUseCaseOrReferenceCount = 0;
  let standardsWithCuratedUseCaseCount = 0;

  const rows: StandardsCrosswalkRow[] = (doc.standards ?? []).map((s) => {
    const personaSet = new Set<string>();
    const cellCompetitors = competitors.map((c) => {
      const rated = ratingsIndex.get(`${s.element_id}|${c.slug}`);
      if (rated) {
        ratedCompetitorCellCount += 1;
        if (rated.evidence_strength === "directional") directionalRatingCount += 1;
        for (const p of rated.persona_relevance ?? []) personaSet.add(p);
      }
      return {
        competitor: c.competitor,
        slug: c.slug,
        rating: rated?.rating ?? ("unresearched" as const),
        rationale: rated?.rationale,
        source: rated?.source,
        competitorFeatureRef: rated?.competitor_feature_ref,
        sources: resolveSourceIds(rated?.sources),
        evidenceStrength: rated?.evidence_strength,
        evidenceNote: rated?.evidence_note,
      };
    });

    const useCases = useCasesByElement.get(s.element_id) ?? [];
    const allComputed = rankComputedUseCaseMatches(computedIndex.get(s.element_id) ?? [], useCases);
    if (useCases.length) standardsWithCuratedUseCaseCount += 1;
    if (useCases.length || allComputed.length) standardsWithUseCaseOrReferenceCount += 1;

    return {
      element_id: s.element_id,
      element_title: s.element_title,
      evidence_programs_must_produce: s.evidence_programs_must_produce,
      required_software_behavior: s.required_software_behavior,
      prism_fit: s.prism_fit,
      prism_fit_rationale: s.prism_fit_rationale,
      exxat_compliance: s.exxat_compliance,
      exxat_compliance_rationale: s.exxat_compliance_rationale,
      gap_notes: s.gap_notes,
      personaRelevance: Array.from(personaSet),
      researchSources: resolveSourceIdStrings(s.research_sources),
      competitors: cellCompetitors,
      useCases,
      computedMatches: allComputed.slice(0, COMPUTED_USE_CASE_MATCH_CAP),
      computedMatchTotal: allComputed.length,
    };
  });

  return {
    domain,
    accreditor: doc.accreditor,
    standardsDocument: doc.standards_document,
    competitors: competitors.map((c) => ({ competitor: c.competitor, slug: c.slug })),
    rows,
    researchStatus: doc.research_status,
    ratedCompetitorCellCount,
    totalCompetitorCellCount: rows.length * competitors.length,
    standardsWithUseCaseOrReferenceCount,
    standardsWithCuratedUseCaseCount,
    directionalRatingCount,
  };
}

export function listStandardsCrosswalkDomains(): string[] {
  return sortDomainsByPriority(Object.keys(DOMAIN_TO_ACCREDITATION_SLUG), (d) => d);
}

export interface TrendCompetitorRef {
  competitor_slug: string;
  capability_ref?: string;
  source_id?: string;
}

export interface TrendEntry {
  id: string;
  trend: string;
  detail?: string;
  exxat_status: "shipped" | "roadmap" | "unaddressed" | string;
  exxat_ref?: string | null;
  addressed_by_competitors?: TrendCompetitorRef[];
  // Flat list of content/sources/registry.yaml ids — simpler than the
  // {source_id} object shape ratings entries use, since a trend has no other
  // per-source metadata to hang alongside it.
  sources?: string[];
}

export interface TrendsDoc {
  domain: string;
  trends: TrendEntry[];
  last_updated?: string;
}

export interface ResolvedTrendCompetitorRef {
  competitor?: string;
  slug: string;
  capabilityRef?: string;
  source?: SourceRegistryEntry;
}

export interface ResolvedTrendEntry extends Omit<TrendEntry, "addressed_by_competitors" | "sources"> {
  addressedByCompetitors: ResolvedTrendCompetitorRef[];
  sources: SourceRegistryEntry[];
}

// content/trends/<slug>.yaml — one file per top-level domain (dentistry, do,
// medicine, pharmacy), keyed the same way DOMAIN_TO_ACCREDITATION_SLUG's
// domain labels lowercase to their file slug. Sparse by design, same
// convention as the standards-competitor-ratings lens.
const TRENDS_DOMAINS = ["Dentistry", "DO", "Medicine", "Pharmacy"];

export function listTrendsDomains(): string[] {
  return TRENDS_DOMAINS;
}

export function getTrendsForDomain(domain: string): ResolvedTrendEntry[] {
  const slug = domain.toLowerCase();
  const doc = readYamlFile<TrendsDoc>(`trends/${slug}.yaml`);
  if (!doc?.trends) return [];
  const competitorsBySlug = new Map(listCompetitors().map((c) => [c.slug, c]));
  return doc.trends.map((t) => ({
    ...t,
    addressedByCompetitors: (t.addressed_by_competitors ?? []).map((ref) => ({
      competitor: competitorsBySlug.get(ref.competitor_slug)?.competitor,
      slug: ref.competitor_slug,
      capabilityRef: ref.capability_ref,
      source: ref.source_id ? resolveSourceIdStrings([ref.source_id])[0] : undefined,
    })),
    sources: resolveSourceIdStrings(t.sources),
  }));
}

export interface DomainHubData {
  tierEntry: AccreditorTierEntry | null;
  landscapeEntry: CompetitorLandscapeDomain | null;
  featureComparison: FeatureComparisonForDomain;
  standardsCrosswalk: StandardsCrosswalkForDomain | null;
  accreditationDoc: AccreditationDoc | null;
  disciplinePersona: DisciplinePersona | null;
}

// Bundles the per-domain lens/accreditation/persona lookups into a single fs-backed
// call, shared by every tab under app/domains/[slug]/**. `domain` is the canonical
// label (e.g. "Physical Therapy", matching AccreditorTierEntry.domain); `routeSlug`
// is the URL segment (e.g. "pt"), used only for the discipline-persona lookup since
// personas/discipline-*.yaml is keyed by that slug, not the label.
// content/synthesis/{slug}/SALES.md exists for 4 of the 13 tracked domains today
// (pharmacy, do, dentistry, medicine) — this is the cheap existence check
// DomainHubTabs needs to conditionally show the "How we win" tab without
// parsing the file. See lib/sales-brief.ts for the actual parse.
export function hasSalesBrief(routeSlug: string): boolean {
  return readMarkdownFile(`synthesis/${routeSlug}/SALES.md`) !== null;
}

export function getDomainHubData(domain: string, routeSlug: string): DomainHubData {
  return {
    tierEntry: getAccreditorTiers()?.domains.find((d) => d.domain === domain) ?? null,
    landscapeEntry: getCompetitorLandscape()?.domains.find((d) => d.domain === domain) ?? null,
    featureComparison: getFeatureComparisonForDomain(domain),
    standardsCrosswalk: getStandardsCrosswalkForDomain(domain),
    accreditationDoc: listAccreditation().find((a) => a.slug === DOMAIN_TO_ACCREDITATION_SLUG[domain]) ?? null,
    disciplinePersona: getDisciplinePersona(routeSlug),
  };
}
