/**
 * Regression suite for the render-time file-citation sanitizer.
 *
 * Run it:   npm test          (from apps/ecosystem)
 * Or:       node --experimental-strip-types --no-warnings lib/strip-file-citations.test.mts
 *
 * There is no test runner in this app and this file deliberately does not add one — it is
 * a plain Node script over node:assert, so it has zero dependencies and cannot rot when a
 * framework version moves. It is .mts so Node treats it as ESM without a "type" field, and
 * it imports the real module by its real ".ts" path (see allowImportingTsExtensions in
 * tsconfig.json) so `tsc --noEmit` type-checks the suite against the real signatures
 * rather than against a copy.
 *
 * WHY THIS FILE EXISTS. Two consecutive tasks rewrote strip-file-citations.ts — first
 * widening the filename regex to bare/unprefixed names, then widening it again to ".md" —
 * and each verified itself with a throwaway script that was never committed. The
 * sanitizer's whole job is a pile of negative lookarounds guarding against over-matching,
 * which is exactly the code where an innocuous-looking edit silently breaks a neighbouring
 * case. The `.yaml`/`.yml` block below is the byte-identical-behaviour set: every one of
 * those assertions passed BEFORE the ".md" widening and must keep passing after any future
 * one. If you widen this regex again, add your new cases and keep every existing case green.
 */
import assert from "node:assert";
import {
  humanizeSourceRef,
  stripFileCitations,
  stripFileCitationsInMarkdown,
} from "./strip-file-citations.ts";

let passed = 0;
const failures: string[] = [];

function check(name: string, actual: unknown, expected: unknown): void {
  try {
    assert.deepStrictEqual(actual, expected);
    passed++;
  } catch {
    failures.push(
      `${name}\n    actual:   ${JSON.stringify(actual)}\n    expected: ${JSON.stringify(expected)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// 1. .yaml / .yml — the byte-identical-behaviour set.
//    Every assertion here passed before ".md" was added to the pattern. They exist to
//    prove a future extension widening does not disturb the cases already shipping.
// ---------------------------------------------------------------------------

check(
  "bare .yaml filename is humanized via BARE_FILE_FOLDER",
  stripFileCitations("documented in capability-map.yaml — a shipped capability"),
  "documented in Capability Map — Prism reference — a shipped capability",
);
check(
  "repo-relative .yaml path is humanized",
  stripFileCitations("see content/accreditation/acpe.yaml for detail"),
  "see ACPE accreditation record for detail",
);
check(
  "../ relative .yaml path is humanized",
  stripFileCitations("per ../flows/rotation-lifecycle--05-x.yaml today"),
  "per Rotation Lifecycle 05 X — flow today",
);
check(
  "slash-separated citation list splits into three citations, not one path",
  stripFileCitations("coca.yaml/lcme.yaml/coda.yaml"),
  "COCA accreditation record/LCME accreditation record/CODA accreditation record",
);
check(
  "a real URL ending .yaml is left alone (no path segment chewed out of it)",
  stripFileCitations("fetch https://host/spec/openapi.yaml now"),
  "fetch https://host/spec/openapi.yaml now",
);
check(
  "a parenthetical whose contents are .yaml citations is deleted outright",
  stripFileCitations("A claim (competitors/emedley.yaml, e-value.yaml) holds."),
  "A claim holds.",
);
check(
  "a bracketed .yaml attribution is deleted outright",
  stripFileCitations("Growing fast [../domains/dentistry.yaml market]"),
  "Growing fast",
);
check(
  "a source-code path is humanized via CODE_PATH_LABEL",
  stripFileCitations("hardcoded in apps/ecosystem/lib/zendesk/client.ts today"),
  "hardcoded in the app's Zendesk client today",
);
check(
  "a .yaml markdown link target survives the document variant",
  stripFileCitationsInMarkdown("See [CORE ELMS](../../competitors/core-elms.yaml) for more."),
  "See [CORE ELMS](../../competitors/core-elms.yaml) for more.",
);
check(
  "humanizeSourceRef resolves a relative accreditation ref",
  humanizeSourceRef("../accreditation/coca.yaml"),
  "COCA accreditation record",
);
// The "./" form: same citation, third spelling. content/accreditation/coa.yaml writes it
// twice, and before this was handled the leading "." survived into the folder position, so
// FOLDER_NOUN missed and the label degraded to a plain titleCase "Coca". A WRONG LABEL
// rather than a raw path — it renders plausibly and hides itself, which is why it outlived
// five follow-up tasks aimed at this exact file.
check(
  "./ prefixed citation resolves identically to the ../ and bare forms",
  stripFileCitations("cross-checked against ./coca.yaml before publishing"),
  "cross-checked against COCA accreditation record before publishing",
);
check(
  "humanizeSourceRef strips a ./ prefix",
  humanizeSourceRef("./coca.yaml"),
  humanizeSourceRef("coca.yaml"),
);
check(
  "./ inside a folder-qualified path still resolves",
  humanizeSourceRef("./accreditation/coca.yaml"),
  "COCA accreditation record",
);
check(
  "humanizeSourceRef passes a real https source through untouched",
  humanizeSourceRef("https://exxat.com/x.yaml"),
  "https://exxat.com/x.yaml",
);

// ---------------------------------------------------------------------------
// 2. .md — the synthesis layer and the pasted-in transcript documents.
//    content/prism/capability-map.yaml's pillar notes cite gap-analysis.md four times,
//    in both the folder-qualified and the bare form; all four rendered raw before this.
// ---------------------------------------------------------------------------

check(
  "repo-relative .md path is humanized",
  stripFileCitations("reading in content/synthesis/gap-analysis.md Pattern G that assumed"),
  "reading in Gap Analysis Pattern G that assumed",
);
check(
  "bare .md filename is humanized",
  stripFileCitations('the "stops at the student" reading in gap-analysis.md Pattern A — the gating'),
  'the "stops at the student" reading in Gap Analysis Pattern A — the gating',
);
check(
  "bare and folder-qualified .md forms produce the SAME label",
  humanizeSourceRef("gap-analysis.md"),
  humanizeSourceRef("content/synthesis/gap-analysis.md"),
);
check(
  "a parenthetical holding only a bare .md citation is deleted",
  stripFileCitations('comparisons (gap-analysis.md) described Prism as "generic."'),
  'comparisons described Prism as "generic."',
);
check(
  "a prose parenthetical containing a .md citation is deleted whole",
  stripFileCitations("an earlier reading (see content/synthesis/gap-analysis.md Pattern G) that assumed"),
  "an earlier reading that assumed",
);
check(
  "slash-separated .md list splits into separate citations",
  stripFileCitations("gap-analysis.md/prism-positioning.md"),
  "Gap Analysis/Prism Positioning",
);
check(
  "a real URL ending .md is left alone",
  stripFileCitations("read https://example.com/docs/readme.md now"),
  "read https://example.com/docs/readme.md now",
);
check(
  "a bare transcript .md filename is humanized",
  stripFileCitations('CRNAVideosTranscripts.md line 67: "If you"'),
  'CRNAVideosTranscripts line 67: "If you"',
);
check(
  "a pasted absolute /Users path to a .md file humanizes to its basename",
  stripFileCitations('/Users/someone/Downloads/CRNAVideosTranscripts.md line 57: "The case"'),
  'CRNAVideosTranscripts line 57: "The case"',
);

// ---------------------------------------------------------------------------
// 3. False-positive guards. ".md" is a much commoner-looking token than ".yaml", and this
//    corpus is full of clinical-credential spellings. The pattern requires a [\w-]+ stem
//    BEFORE the dot and a \b after "md", which is what rules all of these out.
// ---------------------------------------------------------------------------

check(
  "the M.D. credential is not a citation (no stem before the dot)",
  stripFileCitations("she holds an M.D. degree"),
  "she holds an M.D. degree",
);
check(
  "MD/DO is not a citation (no dot at all)",
  stripFileCitations("lost MD/DO RFPs"),
  "lost MD/DO RFPs",
);
check(
  "md5 and a .mdx filename are not .md citations (\\b after md)",
  stripFileCitations("the md5 hash and a mid-token x.mdx name"),
  "the md5 hash and a mid-token x.mdx name",
);
check(
  "an .md inside a longer word is not matched",
  stripFileCitations("the schema.mdinfo field"),
  "the schema.mdinfo field",
);

// ---------------------------------------------------------------------------
// 4. The Markdown-document variant's structural invariants.
//    Applied to whole documents (content/synthesis/gap-analysis.md, prism-positioning.md,
//    vocabulary-glossary.md, enterprise-repo/tool-comparison.md, synthesis/*/SALES.md),
//    where whitespace is structure and a "](...)" is a working link, not prose.
// ---------------------------------------------------------------------------

const doc = [
  "# Title",
  "",
  "> field and `synthesis/prism-positioning.md`. This is a business call.",
  "",
  "See [PRODUCT.md](./PRODUCT.md) and [`../gap-analysis.md`](../gap-analysis.md).",
  "",
  "```",
  "cat content/synthesis/gap-analysis.md",
  "```",
  "",
  "    indented four spaces stays",
].join("\n");
const out = (stripFileCitationsInMarkdown(doc) ?? "").split("\n");

check("document line count never changes", out.length, doc.split("\n").length);
check(
  "a .md citation inside a fenced code block is verbatim",
  out[7],
  "cat content/synthesis/gap-analysis.md",
);
check(
  "both .md link targets survive the widened pattern",
  out[4].includes("](./PRODUCT.md)") && out[4].includes("](../gap-analysis.md)"),
  true,
);
check("leading indentation is structure, not spacing", out[10], "    indented four spaces stays");
check(
  "a .md citation in document prose is humanized",
  out[2],
  "> field and `Prism Positioning`. This is a business call.",
);

// ---------------------------------------------------------------------------
// 4. CALL-SITE REGRESSION CHECK — the part that guards the bug this file keeps missing.
//
// Sections 1-3 test the sanitizer's LOGIC. Every defect actually shipped in this plan's
// last four follow-ups was instead a missing CALL — a render site that never invoked a
// sanitizer that worked perfectly. Logic tests cannot see that class of bug, which is why
// it recurred four times.
//
// WHAT THIS DOES. Two halves, and the first is what keeps it from rotting:
//
//   a) Read the real content/ tree and derive, from the data itself, the set of field names
//      that ACTUALLY contain a file citation today. Nothing is hardcoded — add a citation to
//      a new field in a YAML file tomorrow and that field name appears here automatically.
//   b) For every such field name, find every place the app's own source reads it, and
//      require each read either to be sanitized or to be listed in ALLOWED below with a
//      stated reason.
//
// WHY THIS SHAPE, and what it does NOT do. The brief offered a dynamic alternative: crawl a
// running build and assert zero raw filenames. That is strictly better evidence and it is
// implemented — in lib/sanitizer-audit.mts, which is how this task's fixes were verified.
// It is not wired in HERE because it needs `next build` plus a live server, which would turn
// a sub-second dependency-free `npm test` into a multi-minute one needing a free port. The
// two are complements: run `npm run audit:sanitizer` against a build for ground truth; this
// static check is the one that runs on every commit.
//
// Being static, it is a heuristic on both halves. It can be fooled by a read spelled in a
// way the scan does not recognise, and "sanitized" is judged by proximity, not by dataflow.
// It is a smoke alarm, not a proof — it exists to make the NEXT missing call site fail loudly
// at commit time instead of being discovered by a seventh person reading pages by hand.
//
// WHEN IT FAILS, the fix is one of exactly three things:
//   1. A genuinely new unsanitized render site -> wrap it. This is the case it is built for.
//   2. A read that is safe for a reason the scan cannot see -> add it to ALLOWED with that
//      reason written out. Do not delete the entry; the reason is the point.
//   3. A field renamed or a site moved -> update ALLOWED.
// ---------------------------------------------------------------------------

import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { load as loadYaml } from "js-yaml";

const APP_DIR = new URL("..", import.meta.url).pathname;
const CONTENT_DIR = join(APP_DIR, "..", "..", "content");

function walk(dir: string, ext: string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, ext));
    else if (ext.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

// Same detector as the sanitizer's own BARE_CONTENT_PATH, minus the start guard — see the
// matching note in sanitizer-audit.mts. An auditor should over-notice, never under-notice.
const CITATION = /(?:\/|(?:\.\.?\/)+)?(?:(?![\w.-]*\.(?:ya?ml|md)\/)[\w.-]+\/)*[\w-]+\.(?:ya?ml|md)\b/i;

/**
 * Field names whose real values contain a citation today, walked out of content/ itself.
 * Structural keys are excluded: they hold a citation because a citation is their JOB, and
 * they are rendered (where they are rendered at all) through humanizeSourceRef rather than
 * as prose.
 */
const CITATION_BY_DESIGN = new Set([
  "sources",
  "source",
  "source_id",
  "confirmed_by",
  "path",
  "file",
  "files",
  "related_flows",
  "cites",
  "citation",
]);

/**
 * A citation inside a SHORT value is a structural reference, not prose — `type: "yaml"`,
 * a one-token path, an id. Requiring real sentence length is what keeps generic key names
 * like `type` and `flow` from dragging in every unrelated `.type` in the codebase.
 */
const MIN_PROSE_LENGTH = 60;

/**
 * Two sets, because a citation reaches the screen by two different routes.
 *
 *   leaves     The key whose own string value holds the citation — `.rationale`,
 *              `.notes`. Reading one of these is reading the prose itself.
 *   containers The key one level ABOVE such a leaf — `accreditation_pressure`, whose
 *              value is a list of `{point, detail}` records and whose citation lives on
 *              the inner `detail`. Reading a container hands the whole subtree, prose
 *              included, to whatever is downstream.
 *
 * Containers are why this function returns a pair rather than one set. The
 * accreditation_pressure leak was a container read: the field NAME the builder wrote
 * (`p?.accreditation_pressure`) never appeared in a leaf-only set, because the citation
 * sat on the `detail` key nested inside it. A leaf-only scan cannot see that read at all,
 * which is half of why that bug shipped past this check. The two sets are kept apart
 * rather than merged because they need different render tests — see PASS_THROUGH below.
 */
function fieldsCarryingCitations(): { leaves: Set<string>; containers: Set<string> } {
  const leaves = new Set<string>();
  const parents = new Set<string>();
  const visit = (node: unknown, key: string | undefined, parentKey: string | undefined) => {
    if (typeof node === "string") {
      if (
        key &&
        !CITATION_BY_DESIGN.has(key) &&
        node.length > MIN_PROSE_LENGTH &&
        CITATION.test(node)
      ) {
        leaves.add(key);
        if (parentKey && parentKey !== key && !CITATION_BY_DESIGN.has(parentKey)) {
          parents.add(parentKey);
        }
      }
      return;
    }
    if (Array.isArray(node)) {
      // A sequence is not a key level: its items keep the key the sequence is bound to,
      // so `accreditation_pressure: [{detail: ...}]` still reports `accreditation_pressure`
      // as the parent of `detail`, not the anonymous list item.
      for (const v of node) visit(v, key, parentKey);
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) visit(v, k, key);
    }
  };
  for (const file of walk(CONTENT_DIR, [".yaml", ".yml"])) {
    try {
      visit(loadYaml(readFileSync(file, "utf8")), undefined, undefined);
    } catch {
      // A content file that does not parse is the density checker's problem, not this test's.
    }
  }
  // A name that is a leaf SOMEWHERE is treated as a leaf everywhere: the stricter of the
  // two tests wins, so a genuine prose read is never downgraded to the container rule.
  for (const l of leaves) parents.delete(l);
  return { leaves, containers: parents };
}

/**
 * Reads of a content field in app source: `.field_name` or `field_name:` in an object
 * literal built from content. A read counts as sanitized when a sanitizer call appears in
 * the same statement — approximated as the matched line plus the two lines around it, which
 * covers both the `{stripFileCitations(x.field)}` one-liner and the multi-line
 * `field: stripFileCitations(\n  obj?.field,\n)` builder form.
 */
const SANITIZERS = /strip(?:FileCitations|FileCitationsInMarkdown)|humanizeSourceRef/;

interface Unsanitized {
  file: string;
  line: number;
  field: string;
  text: string;
}

/**
 * Lines that mention a field without rendering its text: existence tests, counts,
 * predicates, sort keys. They are the bulk of the raw matches and none of them can put a
 * filename on screen.
 */
const NOT_A_RENDER = /\.length\b|\.filter\(|\.some\(|\.every\(|\.find\(|\.sort\(|\bkey=/;

/**
 * A CONTAINER read is only a hazard where the whole subtree is handed downstream — a
 * `prop: src.container` assignment in an object literal, which is exactly the shape the
 * accreditation_pressure leak had. Where a container is iterated, counted or tested, the
 * prose is reached through a LEAF field on the element, and that leaf read is judged on
 * its own line. Without this split, adding containers to the scan turned every
 * `doc.stages.forEach(` and `if (!doc?.standards)` in the codebase into a finding: 20
 * lib/ file:field pairs became 32 and app/ went from 5 to 22, none of the additions real.
 * Leaf fields do NOT get this gate — a leaf is prose wherever it is read.
 */
const PASS_THROUGH = /^\s*[A-Za-z_$][\w$]*\s*:/;
const ITERATION =
  /\.(?:map|forEach|flatMap|reduce|flat|join|slice|concat|entries|keys)\(|^\s*(?:if|for|while|return|const|let|var)\b/;

/** Net parenthesis balance of one line: > 0 means it leaves a group open. */
function netParens(line: string): number {
  return (line.match(/\(/g) ?? []).length - (line.match(/\)/g) ?? []).length;
}

/**
 * Is the read on line `i` actually wrapped in a sanitizer?
 *
 * This replaced a flat "±2 lines" text window, and the replacement is the other half of
 * why the accreditation_pressure leak shipped past this check. That field sat two lines
 * below two SANITIZED SIBLINGS:
 *
 *     archetypeSummary: stripFileCitations(p?.archetype_summary),
 *     switchingTrigger: stripFileCitations(p?.switching_trigger),
 *     accreditationPressure: p?.accreditation_pressure ?? [],   <-- raw, and passed
 *
 * The window saw "stripFileCitations" nearby and called the third line sanitized. Nearby
 * is not the same statement. So instead of a line count this walks the actual bracket
 * structure, in the only two directions a sanitizer for THIS read can live:
 *
 *   backward, to the statement HEAD — but only through lines that leave a group open
 *     (`field: stripFileCitations(` has net > 0), which is precisely what a finished
 *     sibling property (net == 0) does not do. That one condition is what makes the
 *     three lines above come out right.
 *   forward, into the statement BODY — but only when this line itself opens a group, so
 *     `x: (a?.b ?? []).map((p) => ({ point: stripFileCitations(p.point) }))` spread over
 *     several lines still reads as sanitized. That is the shape of the FIX for the same
 *     field, so without this half the check would flag the corrected code.
 */
function sanitizedAt(lines: string[], i: number): boolean {
  if (SANITIZERS.test(lines[i])) return true;
  let back = 0;
  for (let j = i - 1; j >= 0 && i - j <= 3; j--) {
    back += netParens(lines[j]);
    if (back < 0) break;
    if (back > 0 && SANITIZERS.test(lines[j])) return true;
  }
  let fwd = netParens(lines[i]);
  for (let j = i + 1; j < lines.length && j - i <= 6; j++) {
    // A line opening `.`, `?` or `:` continues the statement even when the line before it
    // closed every bracket it opened:
    //   `.`  a method chain — `features: (pillar?.features ?? [])` is net-zero and the
    //        `.map((f) => ({ ... }))` carrying its sanitizers starts on the NEXT line.
    //   `?`/`:`  a ternary whose test is the bare field read and whose branches, one line
    //        down, hold the wrap — `const signal = c.exxat_opportunity` /
    //        `  ? stripFileCitations(leadSentence(c.exxat_opportunity))`. The single-line
    //        existence-test lookahead cannot see that `?`, because it is not on the line.
    const chained = /^\s*[.?:]/.test(lines[j]);
    if (fwd <= 0 && !chained) break;
    if (SANITIZERS.test(lines[j])) return true;
    fwd += netParens(lines[j]);
  }
  return false;
}

/**
 * Scan one source directory for unsanitized reads of `fields`.
 *
 * SCOPE, and why it is two directories and not three. `app/` and `lib/` are scanned;
 * `components/` is not.
 *
 *   app/    A page reads lib/content.ts getters directly, so what it holds is raw YAML and
 *           an unwrapped render there is a real bug. The routes are where the bugs were,
 *           five times running.
 *   lib/    The builders (lib/dissection-node-detail.ts is the big one) read raw content
 *           directly — exactly like an app/ page does — so the same reasoning applies, and
 *           lib/ is where this series' worst gaps actually lived: personaDetail's
 *           accreditation_pressure leak shipped past this very check while lib/ was
 *           excluded. Added in follow-up 8, which closed that gap; the retroactive test
 *           below pins it. Widening the directory turned out to be the SMALLEST part of
 *           that work: pointed at lib/ unchanged, the scan still missed the very leak it
 *           was widened for, three times over — see fieldsCarryingCitations (containers),
 *           the `??` note in the loop below, and sanitizedAt. A scope change alone would
 *           have closed the gap on paper and left the bug catchable by nobody.
 *   components/  EXCLUDED, and this exclusion is justified by measurement, not by symmetry
 *           with the above. Components mostly receive props already sanitized upstream by a
 *           lib/ builder, and a static scan cannot follow that dataflow — including them
 *           produced ~40 findings of which every single one was a false positive, which is
 *           a check nobody will keep running. That argument does NOT apply to lib/, which
 *           is why lib/ is in and components/ is out.
 *
 * The matching logic below is shared unmodified across both directories. It operates on
 * plain text lines, not on JSX syntax, so it transfers to `.ts` as-is — verified
 * empirically when lib/ was added rather than assumed.
 */
function unsanitizedReads(
  fields: { leaves: Set<string>; containers: Set<string> },
  dir: string,
  exts: string[],
): Unsanitized[] {
  const out: Unsanitized[] = [];
  // resolve(), not join(), so an absolute dir is honoured — the retroactive fixture below
  // scans a temp directory rather than a path under the app.
  for (const file of walk(resolve(APP_DIR, dir), exts)) {
    const lines = readFileSync(file, "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line)) continue;
      if (NOT_A_RENDER.test(line)) continue;
      for (const field of [...fields.leaves, ...fields.containers]) {
        // A ternary TEST ("{x.notes ? (") is an existence check; the render is on a later
        // line and gets judged on its own. `??` is NOT that: `x.notes ?? []` is a DEFAULT,
        // and the value flows onward. The original `(?!\.)` lookahead only excluded `?.`,
        // so every `field ?? fallback` read in the codebase was being skipped as a mere
        // existence test — including `p?.accreditation_pressure ?? []`, the exact line of
        // this series' worst leak.
        if (new RegExp(String.raw`\.${field}\b\s*\?(?![.?])`).test(line)) continue;
        if (!new RegExp(String.raw`\.${field}\b`).test(line)) continue;
        if (
          fields.containers.has(field) &&
          (!PASS_THROUGH.test(line) || ITERATION.test(line))
        ) {
          continue;
        }
        if (sanitizedAt(lines, i)) continue;
        out.push({
          file: relative(APP_DIR, file),
          line: i + 1,
          field,
          text: line.trim().slice(0, 110),
        });
      }
    }
  }
  return out;
}

/**
 * Reads that are safe for a reason the static scan cannot see. Every entry states WHY —
 * an entry without a reason is indistinguishable from a bug someone silenced.
 */
const ALLOWED = new Set([
  // `dissectionNodeId.persona(...)` is a function on a helper object. It collides with the
  // content field name `persona` and renders nothing.
  "app/domains/[slug]/persona/page.tsx:persona",
  // app/page.tsx's roadmap timeline is a TIMELINE const literal declared at the top of that
  // file. Its `detail` strings are written in the .tsx, never loaded from content/, so they
  // cannot carry a content filename. Same for the HORIZONS const beside it.
  "app/page.tsx:detail",
  // Renders `artifact.type`, a short enum ("screenshot" / "memo"). It shares a name with a
  // content field somewhere in the corpus whose value happens to be long prose containing a
  // citation; this is not that field.
  "app/reference/vendor-comparison-chart/page.tsx:type",
  // The `.map((q) => (` iteration header. The render is per-element inside the callback and
  // IS wrapped — `{stripFileCitations(q)}` — just beyond this scan's proximity window.
  "app/prism/page.tsx:open_questions_for_phase_2",
]);

/**
 * The lib/ equivalent of ALLOWED, kept SEPARATE on purpose.
 *
 * The two directories share field names — `persona`, `type`, `detail` all collide — and an
 * `app/` entry's reason is almost never the `lib/` entry's reason. Merging the sets would
 * let a stated reason silently cover a read it was never written about, which is the exact
 * failure the "every entry states WHY" rule exists to prevent.
 *
 * Every entry below was traced to its render site before being written down.
 */
const ALLOWED_LIB = new Set([
  // --- Not prose: a closed node-kind enum -------------------------------------------
  // `DissectionNodeType` ("pillar" | "persona" | "competitor" | ...). These are a sort
  // rank, a lane index and a switch dispatch; none renders text. The name collides with a
  // content field `type` elsewhere in the corpus whose value is long prose.
  "lib/dissection-graph.ts:type",
  "lib/dissection-node-detail.ts:type",
  "lib/graph-layout.ts:type",
  // `optStr(snap.type) ?? "support-ticket"` — a short source-kind enum, same collision.
  "lib/content.ts:type",

  // --- Not a render: predicate, slug or href ----------------------------------------
  // `ref.flow.replace(/\.yaml$/i, "")` converts a citation-shaped ref INTO a slug; the
  // extension is removed on this very line. The other `flow` read builds `/flows/${slug}`.
  "lib/content.ts:flow",
  // `elementProseHit(stage.accreditation_link, ...)` returns a boolean.
  "lib/content.ts:accreditation_link",
  // buildComputedUseCaseIndex's `prose` haystack (content.ts:1235-1237). Its only use is
  // the `prose.some((p) => elementProseHit(p, id, accreditorShort))` predicate at :1240.
  // The match records pushed at :1242-1250 carry kind/label/href/context only — the
  // citation text never leaves the matcher.
  "lib/content.ts:accreditation_citation",

  // --- Sanitized downstream, at the render site -------------------------------------
  // normalizeStage only ALIASES drifted key spellings onto a canonical name. Both render
  // sites wrap: components/journey-stage-section.tsx:56 and :63, and the list variant at
  // components/discipline-variance-list.tsx:25.
  "lib/content.ts:domain_variance",
  "lib/content.ts:discipline_variance",
  // StandardsCrosswalkRow prose. Every render site wraps:
  // components/dissect/standard-detail-panel.tsx:153 and :155,
  // components/exxat-gap-answer.tsx:131, app/domains/[slug]/win/page.tsx:259.
  "lib/content.ts:prism_fit_rationale",
  "lib/content.ts:gap_notes",
  // featureTeardown is handed through raw but its only render path is the shared
  // CompetitorFeatureDossier, which wraps both prose fields at
  // components/competitor-feature-dossier.tsx:34 (competitor_capability) and :40 (evidence).
  "lib/dissection-node-detail.ts:feature_teardown",

  // --- Built, but never rendered ----------------------------------------------------
  // FeatureComparisonRow cells. The one consumer, components/charts/feature-depth-chart.tsx:29-32,
  // projects only {competitor, depth, pillar} into Observable Plot; capability/evidence/
  // source/slug are dropped there. They still ship in the RSC payload, which is the
  // sanitizer-audit tool's tracked payload-only tier, not a visible defect.
  "lib/content.ts:competitor_capability",
  "lib/content.ts:evidence",
  // SourceRegistryEntry.what_it_supports has ZERO readers under app/ or components/ —
  // components/source-list.tsx:96-125 reads publisher/date/evidence_status/type/title/url/id
  // only. Built from prose (`caveat`, `finding`), so it is a latent hazard the moment
  // anyone renders it, but it is not on screen today.
  "lib/content.ts:what_it_supports",
  "lib/content.ts:caveat",
]);

const citationFields = fieldsCarryingCitations();
check(
  "content/ still carries prose file citations (if 0, this whole check is silently vacuous)",
  citationFields.leaves.size > 0,
  true,
);
check(
  "content/ nests citations inside container fields (the accreditation_pressure shape)",
  citationFields.containers.size > 0,
  true,
);

const offenders = [
  ...unsanitizedReads(citationFields, "app", [".tsx"]).filter(
    (o) => !ALLOWED.has(`${o.file}:${o.field}`),
  ),
  ...unsanitizedReads(citationFields, "lib", [".ts"]).filter(
    (o) => !ALLOWED_LIB.has(`${o.file}:${o.field}`),
  ),
];

if (offenders.length) {
  failures.push(
    "unsanitized reads of content fields that really contain file citations:\n" +
      offenders
        .map((o) => `      ${o.file}:${o.line}  [${o.field}]  ${o.text}`)
        .join("\n") +
      "\n    Wrap each in stripFileCitations, or add it to ALLOWED/ALLOWED_LIB with a stated reason.",
  );
} else {
  passed++;
}

// ---------------------------------------------------------------------------
// 6. THE RETROACTIVE TEST — does the scanner above actually catch the bug it was
//    widened for?
//
// A checker that reports zero proves nothing on its own; it reports zero both when the
// tree is clean and when the checker is blind. So this feeds it the REAL pre-fix source
// of the leak it missed — personaDetail's `accreditation_pressure`, as it stood in commit
// 61c1273's parent — and requires a finding.
//
// The fixture is the genuine shape, reproduced verbatim rather than simplified, because
// all three of its details are what defeated the previous scanner and each is now a
// separate reason this test can fail:
//
//   1. the citation lives on `detail`, NESTED inside accreditation_pressure, so a
//      leaf-only field set never contained the name the builder actually reads;
//   2. the read is `?? []`, which the old ternary-existence lookahead skipped wholesale;
//   3. it sits directly beneath two SANITIZED SIBLINGS, which the old ±2-line window
//      accepted as proof that this line was sanitized too.
//
// If someone simplifies any of the three away, this stops testing what it says it tests.
// ---------------------------------------------------------------------------

const fixtureDir = mkdtempSync(join(tmpdir(), "sanitizer-regress-"));
try {
  writeFileSync(
    join(fixtureDir, "pre-fix-persona-detail.ts"),
    [
      "function personaDetail(node: DissectionNode): PersonaNodeDetail {",
      "    return {",
      "      competitorReads: [],",
      "      archetypeSummary: stripFileCitations(p?.archetype_summary),",
      "      switchingTrigger: stripFileCitations(p?.switching_trigger),",
      "      accreditationPressure: p?.accreditation_pressure ?? [],",
      "      found: !!p,",
      "    };",
      "}",
      "",
    ].join("\n"),
  );
  const caught = unsanitizedReads(citationFields, fixtureDir, [".ts"]);
  check(
    "the real pre-fix accreditation_pressure leak is flagged (commit 61c1273's parent)",
    caught.some((o) => o.field === "accreditation_pressure"),
    true,
  );
  check(
    "its two already-sanitized siblings are NOT flagged alongside it",
    caught.map((o) => o.field).filter((f) => f === "archetype_summary" || f === "switching_trigger")
      .length,
    0,
  );
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------

if (failures.length) {
  console.error(`\n${failures.length} FAILED, ${passed} passed\n`);
  for (const f of failures) console.error(`  FAIL ${f}\n`);
  process.exit(1);
}
console.log(`strip-file-citations: ${passed} passed, 0 failed`);
