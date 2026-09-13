// The `depth_vs_prism` vocabulary, in one place.
//
// A pure vocabulary module with NO imports — deliberately not part of lib/content.ts,
// which reads content/ through node:fs and therefore cannot be imported at runtime by a
// client component (same reason lib/dissection-graph-model.ts exists separately from
// lib/dissection-graph.ts). Both the by-competitor depth chart (a client component) and
// the by-quadrant builder (server-side, lib/competitor-quadrant.ts) normalize the same
// free-text field; two copies of this `.includes()` chain would be two chances to
// disagree about what "at-parity" means.

export type DepthVsPrism = "behind" | "at-parity" | "ahead" | "prism-only" | "unknown";

/** Checked in this order — the first key the raw string contains wins. */
export const DEPTH_ORDER: DepthVsPrism[] = ["behind", "at-parity", "ahead", "prism-only", "unknown"];

/**
 * Maps a competitor file's free-text `depth_vs_prism` onto the five-value vocabulary.
 * Anything unrecognized (`"unable to verify"`, an empty string, a missing field) lands
 * on `unknown` rather than being guessed at — an unverified pillar is a real state in
 * this research, not a zero.
 */
export function normalizeDepth(raw?: string): DepthVsPrism {
  if (!raw) return "unknown";
  const lower = raw.toLowerCase();
  return DEPTH_ORDER.find((k) => lower.includes(k)) ?? "unknown";
}
