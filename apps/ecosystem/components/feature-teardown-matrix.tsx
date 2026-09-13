"use client";

import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Blockquote } from "@astryxdesign/core/Blockquote";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { ComparisonMatrix } from "@/components/comparison-matrix";
import { CompetitorLogo } from "@/components/competitor-logo";
import { FieldBlock } from "@/components/field-block";
import { SourceLine } from "@/components/source-line";
import { Takeaway } from "@/components/takeaway";
import { DepthBadge, depthLabel, depthStatus } from "@/components/fit-badge";
import { stripFileCitations } from "@/lib/strip-file-citations";
import type { FeatureComparisonForDomain } from "@/lib/content";

// The pillar × competitor cross-tab on a domain's Competitors tab: rows are the six
// canonical Prism pillars, columns are the competitors researched in this domain, and
// each cell is that competitor's own feature_teardown row for that pillar.
//
// Why it exists: Phase 6 retired the hand-rolled domain-feature-comparison-table.tsx,
// which was the right call about the COMPONENT (comparison-matrix.tsx's own header
// comment names it as one of three re-implementations of one shape) but left a real
// editorial hole — "who is ahead on Curriculum Mapping across these seven vendors?"
// had no single view. FeatureDepthChart does not answer it: it groups by competitor and
// collapses the pillar dimension entirely. This restores the cross-tab through the
// generic component instead of a fourth bespoke table, and gains the per-cell drill-down
// the old table only half-had.
//
// No new content: getFeatureComparisonForDomain derives every cell from competitor
// files' already-cited feature_teardown[]. NOT the hand-authored, deliberately-sparse
// content/lenses/feature-comparison-matrix.yaml lens — that one is the Dissection tab's
// DissectionMatrix, a different question with a different vocabulary and an Exxat column.
//
// Client component for the same reason scorecard-matrix.tsx and dissection-matrix.tsx
// are: ComparisonMatrix is configured with render props, and a server component cannot
// pass functions across the RSC boundary. The page does the content read and hands this
// wrapper only serializable data.

interface TeardownCellValue {
  competitor: string;
  slug: string;
  capability?: string;
  depth?: string;
  evidence?: string;
  source?: string;
}

// depthLabel() returns sentence-case words, and half of them CONTAIN the product name
// ("Ahead of Prism", "Behind Prism", "Prism only"). A blanket .toLowerCase() on the whole
// label to make it read mid-sentence therefore also lowercased "Prism" — "…is rated ahead
// of prism here". Lowercase the leading character only, and leave labels that start with
// the product name alone. fit-badge.tsx stays the single owner of the words themselves;
// this only adjusts the casing at the one place that speaks them mid-sentence.
function depthPhrase(depth?: string): string {
  const label = depthLabel(depth);
  if (label.startsWith("Prism")) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/** A teardown row exists for this pillar only if it carries at least one researched field. */
function isResearched(cell: { capability?: string; depth?: string; evidence?: string }) {
  return Boolean(cell.capability || cell.depth || cell.evidence);
}

function CellEvidence({ value }: { value: TeardownCellValue }) {
  return (
    <Stack gap={3}>
      <FieldBlock
        label="What they ship"
        text={value.capability ?? "No capability description recorded for this pillar."}
        maxLines={4}
      />
      {value.evidence ? (
        // Same three-way separation CompetitorFeatureDossier established on
        // /competitors/{slug}: "what they claim" (capability) above, "why we believe it"
        // (evidence, cited) inside the Blockquote, "our judgment" (the depth badge) in
        // the panel header and the Takeaway. Deliberately the same vocabulary — this is
        // the same data, one click closer, not a second visual language for it.
        <Blockquote cite={<SourceLine source={value.source} />}>
          <Text type="supporting" size="sm">
            {value.evidence}
          </Text>
        </Blockquote>
      ) : (
        <Text type="supporting" size="xsm" color="secondary">
          No evidence is cited on this teardown row.
        </Text>
      )}
    </Stack>
  );
}

export function FeatureTeardownMatrix({ comparison }: { comparison: FeatureComparisonForDomain }) {
  const rowAxis = comparison.rows.map((r) => ({ id: r.pillar, label: r.pillar }));

  // NO explicit column widths — every column takes ComparisonMatrix's default
  // proportional(1), for the reason dissection-matrix.tsx spells out: fixed pixel widths
  // pin the table wider than the viewport and silently clip the right-hand edge of every
  // drill-down panel. That matters more here than anywhere else in the app, because
  // Medicine renders ten competitor columns.
  const columnAxis = comparison.competitors.map((c) => ({
    id: c.slug,
    // Stays the plain competitor name: ComparisonMatrix renders `name` verbatim in its
    // own panel header and every sentence below builds on it, so a ReactNode here would
    // print "[object Object]". Only `header`, the component's rich slot, gets the logo.
    name: c.competitor,
    header: (
      // textWrap="wrap" is load-bearing — see accreditation-standards-table.tsx's own
      // comment: a composite header does not inherit Table's header-cell wrapping, so
      // "Leo (DaVinci Education)" runs off the right edge instead of wrapping under
      // the logo. The link is not new information: every row of the competitor list
      // above this matrix already links to the same page.
      <Link href={`/competitors/${c.slug}`} color="accent">
        <Stack direction="horizontal" gap={1.5} vAlign="center" wrap="wrap">
          <CompetitorLogo slug={c.slug} competitor={c.competitor} size={20} />
          <Text type="body" weight="semibold" textWrap="wrap">
            {c.competitor}
          </Text>
        </Stack>
      </Link>
    ),
  }));

  // Sanitized once here, where the cell is built, so the cell, the Takeaway and the
  // panel all read already-clean text (same discipline as scorecard-matrix.tsx).
  const cellValues: TeardownCellValue[][] = comparison.rows.map((r) =>
    r.cells.map((c) => ({
      competitor: c.competitor,
      slug: c.slug,
      capability: stripFileCitations(c.capability),
      depth: c.depth,
      evidence: stripFileCitations(c.evidence),
      source: c.source,
    }))
  );

  // Sparse by construction: getFeatureComparisonForDomain emits a cell object for every
  // competitor × pillar pair even when that competitor's file has no teardown row for
  // the pillar, so the unresearched ones are dropped here rather than rendered as an
  // empty badge. An absent intersection gets ComparisonMatrix's own "—", which means
  // "nobody researched this vendor on this pillar" — not "they don't ship it".
  const cells = comparison.rows.flatMap((r, i) =>
    cellValues[i]
      .filter(isResearched)
      .map((value) => ({ rowId: r.pillar, colId: value.slug, value }))
  );

  const valuesByPillar = new Map(comparison.rows.map((r, i) => [r.pillar, cellValues[i]]));

  return (
    <ComparisonMatrix<string, string, TeardownCellValue>
      variant="rigorous"
      // Matches this page's own container (app/domains/[slug]/competitors/page.tsx
      // renders a plain, non-muted Section) so the sticky row-label column's
      // opaque background doesn't show a darker band against the scrolled data cells.
      stickyRowBackground="var(--color-background-surface)"
      rowAxisHeader="Pillar"
      rowAxis={rowAxis}
      columnAxis={columnAxis}
      cells={cells}
      detailTriggerLabel="Show evidence"
      detailCloseLabel="Hide evidence"
      // The badge alone, not badge-over-capability the way scorecard-matrix.tsx and
      // dissection-matrix.tsx render their rationale. Those matrices carry four to six
      // columns; this one carries up to ten, so a proportional column is ~100px wide
      // and a clamped capability line renders three or four words per row before the
      // ellipsis — noise that pushes the badges apart without informing anyone. The
      // capability is one click away in the panel, in full, where it is readable.
      renderCell={({ value }) => <DepthBadge depth={value.depth} />}
      rowPanelTakeaway={({ row, column, value }) => {
        const values = valuesByPillar.get(row.id) ?? [];
        const researched = values.filter(isResearched);
        const ahead = researched.filter((v) => v.depth?.toLowerCase().includes("ahead"));
        if (column && value) {
          const others = ahead.filter((v) => v.slug !== value.slug);
          return (
            <Takeaway
              status={depthStatus(value.depth)}
              title={`${column.name} — ${depthLabel(value.depth)} on ${row.label}`}
            >
              {/* Deliberately NOT the capability text: the deep-dive section below opens
                  with it in full, and a clamped copy here would print the same paragraph
                  twice on one screen (the duplication scorecard-matrix.tsx's own comment
                  warns about, found the same way — by clicking, not by reading the JSX).
                  What goes here instead is the one thing a single cell cannot say: where
                  this rating sits among the other competitors in the same row, which is
                  the whole reason the cross-tab was worth restoring. */}
              <Text type="supporting" maxLines={2}>
                {others.length
                  ? `${others.length} other researched competitor${others.length === 1 ? " is" : "s are"} ahead of Prism on this pillar: ${others.map((v) => v.competitor).join(", ")}.`
                  : `No other researched competitor is ahead of Prism on this pillar (${researched.length} rated).`}
              </Text>
            </Takeaway>
          );
        }
        return (
          <Takeaway
            status={ahead.length ? "warning" : "info"}
            title={
              ahead.length
                ? `${ahead.length} of ${researched.length} researched competitors are ahead of Prism on ${row.label}`
                : `No researched competitor is ahead of Prism on ${row.label}`
            }
          >
            <Text type="supporting" maxLines={3}>
              {/* Says only what THIS panel renders. The row-label view lists each
                  competitor's capability and depth badge; the cited evidence lives one
                  more click down, in the per-cell panel — so promising "the evidence
                  below" here sent a reader looking for a Blockquote that is not on
                  this screen. */}
              {ahead.length
                ? `${ahead.map((v) => v.competitor).join(", ")} — each one's capability and depth rating is below; click a competitor's cell for the cited evidence.`
                : `All ${researched.length} researched ratings on this pillar are at parity or behind — each one's capability and depth rating is below; click a cell for the cited evidence.`}
            </Text>
          </Takeaway>
        );
      }}
      rowPanel={({ row, column, value }) => (
        <CollapsibleGroup
          // Remount when the panel re-focuses onto a different cell: defaultValue is an
          // uncontrolled initial state applied once at mount, so without this the
          // row-label panel's cross-competitor list stays closed after a re-focus even
          // though it IS that panel's whole point. Same fix, same reason, as
          // scorecard-matrix.tsx and dissection-matrix.tsx.
          key={column?.id ?? "__row__"}
          type="multiple"
          hasDividers
          density="compact"
          // Cell panel: the focused competitor's own section opens, because unlike the
          // other two matrices this cell shows only a badge — the capability and evidence
          // are not printed anywhere above, so opening this is not a third repetition, it
          // is the first sight of them. Row-label panel has no focused cell, so the
          // cross-competitor list is its scan layer and opens instead.
          defaultValue={column ? ["why"] : ["all-competitors"]}
        >
          {column && value ? (
            <Collapsible value="why" trigger={`Why ${column.name} is rated ${depthPhrase(value.depth)} here`}>
              <CellEvidence value={value} />
            </Collapsible>
          ) : null}
          <Collapsible value="all-competitors" trigger={`Every competitor on ${row.label}`}>
            <Stack gap={3}>
              {(valuesByPillar.get(row.id) ?? []).map((entry) => (
                <Stack key={entry.slug} gap={1}>
                  <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                    <CompetitorLogo slug={entry.slug} competitor={entry.competitor} size={20} />
                    <Link href={`/competitors/${entry.slug}`} color="accent">
                      <Text type="body" weight="semibold">
                        {entry.competitor}
                      </Text>
                    </Link>
                    {isResearched(entry) ? (
                      <DepthBadge depth={entry.depth} />
                    ) : (
                      <Text type="supporting" size="xsm" color="secondary">
                        no teardown row for this pillar
                      </Text>
                    )}
                  </Stack>
                  {isResearched(entry) ? (
                    <FieldBlock text={entry.capability} type="supporting" maxLines={2} />
                  ) : null}
                </Stack>
              ))}
            </Stack>
          </Collapsible>
        </CollapsibleGroup>
      )}
    />
  );
}
