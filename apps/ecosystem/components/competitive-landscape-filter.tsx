import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { DisciplineChip } from "@/components/discipline-chip";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import { getAccreditorTiers } from "@/lib/content";

// The `?domain=` narrowing shared by both pivots of /competitive-landscape.
//
// Resolution reuses the domain hub's own idiom verbatim — the route slug is
// matched against accreditor-tiers.yaml's domain names through
// matchDisciplineMeta, exactly as app/domains/[slug]/competitors/page.tsx does to
// find its entry. That matters because the downstream competitor filter
// (getFeatureComparisonForDomain) keys off that same YAML domain string and
// handles the "MD" vs. "Medicine" abbreviation mismatch internally; inventing a
// second slug→domain mapping here would be the one place the two could drift.

export interface DomainFilter {
  slug: string;
  /** The domain name as accreditor-tiers.yaml spells it — what content lookups key off. */
  domain: string;
}

/** Null for an absent, array-valued, or unrecognized `?domain=` — an unknown slug widens to all domains rather than 404ing a pivot that is perfectly readable unfiltered. */
export function resolveDomainFilter(raw: string | string[] | undefined): DomainFilter | null {
  if (typeof raw !== "string" || !raw) return null;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === raw);
  return entry ? { slug: raw, domain: entry.domain } : null;
}

/** The "you are scoped to one domain, here is the way out" row. Rendered only when a filter is active, so the unfiltered pivots stay byte-identical to the pages they replaced. */
export function DomainFilterNotice({ filter, clearHref }: { filter: DomainFilter; clearHref: string }) {
  return (
    <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
      <Text type="label" color="secondary" size="sm">
        Scoped to
      </Text>
      <DisciplineChip subject={filter.domain} />
      <Link href={clearHref} color="accent" hasUnderline>
        Show all domains
      </Link>
    </Stack>
  );
}
