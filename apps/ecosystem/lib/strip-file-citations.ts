// Some flow-element prose (accreditation_citation, competitor_equivalent) embeds
// parenthetical source-file citations inline, e.g. "...(competitors/emedley.yaml,
// e-value.yaml)..." — real content, correct as research, but a literal raw-filename
// violation of the "no partial URLs visible as UI text" rule once rendered. Source
// attribution belongs in the underlying source: fields, not the reader-facing prose,
// so strip it at render time rather than rewriting the content fields themselves.
export function stripFileCitations(text?: string): string | undefined {
  if (!text) return text;
  return text.replace(/\s*\([^()]*\.ya?ml[^()]*\)/gi, "").replace(/\s{2,}/g, " ").trim();
}

function titleCase(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const FOLDER_NOUN: Record<string, string> = {
  accreditation: "accreditation record",
  competitors: "competitor research",
  domains: "domain profile",
  personas: "persona profile",
  flows: "flow",
  journeys: "journey",
  lenses: "lens data",
};

// content/lenses/*.yaml's `sources:` field is a relative-file citation (e.g.
// "../accreditation/coca.yaml") — correct at the content layer per ARCHITECTURE.md's
// citation rule, but a raw-filename violation if rendered verbatim as reader-facing
// UI text. Real URLs (persona sources are full https:// links) pass through unchanged.
export function humanizeSourceRef(ref: string): string {
  if (/^https?:\/\//i.test(ref)) return ref;
  const clean = ref.replace(/^(\.\.\/)+/, "");
  const parts = clean.split("/");
  const folder = parts.length > 1 ? parts[0] : undefined;
  const filename = parts[parts.length - 1].replace(/\.(ya?ml|md)$/i, "");

  if (folder === "interviews") {
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.*)$/);
    if (match) {
      const [, date, slug] = match;
      return `Interview notes, ${date} — ${titleCase(slug)}`;
    }
  }
  if (folder === "accreditation") return `${filename.toUpperCase()} accreditation record`;

  const noun = folder ? FOLDER_NOUN[folder] : undefined;
  return noun ? `${titleCase(filename)} — ${noun}` : titleCase(filename);
}
