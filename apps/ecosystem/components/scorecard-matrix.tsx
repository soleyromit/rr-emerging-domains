"use client";

import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { ComparisonMatrix } from "@/components/comparison-matrix";
import { FieldBlock } from "@/components/field-block";
import { Takeaway } from "@/components/takeaway";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import { stripFileCitations } from "@/lib/strip-file-citations";
import type { ScorecardCriterion } from "@/lib/content";

// The scorecard's "Scoring detail" grid, expressed as the app's generic
// ComparisonMatrix (rows = criteria, columns = domains) instead of the
// hand-rolled Table that used to live in scorecard-table.tsx.
//
// Why this file exists at all rather than the swap happening inline in
// app/go-to-market/page.tsx: ComparisonMatrix is a client component whose axes are
// configured with render props (renderCell / rowPanel / rowPanelFact / …), and a
// server component cannot pass functions across the RSC boundary. So the page
// keeps doing the server-side YAML read and hands this client wrapper only
// serializable data — exactly the split ScorecardTable already had.
//
// What is deliberately UNCHANGED from ScorecardTable: every cell still shows the
// bold score AND its rationale clamped at maxLines={4}, inline, with no click
// required. The drill-down is additive — it carries the weight math, the full
// unclamped rationale, and a cross-domain comparison the old table had nowhere to
// put — never a relocation of something that used to be visible.

interface ScoreCellValue {
  score: number;
  rationale?: string;
  weight: number;
  /** weight × score — this criterion's share of the domain's weighted total. */
  contribution: number;
}

const pct = (weight: number) => `${(weight * 100).toFixed(0)}%`;

// 1-5 per criterion, so 4+ is a strength, 3 is neutral, 2 and below is the reason
// a domain loses. Same three-way read the rest of the app's badges use.
function scoreStatus(score: number): "success" | "info" | "warning" {
  if (score >= 4) return "success";
  if (score >= 3) return "info";
  return "warning";
}

export function ScorecardMatrix({
  criteria,
  domains,
  dissectedSlugs = [],
}: {
  criteria: ScorecardCriterion[];
  domains: string[];
  /** Route slugs with a dissection manifest — those columns' headers become links into
   * that domain's Dissection tab. Passed in rather than derived here: the manifests are
   * read from content/ on the server and this is a client component. */
  dissectedSlugs?: string[];
}) {
  const dissected = new Set(dissectedSlugs);
  const rowAxis = criteria.map((c) => ({
    id: c.name,
    label: c.name,
    // The weight keeps the row-label column it always had ("Criterion (weight)"),
    // via the component's own sublabel slot — it is not demoted into the panel.
    sublabel: `weight ${pct(c.weight ?? 0)}`,
  }));

  // `name` stays the plain domain string — ComparisonMatrix uses it verbatim in the
  // drill-down panel's own header and in every sentence the Fact/Impact slots build, so a
  // ReactNode there would render "[object Object] scores 4/5". Only `header`, the
  // optional rich slot the component already exposes for exactly this, becomes a Link.
  //
  // Done entirely in this caller: ComparisonMatrixColumn has no `href` field and did
  // not need one. Adding a prop would have put a link policy inside a shared component
  // that three other pages render, to serve one of them.
  //
  // textWrap="wrap" for the same reason accreditation-standards-table.tsx's composite
  // competitor headers set it — a header that is no longer a bare string does not
  // inherit Table's own header-cell wrapping, and "Dentistry" in a narrow column
  // overflows rather than wraps without it.
  const columnAxis = domains.map((d) => {
    const slug = matchDisciplineMeta(d)?.slug;
    return {
      id: d,
      name: d,
      header:
        slug && dissected.has(slug) ? (
          <Link href={`/domains/${slug}/dissect`} color="accent" hasUnderline>
            <Text type="body" weight="semibold" textWrap="wrap">
              {d}
            </Text>
          </Link>
        ) : undefined,
    };
  });

  // Sparse on purpose: a criterion that genuinely has no score for a domain gets
  // the matrix's "—" rather than a fabricated 0. (With today's where-to-play.yaml
  // every criterion scores every domain, so all 5 × 4 cells are present and the
  // render matches the old table cell-for-cell.)
  const cells = criteria.flatMap((c) =>
    domains
      .filter((d) => c.scores?.[d] != null)
      .map((d) => {
        const score = c.scores[d];
        const weight = c.weight ?? 0;
        return {
          rowId: c.name,
          colId: d,
          // Sanitized once here, where the cell is built, so every surface that reads
          // value.rationale below (the cell, the drill-down, the compare column) is clean.
          value: { score, rationale: stripFileCitations(c.rationale?.[d]), weight, contribution: weight * score },
        };
      })
  );

  const criterionByName = new Map(criteria.map((c) => [c.name, c]));

  return (
    <ComparisonMatrix<string, string, ScoreCellValue>
      variant="rigorous"
      // Matches this page's own container (app/go-to-market/page.tsx renders a
      // plain, non-muted Section) so the sticky row-label column's opaque
      // background doesn't show a darker band against the scrolled data cells.
      stickyRowBackground="var(--color-background-surface)"
      rowAxisHeader="Criterion (weight)"
      rowAxis={rowAxis}
      columnAxis={columnAxis}
      cells={cells}
      detailTriggerLabel="Show scoring detail"
      detailCloseLabel="Hide scoring detail"
      // ONE vertical Stack, not a fragment of two siblings: the component drops
      // this content into a horizontal Stack, so two siblings would sit
      // side-by-side instead of the score-over-rationale layout the old table had.
      renderCell={({ value }) => (
        <Stack gap={0.5}>
          <Text type="body" weight="semibold">
            {value.score}
          </Text>
          <Text type="supporting" maxLines={4}>
            {value.rationale}
          </Text>
        </Stack>
      )}
      // FACT — the score, stated once. Same sentence this panel always led with;
      // the weight arithmetic that used to sit under it inside the same Takeaway
      // is now the IMPACT slot, because it is what FOLLOWS from the score rather
      // than part of it.
      rowPanelFact={({ row, column, value }) =>
        column && value ? (
          <Takeaway
            status={scoreStatus(value.score)}
            title={`${column.name} scores ${value.score}/5 — contributes ${value.contribution.toFixed(2)} of its weighted total`}
          />
        ) : (
          <Takeaway
            status="info"
            title={`${row.label} is ${pct(criterionByName.get(row.id)?.weight ?? 0)} of the weighted score`}
          >
            <Text type="supporting" maxLines={2}>
              Every domain&apos;s score on this criterion, with the rationale behind it, is below.
            </Text>
          </Takeaway>
        )
      }
      // IMPACT — the arithmetic the table could never show: what this score
      // actually contributes once its weight is applied, which is the only
      // reason a 4 on a 10% criterion and a 4 on a 35% one are not the same
      // finding. Verbatim the prose that used to be the Takeaway's body.
      //
      // Null on the row-label panel: "every domain is listed below" is
      // navigation, not impact, so it stays with the fact it belongs to and this
      // slot renders nothing rather than a heading over a signpost.
      rowPanelImpact={({ row, column, value }) =>
        column && value ? (
          <Text type="supporting" maxLines={2}>
            {`${row.label} carries ${pct(value.weight)} of the scorecard, so a ${value.score} here is worth ${value.weight.toFixed(2)} × ${value.score} = ${value.contribution.toFixed(2)} out of a possible ${(value.weight * 5).toFixed(2)}.`}
          </Text>
        ) : null
      }
      // No `rowPanelAct`: where-to-play.yaml authors criteria, weights, scores and
      // rationale — it authors no next step per criterion × domain, and inventing
      // one here would put unsourced advice under a heading that reads as sourced.
      // The prop is omitted rather than stubbed, so the slot never renders.
      rowPanel={({ row, column, value }) => {
        const criterion = criterionByName.get(row.id);
        return (
          <CollapsibleGroup
            // Remount when the panel re-focuses onto a different cell. Without
            // it, `defaultValue` (an uncontrolled initial state, applied once at
            // mount) is stale for every focus after the first: re-focusing an
            // open row from a cell to the row label left "Every domain on …"
            // closed even though the row-level panel's whole scan layer IS that
            // list. Seen by clicking, not by reading the JSX.
            key={column?.id ?? "__row__"}
            type="multiple"
            hasDividers
            density="compact"
            // Cell panel: nothing open. The component's own header already shows
            // that cell's score and rationale, and the Takeaway above carries the
            // weight math — opening "Why X scores N" by default printed the same
            // rationale a third time on one screen (seen in the browser, not in
            // the JSX). Row-label panel has no focused cell, so the cross-domain
            // list IS its scan layer and opens.
            defaultValue={column ? [] : ["all-domains"]}
          >
            {column && value ? (
              <Collapsible value="why" trigger={`Why ${column.name} scores ${value.score}`}>
                {/* The same rationale the cell already shows clamped — here
                    unclamped-on-demand, which is the only thing the panel adds to
                    it. The cell's copy is not removed to make room for this one. */}
                <FieldBlock
                  label="Rationale"
                  text={value.rationale ?? "No rationale recorded for this domain."}
                  maxLines={4}
                />
              </Collapsible>
            ) : null}
            <Collapsible value="all-domains" trigger={`Every domain on ${row.label}`}>
              <Stack gap={3}>
                {domains.map((d) => {
                  const score = criterion?.scores?.[d];
                  const weight = criterion?.weight ?? 0;
                  return (
                    <Stack key={d} gap={1}>
                      <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                        <Text type="body" weight="semibold">
                          {d}
                        </Text>
                        <Text type="supporting" size="xsm" color="secondary">
                          {score == null
                            ? "not scored"
                            : `${score}/5 · contributes ${(weight * score).toFixed(2)}`}
                        </Text>
                      </Stack>
                      <FieldBlock
                        text={stripFileCitations(criterion?.rationale?.[d])}
                        type="supporting"
                        maxLines={2}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            </Collapsible>
          </CollapsibleGroup>
        );
      }}
    />
  );
}
