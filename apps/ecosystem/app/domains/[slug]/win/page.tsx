import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Link } from "@astryxdesign/core/Link";
import { Divider } from "@astryxdesign/core/Divider";
import { Markdown } from "@astryxdesign/core/Markdown";
import { List, ListItem } from "@astryxdesign/core/List";
import { CollapsibleGroup, Collapsible } from "@astryxdesign/core/Collapsible";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { EntryChain } from "@/components/entry-chain";
import { BuyerMap } from "@/components/buyer-map";
import { ObjectionList } from "@/components/objection-list";
import { CompetitorLogo } from "@/components/competitor-logo";
import { ExxatComplianceBadge, StandardsRatingBadge, ThreatBadge } from "@/components/fit-badge";
import { getAccreditorTiers, getDomainHubData, getScorecard, computeWeightedTotals } from "@/lib/content";
import type { StandardsCrosswalkCompetitorCell } from "@/lib/content";
import { getSalesBrief } from "@/lib/sales-brief";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import { dissectNodeHref, dissectionNodeId, dissectionNodeIds } from "@/lib/dissection-links";
import { extractLead } from "@/lib/markdown-sections";
import { stripFileCitations } from "@/lib/strip-file-citations";

function bestRated(cells: StandardsCrosswalkCompetitorCell[]): StandardsCrosswalkCompetitorCell | undefined {
  const rank: Record<string, number> = { "fully-meeting": 3, "partially-meeting": 2, "not-meeting": 1 };
  return [...cells].sort((a, b) => (rank[b.rating] ?? 0) - (rank[a.rating] ?? 0))[0];
}

export default async function DomainWinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  const brief = getSalesBrief(slug);
  if (!brief) {
    // Defense in depth — DomainHubTabs only shows this tab when hasSalesBrief(slug)
    // is true, so a real visitor never lands here without a brief. A hand-typed
    // URL for a domain with none gets an honest empty state, not a 500.
    return (
      <Section padding={6}>
        <EmptyState
          title="No GTM brief yet for this domain"
          description="This domain doesn't have a sales/positioning brief in the research base yet."
        />
      </Section>
    );
  }

  const hub = getDomainHubData(entry.domain, slug);
  const scorecard = getScorecard();
  const totals = scorecard ? computeWeightedTotals(scorecard) : null;
  const ranked = totals ? Object.entries(totals).sort((a, b) => b[1] - a[1]) : [];
  const gtmTarget = scorecard?.actual_gtm_target;
  const isConfirmedTarget = gtmTarget === entry.domain;
  const domainRank = ranked.findIndex(([d]) => d === entry.domain);
  const domainScore = domainRank >= 0 ? ranked[domainRank][1] : undefined;

  // ---------- header title: never hand-typed, and DO's page must name both
  // Pharmacy's confirmed-target status and its own analytical lead — the two
  // conclusions are intentionally not reconciled anywhere else in the app.
  // "The scorecard's analytical leader" is only true of whichever domain
  // actually ranks #1 (DO) — every other non-target domain gets its real
  // rank instead, or it would falsely claim the title for Dentistry/Medicine
  // too. ----------
  const isAnalyticalLeader = domainRank === 0 && !isConfirmedTarget;
  const title = isConfirmedTarget
    ? `${entry.domain} — the confirmed first domain in market`
    : isAnalyticalLeader && gtmTarget
      ? `${entry.domain} — the scorecard's analytical leader, sequenced behind ${gtmTarget}`
      : gtmTarget && domainRank >= 0
        ? `${entry.domain} — ranked ${domainRank + 1} of ${ranked.length} on the scorecard, sequenced behind ${gtmTarget}`
        : `${entry.domain} — how we win`;

  // ---------- entry chain: Trigger -> Lead -> Concede ----------
  // switching_trigger opens every domain's file with a scene-setting sentence
  // ("Three triggers, roughly in order of force.") before naming the first
  // real one — 1 sentence only ever surfaces the throat-clear. Pull enough
  // sentences that real content is in range, and let the card's maxLines
  // clamp handle the display truncation.
  // Sanitized before extractLead, not after — the same ordering trends/page.tsx needs.
  // A citation deleted from the middle of sentence two must not shift which four sentences
  // "the lead" means, and a parenthetical citation containing a "." would otherwise let the
  // sentence splitter cut inside the citation and strand half a path in the card.
  const triggerText = hub.disciplinePersona?.switching_trigger
    ? extractLead(stripFileCitations(hub.disciplinePersona.switching_trigger) ?? "", 4)
    : undefined;
  const topOpening = brief.openings[0];
  // The honest-gap sentence: verified against all 4 real briefs, each has
  // exactly one objection whose answer explicitly admits a limitation rather
  // than redirecting — and each uses one of the same three admission phrases
  // ("be honest," "concede," "be straight"). A weaker signal like the bare
  // word "gap" false-positives on Pharmacy's CORE-ELMS objection, whose
  // answer says "that's the gap Prism's architecture answers" — a claimed
  // strength, not a conceded weakness — so this only matches the explicit
  // admission move, never a stray keyword.
  const concedeObjection = brief.objections.find((o) => /\bbe honest\b|\bconcede\b|\bbe straight\b/i.test(o.answer));

  // ---------- gap standards: top 3 gap/partial rows, each with best competitor ----------
  const gapRows = (hub.standardsCrosswalk?.rows ?? [])
    .filter((r) => ["gap", "partial"].includes((r.exxat_compliance ?? "").toLowerCase()))
    .slice(0, 3);

  // A gap card links to its own standard on the Dissection map — but only where that
  // element really is a node. The map's standards come from the competitor-ratings
  // lens, not from this crosswalk, so an unrated element (4 of Pharmacy's 20) has
  // nothing to open and gets no link rather than a dead one.
  const dissectNodeIdSet = dissectionNodeIds(slug, entry.domain);

  const highThreatCompetitors = (hub.landscapeEntry?.competitors ?? [])
    .slice()
    .sort((a, b) => (a.threat === "high" ? -1 : 1) - (b.threat === "high" ? -1 : 1));

  const compliantCount = (hub.standardsCrosswalk?.rows ?? []).filter(
    (r) => (r.exxat_compliance ?? "").toLowerCase() === "compliant"
  ).length;
  const totalStandards = hub.standardsCrosswalk?.rows.length ?? 0;
  const gapsWithCompetitor = (hub.standardsCrosswalk?.rows ?? []).filter(
    (r) =>
      ["gap", "partial"].includes((r.exxat_compliance ?? "").toLowerCase()) &&
      r.competitors.some((c) => c.rating && c.rating !== "unresearched")
  ).length;
  const highThreatCount = (hub.landscapeEntry?.competitors ?? []).filter((c) => c.threat === "high").length;

  return (
    <Stack gap={0}>
      {/* ---------- Scan layer: the answer, above the fold ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="How we win"
            title={title}
            endContent={
              isConfirmedTarget ? (
                <Badge variant="success" label={`Confirmed GTM target${scorecard?.actual_gtm_target_decided ? ` — ${scorecard.actual_gtm_target_decided}` : ""}`} />
              ) : isAnalyticalLeader ? (
                <Badge variant="info" label="Scorecard analytical leader" />
              ) : domainRank >= 0 ? (
                <Badge variant="neutral" label={`Rank ${domainRank + 1} of ${ranked.length} on the scorecard`} />
              ) : null
            }
          />

          {brief.positioningStatement ? (
            <Takeaway title="The one-sentence answer">{brief.positioningStatement}</Takeaway>
          ) : null}

          {brief.labeledLeads["The rule first"] ? (
            <Takeaway status="warning" title="Read this before the room">
              {brief.labeledLeads["The rule first"]}
              {brief.labeledLeads["The disqualifier to know before you're in the room"]
                ? ` ${brief.labeledLeads["The disqualifier to know before you're in the room"]}`
                : ""}
            </Takeaway>
          ) : null}

          <EntryChain
            nodes={[
              triggerText ? { label: "Why now", text: triggerText, variant: "blue" } : undefined,
              topOpening
                ? {
                    label: "What we lead with",
                    text: stripFileCitations(topOpening.detail || topOpening.headline) ?? "",
                    variant: "green",
                  }
                : undefined,
              concedeObjection ? { label: "What we concede", text: concedeObjection.answer, variant: "orange" } : undefined,
            ]}
          />

          <MetadataList columns={4}>
            <MetadataListItem label="Standards met">
              {totalStandards ? `${compliantCount} / ${totalStandards}` : "Not yet mapped"}
            </MetadataListItem>
            <MetadataListItem label="Gaps a competitor already covers">{gapsWithCompetitor}</MetadataListItem>
            <MetadataListItem label="High-threat competitors">{highThreatCount}</MetadataListItem>
            <MetadataListItem label="Objections prepared">
              {brief.objections.length + (brief.objectionAddendum?.objections.length ?? 0)}
            </MetadataListItem>
          </MetadataList>

          {brief.openings.length ? (
            <Stack gap={2}>
              <Text type="label" color="secondary" size="sm">
                Why they&apos;d switch now
              </Text>
              <List hasDividers>
                {brief.openings.map((o) => (
                  <ListItem
                    key={o.headline}
                    label={o.headline}
                    description={
                      <Text type="supporting" size="sm" maxLines={2}>
                        {stripFileCitations(o.detail)}
                      </Text>
                    }
                  />
                ))}
              </List>
            </Stack>
          ) : null}

          {brief.buyers.length ? (
            <Stack gap={2}>
              <Text type="label" color="secondary" size="sm">
                Who signs
              </Text>
              <BuyerMap buyers={brief.buyers} />
            </Stack>
          ) : null}
        </Stack>
      </Section>

      {/* ---------- Deep dive ---------- */}
      <Section padding={6} variant="muted">
        <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />
      </Section>

      {brief.objections.length || brief.objectionAddendum ? (
        <Section padding={6} dividers={["bottom"]} variant="muted">
          <Stack gap={3}>
            <Heading level={3}>Objections you will hear</Heading>
            <ObjectionList objections={brief.objections} addendum={brief.objectionAddendum} />
          </Stack>
        </Section>
      ) : null}

      {gapRows.length ? (
        <Section padding={6} dividers={["bottom"]} variant="muted">
          <Stack gap={3}>
            <Heading level={3}>The compliance gaps they&apos;ll test you on</Heading>
            <Grid columns={{ minWidth: 280, max: 3 }} gap={3}>
              {gapRows.map((row) => {
                const rated = row.competitors.filter((c) => c.rating && c.rating !== "unresearched");
                const best = bestRated(rated);
                const mapHref = dissectNodeHref(
                  slug,
                  dissectNodeIdSet,
                  dissectionNodeId.standard(entry.domain, row.element_id)
                );
                return (
                  <Card key={row.element_id} variant="default">
                    <Stack gap={1.5}>
                      <ExxatComplianceBadge compliance={row.exxat_compliance} />
                      <Text type="body" weight="semibold" maxLines={2}>
                        {row.element_title || row.element_id}
                      </Text>
                      <Text type="supporting" size="xsm" color="secondary">
                        {row.element_id}
                      </Text>
                      {row.gap_notes ? (
                        <Text type="supporting" size="sm" maxLines={3}>
                          {stripFileCitations(row.gap_notes)}
                        </Text>
                      ) : null}
                      {best ? (
                        <Stack direction="horizontal" gap={1.5} vAlign="center" style={{ paddingTop: 4 }}>
                          <CompetitorLogo slug={best.slug} competitor={best.competitor} size={16} />
                          <Text type="supporting" size="xsm">
                            {best.competitor}
                          </Text>
                          <StandardsRatingBadge rating={best.rating} />
                        </Stack>
                      ) : null}
                      {mapHref ? (
                        <Text type="label" color="secondary" size="xsm">
                          <Link href={mapHref} color="accent" hasUnderline>
                            Who else this touches →
                          </Link>
                        </Text>
                      ) : null}
                    </Stack>
                  </Card>
                );
              })}
            </Grid>
            <Text type="label" color="secondary" size="xsm">
              <Link href={`/domains/${slug}/standards`} color="accent" hasUnderline>
                See all {totalStandards} standards →
              </Link>
            </Text>
          </Stack>
        </Section>
      ) : null}

      {highThreatCompetitors.length ? (
        <Section padding={6} dividers={["bottom"]} variant="muted">
          <Stack gap={3}>
            <Heading level={3}>Who else is in the room</Heading>
            <List hasDividers>
              {highThreatCompetitors.slice(0, 5).map((c) => (
                <ListItem
                  key={c.slug}
                  href={`/competitors/${c.slug}`}
                  label={
                    <Stack direction="horizontal" gap={2} vAlign="center">
                      <CompetitorLogo slug={c.slug} competitor={c.competitor} size={20} />
                      <Text type="body" weight="semibold">
                        {c.competitor}
                      </Text>
                    </Stack>
                  }
                  description={
                    <Text type="supporting" size="sm" maxLines={2}>
                      {stripFileCitations(c.rationale)}
                    </Text>
                  }
                  endContent={<ThreatBadge threat={c.threat} />}
                />
              ))}
            </List>
            <Text type="label" color="secondary" size="xsm">
              <Link href={`/domains/${slug}/competitors`} color="accent" hasUnderline>
                See the full pillar-by-pillar comparison →
              </Link>
            </Text>
          </Stack>
        </Section>
      ) : null}

      {brief.pricingSection ? (
        <Section padding={6} dividers={["bottom"]} variant="muted">
          <Stack gap={3}>
            <Heading level={3}>Pricing &amp; ROI talking points</Heading>
            <CollapsibleGroup type="single" hasDividers density="compact">
              <Collapsible value="pricing" trigger="Pricing, ROI framing, and beachhead-target status">
                <Stack paddingBlockStart={2}>
                  <Markdown headingLevelStart={4} contentWidth={760}>
                    {brief.pricingSection}
                  </Markdown>
                </Stack>
              </Collapsible>
            </CollapsibleGroup>
          </Stack>
        </Section>
      ) : null}

      <Section padding={6} variant="muted">
        <Stack gap={3}>
          <Heading level={3}>The full brief, section by section</Heading>
          <Text type="supporting">
            Nothing is summarized away — each section below is the verbatim source text from the
            source brief for this domain. Re-check any claim against it before it goes external;
            this brief is a snapshot, not a script.
          </Text>
          <CollapsibleGroup type="multiple" hasDividers density="compact">
            {brief.otherSections.map((s) => (
              <Collapsible key={s.title} value={s.title} trigger={s.title}>
                <Stack paddingBlockStart={2}>
                  <Markdown headingLevelStart={3} contentWidth={760}>
                    {s.body}
                  </Markdown>
                </Stack>
              </Collapsible>
            ))}
            {brief.preamble ? (
              <Collapsible value="__preamble" trigger="Scope, sources & how to use this brief">
                <Stack paddingBlockStart={2}>
                  <Markdown headingLevelStart={3} contentWidth={760}>
                    {brief.preamble}
                  </Markdown>
                </Stack>
              </Collapsible>
            ) : null}
          </CollapsibleGroup>
        </Stack>
      </Section>
    </Stack>
  );
}
