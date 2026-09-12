/**
 * Raw-filename audit: crawl every route this app serves and report where a content
 * filename (`*.yaml` / `*.yml` / `*.md`) still reaches the browser.
 *
 * WHY THIS FILE IS COMMITTED. Follow-ups 3, 4 and 5 of this plan each independently
 * rediscovered a render site that forgot to call `stripFileCitations`, and each one
 * rebuilt a throwaway crawler to find it — twice the crawler died with the session and
 * the next task started from nothing. This is that crawler, kept, so the seventh
 * discovery is a 30-second command instead of an afternoon.
 *
 * RUN IT:
 *
 *     cd apps/ecosystem
 *     npx next build && npx next start -p 3999 &      # any free port
 *     npm run audit:sanitizer -- --base http://localhost:3999
 *     kill %1
 *
 * `npm run audit:sanitizer` defaults to http://localhost:3000. `--json` prints the raw
 * findings array instead of the report (including waived findings, flagged as such — a
 * consumer can filter).
 *
 * Exit code: 1 when there is an unwaived finding in a VISIBLE tier; 0 otherwise. Payload-only
 * findings are printed but do not fail the run by default — that tier is a ~6,000-item
 * tracked backlog, and gating on it would mean a permanently red check. Pass `--strict` to
 * include it. See INTENTIONAL below for what is waived and why.
 *
 * THE TWO-SCAN RULE — the reason this tool exists in this shape rather than a simpler one.
 * Follow-up 5's review established that either scan ALONE systematically misreports this
 * app, in opposite directions:
 *
 *   - A rendered-text scan (delete <script>/<style>, strip tags) UNDER-reports. It deletes
 *     the RSC flight payload along with the real script tags, so payload-only bleed is
 *     invisible to it — that is exactly how /feature-map's 43 leaked filenames went unseen
 *     for three tasks.
 *   - A raw-source scan OVER-reports. It catches the payload, but calls inert prop data
 *     nobody will ever see a "visible defect", which pushes the wrong fix (sanitize it)
 *     over the right one (stop shipping it).
 *
 * So both scans run separately here and every finding is tagged with which one saw it.
 * Collapsing them into a single "leak found" count has already cost this plan one missed
 * route; don't re-collapse them.
 *
 * TIERS, and what each one means for the fix:
 *
 *   visible-first-paint   In the server-rendered markup, outside any collapsed panel.
 *                         A reader sees this without clicking. Fix: wrap the render site.
 *   visible-on-interaction
 *                         In the markup, but inside a collapsed <Collapsible> — in the
 *                         DOM, not on screen until clicked. Same fix, lower urgency.
 *   payload-only          Seen in the served bytes but not in the server-rendered markup.
 *
 * READ THIS BEFORE TRUSTING THE "payload-only" TIER. It does NOT mean "nobody can ever see
 * this". It means "not in the markup this route ships". Two very different things land in
 * it, and they take opposite fixes:
 *
 *   (a) Genuinely dead prop data — a field serialized into the payload that no component
 *       reads at any interaction depth. /feature-map's per-pillar `sources` was this: 43
 *       filenames on the wire, rendered nowhere. Fix: stop shipping the data.
 *   (b) Client-component state that simply is not the initial one — the non-selected tab of
 *       a <Tabs>, a list the client paginates. It is one click from the screen, but no
 *       amount of markup scanning will show it, because the markup never contained it.
 *       /feature-map's `opportunity` field was exactly this and sat misfiled here until a
 *       human read the surrounding component. Fix: wrap the render site, same as any
 *       visible leak.
 *
 * Telling (a) from (b) requires reading the consuming component. The tool cannot do it and
 * does not pretend to; treat "payload-only" as "triage this by hand", not as "ignore".
 *
 * The first-paint/interaction split among VISIBLE findings is likewise a heuristic (it looks
 * for the nearest enclosing element carrying a collapsed-state attribute). A finding tiered
 * "visible-on-interaction" is still a finding; the tier only orders the queue.
 *
 * WHAT THIS TOOL CANNOT SEE — read before quoting its numbers as a leak total.
 *
 * It counts what its PATTERN matches, which is not the same as what a reader can see. The
 * pattern is deliberately kept in lockstep with the sanitizer's own BARE_CONTENT_PATH (see
 * RAW_FILENAME below), and that pattern's path segments are `[\w.-]+` — so it cannot match a
 * filename containing a SPACE. This is not a corner case in this repo: contributor vault
 * paths like
 *
 *   /Users/<name>/Downloads/PRISM-Expansion-Vault/…/Clinical Internship Evaluation Tool
 *   - Version 2.0.md
 *
 * used to render in first-paint visible text on dozens of routes, and an independent crawl
 * counted ~1,008 such occurrences across ~48 routes that this tool reported as ZERO.
 *
 * THAT SPECIFIC INSTANCE IS NOW CLOSED. Follow-up 7 stripped the local machine-path prefixes
 * (`/Users/<name>/Downloads/` and `/Users/<name>/Documents/GitHub/rr-emerging-domains/`) from
 * 1,314 citations across 49 `content/*.yaml` files. The same independent crawl now counts
 * **0 visible occurrences across 0 of 165 routes**. The evidentiary content — the document
 * title, its line numbers, its quoted excerpts — was preserved verbatim; only the machine-path
 * prefix was removed.
 *
 * THE BLIND SPOT ITSELF REMAINS, and that is why this paragraph is not deleted. The pattern
 * still cannot match a spaced filename, so a spaced path reintroduced into content/ tomorrow
 * would again be reported as zero. What changed is the count, not the capability. Guard it
 * with the grep this task used, which needs no pattern at all:
 *
 *     grep -rn "/Users/" content/          # expect only sources/registry.yaml's 2 path: fields
 *
 * Note also that the spaced vault paths were never wholly invisible here: the detector matches
 * their `2.0.md` tail and reports it as a filename literally named "0.md". Those findings are
 * about the retained, legitimate document title, NOT the removed machine path, so they survive
 * this fix unchanged. Do not read them as residual leak.
 *
 * So: a clean run of this tool means "no raw filename THIS DETECTOR CAN SEE", never "no raw
 * filenames". The report prints that caveat on every run for the same reason it is written
 * here — the previous version's summary line read as a completeness claim and was quoted as
 * one. If you widen the detector later, delete this paragraph and the report's caveat line
 * together, so the two can never disagree.
 */

import { humanizeSourceRef } from "./strip-file-citations.ts";

// ---------------------------------------------------------------------------
// What counts as a raw filename.
// ---------------------------------------------------------------------------

/**
 * Deliberately NOT a second, divergent detector. This is `BARE_CONTENT_PATH` from
 * strip-file-citations.ts with one change: the `(?<![\w./-])` start guard is dropped.
 *
 * That guard exists to stop the SANITIZER chewing a path segment out of a real URL. An
 * AUDITOR wants the opposite bias — it should over-notice and let a human dismiss, never
 * quietly skip. The URL case is handled after the fact instead (see `isInsideUrl`), where
 * it can be reported as "ignored, looked like a URL" rather than silently dropped.
 *
 * Keeping the rest character-identical matters: if this pattern and the sanitizer's ever
 * drift, this tool starts reporting leaks the sanitizer cannot fix, or (worse) passing a
 * route the sanitizer is failing on.
 */
const EXT = String.raw`\.(?:ya?ml|md)`;
const RAW_FILENAME = new RegExp(
  String.raw`(?:\/|(?:\.\.?\/)+)?(?:(?![\w.-]*${EXT}\/)[\w.-]+\/)*[\w-]+${EXT}\b`,
  "gi",
);

/**
 * A real link to a spec file on some vendor's site ("https://host/spec/openapi.yaml") is
 * not a leak. Checked by looking backwards from the match for a scheme with no intervening
 * whitespace or quote, which is what actually distinguishes a URL from prose that happens
 * to contain slashes.
 */
function isInsideUrl(haystack: string, index: number): boolean {
  const back = haystack.slice(Math.max(0, index - 200), index);
  const lastBreak = Math.max(
    back.lastIndexOf(" "),
    back.lastIndexOf("\n"),
    back.lastIndexOf('"'),
    back.lastIndexOf("'"),
    back.lastIndexOf(">"),
  );
  return /https?:\/\//i.test(back.slice(lastBreak + 1));
}

export interface Finding {
  route: string;
  filename: string;
  tier: "visible-first-paint" | "visible-on-interaction" | "payload-only";
  /** Which scan saw it. A finding can be seen by both; `scans` records that honestly. */
  scans: ("visible-text" | "raw-source")[];
  /**
   * Counted SEPARATELY per scan, and never merged into one number. The raw-source count
   * includes every occurrence inside the flight payload, which on this app runs 10-100x
   * the on-screen count — reporting a single figure made `/domains/te/standards` look like
   * a 17-occurrence visible leak when 1 is visible and 16 are payload. A merged count
   * misrepresents the severity of exactly the tier that matters most.
   */
  visibleCount: number;
  sourceCount: number;
  /** A short excerpt of the first occurrence, for eyeballing whether it is a real leak. */
  sample: string;
  /** What stripFileCitations WOULD have rendered instead, so a fix's effect is obvious. */
  wouldRenderAs: string;
}

// ---------------------------------------------------------------------------
// The two scans.
// ---------------------------------------------------------------------------

/**
 * Scan 1: what a reader can actually read. Script and style elements go first — which is
 * precisely what removes the flight payload, hence scan 2 existing at all.
 *
 * Collapsed-panel content survives this strip (it IS in the markup), so the tier is
 * decided afterwards by looking at what encloses the hit.
 */
function visibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Is this offset inside a collapsed region? Walks backwards counting element opens and
 * closes to find the nearest still-open ancestor carrying a collapsed marker.
 *
 * Heuristic by necessity: the design system renders a closed Collapsible with
 * `data-state="closed"` / `aria-expanded="false"` / `hidden`, and which of those appears
 * depends on the component. Getting this wrong only mis-orders the queue — the finding is
 * still reported either way, which is the property that matters.
 */
const COLLAPSED_MARKER = /\b(?:data-state="closed"|aria-expanded="false"|aria-hidden="true"|hidden(?:=""|\s|>))/;

function isInsideCollapsed(html: string, index: number): boolean {
  const before = html.slice(0, index);
  // Only the last ~20k of preceding markup is worth walking; a collapsed panel wrapping a
  // hit from further away than that would be an enormous panel, and the walk is O(n).
  const window_ = before.slice(-20000);
  const tags = [...window_.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g)];
  let depth = 0;
  for (let i = tags.length - 1; i >= 0; i--) {
    const [, slash, , attrs] = tags[i];
    if (slash) {
      depth++;
      continue;
    }
    if (depth > 0) {
      depth--;
      continue;
    }
    // An unclosed ancestor of the hit.
    if (COLLAPSED_MARKER.test(attrs)) return true;
  }
  return false;
}

function collect(haystack: string): Map<string, { count: number; index: number }> {
  const out = new Map<string, { count: number; index: number }>();
  for (const m of haystack.matchAll(RAW_FILENAME)) {
    if (m.index === undefined) continue;
    if (isInsideUrl(haystack, m.index)) continue;
    const key = m[0];
    const prev = out.get(key);
    if (prev) prev.count++;
    else out.set(key, { count: 1, index: m.index });
  }
  return out;
}

export async function auditRoute(base: string, route: string): Promise<Finding[]> {
  const res = await fetch(new URL(route, base));
  const html = await res.text();
  const text = visibleText(html);

  const inText = collect(text);
  const inSource = collect(html);

  const findings: Finding[] = [];
  for (const [filename, srcHit] of inSource) {
    const textHit = inText.get(filename);
    const scans: Finding["scans"] = textHit ? ["visible-text", "raw-source"] : ["raw-source"];
    let tier: Finding["tier"];
    if (!textHit) {
      tier = "payload-only";
    } else {
      // Tier off the markup position, not the stripped-text position — the collapsed-state
      // attributes only exist in the markup.
      const markupIndex = html.indexOf(filename);
      tier =
        markupIndex >= 0 && isInsideCollapsed(html, markupIndex)
          ? "visible-on-interaction"
          : "visible-first-paint";
    }
    const source = textHit ? text : html;
    const at = textHit ? textHit.index : srcHit.index;
    findings.push({
      route,
      filename,
      tier,
      scans,
      visibleCount: textHit?.count ?? 0,
      sourceCount: srcHit.count,
      sample: source.slice(Math.max(0, at - 70), at + filename.length + 70).replace(/\s+/g, " "),
      wouldRenderAs: humanizeSourceRef(filename),
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Intentional, reviewed exceptions.
// ---------------------------------------------------------------------------

/**
 * Filenames a route is SUPPOSED to name on screen.
 *
 * Two pages each render a provenance line naming the single document they are built from —
 * "…the verbatim source text from `content/synthesis/gap-analysis.md`" — as literal JSX
 * inside a <code> element. No sanitizer runs on them and none should: on a singleton page
 * about one document, naming that document is useful provenance rather than a leaked
 * implementation detail. (app/domains/[slug]/win/page.tsx makes the opposite call for the
 * same sentence, correctly — it is templated over four per-domain briefs, so a filename
 * there would be both wrong and meaningless.) Reviewed and confirmed intentional.
 *
 * Why they need a waiver rather than a shrug: without one this tool exits 1 on a clean app,
 * so its exit code cannot gate anything, and "the audit is red but the red is fine" is how a
 * check stops being read at all. Waived findings are still PRINTED — they are just not
 * failures. Keep this list tiny, and only for cases a human has actually looked at.
 */
const INTENTIONAL: { route: string; filename: string }[] = [
  { route: "/synthesis/gap-analysis", filename: "content/synthesis/gap-analysis.md" },
  { route: "/repo-comparison", filename: "content/enterprise-repo/tool-comparison.md" },
];

function isIntentional(f: Finding): boolean {
  return INTENTIONAL.some((w) => w.route === f.route && w.filename === f.filename);
}

// ---------------------------------------------------------------------------
// Route discovery.
// ---------------------------------------------------------------------------

/**
 * Every route the app really serves, from two sources unioned together.
 *
 * 1. `.next/prerender-manifest.json` — Next's own list of prerendered routes, with all
 *    `[slug]` segments already expanded from generateStaticParams. Authoritative, needs no
 *    maintenance, and stays correct when a new domain is added to content/.
 * 2. A BFS over same-origin hrefs, as a backstop for anything served but not prerendered.
 *
 * Neither alone is sufficient, and finding that out is what this tool is for. A pure link
 * crawl found 132 routes and MISSED /domains/crna/persona — a real page, serving three raw
 * filenames in first-paint text, that simply is not linked from its own domain hub. The
 * manifest lists 165. A first draft of this file used the crawl alone and would have
 * reported that route clean by never asking it, which is precisely the "the tool said it
 * was fine" failure this task exists to prevent.
 */
async function manifestRoutes(): Promise<string[]> {
  try {
    const { readFile } = await import("node:fs/promises");
    const path = new URL("../.next/prerender-manifest.json", import.meta.url);
    const manifest = JSON.parse(await readFile(path, "utf8")) as {
      routes?: Record<string, unknown>;
    };
    return Object.keys(manifest.routes ?? {}).filter((r) => !r.endsWith(".rsc"));
  } catch {
    // No build on disk (or a future Next that moves the file): fall back to the crawl
    // alone, but say so rather than silently auditing a third of the app.
    console.warn(
      "! .next/prerender-manifest.json unreadable — falling back to link discovery only.\n" +
        "  Run `npx next build` first; a link crawl alone misses routes nothing links to.",
    );
    return [];
  }
}

export async function discoverRoutes(base: string, max = 400): Promise<string[]> {
  const fromManifest = await manifestRoutes();
  const seen = new Set<string>(["/", ...fromManifest]);
  const queue = ["/"];
  const out: string[] = [...fromManifest.filter((r) => r !== "/")];
  while (queue.length && out.length < max) {
    const route = queue.shift()!;
    out.push(route);
    let html: string;
    try {
      html = await (await fetch(new URL(route, base))).text();
    } catch {
      continue;
    }
    for (const m of html.matchAll(/href="(\/[^"#]*)"/g)) {
      // Drop the query string: `?node=…` on the dissect routes would otherwise enumerate
      // every node in every graph as a separate "route" for identical served HTML.
      const href = m[1].split("?")[0].replace(/\/$/, "") || "/";
      if (href.startsWith("//") || href.startsWith("/_next")) continue;
      if (/\.(png|jpe?g|svg|ico|webp|txt|xml|json)$/i.test(href)) continue;
      if (seen.has(href)) continue;
      seen.add(href);
      queue.push(href);
    }
  }
  return out.sort();
}

// ---------------------------------------------------------------------------
// CLI.
// ---------------------------------------------------------------------------

const TIER_ORDER: Finding["tier"][] = [
  "visible-first-paint",
  "visible-on-interaction",
  "payload-only",
];

/**
 * Printed on EVERY run, clean or not. The previous version's summary read as a completeness
 * claim ("all 15 remaining occurrences") and was quoted as one downstream; it was not one.
 * The caveat belongs in the output rather than only in this file's header, because the
 * output is the part that gets pasted into a report.
 */
const SCOPE_CAVEAT =
  "NOTE ON SCOPE: these counts are what this detector's pattern can match, NOT a complete\n" +
  "leak total. The pattern is kept in lockstep with the sanitizer's own BARE_CONTENT_PATH,\n" +
  "whose path segments are [\\w.-]+ — so filenames containing SPACES are invisible to it.\n" +
  "Contributor vault paths (\"…/Clinical Internship Evaluation Tool - Version 2.0.md\") were\n" +
  "the known instance: ~1,008 occurrences across ~48 routes rendered visibly and counted here\n" +
  "as zero. Follow-up 7 fixed that in content/; an independent crawl now finds 0 across all\n" +
  "165 routes. The BLIND SPOT REMAINS — a spaced path added tomorrow would again read as zero,\n" +
  "so verify with: grep -rn \"/Users/\" content/ (expect only registry.yaml's 2 path: fields).\n" +
  "Read a clean run as \"nothing this detector can see\".";

export function formatReport(findings: Finding[], routeCount: number): string {
  const lines: string[] = [];
  const waived = findings.filter(isIntentional);
  const failing = findings.filter((f) => !isIntentional(f));

  lines.push(`Crawled ${routeCount} routes.`);
  lines.push("");
  lines.push(SCOPE_CAVEAT);

  if (!failing.length) {
    lines.push("");
    lines.push(
      "No unwaived raw content filenames found in markup or payload " +
        "(subject to the scope note above).",
    );
  }
  for (const tier of TIER_ORDER) {
    const inTier = failing.filter((f) => f.tier === tier);
    const onScreen = inTier.reduce((n, f) => n + f.visibleCount, 0);
    const inSource = inTier.reduce((n, f) => n + f.sourceCount, 0);
    lines.push("");
    lines.push(
      `## ${tier} — ${inTier.length} distinct filename(s), ` +
        `${onScreen} on-screen occurrence(s), ${inSource} in raw source`,
    );
    if (!inTier.length) {
      lines.push("  (none)");
      continue;
    }
    for (const f of inTier.sort((a, b) => b.visibleCount - a.visibleCount || b.sourceCount - a.sourceCount)) {
      lines.push(
        `  ${f.route}  ${f.filename}  ×${f.visibleCount} on screen (×${f.sourceCount} in source)` +
          `  -> would render as "${f.wouldRenderAs}"`,
      );
      lines.push(`      …${f.sample}…`);
    }
  }

  // Printed, never a failure — a waiver nobody can see is indistinguishable from a blind spot.
  if (waived.length) {
    lines.push("");
    lines.push(`## waived — ${waived.length} reviewed, intentional filename(s) on screen`);
    for (const f of waived) {
      lines.push(`  ${f.route}  ${f.filename}  ×${f.visibleCount} on screen — intentional provenance`);
    }
  }
  return lines.join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const baseIdx = argv.indexOf("--base");
  const base = baseIdx >= 0 ? argv[baseIdx + 1] : "http://localhost:3000";
  const asJson = argv.includes("--json");
  const strict = argv.includes("--strict");

  const routes = await discoverRoutes(base);
  const findings: Finding[] = [];
  for (const route of routes) findings.push(...(await auditRoute(base, route)));

  if (asJson) console.log(JSON.stringify(findings, null, 2));
  else console.log(formatReport(findings, routes.length));

  // What the exit code means, precisely, because a code that is always 1 gates nothing.
  //
  // Default: fail on unwaived findings a reader can actually SEE. That is the thing a gate
  // should block, and it is currently achievable — the visible tiers are clean apart from
  // the spaced-path content backlog the scope note describes, which this detector cannot
  // see anyway.
  //
  // The payload-only tier is deliberately NOT part of the default exit code. It stands at
  // ~6,000 distinct filenames across the app: server components handing whole YAML objects
  // to client components, a real and tracked problem, but far too large to gate on today.
  // Wiring the gate to it would mean a permanently red check, which is the same as no check.
  // Findings are still printed in full, and `--strict` includes them for anyone working
  // that backlog down — /feature-map's dead `sources` prop was a payload-only finding and a
  // genuine bug, so this tier must stay visible even while it cannot fail the build.
  const unwaived = findings.filter((f) => !isIntentional(f));
  const blocking = strict ? unwaived : unwaived.filter((f) => f.tier !== "payload-only");
  if (!asJson) {
    console.log("");
    console.log(
      blocking.length
        ? `FAIL: ${blocking.length} blocking finding(s) — ${strict ? "visible + payload (--strict)" : "visible tiers only; re-run with --strict to include payload-only"}.`
        : `PASS: no blocking findings${strict ? " (--strict: payload included)" : ""}. ` +
            `${unwaived.filter((f) => f.tier === "payload-only").length} payload-only finding(s) reported above do not affect this exit code.`,
    );
  }
  process.exit(blocking.length ? 1 : 0);
}

// Run only when invoked as a script, so the exports above stay importable from a test.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop()!)) {
  await main();
}
