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

if (failures.length) {
  console.error(`\n${failures.length} FAILED, ${passed} passed\n`);
  for (const f of failures) console.error(`  FAIL ${f}\n`);
  process.exit(1);
}
console.log(`strip-file-citations: ${passed} passed, 0 failed`);
