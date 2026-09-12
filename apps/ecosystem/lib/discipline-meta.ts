// Canonical registry of the 4 expansion domains + 8 existing disciplines, reused
// everywhere a discipline/domain needs a consistent short code + color across the app
// (matrices, chips, chart legends, table rows). Colors are deliberately kept out of the
// red/yellow/green/blue family — those are reserved for gap-severity semantics elsewhere
// (see fit-badge.tsx) — so discipline identity never gets confused with a severity signal.

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

export interface DisciplineMeta {
  slug: string;
  label: string;
  code: string;
  kind: "domain" | "discipline";
  badgeVariant: BadgeVariant;
}

export const DOMAINS: DisciplineMeta[] = [
  { slug: "do", label: "DO — Osteopathic Medicine", code: "DO", kind: "domain", badgeVariant: "purple" },
  { slug: "pharmacy", label: "Pharmacy", code: "RPh", kind: "domain", badgeVariant: "teal" },
  { slug: "dentistry", label: "Dentistry", code: "DDS", kind: "domain", badgeVariant: "orange" },
  { slug: "medicine", label: "Medicine (MD)", code: "MD", kind: "domain", badgeVariant: "cyan" },
];

export const DISCIPLINES: DisciplineMeta[] = [
  { slug: "pt", label: "Physical Therapy (PT/PTA)", code: "PT", kind: "discipline", badgeVariant: "pink" },
  { slug: "ot", label: "Occupational Therapy (OT/OTA)", code: "OT", kind: "discipline", badgeVariant: "purple" },
  { slug: "pa", label: "Physician Assistant", code: "PA", kind: "discipline", badgeVariant: "teal" },
  { slug: "slp", label: "Speech-Language Pathology", code: "SLP", kind: "discipline", badgeVariant: "cyan" },
  { slug: "nursing", label: "Nursing", code: "RN", kind: "discipline", badgeVariant: "orange" },
  { slug: "social-work", label: "Social Work", code: "SW", kind: "discipline", badgeVariant: "neutral" },
  { slug: "te", label: "Teacher Education", code: "TE", kind: "discipline", badgeVariant: "pink" },
  { slug: "crna", label: "CRNA (Nurse Anesthesia)", code: "CRNA", kind: "discipline", badgeVariant: "purple" },
  { slug: "counseling", label: "Counseling", code: "COUN", kind: "discipline", badgeVariant: "info" },
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
