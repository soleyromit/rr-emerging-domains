import { Badge } from "@astryxdesign/core/Badge";

type BadgeVariant =
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

const FIT_VARIANT: Record<string, BadgeVariant> = {
  transfer: "success",
  configure: "warning",
  build: "blue",
  gap: "error",
};

export function FitBadge({ fit }: { fit?: string }) {
  if (!fit) return <Badge variant="neutral" label="Unknown" />;
  const key = Object.keys(FIT_VARIANT).find((k) => fit.toLowerCase().includes(k));
  return <Badge variant={key ? FIT_VARIANT[key] : "neutral"} label={fit} />;
}

const DEPTH_VARIANT: Record<string, BadgeVariant> = {
  ahead: "error",
  "at-parity": "warning",
  behind: "success",
  "prism-only": "blue",
};

// "unknown" shows up as a real value in feature_teardown rows (the researcher
// couldn't judge depth, not a missing field) — give it an explicit label so it
// reads as "not yet judged" rather than looking like a raw enum leaking through.
const DEPTH_LABEL: Record<string, string> = {
  ahead: "Ahead of Prism",
  "at-parity": "At parity",
  behind: "Behind Prism",
  "prism-only": "Prism only",
  unknown: "Unverified",
};

export function DepthBadge({ depth }: { depth?: string }) {
  if (!depth) return <Badge variant="neutral" label="Unknown" />;
  const key = Object.keys(DEPTH_VARIANT).find((k) => depth.toLowerCase().includes(k));
  return <Badge variant={key ? DEPTH_VARIANT[key] : "neutral"} label={DEPTH_LABEL[depth.toLowerCase()] ?? depth} />;
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const shipped = status === "shipped";
  return <Badge variant={shipped ? "success" : "info"} label={shipped ? "Shipped" : "Roadmap"} />;
}

const GAP_SEVERITY_VARIANT: Record<string, BadgeVariant> = {
  none: "success",
  cosmetic: "info",
  "configure-needed": "warning",
  gap: "error",
};

const GAP_SEVERITY_LABEL: Record<string, string> = {
  none: "No gap",
  cosmetic: "Cosmetic",
  "configure-needed": "Configure needed",
  gap: "Gap",
};

export function GapSeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return <Badge variant="neutral" label="Unrated" />;
  const key = severity.toLowerCase().trim();
  return (
    <Badge variant={GAP_SEVERITY_VARIANT[key] ?? "neutral"} label={GAP_SEVERITY_LABEL[key] ?? severity} />
  );
}

const THREAT_VARIANT: Record<string, BadgeVariant> = {
  high: "error",
  medium: "warning",
  low: "success",
};

const THREAT_LABEL: Record<string, string> = {
  high: "High threat",
  medium: "Medium threat",
  low: "Low threat",
};

export function ThreatBadge({ threat }: { threat?: string }) {
  if (!threat) return <Badge variant="neutral" label="Unrated" />;
  const key = threat.toLowerCase().trim();
  return <Badge variant={THREAT_VARIANT[key] ?? "neutral"} label={THREAT_LABEL[key] ?? threat} />;
}

const STANDARDS_RATING_VARIANT: Record<string, BadgeVariant> = {
  "not-meeting": "error",
  "partially-meeting": "warning",
  "fully-meeting": "success",
  unresearched: "neutral",
};

const STANDARDS_RATING_LABEL: Record<string, string> = {
  "not-meeting": "Not meeting",
  "partially-meeting": "Partially meeting",
  "fully-meeting": "Fully meeting",
  unresearched: "Not yet researched",
};

export function StandardsRatingBadge({ rating }: { rating?: string }) {
  if (!rating) return <Badge variant="neutral" label="Not yet researched" />;
  const key = rating.toLowerCase().trim();
  return <Badge variant={STANDARDS_RATING_VARIANT[key] ?? "neutral"} label={STANDARDS_RATING_LABEL[key] ?? rating} />;
}
