"use client";

import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Grid } from "@astryxdesign/core/Grid";
import { Badge } from "@astryxdesign/core/Badge";
import { Divider } from "@astryxdesign/core/Divider";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import {
  DirectionalBadge,
  ExxatComplianceBadge,
  exxatComplianceStatus,
  FitBadge,
  PrismFeatureBadge,
  StandardsRatingBadge,
  UseCaseStatusBadge,
} from "@/components/fit-badge";
import { FieldBlock } from "@/components/field-block";
import { CompetitorLogo } from "@/components/competitor-logo";
import { SourceList } from "@/components/source-list";
import { RelatedFlowsPreview } from "@/components/related-flows-preview";
import { Takeaway } from "@/components/takeaway";
import { stripFileCitations } from "@/lib/strip-file-citations";
import type { StandardsCrosswalkRow } from "@/lib/content";

// EXTRACTED VERBATIM from components/accreditation-standards-table.tsx (Task 5.5).
// Nothing below this import block was edited: the component body, every comment in
// it, and its `personaLabel` helper are the exact lines that already shipped in that
// file. They moved here so the Dissection tab's topology map can open the SAME panel
// for a `standard` node that /domains/{slug}/standards opens for a table row — two
// surfaces, one panel, rather than a thinner second version of a component that is
// already written and already reviewed. The only edits are mechanical: `function` ->
// `export function` on StandardDetail, and the import list above, which is that
// file's own import list narrowed to what this file actually uses.

// content/personas/*.yaml filenames minus extension ("role-compliance-accreditation-liaison").
// UI-DENSITY-PATTERNS.md: a raw slug must never reach the screen, so every one of
// these is title-cased and de-prefixed before it's rendered.
function personaLabel(slug: string): string {
  return slug
    .replace(/^(role|discipline|lens)-/, "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Full-width detail panel for one expanded row, following UI-DENSITY-PATTERNS.md's
// two-zone shape: a scan layer with ONE real takeaway (what is Exxat's answer to
// this standard, in one sentence, no scrolling required), then a Divider into a
// closed-by-default CollapsibleGroup for everything else. An earlier version of
// this panel wrapped every field in a same-weight "label + paragraph" block and
// tried to differentiate zones with background color alone — that's not a real
// hierarchy fix, it's the same flat wall of text with a tint over it. The actual
// fix is: one prominent verdict, then named, closed sections a reader opens only
// for the layer they actually want (the standard's official text / why Exxat is
// rated this way / proposed use cases / competitor research), matching the exact
// pattern `/prism` and the other reference pages already use.
export function StandardDetail({
  row,
  slug,
  hasWinBrief,
  dissectHref,
}: {
  row: StandardsCrosswalkRow;
  slug: string;
  hasWinBrief: boolean;
  /** A `/domains/{slug}/dissect?node=standard:…` link for THIS element, added to the
   * link row below (Phase 6 cross-linking).
   *
   * Opt-in per call site rather than derived here, for two reasons. First, this panel
   * renders on two surfaces and one of them IS the map: the topology graph opens this
   * same component for a `standard` node, where "View in Dissection map" would be a
   * link back to the panel the reader is already looking at — so that caller passes
   * nothing. Second, not every standard is a node: buildDissectionGraph only creates
   * one from a row in the competitor-ratings lens, so 4 of Pharmacy's 20 crosswalk
   * elements have no node at all. The Standards tab resolves that against the real
   * graph and passes a URL only where it will actually open something; `undefined`
   * renders no link rather than a promise the map cannot keep. */
  dissectHref?: string;
}) {
  const hasRated = row.competitors.some((c) => c.rating && c.rating !== "unresearched");
  const ratedCount = row.competitors.filter((c) => c.rating && c.rating !== "unresearched").length;

  const complianceKey = (row.exxat_compliance ?? "").toLowerCase();
  const complianceWord =
    complianceKey === "compliant"
      ? "Compliant"
      : complianceKey === "gap"
        ? "a Gap today"
        : complianceKey === "partial"
          ? "Partially compliant"
          : "Not yet rated";
  const takeawayTitle = `Exxat is ${complianceWord} — Prism fit: ${row.prism_fit ?? "Unknown"}`;

  const useCaseTriggerLabel = row.useCases.length
    ? `Proposed use cases (${row.useCases.length})`
    : row.computedMatches.length
      ? `Proposed use cases (0 curated · ${row.computedMatches.length} referenced)`
      : "Proposed use cases (none yet)";

  return (
    <Stack gap={4}>
      {/* SCAN LAYER — the one sentence a reader needs without opening anything. */}
      <Takeaway status={exxatComplianceStatus(row.exxat_compliance)} title={takeawayTitle}>
        <FieldBlock text={stripFileCitations(row.exxat_compliance_rationale)} maxLines={3} />
      </Takeaway>

      <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />

      {/* "Proposed use cases" opens by default — it's the newest, most-requested
          content on this panel and the reason a reader is likely here at all.
          Everything else starts closed, per UI-DENSITY-PATTERNS.md's "pick a
          sensible default, set it on the group" rule. */}
      <CollapsibleGroup type="multiple" hasDividers density="compact" defaultValue={["use-cases"]}>
        <Collapsible value="standard" trigger="What the standard requires">
          <Stack gap={3}>
            <Grid columns={{ minWidth: 280, max: 2 }} gap={4}>
              <FieldBlock label="Evidence required" text={stripFileCitations(row.evidence_programs_must_produce)} maxLines={5} />
              <FieldBlock label="Required software behavior" text={stripFileCitations(row.required_software_behavior)} maxLines={5} />
            </Grid>
            {row.researchSources.length ? (
              <Stack gap={1}>
                <Text type="label" color="secondary" size="xsm">
                  What the literature says about this standard
                </Text>
                <SourceList sources={row.researchSources} />
              </Stack>
            ) : null}
          </Stack>
        </Collapsible>

        <Collapsible
          value="rationale"
          // A bare string here, NOT wrapped in <Text> — Collapsible's trigger span
          // applies its own fixed ~17px/semibold styling directly to a plain string
          // child, matching the other three (string) triggers exactly. Wrapping the
          // label in <Text> made this the one trigger to render smaller/lighter than
          // its siblings, because Text sets its own font-size that overrides what it
          // would otherwise inherit from the trigger span.
          trigger={
            <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
              Why Exxat is rated this way
              <ExxatComplianceBadge compliance={row.exxat_compliance} />
              <FitBadge fit={row.prism_fit} />
            </Stack>
          }
        >
          <Stack gap={3}>
            <Grid columns={{ minWidth: 280, max: 2 }} gap={4}>
              <FieldBlock label="Exxat today" text={stripFileCitations(row.exxat_compliance_rationale)} maxLines={8} />
              <FieldBlock label="Prism fit" text={stripFileCitations(row.prism_fit_rationale)} maxLines={8} />
            </Grid>
            {row.gap_notes ? <FieldBlock label="Gap notes" text={stripFileCitations(row.gap_notes)} maxLines={5} /> : null}
            {row.personaRelevance.length ? (
              <Stack gap={1}>
                <Text type="label" color="secondary" size="xsm">
                  Who this matters to
                </Text>
                <Stack direction="horizontal" gap={1} wrap="wrap">
                  {row.personaRelevance.map((p) => (
                    <Badge key={p} variant="neutral" label={personaLabel(p)} />
                  ))}
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        </Collapsible>

        <Collapsible value="use-cases" trigger={useCaseTriggerLabel}>
          <Stack gap={3}>
            {row.useCases.length ? (
              <Stack gap={3}>
                {row.useCases.map((u, i) => (
                  <Stack key={`${u.useCase}-${i}`} gap={1.5}>
                    <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                      <UseCaseStatusBadge status={u.status} />
                      <PrismFeatureBadge feature={u.prismFeatureRef} />
                    </Stack>
                    {/* No size override here — `size="lg"` (font-size-lg) landed at
                        nearly the same step as the Collapsible trigger's own ~17px
                        type, so the item headline and the section header above it
                        were visually indistinguishable. Default body size + semibold
                        weight keeps it bolder than the supporting detail below while
                        staying clearly smaller than "Proposed use cases (N)" above. */}
                    <Text type="body" weight="semibold" textWrap="wrap">
                      {u.useCase}
                    </Text>
                    <FieldBlock text={u.detail} type="supporting" maxLines={3} />
                    {u.audience.length ? (
                      <Stack direction="horizontal" gap={1} wrap="wrap">
                        {u.audience.map((a) => (
                          <Badge key={a} variant="neutral" label={personaLabel(a)} />
                        ))}
                      </Stack>
                    ) : null}
                    <RelatedFlowsPreview items={u.relatedFlows} />
                    <SourceList sources={u.sources} />
                  </Stack>
                ))}
              </Stack>
            ) : null}

            {row.computedMatches.length ? (
              <Stack gap={1.5}>
                <Text type="label" color="secondary" size="xsm">
                  Also cited by existing research (computed — not a curated use case)
                </Text>
                <Stack gap={1}>
                  {row.computedMatches.map((m) => (
                    <Stack
                      key={`${m.kind}-${m.href}-${m.label}`}
                      direction="horizontal"
                      gap={2}
                      vAlign="center"
                      wrap="wrap"
                    >
                      <Badge variant="neutral" label={m.kind === "flow" ? "Flow" : "Journey"} />
                      <Link href={m.href} color="accent" hasUnderline>
                        {m.label}
                      </Link>
                      {m.context ? (
                        <Text type="supporting" size="xsm" color="secondary" maxLines={1}>
                          {m.context}
                        </Text>
                      ) : null}
                    </Stack>
                  ))}
                </Stack>
                {row.computedMatchTotal > row.computedMatches.length ? (
                  <Text type="supporting" size="xsm" color="secondary">
                    {row.computedMatchTotal - row.computedMatches.length} more flow and journey
                    references name this element — open the linked flows above to follow the chain.
                  </Text>
                ) : null}
              </Stack>
            ) : null}

            {!row.useCases.length && !row.computedMatches.length ? (
              <Text type="supporting" size="sm" color="secondary" style={{ fontStyle: "italic" }}>
                No use case or journey is mapped to this standard yet — unmapped, not unsupported.
                Nothing here says a program can't do this in Prism; it says nobody has written
                down what doing it looks like.
              </Text>
            ) : null}
          </Stack>
        </Collapsible>

        <Collapsible value="competitors" trigger={`Competitor ratings (${ratedCount}/${row.competitors.length} rated)`}>
          <Stack gap={3}>
            {row.competitors.length ? (
              // Every competitor tracked for this domain gets a card here, rated or
              // not — this is the exhaustive Standards tab, not the Overview
              // answer-key, so silently dropping the unrated majority read as "we
              // didn't check," not "unresearched." A rated card carries the full
              // rationale/sources; an unrated one says so plainly instead of
              // vanishing.
              <Grid columns={{ minWidth: 220, max: 3 }} gap={3}>
                {row.competitors.map((c) => {
                  const isRated = !!c.rating && c.rating !== "unresearched";
                  return (
                    <Stack key={c.slug} gap={1.5}>
                      <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                        <CompetitorLogo slug={c.slug} competitor={c.competitor} size={20} />
                        <Text type="body" weight={isRated ? "semibold" : undefined} color={isRated ? undefined : "secondary"}>
                          {c.competitor}
                        </Text>
                        <StandardsRatingBadge rating={c.rating} />
                      </Stack>
                      {isRated ? (
                        <>
                          {c.rationale ? (
                            <FieldBlock text={c.rationale} type="supporting" maxLines={4} />
                          ) : null}
                          {/* Directional flag lives here, in the expanded card — NOT in the
                              collapsed table cell. A second pill per cell across 5 competitor
                              columns breaks the row's scan strip. The note reuses the same
                              italic supporting-text treatment as "not yet researched" below. */}
                          {c.evidenceStrength === "directional" ? (
                            // hAlign="start" (align-items on a vertical Stack) keeps the
                            // pill at its own width — without it the Badge stretches the
                            // full column and reads as a banner, not a badge.
                            <Stack gap={1} hAlign="start">
                              <DirectionalBadge evidenceStrength={c.evidenceStrength} />
                              {c.evidenceNote ? (
                                <Text
                                  type="supporting"
                                  size="xsm"
                                  color="secondary"
                                  maxLines={3}
                                  style={{ fontStyle: "italic" }}
                                >
                                  {c.evidenceNote}
                                </Text>
                              ) : null}
                            </Stack>
                          ) : null}
                          <SourceList sources={c.sources} />
                        </>
                      ) : (
                        <Text type="supporting" size="xsm" color="secondary" style={{ fontStyle: "italic" }}>
                          Not yet researched against this specific standard — unresearched, not "doesn't
                          solve it."
                        </Text>
                      )}
                    </Stack>
                  );
                })}
              </Grid>
            ) : (
              <Text type="supporting" size="sm" color="secondary" style={{ fontStyle: "italic" }}>
                No competitor research covers this domain yet.{" "}
                <Link href={`/domains/${slug}/competitors`} color="accent" hasUnderline>
                  See who's active in this market →
                </Link>
              </Text>
            )}
            {row.competitors.length && !hasRated ? (
              <Text type="supporting" size="xsm" color="secondary">
                <Link href={`/domains/${slug}/competitors`} color="accent" hasUnderline>
                  See who's active in this market →
                </Link>
              </Text>
            ) : null}
          </Stack>
        </Collapsible>
      </CollapsibleGroup>

      {/* Same "Text label xsm + Link" idiom as exxat-gap-answer.tsx's and
          domain-scenario.tsx's single out-links, just three in a row — keeps
          this row's typography consistent with every other link-out in the
          app rather than introducing a one-off size/weight here. */}
      <Stack direction="horizontal" gap={3} wrap="wrap">
        {dissectHref ? (
          <Text type="label" color="secondary" size="xsm">
            <Link href={dissectHref} color="accent" hasUnderline>
              View in Dissection map →
            </Link>
          </Text>
        ) : null}
        <Text type="label" color="secondary" size="xsm">
          <Link href={`/domains/${slug}/trends`} color="accent" hasUnderline>
            Domain trends →
          </Link>
        </Text>
        <Text type="label" color="secondary" size="xsm">
          <Link href={`/domains/${slug}/competitors`} color="accent" hasUnderline>
            Full competitor comparison →
          </Link>
        </Text>
        <Text type="label" color="secondary" size="xsm">
          <Link href={`/domains/${slug}`} color="accent" hasUnderline>
            Domain overview →
          </Link>
        </Text>
        {hasWinBrief ? (
          <Text type="label" color="secondary" size="xsm">
            <Link href={`/domains/${slug}/win`} color="accent" hasUnderline>
              How we win →
            </Link>
          </Text>
        ) : null}
      </Stack>
    </Stack>
  );
}
