import type { VendorComparisonChart } from "./content";

// Pure derivations over the quarantined vendor comparison chart. They live OUTSIDE
// lib/content.ts on purpose: content.ts imports node:fs, and the matrix that renders
// this data is a client component. A `import type` from content.ts is erased at
// compile time, so this module stays importable from both a server page (for the
// section trigger's counts) and the client matrix (for the column headers') — which
// is the point: one arithmetic, so the trigger and the table can never disagree.
//
// Every number here is COUNTED from the artifact. Nothing below hardcodes 81, 10, 4
// or 7 — the day someone re-transcribes the workbook, these follow.

export interface VendorComparisonFlatRow {
  /** `row_id` — unique across all 10 sections (verified against the file). */
  id: string;
  /** The feature row's own label, verbatim, source typos included. */
  label: string;
  /** The section it sits in, e.g. "Compliance Management". */
  section: string;
  /** Masked label -> whether the chart marks that vendor on this row. */
  claims: Record<string, boolean>;
}

/**
 * The masked column labels, in the order the unmasking key lists them — which is
 * Sheet2's own column order. Entries with `sheet2_label: null` are vendors only the
 * NAMED sheet has, so they are not columns of the masked render and are dropped here.
 *
 * Read from the artifact rather than hardcoded, and NOT unmasked: the masking is part
 * of what makes this chart non-citable, so the real names stay in the provenance
 * detail where the unmasking key can be read as the research exercise it is.
 */
export function vendorComparisonColumns(chart: VendorComparisonChart): string[] {
  const fromKey = chart.unmasking_key
    .map((entry) => entry.sheet2_label)
    .filter((label): label is string => Boolean(label));
  if (fromKey.length) return fromKey;
  // Fallback: the unmasking key is a separate list from the rows, so a file that
  // ever loses it would otherwise render a matrix with no columns at all. The row
  // data itself carries every label.
  const seen = new Set<string>();
  for (const section of chart.sections) {
    for (const row of section.rows) {
      for (const label of Object.keys(row.sheet2 ?? {})) seen.add(label);
    }
  }
  return [...seen];
}

/** All 81 rows, flattened in the source's own section order, each keeping its section. */
export function vendorComparisonRows(chart: VendorComparisonChart): VendorComparisonFlatRow[] {
  return chart.sections.flatMap((section) =>
    (section.rows ?? []).map((row) => ({
      id: row.row_id,
      label: row.row,
      section: section.name,
      // "X" is the only truthy value the file uses; anything else (null) is a blank
      // cell. Compared literally rather than coerced, so a stray value in a future
      // re-transcription reads as "not marked" instead of silently becoming a claim.
      claims: Object.fromEntries(
        Object.entries(row.sheet2 ?? {}).map(([label, value]) => [label, value === "X"]),
      ),
    })),
  );
}

export interface VendorComparisonStats {
  sectionCount: number;
  rowCount: number;
  columns: string[];
  /** Masked label -> how many of the `rowCount` rows mark that vendor. */
  claimedByColumn: Record<string, number>;
  /** Rows where the two sheets flatly disagree — the artifact's own exhaustive list. */
  contradictionCount: number;
  /** Rows where they agree and the named sheet merely credits an extra vendor. */
  unmaskedOnlyCount: number;
  /** Masked labels a column stands for, e.g. "Vendor 1" -> "CastleBranch". */
  unmaskedCount: number;
}

export function vendorComparisonStats(chart: VendorComparisonChart): VendorComparisonStats {
  const columns = vendorComparisonColumns(chart);
  const rows = vendorComparisonRows(chart);
  const claimedByColumn: Record<string, number> = {};
  for (const column of columns) {
    claimedByColumn[column] = rows.filter((row) => row.claims[column]).length;
  }
  return {
    sectionCount: chart.sections.length,
    rowCount: rows.length,
    columns,
    claimedByColumn,
    contradictionCount: chart.artifact.known_contradictions?.length ?? 0,
    unmaskedOnlyCount: chart.artifact.unmasked_only_vendor_rows?.length ?? 0,
    unmaskedCount: chart.unmasking_key?.length ?? 0,
  };
}
