import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Link } from "@astryxdesign/core/Link";
import { Icon } from "@astryxdesign/core/Icon";
import { PageHeader } from "@/components/page-header";
import { DomainHubTabs } from "@/components/domain-hub-tabs";
import { getAccreditorTiers, hasSalesBrief } from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import type { DisciplineMeta } from "@/lib/discipline-meta";

// discipline-meta.ts's BadgeVariant is a superset of Card's variant union (it
// also carries neutral/info/success/warning/error, for severity badges
// elsewhere) — every DOMAINS entry happens to use a color already valid on
// Card, but this narrows the type honestly instead of an `as` cast.
const CARD_COLOR_VARIANTS = ["blue", "cyan", "green", "orange", "pink", "purple", "red", "teal", "yellow"] as const;
type DomainCardVariant = (typeof CARD_COLOR_VARIANTS)[number];
function domainCardVariant(meta: DisciplineMeta | null): DomainCardVariant | "muted" {
  const v = meta?.badgeVariant;
  return (CARD_COLOR_VARIANTS as readonly string[]).includes(v ?? "") ? (v as DomainCardVariant) : "muted";
}

// Single hub per discipline: accreditor structure, full standards table, competitor
// landscape, and discipline persona all live under this one route as sibling tabs
// (page.tsx = Overview, standards/, competitors/ — the persona got its own tab until
// the 2026-09-13 nav consolidation folded it into Overview's Buyer profile section,
// /domains/[slug]#buyer-profile) instead of four
// separate pages (/domains/[slug], /accreditation/[domain], the embedded view on
// what is now /standards and was then /crosswalk,
// view, /personas/discipline/[slug]) that duplicated and never cross-linked each
// other. generateStaticParams lives here once — Next.js propagates it to every
// sibling page nested under this dynamic segment.
export function generateStaticParams() {
  const domains = getAccreditorTiers()?.domains ?? [];
  return domains
    .map((d) => matchDisciplineMeta(d.domain)?.slug)
    .filter((slug): slug is string => !!slug)
    .map((slug) => ({ slug }));
}

export default async function DomainHubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();
  const meta: DisciplineMeta | null = matchDisciplineMeta(entry.domain);
  const hasWinBrief = hasSalesBrief(slug);

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Breadcrumbs>
            <BreadcrumbItem href="/domains">Domains</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{entry.domain}</BreadcrumbItem>
          </Breadcrumbs>
          {/* Every domain has a real, distinct accent already defined in
              discipline-meta.ts (DO purple, Pharmacy teal, Dentistry orange,
              Medicine cyan) — kept out of the red/yellow/green/blue severity
              family on purpose. It only ever showed up as a small chip; this
              is the one place a reader lands on every visit to this domain,
              so it's the right spot to actually carry that color, not just
              name it. */}
          <Card variant={domainCardVariant(meta)} padding={4}>
            <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
              <Stack
                vAlign="center"
                hAlign="center"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "var(--color-background-base)",
                  flexShrink: 0,
                }}
              >
                <Text type="body" weight="bold" size="lg">
                  {meta?.code ?? entry.domain.slice(0, 2).toUpperCase()}
                </Text>
              </Stack>
              <PageHeader
                eyebrow="Domain"
                title={entry.domain}
                description="Accreditor structure, standards, competitors, and persona — everything about this domain in one place."
                endContent={
                  hasWinBrief ? (
                    <Link href={`/domains/${slug}/win`} color="accent" hasUnderline>
                      <Stack direction="horizontal" gap={1} vAlign="center">
                        <Text type="body" weight="semibold">
                          How we win this domain
                        </Text>
                        <Icon icon="chevronRight" size="sm" aria-hidden="true" />
                      </Stack>
                    </Link>
                  ) : undefined
                }
              />
            </Stack>
          </Card>
          <DomainHubTabs slug={slug} hasWinBrief={hasWinBrief} />
        </Stack>
      </Section>
      {children}
    </Stack>
  );
}
