import { Badge } from "@astryxdesign/core/Badge";
import { Text } from "@astryxdesign/core/Text";

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

// `build` is the "neutral, not-a-verdict" slot in an otherwise semantic scale, so it
// takes the semantic accent variant (`info` — Badge's `info` IS the accent color:
// background `--color-accent`) rather than the non-semantic `blue` tint. Same slot
// and same variant StatusBadge below gives "Roadmap".
const FIT_VARIANT: Record<string, BadgeVariant> = {
  transfer: "success",
  configure: "warning",
  build: "info",
  gap: "error",
};

export function FitBadge({ fit }: { fit?: string }) {
  if (!fit) return <Badge variant="neutral" label="Unknown" />;
  const key = Object.keys(FIT_VARIANT).find((k) => fit.toLowerCase().includes(k));
  return <Badge variant={key ? FIT_VARIANT[key] : "neutral"} label={fit} />;
}

// Same reasoning as FIT_VARIANT above: `prism-only` is the not-a-verdict slot, so it
// carries the semantic accent variant (`info`) instead of the `blue` tint.
const DEPTH_VARIANT: Record<string, BadgeVariant> = {
  ahead: "error",
  "at-parity": "warning",
  behind: "success",
  "prism-only": "info",
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

// The same words the badge shows, as a string — for a Takeaway/heading that has to
// SAY the depth in a sentence rather than render a pill ("E*Value is ahead of Prism
// on Curriculum Mapping"). Exported for the same reason standardsRatingLabel is: a
// caller that needs the words in prose must not drift into a second spelling of a
// vocabulary this file already owns.
export function depthLabel(depth?: string): string {
  if (!depth) return "Unknown";
  return DEPTH_LABEL[depth.toLowerCase()] ?? depth;
}

// Same depth value, mapped to a Banner/Takeaway status instead of a Badge variant —
// the DEPTH_VARIANT colors read from Prism's point of view (a competitor "ahead" is
// the bad news, "behind" is the good news), and this keeps a panel's one-line verdict
// agreeing with the pill beside it rather than each guessing its own color.
export function depthStatus(depth?: string): "success" | "warning" | "error" | "info" {
  if (!depth) return "info";
  const key = Object.keys(DEPTH_VARIANT).find((k) => depth.toLowerCase().includes(k));
  if (key === "ahead") return "error";
  if (key === "at-parity") return "warning";
  if (key === "behind") return "success";
  return "info";
}

export function DepthBadge({ depth }: { depth?: string }) {
  if (!depth) return <Badge variant="neutral" label="Unknown" />;
  const key = Object.keys(DEPTH_VARIANT).find((k) => depth.toLowerCase().includes(k));
  return <Badge variant={key ? DEPTH_VARIANT[key] : "neutral"} label={depthLabel(depth)} />;
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

// The same words the badge shows, as a string — for a Takeaway/heading that has to
// SAY the rating in a sentence rather than render a pill ("CORE ELMS is Fully
// meeting on this capability"). Exported so a caller can't drift into its own
// second spelling of this three-value vocabulary.
export function standardsRatingLabel(rating?: string): string {
  if (!rating) return STANDARDS_RATING_LABEL.unresearched;
  const key = rating.toLowerCase().trim();
  return STANDARDS_RATING_LABEL[key] ?? rating;
}

export function StandardsRatingBadge({ rating }: { rating?: string }) {
  if (!rating) return <Badge variant="neutral" label="Not yet researched" />;
  const key = rating.toLowerCase().trim();
  return <Badge variant={STANDARDS_RATING_VARIANT[key] ?? "neutral"} label={STANDARDS_RATING_LABEL[key] ?? rating} />;
}

// Exxat's *own* compliance against a standard element — a different question
// from StandardsRatingBadge above (which rates a competitor) and from FitBadge
// (which rates how Prism would have to be built to satisfy it). Same five-state
// palette and the same "absence is a real, named state" rule, so the Exxat
// column and the competitor columns stay comparable at a glance while their
// vocabularies stay distinct.
const EXXAT_COMPLIANCE_VARIANT: Record<string, BadgeVariant> = {
  compliant: "success",
  partial: "warning",
  gap: "error",
  "not-applicable": "neutral",
};

const EXXAT_COMPLIANCE_LABEL: Record<string, string> = {
  compliant: "Compliant",
  partial: "Partial",
  gap: "Gap",
  "not-applicable": "Not yet rated",
};

// Same compliance value, mapped to a Banner-compatible status instead of a Badge
// variant — reused by StandardDetail's scan-layer Takeaway so the one-line verdict
// at the top of the panel and the badge inside the deep-dive agree on what
// "compliant"/"gap"/"partial" actually mean, rather than two components each
// guessing their own color for the same word.
export function exxatComplianceStatus(compliance?: string): "success" | "warning" | "error" | "info" {
  const key = (compliance ?? "").toLowerCase().trim();
  if (key === "compliant") return "success";
  if (key === "gap") return "error";
  if (key === "partial") return "warning";
  return "info";
}

export function ExxatComplianceBadge({ compliance }: { compliance?: string }) {
  if (!compliance) return <Badge variant="neutral" label="Not yet rated" />;
  const key = compliance.toLowerCase().trim();
  return (
    <Badge
      variant={EXXAT_COMPLIANCE_VARIANT[key] ?? "neutral"}
      label={EXXAT_COMPLIANCE_LABEL[key] ?? compliance}
    />
  );
}

// Trend coverage, keyed by the *same* gap_severity vocabulary GapSeverityBadge
// uses (none | configure-needed | gap) so KeyFindingList's severity contract is
// unchanged — only the labels differ, because "Configure needed" is meaningless
// for a market trend. Selected via KeyFindingList's `severityVocabulary="trend"`.
const TREND_SEVERITY_LABEL: Record<string, string> = {
  none: "Exxat ships it",
  "configure-needed": "Competitors ahead",
  gap: "Nobody addresses it",
};

const TREND_SEVERITY_VARIANT: Record<string, BadgeVariant> = {
  none: "success",
  "configure-needed": "warning",
  gap: "error",
};

export function TrendCoverageBadge({ severity }: { severity?: string }) {
  if (!severity) return <Badge variant="neutral" label="Unrated" />;
  const key = severity.toLowerCase().trim();
  return (
    <Badge variant={TREND_SEVERITY_VARIANT[key] ?? "neutral"} label={TREND_SEVERITY_LABEL[key] ?? severity} />
  );
}

// `gap`, `workaround` and `inverted` were all `error` — one red for three different
// answers, so the pill told a reader nothing the label hadn't already said. They are
// now three treatments:
//   - `gap` stays `error`: nothing exists. The worst case, and the one red belongs to it.
//   - `workaround` drops to `warning`: a real but partial mitigation exists, which is
//     the same severity `configure` carries (and deliberately shares its amber — both
//     mean "reachable, but not natively"). The distinction they lose to each other is
//     smaller than the one they both gain against `gap`.
//   - `inverted` takes `purple`: not a point on the worse/better scale at all — the
//     mechanic runs backwards (the student proposes the site rather than the admin
//     offering capacity), which is a *different shape*, not a worse one. Checked the
//     way PrismFeatureBadge below checked before claiming `teal`: `purple` is used in
//     this app only as an IDENTITY color (lib/discipline-meta.ts, lib/competitor-meta.ts,
//     components/source-list.tsx, components/dissect/topology-graph.tsx) and by no
//     severity scale, so it cannot be misread as a fit/gap rating.
const DIVERGENCE_VARIANT: Record<string, BadgeVariant> = {
  "native fit": "success",
  configure: "warning",
  gap: "error",
  workaround: "warning",
  inverted: "purple",
  unconfirmed: "neutral",
};

// For product-vocabulary comparisons (e.g. how "Wishlist" or "Slot" behaves
// per discipline) rather than accreditation fit — same five-state palette as
// FitBadge/GapSeverityBadge so the color language stays consistent app-wide.
export function DivergenceBadge({ label }: { label: string }) {
  const key = label.toLowerCase().trim();
  return <Badge variant={DIVERGENCE_VARIANT[key] ?? "neutral"} label={label} />;
}

// A directional rating is a first-pass read of a vendor's public material, not the
// element-by-element verification the unflagged entries carry. Neutral on purpose:
// the spec explicitly rules out a new color in the shared palette and a numeric
// "confidence score" — both would invent vocabulary this repo doesn't have. Renders
// nothing when the rating isn't directional, so callers need no emptiness guard.
export function DirectionalBadge({ evidenceStrength }: { evidenceStrength?: string }) {
  if (evidenceStrength?.toLowerCase().trim() !== "directional") return null;
  return <Badge variant="neutral" label="Directional" />;
}

// The ONE cell vocabulary of the quarantined vendor comparison chart: a sales sheet
// marked the box, or it didn't. Exactly two states, and NEITHER is a rating.
//
// Never green, never red, never any status variant. Every other badge in this file
// encodes a researched verdict; this one encodes "someone in sales typed an X", and a
// success/error color would launder that into a finding. "neutral" is the only honest
// choice — the same reasoning DirectionalBadge's comment gives for staying neutral.
//
// The not-marked state renders the SAME em dash ComparisonMatrix's own `emptyCell`
// default uses. That is deliberate rather than a second empty vocabulary: in this
// artifact a blank cell IS the source's silence ("Absence is the source's silence,
// not a researched finding of absence" — the file's own header), which is exactly
// what a dash means everywhere else in this app. Returning null instead would leave a
// visually empty cell that reads as a rendering bug rather than as a real blank.
export function ClaimedBadge({ claimed }: { claimed?: boolean }) {
  if (!claimed) {
    return (
      <Text type="supporting" size="sm" color="secondary">
        —
      </Text>
    );
  }
  return <Badge variant="neutral" label="Claimed" />;
}

// Status of a proposed use case against one accreditation element. Same five-state
// palette as FitBadge/GapSeverityBadge so the color language stays consistent
// app-wide, and the same "absence is a real, named state" rule: `no-fit-yet` is an
// explicit answer, not a blank.
const USE_CASE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  documented: "success",
  "in-flight": "warning",
  proposed: "info",
  "no-fit-yet": "error",
};

const USE_CASE_STATUS_LABEL: Record<string, string> = {
  documented: "Documented",
  "in-flight": "In flight",
  proposed: "Proposed",
  "no-fit-yet": "No fit yet",
};

export function UseCaseStatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant="neutral" label="Unrated" />;
  const key = status.toLowerCase().trim();
  return (
    <Badge variant={USE_CASE_STATUS_VARIANT[key] ?? "neutral"} label={USE_CASE_STATUS_LABEL[key] ?? status} />
  );
}

// Which Exxat/Prism capability actually does the work a proposed use case describes —
// added 2026-09-11 because a use case that only tells a market/customer story without
// naming the product feature behind it reads as a generic idea, not a product answer
// (mirrors competitor cards' competitor_feature_ref, one level up). "teal" is unclaimed
// elsewhere in this badge vocabulary — not one of the red/yellow/green/blue severity
// colors, so it can't be misread as a fit/gap signal. Renders nothing when absent
// (the honest "no-fit-yet" case), so callers need no emptiness guard.
export function PrismFeatureBadge({ feature }: { feature?: string }) {
  if (!feature) return null;
  return <Badge variant="teal" label={feature} />;
}
