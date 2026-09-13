import { getSourceIndex, type SourceRegistryEntry } from "@/lib/content";

/** One inline citation mark on one page: its 1..N position and the registry
 * entry behind it. The entry is the FULL registry record (title, publisher,
 * date, url, what_it_supports) — never a file path — which is what lets
 * CitationMark render a human-readable preview. */
export interface NumberedCitation {
  number: number;
  source: SourceRegistryEntry;
}

/**
 * Numbers an ordered list of Level 0.5 `source_id`s 1..N for one page, in the
 * order their marks appear in the prose — the same model a paper's footnotes
 * use, and the same one ProseItemList's buildCitationRegistry applies to
 * per-item `reference` strings. This one resolves through getSourceIndex()
 * instead, so a mark carries the registry's real metadata rather than a raw
 * string.
 *
 * An id that resolves to nothing is DROPPED, not numbered: a mark with no
 * resolvable source behind it would be an attribution the reader cannot check,
 * and rendering the unresolved id itself would put an internal identifier on
 * screen. Callers render `<CitationMark citation={cites[id]} />`, which is a
 * no-op when the id is missing — so a retired registry entry silently removes
 * its mark rather than breaking the page.
 *
 * Server-only (getSourceIndex reads content/ off disk). Pages resolve the
 * entries and pass the plain objects to the client CitationMark as props.
 */
export function numberCitations(ids: string[]): Record<string, NumberedCitation | undefined> {
  const index = getSourceIndex();
  const cites: Record<string, NumberedCitation> = {};
  let n = 0;
  for (const id of ids) {
    // A repeated citation shares one number, exactly as a reference list works.
    if (cites[id]) continue;
    const source = index.get(id);
    if (!source) continue;
    cites[id] = { number: ++n, source };
  }
  return cites;
}
