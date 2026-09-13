import type { ReactNode } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Text } from "@astryxdesign/core/Text";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { ThreatBadge } from "@/components/fit-badge";
import { CompetitorLogo } from "@/components/competitor-logo";

// The CB Insights market-map treatment for a competitor LIST: the vendor's own mark is
// the primary identifier, and the vendors are banded by threat level rather than run
// together alphabetically, so the shape of the market is readable before any row is.
//
// Threat is a synthesis judgment that lives in lenses/competitor-landscape.yaml and is
// scoped to a domain, so every caller has to say which reading it is showing (this
// domain's rating, or the cross-domain rollup) via `groupCaption` — the component never
// invents or implies a global threat level of its own.
//
// A competitor with no legitimately-sourced logo asset renders CompetitorLogo's initials
// tile in the same slot, at the same size. Four of the 17 researched competitors are in
// that state today; they are meant to read as deliberate, not as a failed image load.

export interface CompetitorLogoGridEntry {
  slug: string;
  competitor: string;
  /** `logo_asset` from content/competitors/<slug>.yaml, when the caller has it loaded. */
  logo_asset?: string;
  /** "high" | "medium" | "low", or absent for a competitor no domain has rated. */
  threat?: string;
  /** One short supporting line under the name — a threat rationale or a category. */
  note?: string;
  /** An optional second clamped line under `note`, e.g. the Prism-opportunity lead. */
  secondaryNote?: string;
  /** Optional trailing row, e.g. DisciplineChips for the domains this vendor serves. */
  meta?: ReactNode;
}

const GROUP_ORDER = ["high", "medium", "low"] as const;

const UNRATED_KEY = "__unrated__";

// Deliberately not "no threat": an unrated competitor is one the landscape lens has not
// judged, which is a research state, not a finding about the vendor. The default is the
// cross-domain reading; a domain-scoped caller passes its own, because "no domain has
// rated these" is false for a vendor rated elsewhere but not in the domain on screen.
const DEFAULT_UNRATED_CAPTION = "No domain's landscape entry has rated these yet";

function threatKey(threat?: string): string {
  const key = threat?.toLowerCase().trim();
  return key && (GROUP_ORDER as readonly string[]).includes(key) ? key : UNRATED_KEY;
}

export function CompetitorLogoGrid({
  entries,
  groupCaption,
  unratedCaption = DEFAULT_UNRATED_CAPTION,
  minTileWidth = 232,
  logoSize = 40,
}: {
  entries: CompetitorLogoGridEntry[];
  /**
   * One line stating WHICH threat reading is banding these vendors — required, because
   * the rating is per-domain in the content and a grid that just says "High threat" over
   * a cross-domain list would assert a global rating the evidence doesn't support.
   */
  groupCaption: string;
  /** What "Unrated" means in THIS view. See DEFAULT_UNRATED_CAPTION. */
  unratedCaption?: string;
  minTileWidth?: number;
  logoSize?: number;
}) {
  if (!entries.length) return null;

  const buckets = new Map<string, CompetitorLogoGridEntry[]>();
  for (const e of entries) {
    const key = threatKey(e.threat);
    const list = buckets.get(key);
    if (list) list.push(e);
    else buckets.set(key, [e]);
  }

  const groups = [...GROUP_ORDER, UNRATED_KEY]
    .map((key) => ({ key, items: buckets.get(key) ?? [] }))
    .filter((g) => g.items.length);

  return (
    <Stack gap={5}>
      <Text type="supporting" size="xsm" color="secondary">
        {groupCaption}
      </Text>
      {groups.map((group) => (
        <Stack key={group.key} gap={2}>
          <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
            <ThreatBadge threat={group.key === UNRATED_KEY ? undefined : group.key} />
            <Text type="supporting" size="xsm" color="secondary">
              {group.items.length === 1 ? "1 vendor" : `${group.items.length} vendors`}
              {group.key === UNRATED_KEY ? ` · ${unratedCaption}` : ""}
            </Text>
          </Stack>
          <Grid columns={{ minWidth: minTileWidth }} gap={3}>
            {group.items.map((e) => (
              <ClickableCard key={e.slug} href={`/competitors/${e.slug}`} label={e.competitor}>
                <Stack gap={2}>
                  <CompetitorLogo
                    slug={e.slug}
                    competitor={e.competitor}
                    logoAsset={e.logo_asset}
                    size={logoSize}
                    decorative
                  />
                  <Text type="body" weight="semibold" size="sm" maxLines={2}>
                    {e.competitor}
                  </Text>
                  {e.note ? (
                    <Text type="supporting" size="xsm" maxLines={2}>
                      {e.note}
                    </Text>
                  ) : null}
                  {e.secondaryNote ? (
                    <Text type="supporting" size="xsm" maxLines={2}>
                      {e.secondaryNote}
                    </Text>
                  ) : null}
                  {e.meta ?? null}
                </Stack>
              </ClickableCard>
            ))}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}
