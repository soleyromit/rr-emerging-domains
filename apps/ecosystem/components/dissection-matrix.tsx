"use client";

import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { ComparisonMatrix } from "@/components/comparison-matrix";
import { FieldBlock } from "@/components/field-block";
import { stripFileCitations } from "@/lib/strip-file-citations";
import { SourceList } from "@/components/source-list";
import { Takeaway } from "@/components/takeaway";
import {
  DirectionalBadge,
  StandardsRatingBadge,
  StatusBadge,
  standardsRatingLabel,
} from "@/components/fit-badge";
import type { FeatureMatrixRow } from "@/lib/content";
import type { SourceRegistryEntry } from "@/lib/content";

// The `matrix` section of a domain's Dissection tab: content/lenses/
// feature-comparison-matrix.yaml, rendered as the app's generic ComparisonMatrix
// (rows = capabilities, columns = Exxat + this domain's in-scope incumbents).
//
// Why this file exists rather than the matrix being built inline in
// app/domains/[slug]/dissect/page.tsx: ComparisonMatrix is a client component
// configured with render props (renderCell / rowPanel / rowPanelTakeaway), and a
// server component cannot pass functions across the RSC boundary. Same split
// scorecard-matrix.tsx uses — the page does the YAML read and hands this wrapper
// only serializable data.
//
// The lens is SPARSE on purpose (14 of 30 possible Pharmacy cells today; zero for
// every other domain). Absent cells get ComparisonMatrix's own "—", never an
// invented rating: an unrated intersection here means "nobody researched this
// vendor on this pillar", which is a different and much weaker claim than
// "not-meeting". The page above refuses to render this component at all for a
// domain with no rows, and shows that domain's real gap_note instead.

/** Exxat's own column. Not a competitor_slug, so it cannot collide with one. */
const EXXAT_COLUMN_ID = "__exxat__";

export interface DissectionMatrixIncumbent {
  /** competitor_slug from the domain's dissection manifest. */
  slug: string;
  /** Resolved display name — never the raw slug (UI-DENSITY-PATTERNS.md). */
  name: string;
  /** primary | switch-target | adjacent | secondary — `not-a-target` never reaches here. */
  role?: string;
}

interface MatrixCellValue {
  kind: "exxat" | "competitor";
  rating: string;
  rationale?: string;
  /** The vendor's (or Prism's) own name for the capability behind this rating. */
  featureRef?: string;
  /** Exxat column only: shipped | roadmap — what Prism does today. */
  prismStatus?: string;
  evidenceStrength?: string;
  evidenceNote?: string;
  sources: SourceRegistryEntry[];
}

// Every authored capability reads "Pillar name: what it actually covers". The
// pillar is the scannable half and goes in the row label; the rest is the
// qualifier, which ComparisonMatrix clamps to 2 lines in its sublabel slot.
// Splitting them beats the alternatives: the whole sentence as a `label` runs ~100
// characters through an unclamped 220px column (8+ line rows), and pillar-as-
// sublabel would just repeat the words the capability already opens with.
//
// This is also the answer to "how are rows grouped by pillar" — ComparisonMatrix
// has no row-group feature, and at today's pillar-granularity each pillar IS one
// row, so the label carries the grouping. If a pillar later holds two capabilities
// they render as two rows sharing a label, told apart by this sublabel.
function splitCapability(capability: string, pillar: string): { label: string; sublabel?: string } {
  const at = capability.indexOf(": ");
  if (at < 0) return { label: pillar || capability, sublabel: pillar ? capability : undefined };
  return { label: pillar || capability.slice(0, at), sublabel: capability.slice(at + 2) };
}

function evidenceLine(value: MatrixCellValue): string {
  const strength =
    value.evidenceStrength === "directional"
      ? "a directional first-pass read of public material"
      : value.evidenceStrength === "verified"
        ? "verified against cited evidence"
        : `evidence ${value.evidenceStrength ?? "unrecorded"}`;
  const cites = value.sources.length === 1 ? "1 cited source" : `${value.sources.length} cited sources`;
  return `${strength.charAt(0).toUpperCase()}${strength.slice(1)} — ${cites}.`;
}

function ratingStatus(rating: string): "success" | "warning" | "error" | "info" {
  const key = rating.toLowerCase().trim();
  if (key === "fully-meeting") return "success";
  if (key === "partially-meeting") return "warning";
  if (key === "not-meeting") return "error";
  return "info";
}

function CellDetail({ value, sourcesLabel }: { value: MatrixCellValue; sourcesLabel: string }) {
  return (
    <Stack gap={3}>
      <FieldBlock
        label="Rationale"
        text={stripFileCitations(value.rationale) ?? "No rationale recorded for this cell."}
        maxLines={4}
      />
      {value.featureRef ? (
        <Stack gap={1}>
          <Text type="label" color="secondary" size="xsm">
            {value.kind === "exxat" ? "Prism feature" : "Vendor's own feature name"}
          </Text>
          <Text type="body">{value.featureRef}</Text>
        </Stack>
      ) : null}
      {value.evidenceNote ? <FieldBlock label="Evidence note" text={value.evidenceNote} maxLines={4} /> : null}
      <SourceList sources={value.sources} label={sourcesLabel} />
      {value.sources.length === 0 ? (
        <Text type="supporting" size="xsm" color="secondary">
          No registered source is cited on this cell.
        </Text>
      ) : null}
    </Stack>
  );
}

export function DissectionMatrix({
  rows,
  incumbents,
}: {
  rows: FeatureMatrixRow[];
  incumbents: DissectionMatrixIncumbent[];
}) {
  const rowAxis = rows.map((r) => ({ id: r.capabilityId, ...splitCapability(r.capability, r.pillar) }));

  // Exxat pinned FIRST — the "where do we stand today" column the whole matrix is
  // compared against, same placement and same two-line header treatment
  // accreditation-standards-table.tsx gives its own Exxat column. Unlike that
  // table, Exxat here shares the competitors' fully/partially/not-meeting
  // vocabulary (it is rated against the same capability, not against a standard),
  // so the distinction is header + the shipped/roadmap badge only.
  //
  // NO explicit column widths — every column takes ComparisonMatrix's default
  // proportional(1), the same thing scorecard-matrix.tsx does. An earlier version
  // set pixel(200) on all six, which pinned the table to a fixed ~1440px inside a
  // narrower scroll viewport; the drill-down panel spans the full table width, so
  // that silently clipped the right-hand ~260px of every panel's evidence prose
  // off-screen. Proportional columns divide the space actually available, so the
  // panel can never be wider than what a reader can see. Fixed widths here are a
  // regression waiting to happen — the panels only get more prose from here.
  const columnAxis = [
    {
      id: EXXAT_COLUMN_ID,
      name: "Exxat",
      header: (
        <Stack gap={0}>
          <Text type="body" weight="semibold">
            Exxat
          </Text>
          <Text type="supporting" size="xsm" color="secondary">
            today
          </Text>
        </Stack>
      ),
    },
    ...incumbents.map((c) => ({
      id: c.slug,
      name: c.name,
      header: (
        <Stack gap={0}>
          <Text type="body" weight="semibold" textWrap="wrap">
            {c.name}
          </Text>
          {c.role ? (
            <Text type="supporting" size="xsm" color="secondary">
              {c.role}
            </Text>
          ) : null}
        </Stack>
      ),
    })),
  ];

  const cells = rows.flatMap((r) => {
    const competitorCells = r.cells.map((c) => ({
      rowId: r.capabilityId,
      colId: c.competitorSlug,
      value: { kind: "competitor" as const, ...c },
    }));
    return r.exxatCell
      ? [
          {
            rowId: r.capabilityId,
            colId: EXXAT_COLUMN_ID,
            value: { kind: "exxat" as const, ...r.exxatCell },
          },
          ...competitorCells,
        ]
      : competitorCells;
  });

  const rowById = new Map(rows.map((r) => [r.capabilityId, r]));

  // Every column on one row, Exxat first — the shape both the row-label panel and
  // the "every column" section read from, so they cannot disagree.
  const rowValues = (capabilityId: string): { id: string; name: string; value?: MatrixCellValue }[] => {
    const row = rowById.get(capabilityId);
    return columnAxis.map((col) => ({
      id: col.id,
      name: col.name,
      value:
        col.id === EXXAT_COLUMN_ID
          ? row?.exxatCell
            ? { kind: "exxat" as const, ...row.exxatCell }
            : undefined
          : (() => {
              const cell = row?.cells.find((c) => c.competitorSlug === col.id);
              return cell ? { kind: "competitor" as const, ...cell } : undefined;
            })(),
    }));
  };

  return (
    <ComparisonMatrix<string, string, MatrixCellValue>
      variant="rigorous"
      // Names the column in the order it actually renders: the bold line is the
      // pillar, the line under it is that pillar's capability detail. Mirrors
      // scorecard-matrix.tsx's "Criterion (weight)" label-then-sublabel shape.
      rowAxisHeader="Pillar (capability)"
      rowAxisWidth={240}
      rowAxis={rowAxis}
      columnAxis={columnAxis}
      cells={cells}
      detailTriggerLabel="Show evidence"
      detailCloseLabel="Hide evidence"
      // ONE vertical Stack, not a fragment: ComparisonMatrix drops this into a
      // horizontal Stack of its own, so siblings would sit side by side instead of
      // badges-over-rationale.
      renderCell={({ value }) => (
        <Stack gap={0.5}>
          <Stack direction="horizontal" gap={1} vAlign="center" wrap="wrap">
            <StandardsRatingBadge rating={value.rating} />
            {value.kind === "exxat" ? <StatusBadge status={value.prismStatus} /> : null}
            <DirectionalBadge evidenceStrength={value.evidenceStrength} />
          </Stack>
          <Text type="supporting" maxLines={3}>
            {stripFileCitations(value.rationale)}
          </Text>
        </Stack>
      )}
      rowPanelTakeaway={({ row, column, value }) => {
        if (column && value) {
          return (
            <Takeaway
              status={ratingStatus(value.rating)}
              title={`${column.name} is ${standardsRatingLabel(value.rating).toLowerCase()} on ${row.label}`}
            >
              <Text type="supporting" maxLines={2}>
                {evidenceLine(value)}
              </Text>
            </Takeaway>
          );
        }
        const values = rowValues(row.id);
        const rated = values.filter((v) => v.value).length;
        const unrated = values.filter((v) => !v.value);
        const one = unrated.length === 1;
        return (
          <Takeaway
            status={rated === values.length ? "info" : "warning"}
            title={`${rated} of ${values.length} columns are rated on ${row.label}`}
          >
            <Text type="supporting" maxLines={3}>
              {rated === values.length
                ? "Every column on this capability has an authored, sourced verdict. All of them are below."
                : `${unrated.map((v) => v.name).join(", ")} ${one ? "is" : "are"} unrated here: nobody has researched ${
                    one ? "that vendor" : "those vendors"
                  } on this capability — not that ${one ? "it falls" : "they fall"} short.`}
            </Text>
          </Takeaway>
        );
      }}
      rowPanel={({ row, column, value }) => (
        <CollapsibleGroup
          // Remount when the panel re-focuses onto another cell: defaultValue is
          // an uncontrolled initial state applied once at mount, so without this
          // the row-label panel's "Every column" section stays closed after a
          // re-focus even though it IS that panel's whole point. Same fix, same
          // reason, as scorecard-matrix.tsx.
          key={column?.id ?? "__row__"}
          type="multiple"
          hasDividers
          density="compact"
          // Cell panel: nothing open — the component's own header already repeats
          // that cell's badges and the Takeaway above states the verdict, so
          // opening the rationale by default would print it a third time on one
          // screen. The row-label panel has no focused cell, so the cross-column
          // list is its scan layer and opens.
          defaultValue={column ? [] : ["all-columns"]}
        >
          {column && value ? (
            <Collapsible
              value="why"
              trigger={`Why ${column.name} is ${standardsRatingLabel(value.rating).toLowerCase()}`}
            >
              <CellDetail value={value} sourcesLabel={`Sources behind ${column.name}'s rating`} />
            </Collapsible>
          ) : null}
          <Collapsible value="all-columns" trigger={`Every column on ${row.label}`}>
            <Stack gap={3}>
              {rowValues(row.id).map((entry) => (
                <Stack key={entry.id} gap={1}>
                  <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                    <Text type="body" weight="semibold">
                      {entry.name}
                    </Text>
                    {entry.value ? (
                      <>
                        <StandardsRatingBadge rating={entry.value.rating} />
                        <DirectionalBadge evidenceStrength={entry.value.evidenceStrength} />
                      </>
                    ) : (
                      <Text type="supporting" size="xsm" color="secondary">
                        not researched on this capability
                      </Text>
                    )}
                  </Stack>
                  {entry.value ? (
                    <FieldBlock
                      text={stripFileCitations(entry.value.rationale)}
                      type="supporting"
                      maxLines={2}
                    />
                  ) : null}
                </Stack>
              ))}
            </Stack>
          </Collapsible>
          {/* The row-label column clamps this sentence to two lines; every rating in
              the row is a verdict against ITS full wording, so the panel has to be
              able to show all of it. */}
          <Collapsible value="capability" trigger="The full capability every column is rated against">
            <FieldBlock text={rowById.get(row.id)?.capability} maxLines={4} />
          </Collapsible>
        </CollapsibleGroup>
      )}
    />
  );
}
