import {
  getJourney,
  getJourneyStagesForDiscipline,
  listJourneys,
  type DisciplineJourneyStage,
  type Journey,
} from "@/lib/content";
import { ALL_DISCIPLINE_META, matchDisciplineMeta } from "@/lib/discipline-meta";

// Everything /journeys/[slug]/compare needs to put two disciplines' journeys beside
// each other — and NOTHING more than that. There is no new data function here and no
// new content field: the comparison is literally
// getJourneyStagesForDiscipline(journeySlug, subjectA) and
// getJourneyStagesForDiscipline(journeySlug, subjectB), aligned on the journey's own
// stage list. This module exists to hold the three things that are genuinely new —
// resolving a URL slug to the `subject` string content is really written with, the
// derived defaults, and the aligned rows — beside each other, the same way
// lib/dissection-links.ts holds the `?node=` URL contract beside its page.
//
// Why this comparison is worth a page at all: the 2026-09-12 Pharmacy planning
// session did it by hand ("how does OT/PT's journey differ from Pharmacy's"), which
// is a question this repo's content can already answer and its UI could not.

export interface ComparableDiscipline {
  /** lib/discipline-meta.ts slug — the value that travels in `?a=` / `?b=`. */
  slug: string;
  label: string;
  code: string;
  /**
   * The EXACT key_findings/discipline_notes `subject` string this discipline is
   * written as in content ("PT/PTA", not "pt") — getJourneyStagesForDiscipline
   * matches it with `===`, so a near-miss silently returns zero stages.
   */
  subject: string;
  /** Which of THIS journey's stages (0-based indices) have something written for it. */
  coveredStages: ReadonlySet<number>;
  /** `coveredStages.size`, carried separately because it is what the picker shows. */
  stageCount: number;
}

export interface JourneyComparisonRow {
  /** 0-based index into the journey's own stage list. */
  index: number;
  /** "3. Placement matching" — numbered here when the content isn't already. */
  label: string;
  a?: DisciplineJourneyStage;
  b?: DisciplineJourneyStage;
}

export interface JourneyComparison {
  rows: JourneyComparisonRow[];
  stageCount: number;
  bothCount: number;
  onlyACount: number;
  onlyBCount: number;
  neitherCount: number;
}

/** Same numbering the journey detail page applies, so a stage is called the same
 * thing on both pages rather than being "3. Placement matching" on one and
 * "Placement matching" on the other. */
function stageLabel(stage: string, index: number): string {
  return /^\d+[.)]/.test(stage.trim()) ? stage : `${index + 1}. ${stage}`;
}

/**
 * discipline slug -> { the exact `subject` spellings these journeys use -> how many
 * key_findings/discipline_notes entries use each }.
 *
 * DERIVED from the journeys' own content rather than hardcoded, because the two
 * vocabularies genuinely differ: the URL wants "pt", content writes "PT/PTA", and
 * inventing either half here is how a column silently renders empty for a discipline
 * that has eight stages written about it.
 */
function tallySubjects(journeys: Journey[]): Map<string, Map<string, number>> {
  const tally = new Map<string, Map<string, number>>();
  for (const journey of journeys) {
    for (const stage of journey.stages ?? []) {
      const subjects = [
        ...(stage.key_findings ?? []).map((f) => f.subject),
        ...(stage.discipline_notes ?? []).map((n) => n.subject),
      ];
      for (const subject of subjects) {
        if (!subject) continue;
        const meta = matchDisciplineMeta(subject);
        if (!meta) continue;
        const counts = tally.get(meta.slug) ?? new Map<string, number>();
        counts.set(subject, (counts.get(subject) ?? 0) + 1);
        tally.set(meta.slug, counts);
      }
    }
  }
  return tally;
}

/** One spelling per discipline: the one those journeys use most, with alphabetical
 * order breaking a tie so the choice never depends on readdir order. */
function dominantSubjects(journeys: Journey[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const [slug, counts] of tallySubjects(journeys)) {
    const best = [...counts.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0];
    if (best) out.set(slug, best[0]);
  }
  return out;
}

/**
 * discipline slug -> the `subject` string to hand getJourneyStagesForDiscipline FOR
 * THIS JOURNEY.
 *
 * Resolved from the TARGET journey's own stages first, and only then from the rest of
 * the corpus. That order is the whole point: a global first-match map is correct only
 * while every journey happens to spell a discipline the same way, and the day one file
 * writes "OT/OTA" where another writes "Occupational Therapy", a global map hands the
 * other journey a subject string its own content never uses — and
 * getJourneyStagesForDiscipline matches with `===`, so the column renders empty and
 * looks exactly like "nothing is written here". That is the failure the two-field
 * (discipline_notes / key_findings) check in that function exists to avoid, undone one
 * layer up.
 *
 * The corpus-wide fallback is still worth having: it is what keeps a discipline this
 * journey never names pickable at all (with an honest zero-stage column) instead of
 * vanishing from the picker. For such a discipline both maps agree on the answer —
 * no entries, therefore no stages — so the fallback can only be wrong about a
 * spelling that this journey, by definition, does not contain.
 */
function subjectsForJourney(journeySlug: string): Map<string, string> {
  // Sorted so the corpus-wide pass is deterministic; readdir order isn't guaranteed.
  const corpus = [...listJourneys()].sort((x, y) => x.slug.localeCompare(y.slug));
  const journey = getJourney(journeySlug);
  const resolved = new Map(dominantSubjects(corpus));
  for (const [slug, subject] of dominantSubjects(journey ? [journey] : [])) {
    resolved.set(slug, subject);
  }
  return resolved;
}

/**
 * Every discipline that CAN be compared on this journey, richest first.
 *
 * Deliberately not filtered to the ones with content: a discipline with zero stages
 * written for this journey is a real, pickable answer ("nothing is written about
 * Medicine here"), and hiding it would turn an honest absence into an invisible one.
 * The `stageCount` is what the picker shows so the choice is informed. A discipline no
 * journey anywhere names is absent — the alternative is guessing at a subject string,
 * and a guess that misses looks exactly like real absence.
 */
export function listComparableDisciplines(journeySlug: string): ComparableDiscipline[] {
  const subjects = subjectsForJourney(journeySlug);
  return ALL_DISCIPLINE_META.flatMap((meta) => {
    const subject = subjects.get(meta.slug);
    if (!subject) return [];
    const coveredStages = new Set(getJourneyStagesForDiscipline(journeySlug, subject).map((s) => s.index));
    return [
      {
        slug: meta.slug,
        label: meta.label,
        code: meta.code,
        subject,
        coveredStages,
        stageCount: coveredStages.size,
      },
    ];
  }).sort((x, y) => y.stageCount - x.stageCount || x.label.localeCompare(y.label));
}

function firstValue(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

/**
 * How many stages exactly ONE of the two has something written at — the size of the
 * symmetric difference of their covered-stage sets, and literally the count the page's
 * own takeaway reports as "diverge at N of M stages".
 *
 * This, not total coverage, is what makes a default pair worth landing on: it is the
 * number of rows that will carry an "Only X" badge.
 */
function divergenceCount(x: ComparableDiscipline, y: ComparableDiscipline): number {
  let count = 0;
  for (const index of x.coveredStages) if (!y.coveredStages.has(index)) count++;
  for (const index of y.coveredStages) if (!x.coveredStages.has(index)) count++;
  return count;
}

/**
 * Ranks one candidate pair. Most divergent first, because that is the question the
 * page exists to answer; richest-pair-overall breaks a tie, so between two equally
 * divergent pairs the one with more actually-written content wins. `options` arrives
 * already sorted (coverage desc, then label), so scanning it in order with a strict
 * `>` makes the winner deterministic without a third tie-break.
 */
function pairScore(x: ComparableDiscipline, y: ComparableDiscipline): [number, number] {
  return [divergenceCount(x, y), x.stageCount + y.stageCount];
}

function beats(candidate: [number, number], best: [number, number] | null): boolean {
  if (!best) return true;
  return candidate[0] !== best[0] ? candidate[0] > best[0] : candidate[1] > best[1];
}

/**
 * Every discipline is a candidate while the count stays small (all 13 entries in
 * lib/discipline-meta.ts is 78 pairs over precomputed Sets — nothing). The cap exists
 * so that a registry that one day grows to hundreds degrades to "the best-covered N"
 * rather than to a quadratic scan on every request.
 */
const MAX_DEFAULT_PAIR_CANDIDATES = 24;

/**
 * A discipline with nothing written on this journey stays PICKABLE — an honest empty
 * column is a finding — but it must never be DERIVED, because it wins on divergence
 * for the wrong reason: a column of eight dashes has a maximal symmetric difference
 * against anything, and five of this repo's six journeys have at least one discipline
 * sitting at zero. Defaulting there lands the reader on the takeaway's own warning
 * state ("X has nothing written on this journey") instead of on a comparison.
 *
 * So the ranking runs twice: over pairs with content on both sides first, and over
 * everything only if this journey genuinely cannot field two written columns.
 */
function hasContentOnBothSides(x: ComparableDiscipline, y: ComparableDiscipline): boolean {
  return x.stageCount > 0 && y.stageCount > 0;
}

/** The partner that diverges most from a discipline the reader already chose. */
function bestPartnerFor(
  anchor: ComparableDiscipline,
  options: ComparableDiscipline[],
): ComparableDiscipline {
  const candidates = options.slice(0, MAX_DEFAULT_PAIR_CANDIDATES).filter((o) => o.slug !== anchor.slug);
  const pick = (eligible: (candidate: ComparableDiscipline) => boolean): ComparableDiscipline | null => {
    let best: ComparableDiscipline | null = null;
    let bestScore: [number, number] | null = null;
    for (const candidate of candidates) {
      if (!eligible(candidate)) continue;
      const score = pairScore(anchor, candidate);
      if (beats(score, bestScore)) {
        best = candidate;
        bestScore = score;
      }
    }
    return best;
  };
  return (
    pick((candidate) => hasContentOnBothSides(anchor, candidate)) ??
    pick(() => true) ??
    // Only reachable if the cap excluded every alternative, which needs the anchor to
    // sit past position 24; take any other option rather than return the anchor twice.
    options.find((o) => o.slug !== anchor.slug)!
  );
}

/**
 * The READ side of `?a=` / `?b=`, validated the same way the Dissection tab validates
 * `?node=`: a slug that doesn't resolve (stale link, typo, a discipline no journey
 * names) is ignored and the page renders its derived default instead of 404-ing or
 * rendering an empty comparison. Two identical slugs fall back the same way — a
 * discipline compared against itself is a page with nothing to say. A half-specified
 * pair keeps the side the reader did name, on the side they named it, and derives only
 * the other one.
 *
 * The derived default is the pair — among those with something written on BOTH sides,
 * see hasContentOnBothSides — whose covered stages differ the MOST: the largest
 * "only A" + "only B" count, with richest total coverage breaking a tie. Picking for
 * coverage alone is what the first version of this function did, by taking the
 * best-covered discipline and then the first partner that differed at all; because that
 * list is sorted by coverage, "differs at all" always landed on the partner differing
 * at the FEWEST stages — on rotation-lifecycle, a 1-of-8 difference, the smallest
 * visible result the page can produce. Landing cold on the least divergent pair
 * available argues against the page's own reason to exist.
 *
 * This stays a general rule computed from content, not an editorial pick: no discipline
 * is named here, and a journey where every discipline is written at identical stages
 * still resolves (to its two best-covered, with a takeaway that honestly says they
 * agree).
 */
export function resolveComparePair(
  options: ComparableDiscipline[],
  rawA: string | string[] | undefined,
  rawB: string | string[] | undefined,
): { a: ComparableDiscipline; b: ComparableDiscipline } | null {
  if (options.length < 2) return null;
  const bySlug = new Map(options.map((o) => [o.slug, o]));
  const requestedA = bySlug.get(firstValue(rawA) ?? "");
  const requestedB = bySlug.get(firstValue(rawB) ?? "");
  if (requestedA && requestedB && requestedA.slug !== requestedB.slug) {
    return { a: requestedA, b: requestedB };
  }
  // Exactly one side resolved (or both named the same discipline): keep it where the
  // reader put it and derive its most divergent partner.
  if (requestedA) return { a: requestedA, b: bestPartnerFor(requestedA, options) };
  if (requestedB) return { a: bestPartnerFor(requestedB, options), b: requestedB };

  const candidates = options.slice(0, MAX_DEFAULT_PAIR_CANDIDATES);
  const pick = (
    eligible: (x: ComparableDiscipline, y: ComparableDiscipline) => boolean,
  ): { a: ComparableDiscipline; b: ComparableDiscipline } | null => {
    let best: { a: ComparableDiscipline; b: ComparableDiscipline } | null = null;
    let bestScore: [number, number] | null = null;
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        if (!eligible(candidates[i], candidates[j])) continue;
        const score = pairScore(candidates[i], candidates[j]);
        if (beats(score, bestScore)) {
          best = { a: candidates[i], b: candidates[j] };
          bestScore = score;
        }
      }
    }
    return best;
  };
  // Two written columns if this journey has them; otherwise the best it can field,
  // which the takeaway will correctly flag as an empty column rather than a comparison.
  return pick(hasContentOnBothSides) ?? pick(() => true) ?? { a: options[0], b: options[1] };
}

/** The WRITE side of the same contract. It lives in its own import-free module so the
 * client picker can spell the URL the same way this server module reads it — see
 * lib/journey-compare-url.ts — and is re-exported here so a server caller has one place
 * to look. */
export { journeyCompareHref, JOURNEY_COMPARE_PARAMS } from "@/lib/journey-compare-url";

/**
 * The comparison itself: the journey's FULL stage list as the shared spine, with each
 * discipline's already-filtered stages dropped into it by index.
 *
 * Every stage is a row, including the ones neither discipline covers. That is the
 * point of the view — a reader is looking for where one has something written and the
 * other doesn't, and a row that quietly disappears because it's empty is the one piece
 * of evidence this page exists to show.
 */
export function buildJourneyComparison(
  journeySlug: string,
  a: ComparableDiscipline,
  b: ComparableDiscipline,
): JourneyComparison {
  const stages = getJourney(journeySlug)?.stages ?? [];
  const byIndex = (entries: DisciplineJourneyStage[]) => new Map(entries.map((e) => [e.index, e]));
  const aByIndex = byIndex(getJourneyStagesForDiscipline(journeySlug, a.subject));
  const bByIndex = byIndex(getJourneyStagesForDiscipline(journeySlug, b.subject));

  const rows: JourneyComparisonRow[] = stages.map((stage, index) => ({
    index,
    label: stageLabel(stage.stage, index),
    a: aByIndex.get(index),
    b: bByIndex.get(index),
  }));

  return {
    rows,
    stageCount: stages.length,
    bothCount: rows.filter((r) => r.a && r.b).length,
    onlyACount: rows.filter((r) => r.a && !r.b).length,
    onlyBCount: rows.filter((r) => !r.a && r.b).length,
    neitherCount: rows.filter((r) => !r.a && !r.b).length,
  };
}
