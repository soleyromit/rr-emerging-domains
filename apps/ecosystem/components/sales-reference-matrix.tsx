"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { ComparisonMatrix } from "@/components/comparison-matrix";
import { FieldBlock } from "@/components/field-block";
import { ClaimedBadge } from "@/components/fit-badge";
import { vendorComparisonRows, vendorComparisonStats } from "@/lib/vendor-comparison";
import type { VendorComparisonChart } from "@/lib/content";

// The quarantined half of the Dissection tab: content/sources/vendor-comparison-chart
// .yaml — Exxat sales' own comparison chart — rendered so it can be pointed at and
// argued with, and so it can never be mistaken for the sourced matrix beside it.
//
// Three independent things keep the two apart, because one would be a style choice:
//   1. ComparisonMatrix's `variant="unverified"`, which is a TYPE, not a theme: the
//      variant's props declare `rowPanel?: never`, so this file structurally CANNOT
//      attach a drill-down. There is no evidence behind these cells to drill into,
//      so there is no affordance suggesting there might be.
//   2. ClaimedBadge — one neutral pill and a dash, no red/yellow/green anywhere. The
//      rigorous matrix's cells carry a rating and an evidence-strength badge; these
//      carry the fact that a box was ticked.
//   3. The whole table sits inside a collapsed warning Banner whose header states the
//      artifact's own numbers against itself. A reader cannot reach a cell without
//      passing that sentence.
//
// All four vendor columns get IDENTICAL treatment — no pinning, no styling for
// Exxat's column, unlike dissection-matrix.tsx which pins Exxat first as "where we
// stand today". Singling Exxat out here would dress up the very thing that disqualifies
// this chart: it marks itself present on every row of it. The per-column counts in the
// headers let that speak for itself (81 of 81 next to 19, 24 and 50).
//
// Client component for the same reason dissection-matrix.tsx is one: ComparisonMatrix
// is configured with render props, and a server component cannot pass a function across
// the RSC boundary. `import type` from lib/content keeps node:fs out of this bundle.

export function SalesReferenceMatrix({
  chart,
  referenceHref,
}: {
  chart: VendorComparisonChart;
  /** When set, the compact contradiction line links here for the full detail.
   * Omitted on the standalone reference route, which IS that detail. */
  referenceHref?: string;
}) {
  const stats = vendorComparisonStats(chart);
  const rows = vendorComparisonRows(chart);

  // Label = the feature row, sublabel = its section. This INVERTS dissection-matrix
  // .tsx's pillar-as-label shape on purpose: there each pillar holds one capability,
  // so the pillar is what tells rows apart, while here a section holds 4-12 rows and a
  // section-as-label column would print "Compliance Management" eleven times in bold
  // with the distinguishing words demoted to the small line under it.
  const rowAxis = rows.map((row) => ({ id: row.id, label: row.label, sublabel: row.section }));

  // No `width` on any column — every one takes ComparisonMatrix's default
  // proportional(1), the same as dissection-matrix.tsx and scorecard-matrix.tsx.
  // Pixel widths pin the table wider than its scroll viewport; see the note in
  // dissection-matrix.tsx for the overflow that caused.
  const columnAxis = stats.columns.map((column) => ({
    id: column,
    name: column,
    header: (
      <Stack gap={0}>
        <Text type="body" weight="semibold" textWrap="wrap">
          {column}
        </Text>
        <Text type="supporting" size="xsm" color="secondary">
          {`marked on ${stats.claimedByColumn[column] ?? 0} of ${stats.rowCount}`}
        </Text>
      </Stack>
    ),
  }));

  // Every (row, column) pair exists: the artifact carries all four column labels on
  // all 81 rows. So no cell is ever structurally absent here, and the dash a reader
  // sees is ClaimedBadge's "not marked", not the matrix's "no data".
  const cells = rows.flatMap((row) =>
    stats.columns.map((column) => ({
      rowId: row.id,
      colId: column,
      value: Boolean(row.claims[column]),
    })),
  );

  const contradictionLine = `The workbook's two sheets disagree outright on ${stats.contradictionCount} of ${stats.rowCount} rows — in both directions, so the masked sheet is sometimes the generous one.`;

  // "4 vendor columns, 3 of them masked" — NOT "4 masked vendors". Exxat's column is
  // named; only its three competitors are hidden behind labels, which is exactly the
  // asymmetry the chart is built on, and the artifact's own provenance note two lines
  // above says "3 masked vendors". Both halves are counted, never asserted.
  const columnLine = stats.maskedColumns.length
    ? `${stats.columns.length} vendor columns — Exxat's own, plus ${stats.maskedColumns.length} competitors the chart leaves masked behind labels`
    : `${stats.columns.length} vendor columns`;

  return (
    <Banner
      status="warning"
      // Banner's OWN collapse: children render in a collapsible content area and
      // `defaultIsExpanded` defaults to false, so this is genuinely closed on load
      // and genuinely expands on click — not a group whose children aren't
      // collapsible (the failure UI-DENSITY-PATTERNS.md exists to prevent).
      container="card"
      title={`${chart.artifact.title} — internal sales collateral, not evidence`}
      description={`Authored by Exxat sales and quarantined: not citable as fact anywhere in this repo. Exxat is marked on all ${stats.claimedByColumn.EXXAT ?? stats.rowCount} of ${stats.rowCount} feature rows with no per-row evidence, and the workbook's two sheets contradict each other on ${stats.contradictionCount}.`}
    >
      <Stack gap={3}>
        <FieldBlock label="The artifact's own provenance note" text={chart.artifact.provenance_note} maxLines={3} />
        <Text type="supporting" maxLines={4}>
          {`${stats.rowCount} feature rows across ${stats.sectionCount} sections, against ${columnLine}. "Claimed" means the sales sheet marks that vendor on that row and nothing more — no rating, no source, no date, and nothing to open. A dash is the sheet's own blank, which is its silence rather than a researched finding that the vendor falls short.`}
        </Text>
        <ComparisonMatrix<string, string, boolean>
          variant="unverified"
          rowAxisHeader="Feature row (chart section)"
          rowAxisWidth={260}
          rowAxis={rowAxis}
          columnAxis={columnAxis}
          cells={cells}
          unverifiedLabel="Unverified — sales collateral"
          unverifiedNote={`Exxat is marked on every one of these ${stats.rowCount} rows with no per-row evidence, and the two source sheets contradict each other on ${stats.contradictionCount}. Nothing records when any cell was last checked against any competitor's product.`}
          renderCell={({ value }) => <ClaimedBadge claimed={value} />}
        />
        {referenceHref ? (
          <Text type="supporting" maxLines={3}>
            {contradictionLine}{" "}
            <Link href={referenceHref} size="sm" color="accent" hasUnderline>
              See the full contradiction list, the unmasking key and where this chart came from
            </Link>
          </Text>
        ) : (
          <Text type="supporting" maxLines={3}>
            {contradictionLine}
          </Text>
        )}
      </Stack>
    </Banner>
  );
}
