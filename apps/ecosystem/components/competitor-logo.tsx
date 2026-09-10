import { Badge } from "@astryxdesign/core/Badge";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import {
  competitorBadgeVariant,
  competitorInitials,
  humanizeCompetitorSlug,
} from "@/lib/competitor-meta";

// Real logos, fetched 2026-09-09 from each competitor's own official site (or
// their current parent brand's, where the product has been absorbed — e.g.
// one45 -> Acuity Insights, castlebranch -> DISA Healthcare Technology) — never
// hotlinked at runtime, committed once under public/logos/. Formats vary
// (svg/png/webp/jpeg) because that's what each vendor's own site actually
// serves; a plain <img> (not next/image) renders all of them uniformly without
// needing next.config's dangerouslyAllowSVG for the handful that are SVG.
//
// Any competitor slug NOT in this map (e.g. a future new entrant) falls back
// to the colored-initials tile below — that fallback path is exercised by
// construction, not just in theory.
const LOGO_FILES: Record<string, string> = {
  axium: "axium.svg",
  castlebranch: "castlebranch.png",
  "core-elms": "core-elms.svg",
  "e-value": "e-value.jpeg",
  elentra: "elentra.png",
  emedley: "emedley.png",
  "experiential-learning-cloud": "experiential-learning-cloud.svg",
  "leo-davinci": "leo-davinci.png",
  medhub: "medhub.webp",
  "new-innovations": "new-innovations.png",
  one45: "one45.png",
  trajecsys: "trajecsys.png",
  typhon: "typhon.svg",
};

export function CompetitorLogo({
  slug,
  competitor,
  size = 24,
}: {
  slug: string;
  competitor?: string;
  size?: number;
}) {
  const name = competitor?.trim() || humanizeCompetitorSlug(slug);
  const file = LOGO_FILES[slug];

  if (file) {
    // A fixed light backing chip, regardless of theme: several of these
    // vendor marks are dark-on-transparent (or a white wordmark meant for a
    // dark header), so without a guaranteed-light backing they'd wash out or
    // vanish depending on the viewer's color scheme. object-fit: contain
    // keeps a wide wordmark from bleeding past the square slot.
    return (
      <Tooltip content={name}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: 6,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            overflow: "hidden",
            flexShrink: 0,
            padding: 2,
          }}
        >
          {/* Local, deliberately-committed asset — plain <img> so every format
              (svg/png/webp/jpeg) these vendors actually serve renders uniformly
              without opting the whole app into next/image's SVG handling. */}
          <img
            src={`/logos/${file}`}
            alt={`${name} logo`}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          />
        </span>
      </Tooltip>
    );
  }

  // Fallback: a colored initials tile. Badge (not a hand-rolled div) so the
  // color comes from the design system's own variant tokens and stays theme-
  // correct; the inline style just squares it off at `size` so it reads as a
  // logo slot rather than a text pill.
  return (
    <Tooltip content={name}>
      <Badge
        variant={competitorBadgeVariant(slug)}
        label={competitorInitials(name)}
        style={{
          width: size,
          height: size,
          padding: 0,
          borderRadius: 6,
          justifyContent: "center",
          overflow: "hidden",
          lineHeight: 1,
          flexShrink: 0,
        }}
      />
    </Tooltip>
  );
}

// A row of competitor logos, capped so a table cell can't grow unbounded as
// competitor research lands. Overflow collapses to a "+N" badge.
export function CompetitorLogoStrip({
  competitors,
  size = 22,
  max = 6,
}: {
  competitors: { competitor?: string; slug: string }[];
  size?: number;
  max?: number;
}) {
  if (!competitors.length) return null;
  const shown = competitors.slice(0, max);
  const overflow = competitors.length - shown.length;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {shown.map((c) => (
        <CompetitorLogo key={c.slug} slug={c.slug} competitor={c.competitor} size={size} />
      ))}
      {overflow > 0 ? <Badge variant="neutral" label={`+${overflow}`} /> : null}
    </span>
  );
}
