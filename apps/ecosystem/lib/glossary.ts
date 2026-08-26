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
}

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

export interface Glossary {
  /** Everything above the first `## ` — purpose, how to use, pillar table, legal flag. */
  howToUse: string;
  /** The "0. Rosetta Stone" translation section, rendered in full on the page. */
  rosetta: GlossaryChunk | null;
  /** Cross-domain group first, then one group per domain. */
  groups: GlossaryGroup[];
  /** `## ` sections carrying no terms (e.g. "Known gaps in this glossary"). */
  appendix: GlossaryChunk[];
  totalTerms: number;
  crossDomainTerms: number;
  domainCount: number;
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
    groups,
    appendix,
    totalTerms: groups.reduce((n, g) => n + g.terms.length, 0),
    crossDomainTerms: crossDomain?.terms.length ?? 0,
    domainCount: groups.filter((g) => g.key !== "cross-domain").length,
  };
}
