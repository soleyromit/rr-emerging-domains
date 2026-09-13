// Canonical registry of the 4 expansion domains + 8 existing disciplines, reused
// everywhere a discipline/domain needs a consistent short code + color across the app
// (matrices, chips, chart legends, table rows). Colors are deliberately kept out of the
// red/yellow/green/blue family — those are reserved for gap-severity semantics elsewhere
// (see fit-badge.tsx) — so discipline identity never gets confused with a severity signal.
//
// That reservation leaves fewer usable tints than there are entries, so tints repeat:
// purple is DO/OT/CRNA, teal is Pharmacy/PA, orange is Dentistry/Nursing, cyan is
// Medicine/SLP, pink is PT/TE. Hue alone therefore cannot identify an entry, and the fix
// is a second visual dimension rather than more colors: every entry also carries a
// `glyph`, rendered as a small leading icon by DisciplineChip, so two chips sharing a
// tint differ in shape as well as in their code text. Glyphs only have to separate the
// 2-3 entries inside one tint family, so pick a shape that is obviously distinct from
// its own tint-mates first and evocative of the discipline second.

export type BadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "blue"
  | "cyan"
  | "green"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "teal"
  | "yellow";

// Glyph *keys*, not icon components: this module is plain data imported by server
// components, and a React component value can't cross the server/client boundary as a
// prop. components/discipline-chip.tsx holds the one key -> lucide-icon map, typed as an
// exhaustive Record<DisciplineGlyph, IconType>, so adding an entry here without giving it
// a glyph is a type error rather than a silently icon-less chip.
export type DisciplineGlyph =
  | "stethoscope"
  | "hand"
  | "syringe"
  | "pill"
  | "clipboard"
  | "tooth"
  | "pulse"
  | "bag"
  | "speech"
  | "dumbbell"
  | "cap"
  | "handshake"
  | "brain";

export interface DisciplineMeta {
  slug: string;
  label: string;
  code: string;
  kind: "domain" | "discipline";
  badgeVariant: BadgeVariant;
  /** Shape cue that separates this entry from its tint-mates — see the header note. */
  glyph: DisciplineGlyph;
}

export const DOMAINS: DisciplineMeta[] = [
  // purple family: DO / OT / CRNA — stethoscope vs. open hand vs. syringe.
  { slug: "do", label: "DO — Osteopathic Medicine", code: "DO", kind: "domain", badgeVariant: "purple", glyph: "stethoscope" },
  // teal family: Pharmacy / PA — pill vs. clipboard.
  { slug: "pharmacy", label: "Pharmacy", code: "RPh", kind: "domain", badgeVariant: "teal", glyph: "pill" },
  // orange family: Dentistry / Nursing — tooth/smile vs. heart-pulse.
  { slug: "dentistry", label: "Dentistry", code: "DDS", kind: "domain", badgeVariant: "orange", glyph: "tooth" },
  // cyan family: Medicine / SLP — medical bag vs. speech bubble.
  { slug: "medicine", label: "Medicine (MD)", code: "MD", kind: "domain", badgeVariant: "cyan", glyph: "bag" },
];

export const DISCIPLINES: DisciplineMeta[] = [
  // pink family: PT / TE — dumbbell vs. graduation cap.
  { slug: "pt", label: "Physical Therapy (PT/PTA)", code: "PT", kind: "discipline", badgeVariant: "pink", glyph: "dumbbell" },
  { slug: "ot", label: "Occupational Therapy (OT/OTA)", code: "OT", kind: "discipline", badgeVariant: "purple", glyph: "hand" },
  { slug: "pa", label: "Physician Assistant", code: "PA", kind: "discipline", badgeVariant: "teal", glyph: "clipboard" },
  { slug: "slp", label: "Speech-Language Pathology", code: "SLP", kind: "discipline", badgeVariant: "cyan", glyph: "speech" },
  { slug: "nursing", label: "Nursing", code: "RN", kind: "discipline", badgeVariant: "orange", glyph: "pulse" },
  // SW and COUN are the only sole occupants of their tint, so their glyph is pure
  // recognition rather than disambiguation — but they still carry one, because a chip row
  // where some chips have a glyph and others don't reads as a bug, not as a signal.
  { slug: "social-work", label: "Social Work", code: "SW", kind: "discipline", badgeVariant: "neutral", glyph: "handshake" },
  { slug: "te", label: "Teacher Education", code: "TE", kind: "discipline", badgeVariant: "pink", glyph: "cap" },
  { slug: "crna", label: "CRNA (Nurse Anesthesia)", code: "CRNA", kind: "discipline", badgeVariant: "purple", glyph: "syringe" },
  { slug: "counseling", label: "Counseling", code: "COUN", kind: "discipline", badgeVariant: "info", glyph: "brain" },
];

export const ALL_DISCIPLINE_META: DisciplineMeta[] = [...DOMAINS, ...DISCIPLINES];

const BY_SLUG = new Map(ALL_DISCIPLINE_META.map((d) => [d.slug, d]));
const BY_CODE_LOWER = new Map(ALL_DISCIPLINE_META.map((d) => [d.code.toLowerCase(), d]));

// Best-effort match against a free-text subject string ("PT/PTA", "DO", "Social Work", ...)
// so extracted findings only need to name the subject in prose, not a slug.
function stripParens(label: string): string {
  return label.toLowerCase().replace(/\s*\([^)]*\)/g, "").trim();
}

export function matchDisciplineMeta(subject: string): DisciplineMeta | null {
  const norm = subject.trim().toLowerCase();
  if (BY_SLUG.has(norm)) return BY_SLUG.get(norm)!;
  if (BY_CODE_LOWER.has(norm)) return BY_CODE_LOWER.get(norm)!;
  // Exact match against the label with its parenthetical stripped — e.g. "Physical
  // Therapy" against "Physical Therapy (PT/PTA)" stripped to "physical therapy".
  // Must run before the loose word-overlap check below: several discipline labels
  // share a generic trailing word ("Physical Therapy" / "Occupational Therapy" both
  // contain "Therapy"), so a single-shared-word match is genuinely ambiguous between
  // them, while a full-label match never is.
  const byExactLabel = ALL_DISCIPLINE_META.find((d) => stripParens(d.label) === norm);
  if (byExactLabel) return byExactLabel;
  // Word-boundary label matching next: still more precise than a raw substring check
  // (whole words, not fragments) — a raw `.includes(d.slug)` check is a false-positive
  // trap for short two-letter slugs that appear incidentally inside another
  // discipline's name (e.g. "pa" inside "occu-PA-tional [therapy]" wrongly matching
  // Physician Assistant's slug before Occupational Therapy could ever be tried).
  const byLabelWord = ALL_DISCIPLINE_META.find((d) =>
    stripParens(d.label)
      .split(/[\s/·]+/)
      .some((word) => word.length > 2 && norm.includes(word))
  );
  if (byLabelWord) return byLabelWord;
  const bySlugPrefix = ALL_DISCIPLINE_META.find((d) => norm.includes(d.slug));
  return bySlugPrefix ?? null;
}

// Same per-domain/discipline color as badgeVariant, but as a literal CSS
// value — for the handful of spots (Plot chart fills, an inline accent
// style) that can't take a Badge/Card `variant` prop. `--color-icon-*` is the
// theme's most saturated token for a given hue (vs. the paler
// `--color-background-*`), so a domain reads as clearly on a chart as it
// does in its own DisciplineChip. Falls back to the neutral text color for
// variants with no color token (neutral/info/success/warning/error aren't
// used by DOMAINS/DISCIPLINES today, but stay safe if that ever changes).
const COLOR_TOKEN_VARIANTS = new Set(["blue", "cyan", "green", "orange", "pink", "purple", "red", "teal", "yellow"]);
export function disciplineColorVar(subject: string): string {
  const meta = matchDisciplineMeta(subject);
  const variant = meta?.badgeVariant;
  return variant && COLOR_TOKEN_VARIANTS.has(variant)
    ? `var(--color-icon-${variant})`
    : "var(--color-text-secondary)";
}
