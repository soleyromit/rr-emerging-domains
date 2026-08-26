export interface CitationSourceInput {
  title?: string;
  url?: string;
}

export interface CitationEntry {
  number: number;
  source: CitationSourceInput;
}

export interface CitationRegistry {
  numberFor(raw: string | undefined): number | undefined;
  list(): CitationEntry[];
}

function parseSource(raw: string): CitationSourceInput {
  return raw.trim().startsWith("http") ? { title: raw, url: raw } : { title: raw };
}

// Builds a stable 1..N numbering over an ordered list of raw source strings,
// deduping identical sources so a repeated citation shares one number —
// mirrors how a real reference list works. Only ever numbers sources that
// genuinely exist in the content (per-item `source`/`accreditation_link`
// fields) — never fabricates an attribution for a field that has none.
export function buildCitationRegistry(rawSources: (string | undefined)[]): CitationRegistry {
  const numberByKey = new Map<string, number>();
  const order: string[] = [];
  for (const raw of rawSources) {
    if (!raw) continue;
    const key = raw.trim();
    if (!key || numberByKey.has(key)) continue;
    numberByKey.set(key, order.length + 1);
    order.push(key);
  }
  return {
    numberFor: (raw) => (raw ? numberByKey.get(raw.trim()) : undefined),
    list: () => order.map((key, i) => ({ number: i + 1, source: parseSource(key) })),
  };
}
