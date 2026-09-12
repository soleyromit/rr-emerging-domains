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
 * findings array instead of the report. Exit code is 1 when any finding is reported, so
 * it can gate a CI step as-is.
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

export function formatReport(findings: Finding[], routeCount: number): string {
  const lines: string[] = [];
  lines.push(`Crawled ${routeCount} routes.`);
  if (!findings.length) {
    lines.push("No raw content filenames found in markup or payload. Clean.");
    return lines.join("\n");
  }
  for (const tier of TIER_ORDER) {
    const inTier = findings.filter((f) => f.tier === tier);
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
  return lines.join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const baseIdx = argv.indexOf("--base");
  const base = baseIdx >= 0 ? argv[baseIdx + 1] : "http://localhost:3000";
  const asJson = argv.includes("--json");

  const routes = await discoverRoutes(base);
  const findings: Finding[] = [];
  for (const route of routes) findings.push(...(await auditRoute(base, route)));

  if (asJson) console.log(JSON.stringify(findings, null, 2));
  else console.log(formatReport(findings, routes.length));

  process.exit(findings.length ? 1 : 0);
}

// Run only when invoked as a script, so the exports above stay importable from a test.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop()!)) {
  await main();
}
