// The `/journeys/[slug]/compare?a=&b=` URL contract, and NOTHING else.
//
// Its own module rather than a function inside lib/journey-comparison.ts because both
// halves of the contract need it and they live on opposite sides of the server/client
// boundary: the server page and the journey page build these links, and so does the
// client picker that writes them. lib/journey-comparison.ts reads content/ through
// node:fs, so importing it from a client component fails the build outright ("the
// chunking context does not support external modules") — this file has no imports at
// all and is safe from either side. lib/journey-comparison.ts re-exports it so a
// server caller still has one place to look.

/** Query-param names, so the read side and the write side cannot drift. */
export const JOURNEY_COMPARE_PARAMS = { a: "a", b: "b" } as const;

/** A comparison URL. Both disciplines or neither: a half-specified pair is not a
 * shorter link, it is a link whose second column is decided by a default the sender
 * could not see. Omitting both is the "open it on this journey's defaults" entry point. */
export function journeyCompareHref(journeySlug: string, aSlug?: string, bSlug?: string): string {
  const base = `/journeys/${journeySlug}/compare`;
  if (!aSlug || !bSlug) return base;
  const query = new URLSearchParams({ [JOURNEY_COMPARE_PARAMS.a]: aSlug, [JOURNEY_COMPARE_PARAMS.b]: bSlug });
  return `${base}?${query.toString()}`;
}
