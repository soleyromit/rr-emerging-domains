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

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
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

function fieldsCarryingCitations(): Set<string> {
  const found = new Set<string>();
  const visit = (node: unknown, key: string | undefined) => {
    if (typeof node === "string") {
      if (
        key &&
        !CITATION_BY_DESIGN.has(key) &&
        node.length > MIN_PROSE_LENGTH &&
        CITATION.test(node)
      ) {
        found.add(key);
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const v of node) visit(v, key);
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) visit(v, k);
    }
  };
  for (const file of walk(CONTENT_DIR, [".yaml", ".yml"])) {
    try {
      visit(loadYaml(readFileSync(file, "utf8")), undefined);
    } catch {
      // A content file that does not parse is the density checker's problem, not this test's.
    }
  }
  return found;
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

function unsanitizedReads(fields: Set<string>): Unsanitized[] {
  const out: Unsanitized[] = [];
  // Scoped to app/ deliberately. A page under app/ reads lib/content.ts getters directly,
  // so what it holds is raw YAML and an unwrapped render there is a real bug. Components
  // under components/ mostly receive props already sanitized by a lib/ builder
  // (dissection-node-detail.ts is the big one), and a static scan cannot follow that
  // dataflow — including them produced ~40 findings of which every single one was a false
  // positive, which is a check nobody will keep running. The routes are where the bugs
  // were, five times running.
  for (const file of walk(join(APP_DIR, "app"), [".tsx"])) {
    const lines = readFileSync(file, "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line)) continue;
      if (NOT_A_RENDER.test(line)) continue;
      for (const field of fields) {
        // A ternary TEST ("{x.notes ? (") is an existence check; the render is on a later
        // line and gets judged on its own.
        if (new RegExp(String.raw`\.${field}\b\s*\?(?!\.)`).test(line)) continue;
        if (!new RegExp(String.raw`\.${field}\b`).test(line)) continue;
        const window_ = lines.slice(Math.max(0, i - 2), i + 3).join("\n");
        if (SANITIZERS.test(window_)) continue;
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

const citationFields = fieldsCarryingCitations();
check(
  "content/ still carries prose file citations (if 0, this whole check is silently vacuous)",
  citationFields.size > 0,
  true,
);

const offenders = unsanitizedReads(citationFields).filter(
  (o) => !ALLOWED.has(`${o.file}:${o.field}`),
);

if (offenders.length) {
  failures.push(
    "unsanitized reads of content fields that really contain file citations:\n" +
      offenders
        .map((o) => `      ${o.file}:${o.line}  [${o.field}]  ${o.text}`)
        .join("\n") +
      "\n    Wrap each in stripFileCitations, or add it to ALLOWED with a stated reason.",
  );
} else {
  passed++;
}

// ---------------------------------------------------------------------------

if (failures.length) {
  console.error(`\n${failures.length} FAILED, ${passed} passed\n`);
  for (const f of failures) console.error(`  FAIL ${f}\n`);
  process.exit(1);
}
console.log(`strip-file-citations: ${passed} passed, 0 failed`);
