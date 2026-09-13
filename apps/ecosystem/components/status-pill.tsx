import type { ReactNode } from "react";

export type PillVariant = "neutral" | "success" | "warning" | "error";

// SECOND COPY OF A SEMANTIC COLOR SCALE — keep it honest about that.
//
// The canonical definition of what neutral/success/warning/error look like is the
// `variants` table in node_modules/@astryxdesign/core/src/Badge/Badge.tsx. This table is
// a deliberate duplicate of four of its rows, and it exists only because Badge hardcodes
// `fontSize: --text-supporting-size` (12px) in its base style with no size/scale prop to
// override it — verified by reading BadgeProps in full (2026-09-13): the props are
// `variant`, `label`, `icon`, `ref` and BaseProps, and nothing else. If a size prop ever
// lands upstream, that is the signal to delete this file and use Badge directly.
//
// Two consequences while it stands:
//   1. Editing a color here without checking Badge's variants (or vice versa) silently
//      forks the two — a status pill and a Badge on the same page would disagree about
//      what "warning" means.
//   2. These are semantic (severity/state) colors, not identity colors. Discipline and
//      competitor identity live on the non-semantic tints in lib/discipline-meta.ts and
//      lib/competitor-meta.ts; don't borrow from this table for identity.
//
// Note the intentional divergence from Badge: Badge's semantic variants are solid
// (`--color-success` on `--color-on-success`), while these are muted fills with colored
// text, matching the non-semantic tint treatment. That is a size-driven choice — a 15px
// solid pill is much heavier on the page than a 12px one — not an oversight.
const COLORS: Record<PillVariant, { fg: string; bg: string }> = {
  neutral: { fg: "var(--color-text-secondary)", bg: "var(--color-background-muted)" },
  success: { fg: "var(--color-success)", bg: "var(--color-success-muted)" },
  warning: { fg: "var(--color-warning, #E9AF08)", bg: "var(--color-warning-muted, #E2A40033)" },
  error: { fg: "var(--color-error)", bg: "var(--color-error-muted)" },
};

// Badge is capped at the design system's --text-supporting-size (12px) with no
// size override — see the COLORS note above — which is too small for a page
// whose whole point is to be readable at a glance. This is a plain pill built on
// Text-scale tokens instead, for anywhere a status needs to actually be read,
// not just color-scanned.
export function StatusPill({ label, variant = "neutral" }: { label: string; variant?: PillVariant }) {
  const c = COLORS[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 14px",
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontWeight: 600,
        fontSize: "15px",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// A colored icon tile — the icon's own tint doubles as the status signal, so
// a row reads before the label text is even parsed.
export function IconTile({ variant = "neutral", children }: { variant?: PillVariant; children: ReactNode }) {
  const c = COLORS[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        borderRadius: 12,
        background: c.bg,
        color: c.fg,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}
