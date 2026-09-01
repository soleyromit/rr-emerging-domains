import type { ReactNode } from "react";

export type PillVariant = "neutral" | "success" | "warning" | "error";

const COLORS: Record<PillVariant, { fg: string; bg: string }> = {
  neutral: { fg: "var(--color-text-secondary)", bg: "var(--color-background-muted)" },
  success: { fg: "var(--color-success)", bg: "var(--color-success-muted)" },
  warning: { fg: "var(--color-warning, #E9AF08)", bg: "var(--color-warning-muted, #E2A40033)" },
  error: { fg: "var(--color-error)", bg: "var(--color-error-muted)" },
};

// Badge is capped at the design system's --text-supporting-size (12px, no
// size override exists) — too small for a page whose whole point is to be
// readable at a glance. This is a plain pill built on Text-scale tokens
// instead, used anywhere a status needs to actually be read, not just
// color-scanned.
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
