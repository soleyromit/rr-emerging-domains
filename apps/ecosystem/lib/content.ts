import fs from "node:fs";
import path from "node:path";
import { load as loadYaml } from "js-yaml";
import matter from "gray-matter";
import { matchDisciplineMeta } from "./discipline-meta";
import { stripFileCitations } from "./strip-file-citations";

// content/ lives one level above apps/ecosystem, at the repo root.
const CONTENT_ROOT = path.join(process.cwd(), "..", "..", "content");

// Every content read in this file bottoms out in readYamlFile or readYamlDir below,
// so these two caches cover every accessor — present and future — in one place.
//
// Cached in PRODUCTION ONLY, matching (and for exactly the reason given by)
// getSourceIndex()'s sourceIndexCache further down. content/ lives two levels above
// apps/ecosystem, outside anything `next dev` watches for hot-reload: the only reason
// a local content edit shows up without a server restart is that every dev request
// does a genuinely fresh fs read. A cache that persisted in dev would serve a content
// author stale YAML until they restarted the server, and this repo's working
// convention is to keep that dev server alive. In production the process reads a
// frozen content/ tree, so a per-process cache is always correct.
//
// Uncached, /domains/[slug]/dissect — necessarily dynamic, for its ?node= deep link —
// re-parsed the same YAML dozens of times per request (buildDissectionGraph alone
// calls listRolePersonas() inside a loop), measuring ~0.87s against ~0.026s for a
// comparable static page.
//
// Callers must not mutate what these return: with the cache on, a returned object is
// shared by every later reader of the same key. Every existing caller copies before
// changing anything (`{...e.data}`, `[...items].sort()`), which is what makes this safe.
const yamlFileCache = new Map<string, unknown>();
const yamlDirCache = new Map<string, { slug: string; data: any }[]>();

function readYamlFile<T = any>(relPath: string): T | null {
  // A cached `null` (missing or unparseable file) is cached deliberately: within one
  // production process the content tree does not change, so the miss is permanent and
  // re-running existsSync on every call buys nothing.
  if (process.env.NODE_ENV === "production" && yamlFileCache.has(relPath)) {
    return yamlFileCache.get(relPath) as T | null;
  }
  const full = path.join(CONTENT_ROOT, relPath);
  let result: T | null = null;
  if (fs.existsSync(full)) {
    try {
      const raw = fs.readFileSync(full, "utf8");
      result = loadYaml(raw) as T;
    } catch {
      result = null;
    }
  }
  if (process.env.NODE_ENV === "production") yamlFileCache.set(relPath, result);
  return result;
}

function readYamlDir<T = any>(relDir: string): { slug: string; data: T }[] {
  if (process.env.NODE_ENV === "production" && yamlDirCache.has(relDir)) {
    return yamlDirCache.get(relDir) as { slug: string; data: T }[];
  }
  const full = path.join(CONTENT_ROOT, relDir);
  const entries = !fs.existsSync(full)
    ? []
    : fs
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
  if (process.env.NODE_ENV === "production") yamlDirCache.set(relDir, entries);
  return entries;
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
  /** Really present on the two `status: roadmap` pillars, and undeclared here until
   * Task 5.5 needed to render it. Holds `{target, source_id}` and nothing else today —
   * and every real `source_id` in the file is null, i.e. the ship dates are the map's
   * own assertion with no citation behind them. Typed as it really is so a UI can say
   * that out loud rather than presenting an uncited date as sourced. */
  roadmap?: { target?: string; source_id?: string | null };
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
  /** Filename of a real vendor-published mark committed under public/logos/, or absent
   *  when none has been legitimately sourced — see content/competitors/_TEMPLATE.yaml.
   *  Absent is a correct state, not a gap: CompetitorLogo renders initials for it. */
  logo_asset?: string;
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

/** Which side of the Exxat footprint an archetype sits on. Spelled `exxat_` rather than
 * `exact_`: the 2026-09-12 Granola transcript this family comes from mis-hears "Exxat"
 * as "Exact" throughout, and letting that reach a schema key would freeze a recognizer
 * artifact into the content model — the same defect the closest_analog work was reviewed
 * for one commit earlier. Typed as a union plus `string` the way `prism_fit` and
 * `exxat_compliance` above are, for the identical reason: the value is read straight from
 * YAML and is not re-validated here, so a typo must render as itself rather than be
 * silently narrowed to a legal value. */
export type ArchetypeFootprint = "current-customer" | "competitor-customer" | "unengaged" | string;

export interface UniversityArchetype {
  name: string;
  description: string;
  exxat_footprint: ArchetypeFootprint;
  identifying_traits: string[];
  gtm_approach: string;
  /** A Level 0.5 source id or a public URL — see content/archetypes/_TEMPLATE.yaml. */
  source: string;
}

/** content/archetypes/*.yaml — university segments by vendor footprint, for GTM
 * targeting. RETURNS AN EMPTY ARRAY TODAY, and that is the correct state: the directory
 * holds only _TEMPLATE.yaml, because the 2026-09-12 planning session assigned this work
 * and no research has since produced an archetype. readYamlDir already skips _TEMPLATE*
 * files and returns [] for a directory it cannot find, so nothing here needs a special
 * case for empty — /archetypes renders an honest empty state off the same length check
 * every other index page uses. */
export function listArchetypes(): UniversityArchetype[] {
  return readYamlDir<UniversityArchetype>("archetypes").map((e) => e.data);
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

// content/domains/*.yaml's optional `closest_analog:` block — the one discipline this
// domain's accreditation structure most resembles, so a reader knows what can be
// scaffolded rather than rebuilt. OPTIONAL AND USUALLY ABSENT: only Pharmacy carries
// one today, because the 2026-09-12 planning session is the only real source in this
// repo that establishes an analog for a domain. An absent block means UNRESEARCHED and
// must render as nothing at all — not an empty card, not a "no analog found" placeholder.
//
// `domain_slug` is null whenever the analog has no domain hub page of its own (OT/PT
// does not), and a null slug must NOT become a link — see UI-DENSITY-PATTERNS.md's
// lateral cross-link rule: an unresolvable cross-reference degrades to plain text.
export interface DomainClosestAnalog {
  discipline: string;
  domain_slug?: string | null;
  similarity?: string;
  reuse_note?: string;
  /** Registered citations, the `{source_id}[]` shape every other sourced block in these
   * files uses — resolved through the source index and rendered by SourceList, so an
   * internal session cites as a real, openable record rather than as a prose note. */
  sources?: { source_id: string }[];
  /** Free-prose fallback, rendered as raw supporting text with no resolution. Kept in the
   * type because the schema still allows it for an external URL with no registry entry,
   * but `sources` above is the correct field for an internal meeting. */
  source?: string;
}

export interface DomainProfile {
  domain: string;
  full_name: string;
  credential?: string;
  program_length_years?: number;
  market?: { program_count?: string; program_count_trend?: string; total_enrollment?: string; sources?: string[] };
  closest_analog?: DomainClosestAnalog;
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
      // Its one consumer already wraps (components/domain-scenario.tsx:62), so this is
      // belt-and-braces — but wrapping here means `detail`, a name shared by half a dozen
      // unrelated records, needs no blanket ALLOWED_LIB entry that would also silence the
      // next genuine unsanitized `.detail` read added to this file.
      disciplineDetail: stripFileCitations(finding?.detail ?? note?.detail ?? "") ?? "",
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

// The scorecard's domain list comes from the data, not a hardcoded array. Union the score
// keys across EVERY criterion rather than trusting the first one: all criteria in
// scorecard/where-to-play.yaml carry an identical key set today, but a content-only YAML
// edit that scored one new criterion on a different set would otherwise silently drop a
// domain from the table, the totals and the chart. Ordered by the canonical
// PRIORITY_DOMAINS order (Pharmacy first). Call this instead of hardcoding a domain list
// anywhere scorecard-adjacent.
export function scorecardDomains(sc: Scorecard): string[] {
  const domains = [...new Set((sc.criteria ?? []).flatMap((c) => Object.keys(c?.scores ?? {})))];
  return sortDomainsByPriority(domains, (d) => d);
}

export function computeWeightedTotals(
  sc: Scorecard,
  domains: string[] = scorecardDomains(sc)
): Record<string, number> {
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
  // NOTE: content/feature-map/*.yaml carries a `sources:` array on every pillar. It is
  // deliberately NOT declared here — see listFeatureMaps below.
}

export interface FeatureMap {
  domain: string;
  pillars: FeatureMapPillar[];
}

/** The YAML on disk, before projection — `sources` exists here and nowhere downstream. */
interface FeatureMapFile {
  domain: string;
  pillars: (FeatureMapPillar & { sources?: string[] })[];
}

const FEATURE_MAP_SLUGS = ["do", "pharmacy", "dentistry", "medicine"];

/**
 * Reads the four feature-map files and projects each pillar down to the five fields
 * /feature-map actually renders.
 *
 * The projection is the point, not tidiness. This is a server component handing props to
 * two client components (FeatureMapHeatmap, FeatureMapTabs), so whatever this returns is
 * serialized into the RSC flight payload and shipped to every browser that opens the page —
 * rendered or not. Returning the raw YAML object put each pillar's `sources` array on the
 * wire: 43 raw content filenames across 12 distinct paths, in a payload nobody reads,
 * because neither consumer touches the field (the heatmap projects it away, the tabs render
 * only pillar/leader/summary/opportunity).
 *
 * The fix is removing the data, NOT running it through stripFileCitations — humanizing a
 * field that is never displayed would only ship prettier dead weight. Source attribution
 * for these judgments lives in the YAML, which is where a researcher reads it.
 *
 * Spelling the projection out field-by-field rather than deleting a key is what makes it
 * hold: a new `sources`-like field added to the YAML later is dropped by default instead of
 * silently riding along to the client the way this one did for three follow-up tasks.
 */
export function listFeatureMaps(): FeatureMap[] {
  return FEATURE_MAP_SLUGS.map((slug) => readYamlFile<FeatureMapFile>(`feature-map/${slug}.yaml`))
    .filter((f): f is FeatureMapFile => f != null)
    .map((f) => ({
      domain: f.domain,
      // `summary` and `opportunity` are sanitized HERE, on the server, not in
      // FeatureMapTabs where the summary one used to live. Both are true, and only one
      // clears the payload: a "use client" component receives its props as serialized text
      // and runs its sanitizer in the browser, so the RAW string — filenames and all — is
      // what crosses the wire and sits in view-source forever. Sanitizing before the prop
      // is built means the raw string never leaves the server. Same reasoning as
      // dissection-node-detail.ts's builders.
      pillars: (f.pillars ?? []).map((p) => ({
        pillar: p.pillar,
        status: p.status,
        leader: p.leader,
        summary: stripFileCitations(p.summary) ?? p.summary,
        opportunity: stripFileCitations(p.opportunity) ?? p.opportunity,
      })),
    }));
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

/** Highest threat rating a competitor holds in ANY researched domain, plus which domains
 *  carry it. `threat` is a per-domain synthesis judgment in
 *  lenses/competitor-landscape.yaml — there is no such thing as a domain-free threat
 *  level in the content — so this is an explicitly-labelled rollup, used only by the
 *  cross-domain /competitive-landscape grid, which must say "highest rating in any
 *  researched domain" rather than presenting it as one global rating. A domain-filtered
 *  view reads that domain's own rating directly instead of calling this. */
export const THREAT_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

export function getCompetitorThreatRollup(): Record<string, { threat: string; domains: string[] }> {
  const out: Record<string, { threat: string; domains: string[] }> = {};
  for (const d of getCompetitorLandscape()?.domains ?? []) {
    for (const c of d.competitors ?? []) {
      const rank = THREAT_RANK[c.threat?.toLowerCase?.().trim() ?? ""] ?? 0;
      const prev = out[c.slug];
      if (!prev) {
        out[c.slug] = { threat: c.threat, domains: [d.domain] };
        continue;
      }
      prev.domains.push(d.domain);
      if (rank > (THREAT_RANK[prev.threat?.toLowerCase?.().trim() ?? ""] ?? 0)) prev.threat = c.threat;
    }
  }
  return out;
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

// Exported for lib/competitor-quadrant.ts, which counts the same canonical pillars off
// the same teardown entries — a second copy of this regex would be the one place the
// grid and the quadrant could disagree about whether "Exam Management (Prism roadmap
// Q2 2027)" is the Exam Management pillar.
export function normalizePillarName(pillar: string): string {
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

// ---------- feature-comparison MATRIX lens (content/lenses/feature-comparison-matrix.yaml) ----------
//
// NOT the same thing as getFeatureComparisonForDomain above, despite the name.
// That one derives a pillar grid from each competitor file's own
// feature_teardown[] (no per-cell authoring, no Exxat column, depth_vs_prism
// vocabulary). This one reads the hand-authored, per-cell, source-cited lens —
// one row per capability_id, an explicit Exxat/Prism verdict per row, and the
// fully/partially/not-meeting vocabulary the accreditation crosswalk already
// uses. The lens is sparse ON PURPOSE (14 of 30 possible Pharmacy cells today,
// zero cells for every other domain), so callers must render absence honestly
// rather than filling it in.

/** `fully-meeting | partially-meeting | not-meeting` — same vocabulary as StandardsRatingBadge. */
export type FeatureMatrixRating = string;

interface RawFeatureMatrixCell {
  domain: string;
  pillar: string;
  capability: string;
  capability_id: string;
  competitor_slug: string;
  rating: FeatureMatrixRating;
  rationale?: string;
  competitor_feature_ref?: string;
  evidence_strength?: string;
  evidence_note?: string;
  element_ids?: string[];
  persona_relevance?: string[];
  sources?: { source_id: string }[];
}

interface RawFeatureMatrixExxatCell {
  domain: string;
  capability_id: string;
  exxat_coverage?: string;
  prism_status?: string;
  prism_feature_ref?: string;
  rating: FeatureMatrixRating;
  rationale?: string;
  evidence_strength?: string;
  evidence_note?: string;
  sources?: { source_id: string }[];
}

interface RawFeatureComparisonMatrixDoc {
  last_updated?: string;
  cells?: RawFeatureMatrixCell[];
  exxat_cells?: RawFeatureMatrixExxatCell[];
}

export interface FeatureMatrixCompetitorCell {
  competitorSlug: string;
  rating: FeatureMatrixRating;
  rationale?: string;
  /** The competitor's own name for the capability, per their file's teardown. */
  featureRef?: string;
  evidenceStrength?: string;
  evidenceNote?: string;
  sources: SourceRegistryEntry[];
}

export interface FeatureMatrixExxatCell {
  rating: FeatureMatrixRating;
  rationale?: string;
  /** `shipped | roadmap` — what Prism actually does today, not what it is rated. */
  prismStatus?: string;
  featureRef?: string;
  evidenceStrength?: string;
  evidenceNote?: string;
  sources: SourceRegistryEntry[];
}

export interface FeatureMatrixRow {
  capabilityId: string;
  /** The full authored capability sentence, e.g. "Curriculum mapping: course-to-standard ...". */
  capability: string;
  /** One of CANONICAL_PILLAR_ORDER. */
  pillar: string;
  cells: FeatureMatrixCompetitorCell[];
  exxatCell?: FeatureMatrixExxatCell;
}

export interface FeatureComparisonMatrixForDomain {
  domain: string;
  /** Ordered by CANONICAL_PILLAR_ORDER; empty for a domain with no authored cells. */
  rows: FeatureMatrixRow[];
  /** Competitor slugs that actually have at least one cell here. */
  competitorSlugs: string[];
  /** Authored competitor cells (excludes the Exxat column). */
  cellCount: number;
  lastUpdated?: string;
}

// `domain` is the APP-LEVEL label the lens file itself uses ("Pharmacy",
// "Medicine"), i.e. the same key set as DOMAIN_TO_ACCREDITATION_SLUG — not the
// competitor files' "MD"-style code, so DOMAIN_TO_COMPETITOR_CODE does not apply.
export function getFeatureComparisonMatrixForDomain(domain: string): FeatureComparisonMatrixForDomain {
  // Read per call, matching getCapabilityMap/getStandardsCompetitorRatings and every
  // other single-file lens getter in this file. readYamlFile memoizes the parse in
  // production (and only there), so this stays a fresh read in dev — the shaping below
  // is redone per call either way, and nothing here mutates `doc`.
  const doc = readYamlFile<RawFeatureComparisonMatrixDoc>("lenses/feature-comparison-matrix.yaml");
  const cells = (doc?.cells ?? []).filter((c) => c.domain === domain);
  const exxatCells = (doc?.exxat_cells ?? []).filter((c) => c.domain === domain);

  const byCapability = new Map<string, RawFeatureMatrixCell[]>();
  for (const cell of cells) {
    const list = byCapability.get(cell.capability_id);
    if (list) list.push(cell);
    else byCapability.set(cell.capability_id, [cell]);
  }
  // A capability can hold an Exxat verdict with no competitor cells yet — that is
  // a real row (Prism has an answer, nobody has rated the incumbents), so the row
  // set is the union of both lists, not just the competitor side.
  for (const cell of exxatCells) {
    if (!byCapability.has(cell.capability_id)) byCapability.set(cell.capability_id, []);
  }

  const exxatByCapability = new Map(exxatCells.map((c) => [c.capability_id, c]));

  const rows: FeatureMatrixRow[] = [...byCapability.entries()].map(([capabilityId, raw]) => {
    const exxat = exxatByCapability.get(capabilityId);
    return {
      capabilityId,
      // Every cell on a row repeats the same capability/pillar strings; take the
      // first that has one rather than asserting they agree.
      capability: raw.find((c) => c.capability)?.capability ?? capabilityId,
      pillar: normalizePillarName(raw.find((c) => c.pillar)?.pillar ?? ""),
      // rationale AND evidenceNote are both authored prose that cites source files.
      // DissectionMatrix wrapped only the first of the pair (dissection-matrix.tsx:104,
      // :246, :329) and rendered evidenceNote raw eleven lines below it, at
      // dissection-matrix.tsx:115 — the same "sanitized sibling beside an unsanitized one"
      // shape as the accreditation_pressure leak. Wrapped here at the builder so the two
      // travel together and no future render site has to remember.
      cells: raw.map((c) => ({
        competitorSlug: c.competitor_slug,
        rating: c.rating,
        rationale: stripFileCitations(c.rationale?.trim()),
        featureRef: c.competitor_feature_ref,
        evidenceStrength: c.evidence_strength,
        evidenceNote: stripFileCitations(c.evidence_note?.trim()),
        sources: resolveSourceIds(c.sources),
      })),
      exxatCell: exxat
        ? {
            rating: exxat.rating,
            rationale: stripFileCitations(exxat.rationale?.trim()),
            prismStatus: exxat.prism_status,
            featureRef: exxat.prism_feature_ref,
            evidenceStrength: exxat.evidence_strength,
            evidenceNote: stripFileCitations(exxat.evidence_note?.trim()),
            sources: resolveSourceIds(exxat.sources),
          }
        : undefined,
    };
  });

  // Canonical pillar order first; anything the lens names that isn't one of the
  // six canonical pillars still renders, after them, rather than disappearing.
  rows.sort((a, b) => {
    const ai = CANONICAL_PILLAR_ORDER.indexOf(a.pillar);
    const bi = CANONICAL_PILLAR_ORDER.indexOf(b.pillar);
    if (ai !== bi) return (ai < 0 ? CANONICAL_PILLAR_ORDER.length : ai) - (bi < 0 ? CANONICAL_PILLAR_ORDER.length : bi);
    return a.capabilityId.localeCompare(b.capabilityId);
  });

  return {
    domain,
    rows,
    competitorSlugs: [...new Set(cells.map((c) => c.competitor_slug))],
    cellCount: cells.length,
    lastUpdated: doc?.last_updated,
  };
}

// ---------- dissection manifests (content/dissection/*.yaml) ----------

/** The six fixed questions every manifest answers, in the order the files list them. */
export type DissectionQuestionKey =
  | "features-to-build"
  | "competitor-differentiation"
  | "market-size"
  | "feature-comparison"
  | "standards-to-product"
  | "persona-and-document-lens";

export type DissectionCoverage = "none" | "stub" | "partial" | "researched";

export interface DissectionQuestion {
  key: DissectionQuestionKey;
  /** File paths (or a "computed — ..." prose marker) that hold the actual answer. */
  answered_in: string[];
  coverage: DissectionCoverage;
  confidence: "low" | "medium" | "high";
  gap_note: string;
}

export interface DissectionIncumbent {
  competitor_slug: string;
  role: "primary" | "switch-target" | "adjacent" | "secondary" | "not-a-target";
  /** Present only on `not-a-target` entries — why this vendor is out of scope. */
  exclusion_reason?: string;
}

export interface DissectionManifest {
  /** The RAW domain value from content/domains/<slug>.yaml — "MD", not "Medicine". */
  domain: string;
  slug: string;
  is_gtm_target: boolean;
  /** The interview id this domain's understanding rests on; null where no session exists. */
  template_of_record: string | null;
  last_reviewed: string;
  incumbent_set: DissectionIncumbent[];
  questions: DissectionQuestion[];
}

/**
 * One domain's dissection manifest, keyed by ROUTE slug (the `/domains/<slug>`
 * segment), which is also the manifest's filename and its own `slug:` field.
 * Returns null for the 9 of 13 routed domains that have no manifest yet — that
 * absence is a real state the UI must render, not an error.
 */
export function getDissectionManifest(routeSlug: string): DissectionManifest | null {
  return readYamlFile<DissectionManifest>(`dissection/${routeSlug}.yaml`);
}

/** Every domain that HAS a manifest — so a page can name which domains have been
 * dissected without hardcoding a list that goes stale the day a fifth manifest lands.
 * `domain` is the manifest's own RAW label ("MD", not "Medicine"); callers rendering
 * it to a reader should resolve the route slug against the app's canonical domain
 * list first and fall back to this only when it doesn't resolve. */
export function listDissectionDomains(): { slug: string; domain: string }[] {
  return readYamlDir<DissectionManifest>("dissection")
    .filter((e) => e.data.domain)
    .map((e) => ({ slug: e.data.slug ?? e.slug, domain: e.data.domain }));
}

/** A question is "answered" for coverage-counting only at partial or better — the
 * same rule scripts/check_content_density.py applies, which is where the "DO 1/6"
 * figure this repo quotes comes from. `stub` deliberately does not count. */
export function dissectionAnsweredCount(manifest: DissectionManifest): number {
  return manifest.questions.filter((q) => q.coverage === "partial" || q.coverage === "researched").length;
}

/** Incumbents actually in scope for a comparison — `not-a-target` entries are listed
 * in the manifest so the exclusion is visible, but they are not competitors this
 * domain is won against. */
export function dissectionInScopeIncumbents(manifest: DissectionManifest): DissectionIncumbent[] {
  return manifest.incumbent_set.filter((i) => i.role !== "not-a-target");
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
  /** "first-party" (Exxat's own material) | "third-party". Added to registry.yaml
   * 2026-09-11; the four corpus-index homes below carry it too (interviews don't). */
  origin?: string;
  /** "public" | "internal" | "confidential". An entry without a real public `url:`
   * is not "public" — that is how the four internal homes below read. */
  access?: string;
  /** Vault- or repo-relative location of an internal source that has no public
   * `url:` (help-center article, playbook, interview record). Not rendered today. */
  path?: string;
  /** How faithfully the source document records what was said. The session front-matter
   * schema added 2026-09-11 is the only thing that *defines* it — no other home has the
   * field — but the entry that carries it is not always the interviews one: where a
   * session's id collides with a frozen `registry.yaml` id, registry still wins the entry
   * as it always has, and the interviews pass then backfills this one genuinely-absent
   * field onto the winner (see the backfill in getSourceIndex, step 5). So a registry-home
   * entry can carry it; a non-interview source never does. `SESSION_EVIDENCE_STATUS` in
   * `scripts/check_content_density.py` is the gate on which values can ship —
   * `"verbatim-cleaned"` and `"summary-only"` today. Documented-then-widened, the same
   * way `type` above is, because the value is read straight from YAML and is not
   * re-validated here. SourceList renders a caveat for the degraded tiers only; see
   * DEGRADED_EVIDENCE_NOTE in components/source-list.tsx. */
  evidence_status?: "verbatim-cleaned" | "summary-only" | string;
  /** Which of the five Level 0.5 source homes this entry was resolved from. */
  home?: SourceHome;
}

export type SourceHome =
  | "registry"
  | "help-center"
  | "playbooks"
  | "support-tickets"
  | "interviews";

export interface SourcesRegistry {
  sources: SourceRegistryEntry[];
}

// content/sources/registry.yaml — Level 0.5 normalized citation registry, added
// 2026-09-09 alongside the standards x competitor crosswalk research pass, so a
// webinar can carry publisher/date/type metadata a bare `source:` string can't.
export function getSourcesRegistry(): SourcesRegistry | null {
  return readYamlFile<SourcesRegistry>("sources/registry.yaml");
}

// ---------- the five-home source-id union ----------
//
// A citable `source_id` used to live in exactly one place: sources/registry.yaml.
// The domain-dissection work added four more homes, each a corpus index (one file
// indexing many sources) rather than one registry entry per source. This mirrors
// `_load_source_ids()` in scripts/check_content_density.py so the app resolves
// exactly the set of ids the content checker considers valid — before this, a
// citation the checker passed (help-center-*, playbook-*, support-ticket-*,
// interview-*) was silently `.filter(Boolean)`-ed away and rendered as nothing.
//
//   content/sources/registry.yaml           sources[].id
//   content/sources/help-center.yaml        articles[].id
//   content/sources/playbooks.yaml          playbooks[].id
//   content/sources/support-tickets/*.yaml  snapshot.id AND tickets[].source_id
//   content/interviews/*.md                 `id:` in the YAML front-matter
//
// Deliberately NOT a home: content/sources/vendor-comparison-chart.yaml, which is
// quarantined `citable_as_fact: false` and whose ids must never appear as a
// source_id. The checker excludes it too.
//
// Precedence is registry-first, and a later home never overwrites an id an earlier
// one already defined. That is load-bearing, not incidental: the 2026-09-04 Vishaka
// session deliberately reuses its frozen registry id
// (`interview-vishaka-pharmacy-understanding-2026-09-04`) in its interview
// front-matter so one session has one canonical id. Registry-first means the richer,
// human-written registry entry keeps rendering exactly as it does today.

/** YAML nulls are everywhere in these files (a support-ticket snapshot taken without
 * live API credentials is almost all nulls). Normalize to undefined so optional
 * rendering (`s.title && s.url`, `[publisher, date].filter(Boolean)`) behaves. */
function optStr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

interface HelpCenterDoc {
  corpus?: { origin?: string; access?: string; mirror_root?: string };
  articles?: { id?: string; title?: string; path?: string; what_it_supports?: string; accessed?: string }[];
}

interface PlaybooksDoc {
  playbooks?: {
    id?: string;
    title?: string;
    discipline?: string;
    path?: string;
    origin?: string;
    access?: string;
    accessed?: string;
    caveat?: string;
  }[];
}

function readInterviewFrontMatter(): { file: string; data: Record<string, unknown> }[] {
  const dir = path.join(CONTENT_ROOT, "interviews");
  if (!fs.existsSync(dir)) {
    warnSourceHome("content/interviews/ is missing — interview source ids cannot resolve");
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_TEMPLATE"))
    .sort()
    .map((f) => {
      try {
        // gray-matter, already used by readMarkdownFile, is a real YAML front-matter
        // parse — matching the checker, which `yaml.safe_load`s the block rather than
        // regexing for `id:` (an interview's `id:` can sit below comment lines).
        return { file: f, data: (matter(fs.readFileSync(path.join(dir, f), "utf8")).data ?? {}) as Record<string, unknown> };
      } catch {
        warnSourceHome(`content/interviews/${f} front-matter is not valid YAML, so its source id cannot resolve`);
        return { file: f, data: {} as Record<string, unknown> };
      }
    });
}

const warnedSourceHomeProblems = new Set<string>();

/** The Python checker names a source-home load problem as a loud FAIL
 * (`check_source_homes_integrity()`), precisely so a home that quietly loads as empty
 * doesn't turn every citation into it into an apparent dangling reference. This
 * resolution path cannot do that — it has to keep rendering the pages it can — so it
 * degrades silently by design, and `scripts/check_content_density.py` remains the
 * source of truth for these five homes' structural validity. Warning here is the
 * consolation prize: it puts a renamed key or a YAML typo in the dev/build log instead
 * of leaving it to be inferred from a citation that mysteriously renders as nothing.
 * Deduped because with the cache off in development the index rebuilds on every call. */
function warnSourceHome(message: string): void {
  if (warnedSourceHomeProblems.has(message)) return;
  warnedSourceHomeProblems.add(message);
  console.warn(`[source-index] ${message} — see scripts/check_content_density.py for the enforced check`);
}

/** Load one corpus-index home, distinguishing "missing" from "unparseable" — readYamlFile
 * collapses both to null. Two of the three failure modes Python's `_load_listed_ids`
 * reports by name; `sourceHomeList` below covers the third (a renamed list key). */
function loadSourceHomeDoc<T>(relPath: string): T | null {
  const doc = readYamlFile<T>(relPath);
  if (doc == null) {
    warnSourceHome(
      fs.existsSync(path.join(CONTENT_ROOT, relPath))
        ? `content/${relPath} could not be read as YAML, so the source ids it defines cannot resolve`
        : `content/${relPath} is missing, so the source ids it defines cannot resolve`
    );
  }
  return doc;
}

/** The home's top-level list, warning when the key has been renamed away — the failure
 * that would otherwise drop a whole home's ids with no signal at all. */
function sourceHomeList<T>(entries: T[] | undefined, relPath: string, listKey: string): T[] {
  if (Array.isArray(entries)) return entries;
  warnSourceHome(`content/${relPath} has no top-level \`${listKey}:\` list, so none of its source ids resolve`);
  return [];
}

let sourceIndexCache: Map<string, SourceRegistryEntry> | null = null;

/** Every id a citation may legitimately resolve to, across all five Level 0.5 source
 * homes, keyed by id.
 *
 * Cached in production only. A resolve call would otherwise re-assemble the index from
 * five homes, and a static build resolves thousands of ids — but caching for the life of
 * the process would make `next dev` serve stale citations until the server is restarted,
 * and this repo's working convention is to keep that dev server alive. `readYamlFile` and
 * `readYamlDir` are gated on `NODE_ENV` the same way and for the same reason, so
 * uncached-in-dev is the file's uniform behavior. This cache still earns its keep on top
 * of theirs: it memoizes the assembled Map (five homes merged, collisions resolved,
 * evidence_status backfilled), not just the raw YAML underneath it. */
export function getSourceIndex(): Map<string, SourceRegistryEntry> {
  if (sourceIndexCache && process.env.NODE_ENV === "production") return sourceIndexCache;
  const index = new Map<string, SourceRegistryEntry>();
  // `where` names the entry so an id-less one is reported the way the checker reports
  // it, rather than vanishing. First writer wins; see the precedence note above.
  const add = (entry: SourceRegistryEntry | null, where: string) => {
    if (!entry) return;
    if (!entry.id) {
      warnSourceHome(`${where} has no id, so it defines no citable source id`);
      return;
    }
    if (index.has(entry.id)) return;
    index.set(entry.id, entry);
  };

  // 1. registry.yaml — unchanged behavior, and first so it wins every id collision.
  for (const s of getSourcesRegistry()?.sources ?? []) {
    if (s?.id) index.set(s.id, { ...s, home: "registry" });
  }

  // 2. help-center.yaml — articles are internal vault files: no url, so SourceList
  //    falls back to rendering the title as prose, which is how the registry's own
  //    url-less internal entries already render.
  const helpCenter = loadSourceHomeDoc<HelpCenterDoc>("sources/help-center.yaml");
  const articles = helpCenter ? sourceHomeList(helpCenter.articles, "sources/help-center.yaml", "articles") : [];
  articles.forEach((a, n) => {
    add({
      id: optStr(a?.id) ?? "",
      title: optStr(a?.title),
      type: "help-center-article",
      what_it_supports: optStr(a?.what_it_supports),
      accessed: optStr(a?.accessed),
      // origin/access live once on the `corpus:` block, not per article.
      origin: optStr(helpCenter?.corpus?.origin),
      access: optStr(helpCenter?.corpus?.access),
      path: optStr(a?.path),
      home: "help-center",
    }, `content/sources/help-center.yaml articles[${n}]`);
  });

  // 3. playbooks.yaml — same shape, per-entry origin/access. `zendesk_capture` is
  //    deliberately ignored: it looks like an id and is not one.
  const playbooks = loadSourceHomeDoc<PlaybooksDoc>("sources/playbooks.yaml");
  const playbookEntries = playbooks
    ? sourceHomeList(playbooks.playbooks, "sources/playbooks.yaml", "playbooks")
    : [];
  playbookEntries.forEach((p, n) => {
    add({
      id: optStr(p?.id) ?? "",
      title: optStr(p?.title),
      type: "playbook",
      // `discipline:` is deliberately not mapped to `publisher:` — a playbook's
      // discipline is not who published it, and SourceRegistryEntry has no field
      // for it. See the report's field-mapping gaps.
      what_it_supports: optStr(p?.caveat),
      accessed: optStr(p?.accessed),
      origin: optStr(p?.origin),
      access: optStr(p?.access),
      path: optStr(p?.path),
      home: "playbooks",
    }, `content/sources/playbooks.yaml playbooks[${n}]`);
  });

  // 4. support-tickets/*.yaml — the snapshot is citable AND each ticket in it is.
  //    readYamlDir already skips _TEMPLATE.yaml, same exclusion as the checker.
  //    Deliberately NOT listSupportTicketSnapshots(), which drops any snapshot
  //    missing domain/taken — a snapshot still defines citable ids without them,
  //    and the checker resolves them, so dropping one here would re-open this gap.
  //    (RawSupportTicketSnapshot is declared further down; type decls hoist.)
  if (!fs.existsSync(path.join(CONTENT_ROOT, "sources/support-tickets"))) {
    warnSourceHome("content/sources/support-tickets/ is missing — support-ticket source ids cannot resolve");
  }
  for (const { slug, data } of readYamlDir<Partial<RawSupportTicketSnapshot>>("sources/support-tickets")) {
    const snap = data?.snapshot;
    const origin = optStr(snap?.origin);
    const access = optStr(snap?.access);
    const taken = optStr(snap?.taken);
    if (!optStr(snap?.id)) {
      warnSourceHome(`content/sources/support-tickets/${slug}.yaml has no \`snapshot.id:\`, so the snapshot defines no citable source id`);
    }
    if (snap?.id) {
      const domain = optStr(snap.domain);
      const system = optStr(snap.system);
      // A snapshot carries no `title:` field. Compose one from fields it does
      // carry rather than render a titleless, urlless row as blank.
      const title = [domain, "support tickets", system ? `— ${system} snapshot` : null, taken ? `(${taken})` : null]
        .filter(Boolean)
        .join(" ");
      add({
        id: snap.id,
        title: title || snap.id,
        type: optStr(snap.type) ?? "support-ticket",
        date: taken,
        what_it_supports: optStr(snap.coverage_caveat),
        accessed: taken,
        origin,
        access,
        home: "support-tickets",
      }, `content/sources/support-tickets/${slug}.yaml snapshot`);
    }
    const tickets = sourceHomeList(data?.tickets, `sources/support-tickets/${slug}.yaml`, "tickets");
    tickets.forEach((t, n) => {
      const id = optStr(t?.source_id);
      add({
        id: id ?? "",
        // `subject` is null on any snapshot transcribed without live API access.
        title: optStr(t?.subject) ?? (t?.ticket_id ? `Ticket #${t.ticket_id}` : id),
        url: optStr(t?.url),
        type: "support-ticket",
        // The customer organization is the nearest thing a ticket has to an
        // attribution line; it is null on any snapshot transcribed without live
        // API access, which is every snapshot in the repo today.
        publisher: optStr(t?.organization),
        date: taken,
        what_it_supports: optStr(t?.finding),
        accessed: taken,
        origin,
        access,
        home: "support-tickets",
      }, `content/sources/support-tickets/${slug}.yaml tickets[${n}]`);
    });
  }

  // 5. interviews/*.md — id in the YAML front-matter. Note: interview front-matter
  //    has an `access:` field but no `origin:`, so `origin` stays undefined here.
  //    `evidence_status` is the one field here that genuinely varies between files
  //    (`summary-only` on one of the four today), so it is threaded through to the
  //    citation UI. `claims_are_speaker_opinion` deliberately is not: it is `true` on
  //    every interview without exception — a standing property of the source type that
  //    the "Interview" badge already stands for, not a per-file signal.
  for (const { file, data } of readInterviewFrontMatter()) {
    const interviewId = optStr(data?.id) ?? "";
    const evidenceStatus = optStr(data?.evidence_status);
    add({
      id: interviewId,
      title: optStr(data?.title),
      type: "interview",
      date: optStr(data?.date),
      access: optStr(data?.access),
      origin: optStr(data?.origin),
      evidence_status: evidenceStatus,
      path: `content/interviews/${file}`,
      home: "interviews",
    }, `content/interviews/${file} front-matter`);

    // One session deliberately reuses an id already frozen in registry.yaml so that the
    // citations pointing at it keep resolving (ARCHITECTURE.md, Level 0.5: "there is one
    // canonical id for the session"). Registry wins that collision by design and should
    // keep winning — its curated title/publisher/what_it_supports are the better record.
    // But registry.yaml has no `evidence_status:` field at all, so without this backfill
    // the winning entry carries none, and the ONLY interview id actually cited anywhere in
    // content/ today is exactly that one — the signal would render nowhere. Filling a field
    // the winner does not define is not overriding it, so this fills only when absent.
    const resolved = interviewId ? index.get(interviewId) : undefined;
    if (resolved && evidenceStatus && !resolved.evidence_status) {
      index.set(interviewId, { ...resolved, evidence_status: evidenceStatus });
    }
  }

  sourceIndexCache = index;
  return index;
}

/** Exported because listDomains() returns raw YAML with no resolution pass of its own, so
 * a domain page resolving `closest_analog.sources` needs the same resolver every derived
 * loader in this file already uses — one code path, one `.filter(Boolean)` drop rule. */
export function resolveSourceIds(ids: { source_id: string }[] | undefined): SourceRegistryEntry[] {
  if (!ids?.length) return [];
  const bySid = getSourceIndex();
  return ids.map((s) => bySid.get(s.source_id)).filter((s): s is SourceRegistryEntry => Boolean(s));
}

function resolveSourceIdStrings(ids: string[] | undefined): SourceRegistryEntry[] {
  if (!ids?.length) return [];
  const bySid = getSourceIndex();
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
      // Rendered raw at components/dissect/standard-detail-panel.tsx:190, inside the one
      // section on that panel that is open by DEFAULT (defaultValue={["use-cases"]} at
      // standard-detail-panel.tsx:114) — so a citation here needed no click to be seen.
      detail: stripFileCitations(u.detail),
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
        // Both cited prose, and both rendered raw on the standards panel:
        // components/dissect/standard-detail-panel.tsx:274 (rationale) and :294
        // (evidenceNote, on the "directional" branch). The OTHER consumer of these same
        // cells, components/exxat-gap-answer.tsx:171, did wrap rationale — so the field
        // rendered clean on the gap surface and raw on the panel beside it, which is why
        // this survived a surface-by-surface review. Wrapped at the builder, once.
        rationale: stripFileCitations(rated?.rationale),
        source: rated?.source,
        competitorFeatureRef: rated?.competitor_feature_ref,
        sources: resolveSourceIds(rated?.sources),
        evidenceStrength: rated?.evidence_strength,
        evidenceNote: stripFileCitations(rated?.evidence_note),
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

// ---------- support-ticket snapshots (content/sources/support-tickets/) ----------

// Shape of one committed snapshot. Mirrors what scripts/snapshot_zendesk.py writes,
// which in turn mirrors what apps/ecosystem/lib/zendesk/client.ts's FeatureGapTicket
// actually returns. Every per-ticket field except id/url/source_id is nullable on
// purpose: a snapshot taken without live credentials records honest nulls rather than
// invented values, and the page must render that state rather than hide it.
export interface SupportTicketEntry {
  source_id: string;
  ticket_id: number;
  url: string;
  subject?: string | null;
  status?: string | null;
  organization?: string | null;
  organization_id?: number | null;
  category?: string | null;
  finding?: string | null;
  redacted?: boolean;
}

export interface SupportTicketSnapshot {
  /** filename minus .yaml, e.g. "pharmacy-2026-09-11" */
  slug: string;
  snapshot: {
    id: string;
    type: string;
    system?: string;
    origin?: string;
    access?: string;
    taken: string;
    domain: string;
    selection_method?: string;
    selection_query?: string | null;
    ticket_ids?: number[];
    organizations_observed?: string[];
    coverage_caveat?: string;
  };
  tickets: SupportTicketEntry[];
}

type RawSupportTicketSnapshot = Omit<SupportTicketSnapshot, "slug">;

function listSupportTicketSnapshots(): SupportTicketSnapshot[] {
  return readYamlDir<RawSupportTicketSnapshot>("sources/support-tickets")
    .filter((entry) => entry.data?.snapshot?.domain && entry.data?.snapshot?.taken)
    .map((entry) => ({
      slug: entry.slug,
      snapshot: entry.data.snapshot,
      tickets: entry.data.tickets ?? [],
    }));
}

/** The domain slugs that have at least one snapshot — the filename prefix before the date. */
export function listSupportSignalDomains(): string[] {
  return [...new Set(listSupportTicketSnapshots().map((s) => s.slug.replace(/-\d{4}-\d{2}-\d{2}$/, "")))];
}

/**
 * Newest snapshot for a domain. Filenames are `<domain-slug>-<YYYY-MM-DD>.yaml`, and an
 * ISO date sorts lexicographically, so the last slug after a plain sort is the newest.
 */
export function getLatestSupportTicketSnapshot(domainSlug: string): SupportTicketSnapshot | null {
  const matches = listSupportTicketSnapshots()
    .filter((s) => s.slug.replace(/-\d{4}-\d{2}-\d{2}$/, "") === domainSlug)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  return matches.length ? matches[matches.length - 1] : null;
}

// ---------- the quarantined sales artifact (content/sources/vendor-comparison-chart.yaml) ----------
//
// Exxat's own internal vendor comparison chart, transcribed verbatim. It is the one
// file under content/sources/ carrying `citable_as_fact: false`, and the five-home
// comment above says why it is deliberately NOT one of the source homes: no
// `source_id` anywhere may resolve into it.
//
// It is loaded here for exactly one purpose — rendering it, quarantined and labelled,
// so a reader can see what sales has been claiming. Nothing here resolves its ids,
// joins it to a lens, or lets a claim from it reach a surface that reads as evidence.
// `maps_to_capability_id` is carried through as authored and is a research-backlog
// marker, not a citation: a crosswalked row is worth exactly what it was worth before.

export interface VendorComparisonWorkbookSheet {
  sheet: string;
  position: number;
  vendor_columns: number;
  masked: boolean;
  /** Which field of the YAML file holds that sheet's transcription. */
  transcribed_here: string;
}

/** One row read off BOTH sheets — the shape of `known_contradictions[]` and of
 * `unmasked_only_vendor_rows[]`, which are like-for-like by design. */
export interface VendorComparisonSheetDiff {
  row_id: string;
  row: string;
  /** Who the masked sheet marks, as the file's own prose list ("EXXAT, Vendor 3"). */
  sheet2: string;
  /** Who the named sheet marks in the 4 columns those masks resolve to. */
  sheet1: string;
  /** Who else the named sheet marks in its 3 unmasked-only columns. */
  sheet1_extra_vendors: string | null;
}

export interface VendorComparisonArtifact {
  id: string;
  type: string;
  origin: string;
  access: string;
  title: string;
  path: string;
  path_status: string;
  transcribed_from: string;
  transcribed: string;
  /** Always false in this file. Typed as a boolean, read as the quarantine flag it is. */
  citable_as_fact: boolean;
  provenance_note: string;
  scope_note: string;
  workbook: VendorComparisonWorkbookSheet[];
  known_contradictions: VendorComparisonSheetDiff[];
  unmasked_only_vendor_rows: VendorComparisonSheetDiff[];
}

/** `sheet2_label: null` marks a vendor the named sheet has and the masked sheet does not. */
export interface VendorComparisonUnmaskingEntry {
  sheet2_label: string | null;
  sheet1_name: string;
}

export interface VendorComparisonRow {
  row: string;
  row_id: string;
  /** Keyed on the MASKED labels ("EXXAT", "Vendor 1"…). Every label is present on
   * every row; the value is the literal "X" (the cell is marked) or null (the cell
   * is empty — the source's silence, never a researched finding of absence). */
  sheet2: Record<string, string | null>;
  /** A feature-comparison-matrix capability id, or null. A mapping is not a citation. */
  maps_to_capability_id: string | null;
}

export interface VendorComparisonSection {
  name: string;
  rows: VendorComparisonRow[];
}

export interface VendorComparisonChart {
  artifact: VendorComparisonArtifact;
  unmasking_key: VendorComparisonUnmaskingEntry[];
  sections: VendorComparisonSection[];
}

/**
 * The whole artifact, unscoped. No row carries a domain, and the file's own
 * `scope_note` says it compares against a different competitor set entirely — so
 * there is nothing to scope it BY, and every domain that renders it renders the same
 * 81 rows. Returns null when the file is missing; a caller must render that absence
 * rather than an empty chart.
 */
export function getVendorComparisonChart(): VendorComparisonChart | null {
  return readYamlFile<VendorComparisonChart>("sources/vendor-comparison-chart.yaml");
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
