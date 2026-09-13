// Render-side registry for the competitor logo assets committed under public/logos/.
//
// WHY THIS EXISTS AS ITS OWN IMPORT-FREE MODULE, and not inside lib/content.ts:
// `content/competitors/<slug>.yaml`'s `logo_asset` field is the AUTHORITY on which file
// a competitor's mark lives in — but most of the surfaces that draw a competitor logo
// (competitor-scan-table, feature-teardown-matrix, accreditation-standards-table,
// crosswalk-view, every dissect/*-detail-panel) are `"use client"` components that
// cannot import lib/content.ts at all, because its YAML readers pull node:fs into the
// browser chunk. Same reason lib/competitor-depth.ts and lib/dissection-graph-model.ts
// exist. So the slug -> asset table is mirrored here, where both halves of the app can
// read it, and the mirror is not allowed to drift: `scripts/check_content_density.py`'s
// check_competitor_logo_assets() FAILs if a slug's `logo_asset` disagrees with the entry
// below, if a registered file is missing from public/logos/, or if an asset on disk is
// registered here but undeclared in content.
//
// PROVENANCE: every file below is the vendor's own published mark, fetched 2026-09-09
// from that vendor's official site — or its current parent brand's, where the product
// has been absorbed (one45 -> Acuity Insights, castlebranch -> DISA Healthcare
// Technology). They are committed once and served locally, never hotlinked at runtime.
// Formats vary (svg/png/webp/jpeg) because that is what each vendor's own site serves.
// Nothing here is drawn, traced, approximated or generated: a competitor with no
// legitimately-sourced mark gets NO entry and renders initials instead. Four do today
// (examsoft, influx, pharmacademic, rxpreceptor), so the fallback path below is
// exercised by construction, not only in theory.

/** Which backing chip a mark needs to stay legible. */
export type LogoBacking = "light" | "dark";

export interface CompetitorLogoAsset {
  /** Filename under public/logos/. Must equal that competitor's `logo_asset` in content. */
  file: string;
  /**
   * `light` (the default) is a white chip: correct for the dark-on-transparent and
   * full-colour marks, which would otherwise wash out on a dark theme. `dark` is for a
   * mark that is a WHITE wordmark on transparency and so is invisible on white — today
   * that is new-innovations.png, whose every visible pixel is #ffffff.
   */
  backing?: LogoBacking;
}

export const COMPETITOR_LOGO_ASSETS: Record<string, CompetitorLogoAsset> = {
  axium: { file: "axium.svg" },
  castlebranch: { file: "castlebranch.png" },
  "core-elms": { file: "core-elms.svg" },
  "e-value": { file: "e-value.jpeg" },
  elentra: { file: "elentra.png" },
  emedley: { file: "emedley.png" },
  "experiential-learning-cloud": { file: "experiential-learning-cloud.svg" },
  "leo-davinci": { file: "leo-davinci.png" },
  medhub: { file: "medhub.webp" },
  // White wordmark on transparency — needs a dark chip or it disappears entirely.
  "new-innovations": { file: "new-innovations.png", backing: "dark" },
  one45: { file: "one45.png" },
  trajecsys: { file: "trajecsys.png" },
  typhon: { file: "typhon.svg" },
};

// A `logo_asset` value reaches this module straight from YAML with no validation in
// between, and it is interpolated into an <img src>. Constrain it to a plain filename
// so a stray "../" or an absolute URL in a future content edit degrades to the initials
// fallback instead of pointing the app at something outside public/logos/.
const SAFE_LOGO_FILENAME = /^[a-z0-9][a-z0-9._-]*\.(svg|png|jpe?g|webp)$/;

/**
 * Resolve the asset to draw for a competitor, or `undefined` to fall back to initials.
 *
 * `declared` is the competitor's own `logo_asset` from content and wins when present —
 * content decides WHICH file. The registry supplies the render hint, and is the only
 * source available to client components, which have no way to read content at all.
 */
export function resolveCompetitorLogo(
  slug: string,
  declared?: string,
): CompetitorLogoAsset | undefined {
  const entry = COMPETITOR_LOGO_ASSETS[slug];
  const file = (declared ?? entry?.file)?.trim();
  if (!file || !SAFE_LOGO_FILENAME.test(file)) return undefined;
  return { file, backing: entry?.backing ?? "light" };
}
