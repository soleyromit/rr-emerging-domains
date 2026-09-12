import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Divider } from "@astryxdesign/core/Divider";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { KeyFindingList } from "@/components/key-finding-list";
import { TrendCoverageBadge } from "@/components/fit-badge";
import { MaturityScale } from "@/components/maturity-scale";
import { FieldBlock } from "@/components/field-block";
import { SourceList } from "@/components/source-list";
import { CompetitorLogo } from "@/components/competitor-logo";
import { Link } from "@astryxdesign/core/Link";
import { getAccreditorTiers, getTrendsForDomain, type ResolvedTrendEntry, type KeyFinding } from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import { stripFileCitations } from "@/lib/strip-file-citations";
import { humanizeCompetitorSlug } from "@/lib/competitor-meta";
import { dissectNodeHref, dissectionNodeId, dissectionNodeIds } from "@/lib/dissection-links";

// Market/regulatory trends per domain, the demand-side sibling of the Standards
// tab: standards are what the accreditor already requires, trends are what the
// market is moving toward before anyone is required to do it.
//
// Severity reuses the gap_severity vocabulary KeyFindingList already speaks
// (none | configure-needed | gap) so nothing about that contract changes — only
// the badge labels are swapped, via renderSeverity + TrendCoverageBadge, because
// "Configure needed" means nothing about a trend. The tri-state:
//   shipped                                   -> none            (Exxat ships it)
//   not shipped, some competitor addresses it -> configure-needed (competitors ahead)
//   not shipped, nobody addresses it          -> gap             (open whitespace)
function trendSeverity(t: ResolvedTrendEntry): string {
  if (t.exxat_status === "shipped") return "none";
  return t.addressedByCompetitors.length > 0 ? "configure-needed" : "gap";
}

// The scan-layer line gets one sentence, not the whole detail: ListItem's
// `description` has no overflow tooltip (see UI-DENSITY-PATTERNS.md), so a long
// string passed straight into it is unrecoverable. Full text lives in the
// deep-dive Collapsible below, in a FieldBlock that does have a read-more.
function leadSentence(detail?: string): string | undefined {
  if (!detail) return undefined;
  const first = detail.split(/(?<=[.?!])\s+/)[0] ?? detail;
  return first.length > 150 ? `${first.slice(0, 147).trimEnd()}…` : first;
}

export default async function DomainTrendsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  const trends = getTrendsForDomain(entry.domain);

  if (!trends.length) {
    return (
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Heading level={2}>Trends</Heading>
          <EmptyState
            title={`Trends not yet sourced for ${entry.domain}`}
            description={
              "This tab populates once the market/regulatory trends research pass lands a " +
              "cited entry for this domain. Nothing is inferred here — an empty list means " +
              "no sourced trend exists yet, not that the domain has no trends."
            }
          />
        </Stack>
      </Section>
    );
  }

  // subject is the domain, not the trend text: DisciplineChip renders its subject
  // as a short color-coded code when it matches a known domain and as a full-width
  // neutral badge when it doesn't — passing trend prose there would blow the chip
  // column open on every row.
  const findings: KeyFinding[] = trends.map((t) => ({
    subject: entry.domain,
    headline: t.trend,
    severity: trendSeverity(t),
    detail: leadSentence(t.detail),
  }));

  // A trend is only ON the map when it has at least one edge there — a competitor that
  // addresses it, or an exxat_ref that resolves to a core pillar. Roughly half do not
  // (7 of Pharmacy's 14, 3 of DO's 8), and buildDissectionGraph drops the rest, so the
  // footer link below is conditional rather than rendered for every card.
  const dissectNodeIds = dissectionNodeIds(slug, entry.domain);

  const shipped = trends.filter((t) => t.exxat_status === "shipped").length;
  const contested = trends.filter(
    (t) => t.exxat_status !== "shipped" && t.addressedByCompetitors.length > 0
  ).length;

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Stack gap={1}>
            <Heading level={2}>Trends</Heading>
            <Text type="supporting">
              Where {entry.domain} is heading, and whether Exxat or a competitor already answers it.
            </Text>
          </Stack>

          <MetadataList columns={3}>
            <MetadataListItem label="Trends tracked">{trends.length}</MetadataListItem>
            <MetadataListItem label="Exxat ships it">{shipped}</MetadataListItem>
            <MetadataListItem label="Competitors ahead">{contested}</MetadataListItem>
          </MetadataList>

          <KeyFindingList findings={findings} severityVocabulary="trend" />
        </Stack>
      </Section>

      <Section padding={6} variant="muted">
        <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />
      </Section>

      <Section padding={6} dividers={["bottom"]} variant="muted">
        <Stack gap={3}>
          <Heading level={3}>Trend detail</Heading>
          <CollapsibleGroup type="multiple" hasDividers density="compact">
            {trends.map((t) => {
              const mapHref = dissectNodeHref(slug, dissectNodeIds, dissectionNodeId.trend(t.id));
              return (
              <Collapsible key={t.id} value={t.id} defaultIsOpen={false} trigger={t.trend}>
                <Stack gap={3}>
                  <Stack gap={1.5}>
                    <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                      <TrendCoverageBadge severity={trendSeverity(t)} />
                    </Stack>
                    <Stack gap={0.5}>
                      <Text type="label" color="secondary" size="xsm">
                        Exxat's path on this trend
                      </Text>
                      <MaturityScale status={t.exxat_status} />
                    </Stack>
                  </Stack>

                  <FieldBlock text={stripFileCitations(t.detail)} maxLines={4} />

                  {t.addressedByCompetitors.length ? (
                    <Stack gap={1.5}>
                      <Text type="label" color="secondary" size="xsm">
                        Addressed by
                      </Text>
                      <Stack gap={1.5}>
                        {t.addressedByCompetitors.map((c) => (
                          <Stack key={c.slug} gap={1}>
                            <Stack direction="horizontal" gap={1.5} vAlign="center">
                              <CompetitorLogo slug={c.slug} competitor={c.competitor} size={20} />
                              <Text type="body" size="sm" weight="semibold">
                                {c.competitor ?? humanizeCompetitorSlug(c.slug)}
                              </Text>
                            </Stack>
                            <SourceList sources={c.source ? [c.source] : []} label="" />
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  ) : (
                    <Text type="supporting" size="sm" color="secondary">
                      No competitor is known to address this yet.
                    </Text>
                  )}

                  <SourceList sources={t.sources} />

                  {/* Same "Text label xsm + Link" idiom as StandardDetail's link row. */}
                  {mapHref ? (
                    <Text type="label" color="secondary" size="xsm">
                      <Link href={mapHref} color="accent" hasUnderline>
                        See this trend on the Dissection map →
                      </Link>
                    </Text>
                  ) : null}
                </Stack>
              </Collapsible>
              );
            })}
          </CollapsibleGroup>
        </Stack>
      </Section>
    </Stack>
  );
}
