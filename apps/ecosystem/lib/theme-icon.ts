import type { IconName } from "@astryxdesign/core/Icon";

// Best-effort keyword → icon mapping for scannable fact cards. The icon
// registry is a small fixed set (no domain-specific glyphs), so this picks
// the closest available icon rather than adding custom SVGs — real visual
// variety across a list of points, not decoration for its own sake.
const RULES: { pattern: RegExp; icon: IconName }[] = [
  { pattern: /critical|severity|asterisk|violat|risk/i, icon: "warning" },
  { pattern: /no .*(competit|intelligence|coverage)|none (confirmed|found)|not (yet )?research|unverified|unconfirmed/i, icon: "eyeSlash" },
  { pattern: /supervis|ratio|cap(ped|s)?\b|ceiling|limit/i, icon: "arrowsUpDown" },
  { pattern: /hour|count|threshold|minimum|numbered|quota/i, icon: "clock" },
  { pattern: /annual|publication|report(ing)?|deadline|cycle|clock/i, icon: "calendar" },
  { pattern: /log|record|transcript|document|attestation/i, icon: "copy" },
  { pattern: /growth|approval|expansion|pre-approval/i, icon: "checkDouble" },
  { pattern: /vendor|competitor|market|acqui/i, icon: "search" },
  { pattern: /link|integration|external/i, icon: "externalLink" },
];

export function pickThemeIcon(text: string, fallback: IconName = "info"): IconName {
  const match = RULES.find((r) => r.pattern.test(text));
  return match?.icon ?? fallback;
}
