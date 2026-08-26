// Shared prose helpers for scan-layer teasers — pulling a short lead-in out of a
// longer field without cutting mid-word or mid-sentence where avoidable.
export function leadSentence(text: string, maxChars = 140): string {
  const match = text.match(/^.*?[.?!](?=\s|$)/);
  const lead = (match ? match[0] : text).trim();
  if (lead.length <= maxChars) return lead;
  return `${lead.slice(0, maxChars).trimEnd()}…`;
}

// Alias kept for call sites that read more naturally as "the first sentence of a
// detail" (e.g. a per-discipline note) than "a lead-in for a card teaser" — same
// implementation, different default length (this one preserves the 200-char
// default discipline-variance-list.tsx was already using before dedupe).
export function firstSentence(text: string, maxChars = 200): string {
  return leadSentence(text, maxChars);
}
