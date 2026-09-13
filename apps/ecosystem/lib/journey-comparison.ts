import {
  getJourney,
  getJourneyStagesForDiscipline,
  listJourneys,
  type DisciplineJourneyStage,
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
 * discipline slug -> the `subject` string content actually uses for it.
 *
 * DERIVED from every journey's own key_findings/discipline_notes rather than
 * hardcoded, because the two vocabularies genuinely differ: the URL wants "pt",
 * content writes "PT/PTA", and inventing either half here is how a column silently
 * renders empty for a discipline that has eight stages written about it. A
 * discipline no journey names at all is absent from this map and is therefore not
 * offered as a comparison option — the alternative is guessing at a subject string,
 * and a guess that misses looks exactly like real absence.
 */
function subjectBySlug(): Map<string, string> {
  const out = new Map<string, string>();
  // Sorted so the mapping is deterministic; readdir order isn't guaranteed, and a
  // discipline written two ways across two journeys must not resolve differently
  // depending on filesystem order.
  const journeys = [...listJourneys()].sort((x, y) => x.slug.localeCompare(y.slug));
  for (const journey of journeys) {
    for (const stage of journey.stages ?? []) {
      const subjects = [
        ...(stage.key_findings ?? []).map((f) => f.subject),
        ...(stage.discipline_notes ?? []).map((n) => n.subject),
      ];
      for (const subject of subjects) {
        if (!subject) continue;
        const meta = matchDisciplineMeta(subject);
        if (meta && !out.has(meta.slug)) out.set(meta.slug, subject);
      }
    }
  }
  return out;
}

/**
 * Every discipline that CAN be compared on this journey, richest first.
 *
 * Deliberately not filtered to the ones with content: a discipline with zero stages
 * written for this journey is a real, pickable answer ("nothing is written about
 * Medicine here"), and hiding it would turn an honest absence into an invisible one.
 * The `stageCount` is what the picker shows so the choice is informed.
 */
export function listComparableDisciplines(journeySlug: string): ComparableDiscipline[] {
  const subjects = subjectBySlug();
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

/** True when there is at least one stage exactly one of them has something written at —
 * i.e. this pair has something for the comparison to actually show. */
function diverges(x: ComparableDiscipline, y: ComparableDiscipline): boolean {
  if (x.stageCount !== y.stageCount) return true;
  return [...x.coveredStages].some((index) => !y.coveredStages.has(index));
}

/**
 * The READ side of `?a=` / `?b=`, validated the same way the Dissection tab validates
 * `?node=`: a slug that doesn't resolve (stale link, typo, a discipline no journey
 * names) is ignored and the page renders its derived default instead of 404-ing or
 * rendering an empty comparison. Two identical slugs fall back the same way — a
 * discipline compared against itself is a page with nothing to say.
 *
 * The default pair is the journey's best-covered discipline against the best-covered
 * one that does NOT cover exactly the same stages, so landing here cold shows the page
 * doing its job rather than an empty frame waiting on two clicks — or, worse, two
 * disciplines written at identical stages, which renders a comparison with nothing to
 * compare. Falls back to plain second-best when every other discipline is identical.
 */
export function resolveComparePair(
  options: ComparableDiscipline[],
  rawA: string | string[] | undefined,
  rawB: string | string[] | undefined,
): { a: ComparableDiscipline; b: ComparableDiscipline } | null {
  if (options.length < 2) return null;
  const bySlug = new Map(options.map((o) => [o.slug, o]));
  const a = bySlug.get(firstValue(rawA) ?? "") ?? options[0];
  const requestedB = bySlug.get(firstValue(rawB) ?? "");
  if (requestedB && requestedB.slug !== a.slug) return { a, b: requestedB };
  const others = options.filter((o) => o.slug !== a.slug);
  const b = others.find((o) => diverges(a, o)) ?? others[0];
  return { a, b };
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
