// Pure-function markdown splitter used to turn one long research document into
// progressively-disclosable chunks. Content files in content/ are written as flat
// prose with a stable `## ` / `### ` heading spine; pages want to render that spine
// as structure (collapsibles, lists, cards) rather than as one wall of text.
//
// Nothing here mutates or summarizes the source — a section's body is the verbatim
// slice of the original string between its heading and the next heading of the same
// level, deeper headings included. Concatenating the preamble plus every section's
// heading + body reproduces the input, so "every word is still reachable" holds.

export interface MarkdownSection {
  /** Heading text with the leading `#`s and surrounding whitespace stripped. */
  title: string;
  /** Heading depth (2 for `## `, 3 for `### `). */
  level: number;
  /** Everything after the heading line up to the next heading at the same level. */
  body: string;
}

const FENCE = /^\s*(```|~~~)/;

/**
 * Split `md` on headings of exactly `level` (default 2). Fenced code blocks are
 * skipped so a `## ` inside a fence never starts a section.
 */
export function splitSectionsAtLevel(md: string, level = 2): MarkdownSection[] {
  const marker = `${"#".repeat(level)} `;
  const lines = (md ?? "").split("\n");
  const sections: MarkdownSection[] = [];
  let current: { title: string; lines: string[] } | null = null;
  let inFence = false;

  for (const line of lines) {
    if (FENCE.test(line)) inFence = !inFence;

    if (!inFence && line.startsWith(marker)) {
      if (current) sections.push({ title: current.title, level, body: current.lines.join("\n").trim() });
      current = { title: line.slice(marker.length).trim(), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) sections.push({ title: current.title, level, body: current.lines.join("\n").trim() });

  return sections;
}

/**
 * Top-level (`## `) sections of a markdown document, in source order.
 * Content before the first `## ` heading is not returned — use `getPreamble`.
 */
export function splitMarkdownSections(md: string): { title: string; body: string }[] {
  return splitSectionsAtLevel(md, 2).map(({ title, body }) => ({ title, body }));
}

/**
 * Everything before the first `## ` heading (title line, front-matter-ish metadata,
 * editorial notes). Returned verbatim minus the leading `# ` document title line.
 */
export function getPreamble(md: string): string {
  const lines = (md ?? "").split("\n");
  const stop = lines.findIndex((l) => l.startsWith("## "));
  const head = (stop === -1 ? lines : lines.slice(0, stop)).filter((l, i) => !(i === 0 && l.startsWith("# ")));
  return head.join("\n").trim();
}

/** First `n` sentences of a markdown body, with inline markup and links flattened. */
export function extractLead(body: string, sentences = 2): string {
  const firstProse = body
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && !l.startsWith("|") && !l.startsWith(">") && !l.startsWith("-"));
  if (!firstProse) return "";

  const flat = firstProse
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → label
    .replace(/\((?:`[^`]*`|https?:\/\/[^)\s]+)[^)]*\)/g, "") // trailing file/URL citations
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();

  // Hand-rolled sentence scan rather than a global regex: a regex with /g silently
  // drops any prefix it cannot match, and standard numbers ("ACPE 7.5.b", "COCA 11.9")
  // are full of periods. A break only happens on .!? followed by whitespace or end.
  const parts: string[] = [];
  let buf = "";
  for (let i = 0; i < flat.length; i++) {
    buf += flat[i];
    const isTerminal = /[.!?]/.test(flat[i]) && (i + 1 >= flat.length || /\s/.test(flat[i + 1]));
    if (isTerminal) {
      parts.push(buf.trim());
      buf = "";
    }
  }
  if (buf.trim()) parts.push(buf.trim());

  return parts.slice(0, sentences).join(" ").replace(/[\s:;,—-]+$/, "").trim();
}
