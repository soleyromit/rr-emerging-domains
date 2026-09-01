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
  gap_notes?: string;
  source?: string;
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
export const PRIORITY_DOMAINS = ["Physician Assistant", "Occupational Therapy", "Nursing"];

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

export interface StandardsCrosswalkCompetitorCell {
  competitor: string;
  slug: string;
  rating: "not-meeting" | "partially-meeting" | "fully-meeting" | "unresearched";
  rationale?: string;
  source?: string;
}

export interface StandardsCrosswalkRow {
  element_id: string;
  element_title?: string;
  evidence_programs_must_produce?: string;
  required_software_behavior?: string;
  prism_fit?: string;
  prism_fit_rationale?: string;
  gap_notes?: string;
  competitors: StandardsCrosswalkCompetitorCell[];
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

  let ratedCompetitorCellCount = 0;
  const rows: StandardsCrosswalkRow[] = (doc.standards ?? []).map((s) => ({
    element_id: s.element_id,
    element_title: s.element_title,
    evidence_programs_must_produce: s.evidence_programs_must_produce,
    required_software_behavior: s.required_software_behavior,
    prism_fit: s.prism_fit,
    prism_fit_rationale: s.prism_fit_rationale,
    gap_notes: s.gap_notes,
    competitors: competitors.map((c) => {
      const rated = ratingsIndex.get(`${s.element_id}|${c.slug}`);
      if (rated) ratedCompetitorCellCount += 1;
      return {
        competitor: c.competitor,
        slug: c.slug,
        rating: rated?.rating ?? ("unresearched" as const),
        rationale: rated?.rationale,
        source: rated?.source,
      };
    }),
  }));

  return {
    domain,
    accreditor: doc.accreditor,
    standardsDocument: doc.standards_document,
    competitors: competitors.map((c) => ({ competitor: c.competitor, slug: c.slug })),
    rows,
    researchStatus: doc.research_status,
    ratedCompetitorCellCount,
    totalCompetitorCellCount: rows.length * competitors.length,
  };
}

export function listStandardsCrosswalkDomains(): string[] {
  return sortDomainsByPriority(Object.keys(DOMAIN_TO_ACCREDITATION_SLUG), (d) => d);
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
