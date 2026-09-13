import { Badge } from "@astryxdesign/core/Badge";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import {
  competitorBadgeVariant,
  competitorInitials,
  humanizeCompetitorSlug,
} from "@/lib/competitor-meta";
import { resolveCompetitorLogo } from "@/lib/competitor-logos";

// The slug -> asset table this used to hard-code inline now lives in content —
// `logo_asset` in each content/competitors/<slug>.yaml — with lib/competitor-logos.ts
// holding the client-readable mirror plus each mark's backing hint. See that module's
// header for why the mirror exists and what keeps it from drifting.

export function CompetitorLogo({
  slug,
  competitor,
  size = 24,
  logoAsset,
  decorative = false,
}: {
  slug: string;
  competitor?: string;
  size?: number;
  /**
   * The competitor's own `logo_asset` from `content/competitors/<slug>.yaml`. Content is
   * the authority on WHICH file to draw, so a server component that already has the
   * Competitor loaded should pass it. Client components cannot read content at all, so
   * omitting it falls back to lib/competitor-logos.ts's mirror of the same table — which
   * a repo-root density check keeps in sync, so both routes resolve to the same file.
   */
  logoAsset?: string;
  /**
   * Set when the competitor's name is already rendered as visible text right beside the
   * mark (the logo grid's tiles, for one). Drops the redundant hover tooltip and marks
   * the image decorative so a screen reader doesn't announce the same name twice.
   */
  decorative?: boolean;
}) {
  const name = competitor?.trim() || humanizeCompetitorSlug(slug);
  const asset = resolveCompetitorLogo(slug, logoAsset);

  const tile = asset ? (
    // A fixed backing chip, regardless of theme: these vendor marks are mostly
    // dark-on-transparent or full-colour, so without a guaranteed-light backing they'd
    // wash out on a dark theme. The one mark that is a WHITE wordmark on transparency
    // gets `backing: "dark"` in the registry instead — on the shared white chip it drew
    // as an empty box, which reads as a broken image rather than as a logo.
    // object-fit: contain keeps a wide wordmark from bleeding past the square slot.
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 6,
        background: asset.backing === "dark" ? "#1b1f24" : "#fff",
        border: `1px solid ${asset.backing === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)"}`,
        overflow: "hidden",
        flexShrink: 0,
        padding: 2,
      }}
    >
      {/* Local, deliberately-committed asset — plain <img> so every format
          (svg/png/webp/jpeg) these vendors actually serve renders uniformly
          without opting the whole app into next/image's SVG handling. */}
      <img
        src={`/logos/${asset.file}`}
        alt={decorative ? "" : `${name} logo`}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
      />
    </span>
  ) : (
    // Fallback: a colored initials tile. This is a correct, deliberate state — four
    // researched competitors have no legitimately-sourced mark and are meant to look
    // like this — not a missing asset, so it must never degrade to a broken-image icon.
    // Badge (not a hand-rolled div) so the color comes from the design system's own
    // variant tokens and stays theme-correct; the inline style just squares it off at
    // `size` so it reads as a logo slot rather than a text pill.
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
  );

  return decorative ? tile : <Tooltip content={name}>{tile}</Tooltip>;
}

// A row of competitor logos, capped so a table cell can't grow unbounded as
// competitor research lands. Overflow collapses to a "+N" badge.
export function CompetitorLogoStrip({
  competitors,
  size = 22,
  max = 6,
}: {
  competitors: { competitor?: string; slug: string; logo_asset?: string }[];
  size?: number;
  max?: number;
}) {
  if (!competitors.length) return null;
  const shown = competitors.slice(0, max);
  const overflow = competitors.length - shown.length;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {shown.map((c) => (
        <CompetitorLogo
          key={c.slug}
          slug={c.slug}
          competitor={c.competitor}
          logoAsset={c.logo_asset}
          size={size}
        />
      ))}
      {overflow > 0 ? <Badge variant="neutral" label={`+${overflow}`} /> : null}
    </span>
  );
}
