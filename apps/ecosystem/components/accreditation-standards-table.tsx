"use client";

import { useState } from "react";
import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import type { TablePlugin } from "@astryxdesign/core/Table";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Grid } from "@astryxdesign/core/Grid";
import { Divider } from "@astryxdesign/core/Divider";
import { FitBadge, StandardsRatingBadge } from "@/components/fit-badge";
import { FieldBlock } from "@/components/field-block";
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
// This uses a hand-rolled detail-panel plugin instead of Table's own
// useTableRowExpansion: that hook's auto-inserted 40px chevron column has no
// room for its own 24px icon once this table's cells pick up context-menu
// padding relocation (TableCell moves density padding onto an inner "trigger"
// wrapper for any cell with a context-menu action, which the hook attaches to
// every cell) — the icon renders but overflows into the next column and
// becomes unclickable. The trigger here instead lives inside the "Element"
// column as a normal text Link, which has real width to work with.
export function AccreditationStandardsTable({
  standardsCrosswalk,
}: {
  standardsCrosswalk: StandardsCrosswalkForDomain;
}) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const rows: StandardRow[] = standardsCrosswalk.rows.map((r) => ({ _id: r.element_id, row: r }));
  const columnCount = 2 + standardsCrosswalk.competitors.length;

  const toggle = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const detailPanel: TablePlugin<StandardRow> = {
    transformBodyRow(props, item) {
      if (!expandedKeys.has(item._id)) return props;
      const panel = (
        <tr key={`${item._id}-detail`}>
          <td colSpan={columnCount} style={{ padding: "16px 20px", background: "var(--color-background-muted)" }}>
            <StandardDetail row={item.row} />
          </td>
        </tr>
      );
      return { ...props, afterRow: props.afterRow ? <>{props.afterRow}{panel}</> : panel };
    },
  };

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
          width: proportional(1.4),
          renderCell: (r) => {
            const isOpen = expandedKeys.has(r._id);
            return (
              <Stack gap={0.5}>
                <Text type="body" weight="semibold">
                  {r.row.element_id}
                </Text>
                {r.row.element_title ? <Text type="supporting">{r.row.element_title}</Text> : null}
                <Link color="accent" hasUnderline onClick={() => toggle(r._id)}>
                  {isOpen ? "Hide detail" : "Show detail"}
                </Link>
              </Stack>
            );
          },
        },
        {
          key: "prism_fit",
          header: "Prism fit",
          width: pixel(150),
          renderCell: (r) => <FitBadge fit={r.row.prism_fit} />,
        },
        ...standardsCrosswalk.competitors.map((c) => ({
          key: c.slug,
          header: c.competitor,
          width: pixel(140),
          renderCell: (r: StandardRow) => {
            const cell = r.row.competitors.find((cc) => cc.slug === c.slug);
            return <StandardsRatingBadge rating={cell?.rating} />;
          },
        })),
      ]}
    />
  );
}

// Full-width detail panel for one expanded row. Evidence/behavior side by side
// (they're the two halves of "what does this standard require"), fit rationale
// and gap notes stacked below at full width, competitor rationale last since
// it's the deepest layer.
function StandardDetail({ row }: { row: StandardsCrosswalkRow }) {
  const ratedCompetitors = row.competitors.filter((c) => c.rating && c.rating !== "unresearched");

  return (
    <Stack gap={4}>
      <Grid columns={{ minWidth: 280, max: 2 }} gap={4}>
        <FieldBlock label="Evidence required" text={row.evidence_programs_must_produce} maxLines={5} />
        <FieldBlock label="Required software behavior" text={row.required_software_behavior} maxLines={5} />
      </Grid>

      <Stack gap={1.5}>
        <Stack direction="horizontal" gap={2} vAlign="center">
          <Text type="label" color="secondary" size="sm">
            Prism fit
          </Text>
          <FitBadge fit={row.prism_fit} />
        </Stack>
        <FieldBlock text={row.prism_fit_rationale} maxLines={5} />
      </Stack>

      {row.gap_notes ? <FieldBlock label="Gap notes" text={row.gap_notes} maxLines={5} /> : null}

      {ratedCompetitors.length ? (
        <>
          <Divider label="COMPETITOR RATINGS" />
          <Grid columns={{ minWidth: 260, max: 3 }} gap={3}>
            {ratedCompetitors.map((c) => (
              <Stack key={c.slug} gap={1.5}>
                <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                  <Text type="body" weight="semibold">
                    {c.competitor}
                  </Text>
                  <StandardsRatingBadge rating={c.rating} />
                </Stack>
                {c.rationale ? (
                  <FieldBlock text={c.rationale} type="supporting" maxLines={4} />
                ) : null}
              </Stack>
            ))}
          </Grid>
        </>
      ) : null}
    </Stack>
  );
}
