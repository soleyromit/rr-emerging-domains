// Turns the vocabulary glossary markdown into scannable structure: top-level `## ` sections
// become groups (cross-domain + one per domain), and each `### ` inside a group becomes one
// term entry with a short extract for the row plus its full body for the expanded view.
//
// The `## ` split is the shared splitter in lib/markdown-sections.ts; the second-level `### `
// split lives here so the shared splitter's contract stays a plain {title, body} list.

import { extractLead, getPreamble, splitSectionsAtLevel } from "@/lib/markdown-sections";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

/** A titled chunk of the source document — heading text plus its verbatim body. */
export interface GlossaryChunk {
  title: string;
  body: string;
}

export interface GlossaryTerm {
  /** Term name, e.g. "COMLEX-USA (Levels 1, 2, 3)". */
  term: string;
  /** 1-2 sentence plain-text extract of the definition, for the scannable row. */
  summary: string;
  /** Full entry markdown: definition, Prism relevance, "say it to a dean", source. */
  body: string;
  /** Key into ROSETTA_KEYS when this term is one domain's manifestation of a
   * Rosetta Stone concept — hand-curated (see RELATED_ROSETTA_KEY below), never
   * inferred at runtime. Absent when no confident match exists. */
  relatedRosettaKey?: string;
}

/** One row of the Rosetta Stone table: a cross-domain concept and each target
 * domain's own term for it. */
export interface RosettaRow {
  /** Stable key, e.g. "accreditor" — assigned by table row order, not derived
   * from cell text (the table's 7 rows are a fixed, known set). */
  key: string;
  /** The allied-health concept being translated, e.g. "CAPTE / ACOTE (the accreditor)". */
  concept: string;
  cells: Partial<Record<"do" | "pharmacy" | "dentistry" | "medicine", string>>;
}

// Fixed row order in the source table (content/synthesis/vocabulary-glossary.md,
// "## 0. The Rosetta Stone"). If a future edit reorders/adds rows, extra rows
// fall back to an index-based key rather than breaking the parse.
const ROSETTA_KEYS = [
  "accreditor",
  "licensure-exam",
  "eval-instrument",
  "rotation",
  "instructor",
  "program-accredited",
  "self-study",
];

// Hand-curated, not runtime-matched: which glossary term headings are a given
// domain's manifestation of a Rosetta Stone concept. Built once by reading all
// 71 term headings against the 7 Rosetta rows — a navigational cross-reference
// (see content/ARCHITECTURE.md's "wayfinding, not evidence" exceptions for
// personas' related_flows / flows' maps_to_journey), not a new factual claim.
// Only high-confidence matches are included; most terms have none.
const RELATED_ROSETTA_KEY: Record<string, string> = {
  "COCA — Commission on Osteopathic College Accreditation": "accreditor",
  "ACPE — Accreditation Council for Pharmacy Education": "accreditor",
  "CODA — Commission on Dental Accreditation": "accreditor",
  "LCME — Liaison Committee on Medical Education": "accreditor",
  "COMLEX-USA (Levels 1, 2, 3)": "licensure-exam",
  "NAPLEX and MPJE": "licensure-exam",
  "INBDE — Integrated National Board Dental Examination": "licensure-exam",
  "ADEX / CDCA-WREB-CITA — the regional clinical licensure exam": "licensure-exam",
  "USMLE — Step 1, Step 2 CK, Step 3": "licensure-exam",
  "OPP / OMM / OMT — Osteopathic Principles and Practice / Osteopathic Manipulative Medicine / Treatment": "eval-instrument",
  "COEPA": "eval-instrument",
  "Standard 2-24 — the ~15 competency categories": "eval-instrument",
  "MSPE — Medical Student Performance Evaluation": "eval-instrument",
  "EPA (Entrustable Professional Activity)": "eval-instrument",
  "Core rotations vs. required rotations": "rotation",
  "IPPE — Introductory Pharmacy Practice Experience": "rotation",
  "APPE — Advanced Pharmacy Practice Experience": "rotation",
  "Comprehensive care model / patient panel": "rotation",
  "Core clerkship": "rotation",
  "Away rotation / audition rotation / VSLO": "rotation",
  "Sub-internship (\"Sub-I\")": "rotation",
  "2:1 preceptor ratio (Key Element 3.3.e)": "instructor",
  "Preceptor credentialing and development (3.3.a, 3.3.c)": "instructor",
  "Clinical practice unit / chairside supervision": "instructor",
  "Attending → resident → intern → student": "instructor",
  "GME (Graduate Medical Education) / PGY-1": "program-accredited",
  "Single Accreditation System (the 2020 AOA–ACGME merger)": "program-accredited",
  "GME placement rate (Element 11.5)": "program-accredited",
  "NRMP / the Match / Match Day / SOAP": "program-accredited",
  "ASHP and PGY1/PGY2": "program-accredited",
  "GPR / AEGD": "program-accredited",
  "Self-study": "self-study",
  "PHARMS — Pharmacy Accreditation Report Management System": "self-study",
  "DCI — Data Collection Instrument": "self-study",
};

export interface GlossaryGroup {
  /** Stable tab value. */
  key: string;
  /** Short tab label, e.g. "DO", "Pharmacy", "Cross-domain". */
  label: string;
  /** Full section heading minus its number, e.g. "DO — Osteopathic Medicine". */
  heading: string;
  /** Subject string for DisciplineChip, null for the cross-domain group. */
  subject: string | null;
  /** Section intro before the first term (market shape, framing callouts). */
  intro: string;
  terms: GlossaryTerm[];
}

/** rosettaKey -> domain slug -> term name(s) whose relatedRosettaKey matches.
 * Reverse of GlossaryTerm.relatedRosettaKey, for RosettaCards to know which
 * cells are click-through-able (and to what) without guessing. */
export type RosettaTermIndex = Record<string, Partial<Record<"do" | "pharmacy" | "dentistry" | "medicine", string[]>>>;

export function buildRosettaTermIndex(groups: GlossaryGroup[]): RosettaTermIndex {
  const index: RosettaTermIndex = {};
  for (const group of groups) {
    const domain = group.subject;
    if (domain !== "do" && domain !== "pharmacy" && domain !== "dentistry" && domain !== "medicine") continue;
    for (const term of group.terms) {
      if (!term.relatedRosettaKey) continue;
      const byDomain = (index[term.relatedRosettaKey] ??= {});
      (byDomain[domain] ??= []).push(term.term);
    }
  }
  return index;
}

export interface Glossary {
  /** Everything above the first `## ` — purpose, how to use, pillar table, legal flag. */
  howToUse: string;
  /** The "0. Rosetta Stone" translation section, rendered in full on the page. */
  rosetta: GlossaryChunk | null;
  /** The Rosetta Stone table, parsed into rows — see RosettaRow. Empty if no
   * table rows were found (e.g. the section is missing or malformed). */
  rosettaRows: RosettaRow[];
  /** Cross-domain group first, then one group per domain. */
  groups: GlossaryGroup[];
  /** `## ` sections carrying no terms (e.g. "Known gaps in this glossary"). */
  appendix: GlossaryChunk[];
  totalTerms: number;
  crossDomainTerms: number;
  domainCount: number;
}

/**
 * Parses the Rosetta Stone's markdown table into structured rows. Table grammar
 * (pipe-delimited, one `|---|` separator row) is deterministic — unlike prose,
 * there's no phrasing ambiguity to reverse-engineer. Column-to-domain mapping is
 * data-driven via matchDisciplineMeta on the header row, not a hardcoded index,
 * so a reordered column doesn't silently mismatch.
 */
function parseRosettaRows(tableBody: string): RosettaRow[] {
  const lines = tableBody.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|"));
  if (lines.length < 2) return [];

  const splitRow = (line: string) =>
    line
      .slice(1, line.endsWith("|") ? -1 : undefined)
      .split("|")
      .map((cell) => cell.trim());

  const header = splitRow(lines[0]);
  const domainColumns = header.map((cell) => matchDisciplineMeta(cell)?.slug ?? null);

  // The separator row's cells are each just dashes (optionally with leading/
  // trailing colons for alignment, e.g. ":---" or "---:") — checking every
  // cell, not the raw line, since a real multi-column line ("|---|---|---|")
  // has `|` characters throughout that a whole-line regex would choke on.
  const isSeparatorRow = (line: string) => splitRow(line).every((cell) => /^:?-+:?$/.test(cell));
  const dataRows = lines.slice(1).filter((l) => !isSeparatorRow(l));

  return dataRows.map((line, i) => {
    const cells = splitRow(line);
    const row: RosettaRow = { key: ROSETTA_KEYS[i] ?? `row-${i}`, concept: stripBold(cells[0] ?? ""), cells: {} };
    for (let c = 1; c < cells.length; c++) {
      const domain = domainColumns[c];
      if (domain === "do" || domain === "pharmacy" || domain === "dentistry" || domain === "medicine") {
        row.cells[domain] = stripBold(cells[c]);
      }
    }
    return row;
  });
}

function stripBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
}

/**
 * A section's intro — everything before its first `### ` term (market shape, framing
 * callouts). The shared module's `getPreamble` is the same idea one level up.
 */
function sectionIntro(body: string): string {
  const lines = body.split("\n");
  const stop = lines.findIndex((l) => l.startsWith("### "));
  return clean((stop === -1 ? lines : lines.slice(0, stop)).join("\n"));
}

// Research files separate sections with a `---` rule; it belongs to neither side once each
// section is rendered inside its own container.
function clean(text: string): string {
  return text.replace(/\n\s*-{3,}\s*$/, "").trim();
}

/**
 * A 1-2 sentence plain-text extract of the entry's "What it is." definition — enough to
 * decide whether to expand, never the whole entry. Every entry opens with a
 * `**What it is.**` line, which `extractLead` flattens into its own leading sentence, so
 * three sentences in leaves two of actual definition.
 */
function summarize(body: string): string {
  return extractLead(body, 3).replace(/^What it is\.\s*/i, "");
}

/** Tab label + chip subject from a section heading like "2. DO — Osteopathic Medicine". */
function labelParts(title: string): { heading: string; label: string } {
  const heading = title.replace(/^\d+\.\s*/, "").trim();
  const label = heading.split(/\s+—\s+/)[0].trim();
  return { heading, label };
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

export function parseGlossary(md: string): Glossary {
  const sections = splitSectionsAtLevel(md, 2);

  const rosettaSection = sections.find((s) => /rosetta/i.test(s.title)) ?? null;
  const rest = sections.filter((s) => s !== rosettaSection);

  const groups: GlossaryGroup[] = [];
  const appendix: GlossaryChunk[] = [];

  for (const section of rest) {
    const terms = splitSectionsAtLevel(section.body, 3).map((sub) => ({
      term: sub.title,
      summary: summarize(sub.body),
      body: clean(sub.body),
      relatedRosettaKey: RELATED_ROSETTA_KEY[sub.title],
    }));

    if (!terms.length) {
      appendix.push({ title: section.title.replace(/^\d+\.\s*/, "").trim(), body: clean(section.body) });
      continue;
    }

    const { heading, label } = labelParts(section.title);
    const isCross = /cross-domain/i.test(section.title);
    groups.push({
      key: isCross ? "cross-domain" : slugify(label),
      label: isCross ? "Cross-domain" : label,
      heading,
      subject: isCross ? null : (matchDisciplineMeta(label)?.slug ?? null),
      intro: sectionIntro(section.body),
      terms,
    });
  }

  // Cross-domain terms are the "learn these first" set, so they lead.
  groups.sort((a, b) => Number(b.key === "cross-domain") - Number(a.key === "cross-domain"));

  const crossDomain = groups.find((g) => g.key === "cross-domain");
  return {
    howToUse: getPreamble(md),
    rosetta: rosettaSection ? { title: rosettaSection.title, body: clean(rosettaSection.body) } : null,
    rosettaRows: rosettaSection ? parseRosettaRows(rosettaSection.body) : [],
    groups,
    appendix,
    totalTerms: groups.reduce((n, g) => n + g.terms.length, 0),
    crossDomainTerms: crossDomain?.terms.length ?? 0,
    domainCount: groups.filter((g) => g.key !== "cross-domain").length,
  };
}

// ---------------------------------------------------------------------------
// Prism-fit lookup — a structured field join, not prose extraction.
// ---------------------------------------------------------------------------

export interface PrismFitMatch {
  /** The accreditation doc's own slug, e.g. "coca". */
  domainSlug: string;
  fit: string;
}

/** Minimal shape resolvePrismFit needs — duck-typed so this file doesn't import
 * lib/content.ts's AccreditationDoc (would create a circular dependency). */
export interface MinimalAccreditationDoc {
  slug: string;
  standards?: { element_id: string; prism_fit?: string }[];
}

const ELEMENT_TOKEN_RE = /\d+-\d+|\d+\.\d+\.[a-z]|\d+\.\d+/gi;

function extractElementTokens(text: string): string[] {
  // Strip page references first ("p.43-44") so a page range is never mistaken
  // for a hyphenated CODA-style element id ("2-24").
  const withoutPages = text.replace(/pp?\.\s*[\d,\s-]+/gi, "");
  return [...withoutPages.matchAll(ELEMENT_TOKEN_RE)].map((m) => m[0].toLowerCase());
}

/**
 * Resolves a term's real, structured Prism-fit rating(s) by matching its
 * `*Source:*` citation against the accreditation files it names — never by
 * reading a rating word out of prose (see the header comment: that approach
 * was rejected after it was shown to surface a corrected-away value on one
 * entry). Matching requires an EXACT element-id token match, so it fails
 * closed: an unrecognized or ambiguous citation returns no match rather than
 * a guess. A cross-domain term citing multiple accreditation files can return
 * multiple matches — one per domain — rather than arbitrarily picking one.
 */
export function resolvePrismFit(term: GlossaryTerm, accreditationDocs: MinimalAccreditationDoc[]): PrismFitMatch[] {
  const sourceLineMatch = term.body.match(/^\*Source:(.+)$/im);
  if (!sourceLineMatch) return [];
  const sourceLine = sourceLineMatch[1];

  const fileSlugs = [...sourceLine.matchAll(/accreditation\/([a-z-]+)\.yaml/gi)].map((m) => m[1].toLowerCase());
  if (!fileSlugs.length) return [];

  const citationTokens = extractElementTokens(sourceLine);
  if (!citationTokens.length) return [];

  // A term can cite more than one element in the same doc (e.g. "Elements 9.7
  // and 9.8" — which really do carry different ratings), so every matching
  // standard is collected, then deduped by (domain, fit) so two elements with
  // the same rating don't render as two identical pills.
  const seen = new Set<string>();
  const matches: PrismFitMatch[] = [];
  for (const slug of fileSlugs) {
    const doc = accreditationDocs.find((d) => d.slug === slug);
    if (!doc?.standards) continue;
    for (const standard of doc.standards) {
      if (!standard.prism_fit) continue;
      const idTokens = extractElementTokens(standard.element_id);
      if (!idTokens.some((t) => citationTokens.includes(t))) continue;
      const dedupeKey = `${slug}::${standard.prism_fit}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      matches.push({ domainSlug: slug, fit: standard.prism_fit });
    }
  }
  return matches;
}
