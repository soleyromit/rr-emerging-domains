// Parses content/synthesis/{slug}/SALES.md into structured data for the "How we
// win" domain page. Same precedent as app/synthesis/positioning/page.tsx's
// parseVerdictTable: split on markdown structure rather than a table parser,
// so a row/line that ever grows unexpected shape drops out instead of
// rendering garbage. Pure functions only — no React, no JSX.
//
// Verified against all 4 real files (content/synthesis/{pharmacy,do,dentistry,
// medicine}/SALES.md) before writing this, not designed against one and hoped
// to generalize:
// - Section headings are matched by letter prefix ("A."), not full title —
//   Dentistry's §A heading carries extra trailing text the others don't.
// - §A's numbered "why switch" list varies in length (Dentistry has 2 items,
//   the other three have 3) — never assume a count.
// - §A's labeled paragraphs (`**Label:** text`) vary per domain — only
//   "Positioning statement" is guaranteed present in all 4.
// - §C (objections) is `**"question"**` + an answer line, repeated. Pharmacy's
//   §C additionally carries a `> **ADDENDUM ...**` blockquote with 3 more
//   objections — returned separately as `objectionAddendum`, never dropped.

import { readMarkdownFile } from "./content";
import { stripFileCitationsInMarkdown } from "./strip-file-citations";
import { splitSectionsAtLevel, getPreamble, type MarkdownSection } from "./markdown-sections";

export interface SalesBriefOpening {
  headline: string;
  detail: string;
}

export interface SalesBriefBuyer {
  role: string;
  motivation: string;
  budgetRole: string;
  notes: string;
}

export interface SalesBriefObjection {
  question: string;
  answer: string;
}

export interface SalesBrief {
  /** §A's `**Positioning statement:**` paragraph, verbatim. Empty string if the
   * label is missing — callers should treat that as "no brief," not render an
   * empty Takeaway. */
  positioningStatement: string;
  /** Every other `**Label:** text` paragraph in §A, keyed by label — e.g.
   * Dentistry's "The rule first" / "The disqualifier to know before you're in
   * the room". Absent labels simply aren't keys; never invented. */
  labeledLeads: Record<string, string>;
  /** §A's numbered "why programs would switch" list, in source order. */
  openings: SalesBriefOpening[];
  /** §B's buyer-map table rows. */
  buyers: SalesBriefBuyer[];
  /** §C's objection/rebuttal pairs (main list, excluding any addendum). */
  objections: SalesBriefObjection[];
  /** §C's trailing `> **ADDENDUM ...**` blockquote, if present. */
  objectionAddendum?: { title: string; objections: SalesBriefObjection[] };
  /** §D's body, verbatim markdown — render with `<Markdown>`, don't parse further. */
  pricingSection?: string;
  /** Any top-level section this parser didn't consume (A/B/C/D), verbatim. */
  otherSections: MarkdownSection[];
  /** Content before the first `## ` heading (the "For: sales/partnerships..." line). */
  preamble: string;
}

function stripBold(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

/** Blank-line-separated blocks, each block's lines trimmed and blanks removed. */
function blocks(body: string): string[][] {
  return body
    .split(/\n\s*\n/)
    .map((b) =>
      b
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
    )
    .filter((b) => b.length > 0);
}

// §A: a mix of `**Label:** text` paragraphs and one numbered "why switch" list.
// A block is the numbered list only when every one of its lines starts "N. ";
// every observed numbered item is a single line (verified across all 4 files),
// so no continuation-line handling is needed here — same reasoning
// parseVerdictTable uses for "no cell contains a pipe."
function parseSectionA(body: string): { labeledLeads: Record<string, string>; openings: SalesBriefOpening[] } {
  const labeledLeads: Record<string, string> = {};
  const openings: SalesBriefOpening[] = [];

  for (const lines of blocks(body)) {
    if (lines.every((l) => /^\d+\.\s+/.test(l))) {
      for (const line of lines) {
        const m = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*(.*)$/);
        if (m) openings.push({ headline: stripBold(m[1]).trim(), detail: m[2].trim() });
      }
      continue;
    }
    const m = lines[0]?.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    if (!m) continue; // a citation-only `*(...)*` line, or stray prose — not a labeled lead
    const label = m[1].trim();
    const rest = [m[2], ...lines.slice(1)]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
    // A header line like "**Why pharmacy programs would consider switching:**"
    // matches this same pattern but has nothing after its closing `**` (the
    // colon sits inside the bold span) — `rest` is empty, so it's correctly
    // skipped rather than stored as a real labeled lead.
    if (rest) labeledLeads[label] = rest;
  }

  return { labeledLeads, openings };
}

// §B: uniform `| Role | Motivation | Budget/decision | Notes |` table, 3 body
// rows in every file. Same pipe-split-and-guard idiom as positioning/page.tsx's
// parseVerdictTable — a row that ever grows a 5th column drops out here rather
// than rendering garbage.
function parseSectionB(body: string): SalesBriefBuyer[] {
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && !/^\|[\s|:-]+\|$/.test(l))
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
    .filter((cells) => cells.length === 4 && !/^role$/i.test(stripBold(cells[0])))
    .map((cells) => ({
      role: stripBold(cells[0]),
      motivation: stripBold(cells[1]),
      budgetRole: stripBold(cells[2]),
      notes: stripBold(cells[3]),
    }));
}

// A `**"question"**` line immediately followed (same block, no blank line
// between them in the source) by its answer paragraph. Blocks that don't open
// with a quoted-bold question — the trailing `*(source)*` citation line, or
// (inside an addendum) its own intro sentence — are silently skipped, not
// misread as an objection.
function parseObjectionBlocks(body: string): SalesBriefObjection[] {
  const objections: SalesBriefObjection[] = [];
  for (const lines of blocks(body)) {
    const qm = lines[0]?.match(/^\*\*"(.+)"\*\*$/);
    if (!qm) continue;
    const answer = lines.slice(1).join(" ").trim();
    if (answer) objections.push({ question: qm[1].trim(), answer });
  }
  return objections;
}

// §C: the main objection list, plus an optional trailing `> ` blockquote
// (Pharmacy's 2026-09-09 addendum) carrying more objections in the same
// question/answer shape. Split on the first blockquote line rather than a
// fixed heading, since only one of the four domains has one.
function parseSectionC(body: string): {
  objections: SalesBriefObjection[];
  objectionAddendum?: SalesBrief["objectionAddendum"];
} {
  const lines = body.split("\n");
  const addendumStart = lines.findIndex((l) => l.trim().startsWith(">"));
  const mainBody = addendumStart === -1 ? body : lines.slice(0, addendumStart).join("\n");
  const objections = parseObjectionBlocks(mainBody);

  if (addendumStart === -1) return { objections };

  const addendumRaw = lines
    .slice(addendumStart)
    .map((l) => l.replace(/^>\s?/, ""))
    .join("\n");
  const addendumBlocks = blocks(addendumRaw);
  const titleMatch = addendumBlocks[0]?.[0]?.match(/^\*\*(.+?)\*\*/);
  return {
    objections,
    objectionAddendum: {
      title: titleMatch ? stripBold(titleMatch[1]).trim() : "Additional objections",
      objections: parseObjectionBlocks(addendumRaw),
    },
  };
}

const SECTION_A_PREFIX = "A.";
const SECTION_B_PREFIX = "B.";
const SECTION_C_PREFIX = "C.";
const SECTION_D_PREFIX = "D.";

export function getSalesBrief(slug: string): SalesBrief | null {
  // The win tab is the most reader-facing surface in the app — a salesperson reads it
  // on a call. Humanize the brief once here, before it is split into sections, so no
  // section of it can render a research filename at a customer.
  const content = stripFileCitationsInMarkdown(readMarkdownFile(`synthesis/${slug}/SALES.md`));
  if (!content) return null;

  const preamble = getPreamble(content);
  const sections = splitSectionsAtLevel(content, 2);
  const sectionA = sections.find((s) => s.title.startsWith(SECTION_A_PREFIX));
  const sectionB = sections.find((s) => s.title.startsWith(SECTION_B_PREFIX));
  const sectionC = sections.find((s) => s.title.startsWith(SECTION_C_PREFIX));
  const sectionD = sections.find((s) => s.title.startsWith(SECTION_D_PREFIX));
  const consumed = new Set([sectionA, sectionB, sectionC, sectionD].filter(Boolean));
  const otherSections = sections.filter((s) => !consumed.has(s));

  const { labeledLeads, openings } = sectionA ? parseSectionA(sectionA.body) : { labeledLeads: {}, openings: [] };
  const buyers = sectionB ? parseSectionB(sectionB.body) : [];
  const { objections, objectionAddendum } = sectionC
    ? parseSectionC(sectionC.body)
    : { objections: [], objectionAddendum: undefined };

  return {
    positioningStatement: labeledLeads["Positioning statement"] ?? "",
    labeledLeads,
    openings,
    buyers,
    objections,
    objectionAddendum,
    pricingSection: sectionD?.body,
    otherSections,
    preamble,
  };
}
