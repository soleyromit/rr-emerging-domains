"use client";

import { Table, pixel } from "@astryxdesign/core/Table";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { ExxatComplianceBadge, FitBadge, StandardsRatingBadge } from "@/components/fit-badge";
import { CompetitorLogo } from "@/components/competitor-logo";
import { useTableDetailPanel } from "@/lib/table-detail-panel";
// StandardDetail was defined in this file until Task 5.5 moved it, unchanged, to
// components/dissect/standard-detail-panel.tsx — the Dissection tab's topology map
// opens the same panel for a `standard` node, and two copies of it would drift.
// The import list above shrank to match: everything StandardDetail used and this
// table does not (Grid, Badge, Divider, Collapsible, the four other fit badges,
// FieldBlock, SourceList, RelatedFlowsPreview, Takeaway, stripFileCitations) now
// lives in that file instead.
import { StandardDetail } from "@/components/dissect/standard-detail-panel";
import type { StandardsCrosswalkForDomain, StandardsCrosswalkRow } from "@/lib/content";

interface StandardRow extends Record<string, unknown> {
  _id: string;
  row: StandardsCrosswalkRow;
}

// Every long-form field (evidence required, required software behavior, Prism
// fit rationale, gap notes, each competitor's rationale) used to live in its own
// ~150-250px table column — fine for a badge, unreadable for prose: a clamped
// preview cuts off mid-clause, and an expanded one wraps into a wall of
// 3-4-word lines. Those fields now live in one full-width panel per row, so a
// row stays a scannable badge strip and the prose gets a real column width to
// breathe in once you open it.
//
// That panel is opened by lib/table-detail-panel.tsx's useTableDetailPanel — the
// shared row-drill-down mechanism this table originally hand-rolled and now
// shares with ComparisonMatrix. It is used instead of Table's own
// useTableRowExpansion because that hook's auto-inserted 40px chevron column has
// no room for its own 24px icon once this table's cells pick up context-menu
// padding relocation (TableCell moves density padding onto an inner "trigger"
// wrapper for any cell with a context-menu action, which the hook attaches to
// every cell) — the icon renders but overflows into the next column and
// becomes unclickable. The trigger here instead lives inside the "Element"
// column as a normal text Link, which has real width to work with.
export function AccreditationStandardsTable({
  standardsCrosswalk,
  slug,
  hasWinBrief = false,
}: {
  standardsCrosswalk: StandardsCrosswalkForDomain;
  slug: string;
  hasWinBrief?: boolean;
}) {
  const rows: StandardRow[] = standardsCrosswalk.rows.map((r) => ({ _id: r.element_id, row: r }));

  const { plugin: detailPanel, isOpen, toggle } = useTableDetailPanel<StandardRow>({
    rowId: (item) => item._id,
    // Element + Exxat + Prism fit + one per competitor.
    columnCount: 3 + standardsCrosswalk.competitors.length,
    renderPanel: (item) => <StandardDetail row={item.row} slug={slug} hasWinBrief={hasWinBrief} />,
  });

  return (
    <Table<StandardRow>
      data={rows}
      idKey="_id"
      density="balanced"
      textOverflow="wrap"
      verticalAlign="top"
      plugins={{ detailPanel }}
      columns={[
        {
          key: "element_id",
          header: "Element",
          // A fixed floor, not proportional(1.4): with this table's sole
          // proportional column, "1.4" is meaningless — a lone proportional
          // column always claims 100% of whatever's left after every pixel
          // column is subtracted, which shrank to under 110px once a 6th
          // competitor column was in play (see /domains/do/standards),
          // wrapping a title into 8+ lines instead of the badges beside it.
          width: pixel(280),
          renderCell: (r) => {
            const isRowOpen = isOpen(r._id);
            return (
              <Stack gap={0.5}>
                <Text type="body" weight="semibold">
                  {r.row.element_id}
                </Text>
                {r.row.element_title ? (
                  // Clamped, not left to wrap indefinitely — the full title is
                  // one click away in "Show detail," so the collapsed row
                  // stays a consistent, scannable height instead of some rows
                  // running 8 lines deep next to 3-line siblings.
                  <Text type="supporting" maxLines={2}>
                    {r.row.element_title}
                  </Text>
                ) : null}
                <Link color="accent" hasUnderline onClick={() => toggle(r._id)}>
                  {isRowOpen ? "Hide detail" : "Show detail"}
                </Link>
              </Stack>
            );
          },
        },
        // Exxat first, pinned ahead of Prism and every competitor: it's the "where
        // do we stand today" column the whole crosswalk exists to answer, and it
        // reads as the baseline the other two column families are compared against.
        // Distinct from the competitor columns by header treatment (two-line
        // "Exxat / today" label) and by its own vocabulary — Compliant/Partial/Gap
        // rather than the competitors' Fully/Partially/Not meeting — while sharing
        // the same success/warning/error palette so the row still scans as one strip.
        {
          key: "exxat_compliance",
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
          // Both badge columns are deliberately narrower than the 150px the
          // Prism column used to have: adding a whole new column to a table that
          // can already carry 6 competitors (see /domains/do/standards) squeezes
          // the Element column, and these two only ever hold a short badge.
          width: pixel(125),
          renderCell: (r) => <ExxatComplianceBadge compliance={r.row.exxat_compliance} />,
        },
        {
          key: "prism_fit",
          header: "Prism fit",
          width: pixel(120),
          renderCell: (r) => <FitBadge fit={r.row.prism_fit} />,
        },
        ...standardsCrosswalk.competitors.map((c) => ({
          key: c.slug,
          // wrap="wrap" is load-bearing: a plain-string header let Table's own
          // header cell wrap the competitor name inside its column, but a
          // horizontal Stack won't — without it a long name ("Leo (DaVinci
          // Education)") overflows its column and runs off the right edge of the
          // table instead of wrapping under the logo.
          header: (
            <Stack direction="horizontal" gap={1.5} vAlign="center" wrap="wrap">
              <CompetitorLogo slug={c.slug} competitor={c.competitor} size={20} />
              <Text type="body" weight="semibold" textWrap="wrap">
                {c.competitor}
              </Text>
            </Stack>
          ),
          width: pixel(140),
          // A dozen-plus "Not yet researched" pills per row, repeated down every
          // row, drowns out the handful of real ratings a sparsely-researched
          // domain actually has — same "—" for an absent value used by
          // domain-feature-comparison-table.tsx's competitor cells. The colored
          // Badge stays reserved for an actual finding, so a real rating still
          // pops against a row of dashes.
          renderCell: (r: StandardRow) => {
            const cell = r.row.competitors.find((cc) => cc.slug === c.slug);
            const rating = cell?.rating?.toLowerCase().trim();
            if (!rating || rating === "unresearched") {
              return (
                <Text type="supporting" size="sm" color="secondary">
                  —
                </Text>
              );
            }
            return <StandardsRatingBadge rating={cell?.rating} />;
          },
        })),
      ]}
    />
  );
}
