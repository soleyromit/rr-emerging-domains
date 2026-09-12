// How a filename stem is spelled when it is a proper noun the market already spells its
// own way. titleCase would render these "E Value", "Emedley", "Core Elms", "Do" — wrong
// enough to be distracting in a sentence a salesperson reads aloud. Keyed by filename
// stem, so it applies however the file was cited (bare, folder-qualified, or relative).
const FILENAME_DISPLAY: Record<string, string> = {
  "core-elms": "CORE ELMS",
  "e-value": "E*Value",
  emedley: "eMedley",
  medhub: "MedHub",
  "leo-davinci": "Leo / DaVinci",
  "new-innovations": "New Innovations",
  one45: "one45",
  rxpreceptor: "RxPreceptor",
  pharmacademic: "PharmAcademic",
  examsoft: "ExamSoft",
  do: "DO",
};

function titleCase(slug: string): string {
  const known = FILENAME_DISPLAY[slug.toLowerCase()];
  if (known) return known;
  return slug
    // Flow filenames are "<journey>--NN-<step>"; the "--" would otherwise leave a
    // double space in the middle of the label.
    .replace(/-{2,}/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s{2,}/g, " ")
    .trim();
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

// A bare (non-parenthesized) citation of a content file, in any of the shapes that
// actually occur in committed prose:
//
//   ../flows/rotation-lifecycle--05-....yaml     relative, from a sibling folder
//   content/prism/capability-map.yaml            repo-relative
//   accreditation/acpe.yaml                      folder-qualified, no prefix
//   /Users/me/src/repo/content/prism/x.yaml      an absolute path a writer pasted in
//   capability-map.yaml                          BARE — just the filename
//
// The previous pattern required a literal "../" or "content/" prefix, so the last three
// shapes never matched and rendered raw on screen. The same gap_note could even contain
// one of each: content/accreditation/acpe.yaml cites "content/prism/capability-map.yaml"
// at line 263 (caught) and a bare "capability-map.yaml" at line 113 (missed) — the same
// reference, humanized in one sentence and raw in the other.
//
// Widening to a bare filename is safe because a ".yaml"/".yml" suffix is an extremely
// rare token in English prose — it is effectively a filename marker on its own. The
// guards keep it from over-reaching:
//   (?<![\w./-])          won't start mid-token, and won't chew a path segment out of a
//                         real URL ("https://host/spec/openapi.yaml") the way an
//                         unanchored match would — same reasoning as BARE_CODE_PATH.
//   (?<=\.ya?ml\/)        ...except immediately after another .yaml, which is the one
//                         place a match legitimately starts mid-token: writers list
//                         files slash-separated ("coca.yaml/lcme.yaml/coda.yaml"). The
//                         guard above would otherwise humanize only the FIRST and leave
//                         "COCA accreditation record/lcme.yaml/coda.yaml" on screen.
//   (?![\w.-]*\.ya?ml\/)  a path SEGMENT may not itself be a .yaml file, so that same
//                         list is read as three separate citations, not one nonsense path.
const BARE_YAML_PATH =
  /(?:(?<![\w./-])|(?<=\.ya?ml\/))(?:\/|(?:\.\.\/)+)?(?:(?![\w.-]*\.ya?ml\/)[\w.-]+\/)*[\w-]+\.ya?ml\b/gi;

// Folder for a filename cited with no folder in front of it. A bare "coca.yaml" means
// exactly what "../accreditation/coca.yaml" means, so resolving the folder here routes
// both through humanizeSourceRef's existing logic and guarantees they humanize to the
// SAME label — which is the whole point, since the two forms appear in the same files.
//
// Only closed sets are enumerated: the accreditor records and the competitor roster are
// both small and stable. Open-ended folders (personas, flows) are matched by the naming
// convention their filenames already follow, so a new flow file needs no edit here.
// Anything unrecognised falls through to titleCase — still a readable label, never a
// raw filename on screen.
const BARE_FILE_FOLDER: Record<string, string> = {
  // content/accreditation/*.yaml
  acen: "accreditation",
  acote: "accreditation",
  acpe: "accreditation",
  "arc-pa": "accreditation",
  "caa-asha": "accreditation",
  caep: "accreditation",
  capte: "accreditation",
  ccne: "accreditation",
  coa: "accreditation",
  coca: "accreditation",
  coda: "accreditation",
  cswe: "accreditation",
  lcme: "accreditation",
  nursing: "accreditation",
  // content/competitors/*.yaml
  axium: "competitors",
  "core-elms": "competitors",
  "e-value": "competitors",
  elentra: "competitors",
  emedley: "competitors",
  examsoft: "competitors",
  influx: "competitors",
  "leo-davinci": "competitors",
  medhub: "competitors",
  "new-innovations": "competitors",
  one45: "competitors",
  pharmacademic: "competitors",
  rxpreceptor: "competitors",
  // content/journeys/*.yaml
  "accreditation-self-study": "journeys",
  "admin-onboarding-product-setup": "journeys",
  "competency-verification": "journeys",
  "preceptor-site-onboarding": "journeys",
  "rotation-lifecycle": "journeys",
  // content/prism/
  "capability-map": "prism",
};

function folderForBareFile(filename: string): string | undefined {
  const known = BARE_FILE_FOLDER[filename.toLowerCase()];
  if (known) return known;
  // personas/ filenames are all role-* or discipline-* (plus the lens-* competitor views).
  if (/^(?:role|discipline|lens)-/i.test(filename)) return "personas";
  // flows/ filenames are "<journey>--NN-<slug>" — the step number is the reliable marker,
  // and it is what distinguishes a flow file from its parent journey file of the same stem.
  if (/--\d{2}-/.test(filename)) return "flows";
  return undefined;
}

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
  const withoutParens = text
    .replace(/\s*\([^()]*\.ya?ml[^()]*\)/gi, "")
    // Square brackets are the other citation bracket this corpus uses — domain and
    // persona prose ends claims with "[../domains/dentistry.yaml market]". Same rule,
    // same reason: the bracket is attribution, not part of the sentence.
    .replace(/\s*\[[^[\]]*\.ya?ml[^[\]]*\]/gi, "");
  const humanized = withoutParens
    .replace(BARE_YAML_PATH, (match) => humanizeSourceRef(match))
    .replace(BARE_CODE_PATH, (match) => humanizeCodeRef(match));
  return humanized.replace(/\s{2,}/g, " ").trim();
}

/**
 * The same substitution for a whole Markdown DOCUMENT rather than one prose field.
 *
 * Two things make a document different, and both are why stripFileCitations must not be
 * pointed at one directly:
 *
 * 1. Whitespace is structure. stripFileCitations ends with `\s{2,}` -> " ", which in a
 *    field is tidying and in a document is destruction — every blank line, heading break
 *    and table row would collapse into a single line. Only runs of *horizontal* space are
 *    squeezed here; newlines are left exactly as written.
 * 2. Markdown has link targets. "[CORE ELMS](../../competitors/core-elms.yaml)" is a
 *    working link, not prose, and humanizing its href would break it — the same class of
 *    mistake BARE_CODE_PATH's URL guard already exists to prevent. Both the parenthetical
 *    strip and the path substitution therefore skip anything sitting in a "](...)" target.
 * 3. Markdown has fenced code blocks, which are verbatim: indentation is structure,
 *    interior runs of spaces may be aligning columns, and a ".yaml" inside a fence is
 *    sample code, not a citation. Fences are passed through untouched.
 *
 * None of the four documents this runs on today contains an indented bullet or a fence,
 * which is exactly why 1 and 3 had to be reasoned about rather than observed — they are
 * traps for the next document added, not current bugs.
 */
// Accepts null because readMarkdownFile returns `string | null` for a missing document;
// callers already branch on falsy, so collapsing null to undefined here costs them nothing.
export function stripFileCitationsInMarkdown(text?: string | null): string | undefined {
  if (!text) return undefined;
  // A fenced code block is verbatim by definition: its indentation is meaningful, its
  // interior spacing may be aligning columns, and a filename inside it is literal sample
  // code rather than prose to humanize. Transform only the stretches BETWEEN fences.
  const lines = text.split("\n");
  const out: string[] = [];
  let prose: string[] = [];
  let fence: string | undefined;
  const flush = () => {
    if (prose.length) out.push(humanizeMarkdownProse(prose.join("\n")));
    prose = [];
  };
  for (const line of lines) {
    const marker = line.match(/^\s{0,3}(```+|~~~+)/)?.[1];
    if (marker && !fence) {
      flush();
      fence = marker[0];
      out.push(line);
      continue;
    }
    if (marker && fence === marker[0]) {
      fence = undefined;
      out.push(line);
      continue;
    }
    if (fence) out.push(line);
    else prose.push(line);
  }
  flush();
  // An unterminated fence leaves its remaining lines untransformed, which is the safe
  // way to be wrong about a malformed document.
  return out.join("\n");
}

function humanizeMarkdownProse(text: string): string {
  const isLinkTarget = (full: string, offset: number) => full.slice(0, offset).endsWith("](");
  const withoutParens = text
    // Leading whitespace is [^\S\r\n]* (spaces/tabs only), never \s*, so stripping a
    // citation at the start of a line cannot swallow the newline above it. The interior
    // excludes \n for the matching reason: a parenthetical that spans two lines would
    // otherwise take the line break (and the next line's "> " or list marker) with it,
    // silently welding two document lines into one. A multi-line citation therefore keeps
    // its parentheses and just gets its path humanized — prose that still reads, with the
    // document's line structure intact. Invariant: this function never changes line count.
    .replace(/[^\S\r\n]*\([^()\n]*\.ya?ml[^()\n]*\)/gi, (match, offset: number, full: string) =>
      // "](" + "(" can't overlap, but a citation directly after a link's closing paren
      // would; checking the character before the "(" keeps a real link intact.
      full.slice(0, offset + match.length - match.trimStart().length).endsWith("]") ? match : "",
    )
    .replace(/[^\S\r\n]*\[[^[\]\n]*\.ya?ml[^[\]\n]*\]/gi, (match, offset: number, full: string) =>
      // A "[...]" immediately followed by "(" is a link label, not a citation bracket.
      full.slice(offset + match.length).startsWith("(") ? match : "",
    );
  const humanized = withoutParens
    .replace(BARE_YAML_PATH, (match, offset: number, full: string) =>
      isLinkTarget(full, offset) ? match : humanizeSourceRef(match),
    )
    .replace(BARE_CODE_PATH, (match, offset: number, full: string) =>
      isLinkTarget(full, offset) ? match : humanizeCodeRef(match),
    );
  // (?<=\S) is what keeps this safe on a document: only a run of spaces that FOLLOWS a
  // non-whitespace character is squeezed, so a run at the start of a line — which in
  // Markdown is not spacing but structure — survives untouched. Without it, a 4-space
  // nested bullet would be de-nested and a fenced code block's own indentation would be
  // re-spaced. The four documents this runs on today happen to contain neither, so the
  // bug would have stayed invisible until someone added one.
  return humanized.replace(/(?<=\S)[^\S\r\n]{2,}/g, " ");
}

// content/lenses/*.yaml's `sources:` field is a relative-file citation (e.g.
// "../accreditation/coca.yaml") — correct at the content layer per ARCHITECTURE.md's
// citation rule, but a raw-filename violation if rendered verbatim as reader-facing
// UI text. Real URLs (persona sources are full https:// links) pass through unchanged.
export function humanizeSourceRef(ref: string): string {
  if (/^https?:\/\//i.test(ref)) return ref;
  const clean = ref
    .replace(/^(\.\.\/)+/, "")
    // An absolute path someone pasted from their own checkout
    // ("/Users/me/src/rr-emerging-domains/content/prism/capability-map.yaml") is the same
    // citation as the repo-relative form. Cut everything through the last "/content/" so
    // it resolves identically — otherwise its folder would read as "Users".
    .replace(/^.*\/content\//, "")
    .replace(/^content\//, "");
  const parts = clean.split("/");
  const filename = parts[parts.length - 1].replace(/\.(ya?ml|md)$/i, "");
  // No folder in the citation itself? Recover it from the filename, so a bare
  // "coca.yaml" reads the same as "../accreditation/coca.yaml".
  const folder = parts.length > 1 ? parts[0] : folderForBareFile(filename);

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
