// Competitor identity: a stable color + short initials per competitor slug, so a
// competitor reads the same everywhere (standards table headers, crosswalk rows,
// trend coverage strips) even before any real logo asset exists.
//
// Mirrors lib/discipline-meta.ts's idea (consistent color-coded short label per
// subject) but deliberately does NOT reuse it: discipline-meta is a hand-curated
// registry of a closed set of 13 disciplines, while competitors are an open,
// research-driven list that grows without a code change. So this is a
// deterministic hash instead of a table — no registry to keep in sync, and the
// same slug always lands on the same color across pages and rebuilds.
//
// Palette avoids the red/yellow/green/blue-ish semantic family for the same
// reason discipline-meta does: those are reserved for fit/severity signalling in
// fit-badge.tsx, and a competitor's identity color must never read as a rating.

import type { BadgeVariant } from "@/lib/discipline-meta";

const IDENTITY_VARIANTS: BadgeVariant[] = ["purple", "teal", "cyan", "orange", "pink", "blue"];

// FNV-1a-ish: small, stable, and dependency-free. Determinism matters more than
// distribution quality here — collisions just mean two competitors share a color.
export function competitorBadgeVariant(slug: string): BadgeVariant {
  let hash = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return IDENTITY_VARIANTS[hash % IDENTITY_VARIANTS.length];
}

// "CORE ELMS" -> "CE", "E*Value" -> "EV", "eMedley" -> "EM", "Exxat" -> "EX".
export function competitorInitials(name: string): string {
  const words = name.trim().split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Slug -> readable name, used only as a last-resort fallback when a content
// reference carries a slug but no resolved competitor name. UI-DENSITY-PATTERNS.md
// forbids rendering a raw slug as visible text anywhere, including alt/aria text.
export function humanizeCompetitorSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
