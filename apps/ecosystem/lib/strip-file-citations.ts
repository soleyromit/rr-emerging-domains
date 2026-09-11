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
  prism: "Prism reference",
  sources: "source registry",
};

// A bare (non-parenthesized) relative citation, e.g. "content/prism/capability-map.yaml"
// or "../flows/rotation-lifecycle--05-....yaml" — the folder segment is a single
// lowercase word (no dots), so this can't accidentally swallow surrounding prose.
const BARE_YAML_PATH = /(?:\.\.\/|content\/)[a-z][a-z-]*\/[\w.-]+\.ya?ml/gi;

// Some flow-element prose (accreditation_citation, competitor_equivalent) embeds
// parenthetical source-file citations inline, e.g. "...(competitors/emedley.yaml,
// e-value.yaml)..." — real content, correct as research, but a literal raw-filename
// violation of the "no partial URLs visible as UI text" rule once rendered. Source
// attribution belongs in the underlying source: fields, not the reader-facing prose,
// so strip it at render time rather than rewriting the content fields themselves.
//
// A bare inline path ("documented in ../prism/capability-map.yaml — a shipped
// capability") can't just be deleted like a parenthetical can — that leaves a
// dangling "documented in — a shipped capability". Substitute it with
// humanizeSourceRef's readable label instead, so the sentence still reads.
//
// (Both paragraphs above document stripFileCitations, defined below.)

// A bare source-code path, e.g. "apps/ecosystem/lib/zendesk/client.ts" or
// "scripts/snapshot_zendesk.py". Provenance prose in content/sources/** legitimately
// names the code that produced a value ("these ids are hardcoded in <path>") — that
// is correct at the content layer, where the reader is an engineer with the repo open,
// and wrong at the render layer, where it's a raw partial path on screen. Same fix as
// the YAML case: substitute a readable label at render time, don't rewrite the content.
//
// Anchored to the two real top-level code folders so it can't swallow prose, and the
// leading (?<![\w/]) stops it firing on a path segment inside a real URL
// ("https://host/apps/x/y.ts"), which would mangle a working link.
const BARE_CODE_PATH = /(?<![\w/])(?:apps|scripts)\/[\w./-]*\w\.(?:tsx?|py|mjs|sh)\b/g;

// Readable names for code files that actually appear in a rendered content field today.
// Deliberately minimal: humanizeCodeRef's fallback already guarantees no raw path reaches
// the screen, so speculative entries for files nothing cites buy nothing and quietly rot.
// Add one here only when a path genuinely shows up in rendered prose and its fallback
// label reads badly.
const CODE_PATH_LABEL: Record<string, string> = {
  "apps/ecosystem/lib/zendesk/client.ts": "the app's Zendesk client",
};

function humanizeCodeRef(ref: string): string {
  const known = CODE_PATH_LABEL[ref];
  if (known) return known;
  const basename = ref.split("/").pop()?.replace(/\.(tsx?|py|mjs|sh)$/i, "") ?? ref;
  return titleCase(basename.replace(/_/g, "-"));
}

export function stripFileCitations(text?: string): string | undefined {
  if (!text) return text;
  const withoutParens = text.replace(/\s*\([^()]*\.ya?ml[^()]*\)/gi, "");
  const humanized = withoutParens
    .replace(BARE_YAML_PATH, (match) => humanizeSourceRef(match))
    .replace(BARE_CODE_PATH, (match) => humanizeCodeRef(match));
  return humanized.replace(/\s{2,}/g, " ").trim();
}

// content/lenses/*.yaml's `sources:` field is a relative-file citation (e.g.
// "../accreditation/coca.yaml") — correct at the content layer per ARCHITECTURE.md's
// citation rule, but a raw-filename violation if rendered verbatim as reader-facing
// UI text. Real URLs (persona sources are full https:// links) pass through unchanged.
export function humanizeSourceRef(ref: string): string {
  if (/^https?:\/\//i.test(ref)) return ref;
  const clean = ref.replace(/^(\.\.\/)+/, "").replace(/^content\//, "");
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
