"use client";

import { useState } from "react";
import { Table, pixel } from "@astryxdesign/core/Table";
import type { TablePlugin } from "@astryxdesign/core/Table";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Grid } from "@astryxdesign/core/Grid";
import { Divider } from "@astryxdesign/core/Divider";
import { Badge } from "@astryxdesign/core/Badge";
import { ExxatComplianceBadge, FitBadge, StandardsRatingBadge } from "@/components/fit-badge";
import { FieldBlock } from "@/components/field-block";
import { CompetitorLogo } from "@/components/competitor-logo";
import { SourceList } from "@/components/source-list";
import type { StandardsCrosswalkForDomain, StandardsCrosswalkRow } from "@/lib/content";

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
  slug,
  hasWinBrief = false,
}: {
  standardsCrosswalk: StandardsCrosswalkForDomain;
  slug: string;
  hasWinBrief?: boolean;
}) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const rows: StandardRow[] = standardsCrosswalk.rows.map((r) => ({ _id: r.element_id, row: r }));
  // Element + Exxat + Prism fit + one per competitor.
  const columnCount = 3 + standardsCrosswalk.competitors.length;

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
            <StandardDetail row={item.row} slug={slug} hasWinBrief={hasWinBrief} />
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
          // A fixed floor, not proportional(1.4): with this table's sole
          // proportional column, "1.4" is meaningless — a lone proportional
          // column always claims 100% of whatever's left after every pixel
          // column is subtracted, which shrank to under 110px once a 6th
          // competitor column was in play (see /domains/do/standards),
          // wrapping a title into 8+ lines instead of the badges beside it.
          width: pixel(280),
          renderCell: (r) => {
            const isOpen = expandedKeys.has(r._id);
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
                  {isOpen ? "Hide detail" : "Show detail"}
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

// Full-width detail panel for one expanded row. Evidence/behavior side by side
// (they're the two halves of "what does this standard require"), fit rationale
// and gap notes stacked below at full width, competitor rationale last since
// it's the deepest layer.
function StandardDetail({
  row,
  slug,
  hasWinBrief,
}: {
  row: StandardsCrosswalkRow;
  slug: string;
  hasWinBrief: boolean;
}) {
  const hasRated = row.competitors.some((c) => c.rating && c.rating !== "unresearched");

  return (
    <Stack gap={4}>
      <Grid columns={{ minWidth: 280, max: 2 }} gap={4}>
        <FieldBlock label="Evidence required" text={row.evidence_programs_must_produce} maxLines={5} />
        <FieldBlock label="Required software behavior" text={row.required_software_behavior} maxLines={5} />
      </Grid>

      <Grid columns={{ minWidth: 280, max: 2 }} gap={4}>
        <Stack gap={1.5}>
          <Stack direction="horizontal" gap={2} vAlign="center">
            <Text type="label" color="secondary" size="sm">
              Exxat today
            </Text>
            <ExxatComplianceBadge compliance={row.exxat_compliance} />
          </Stack>
          <FieldBlock text={row.exxat_compliance_rationale} maxLines={5} />
        </Stack>

        <Stack gap={1.5}>
          <Stack direction="horizontal" gap={2} vAlign="center">
            <Text type="label" color="secondary" size="sm">
              Prism fit
            </Text>
            <FitBadge fit={row.prism_fit} />
          </Stack>
          <FieldBlock text={row.prism_fit_rationale} maxLines={5} />
        </Stack>
      </Grid>

      {row.gap_notes ? <FieldBlock label="Gap notes" text={row.gap_notes} maxLines={5} /> : null}

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

      {row.researchSources.length ? (
        <Stack gap={1}>
          <Text type="label" color="secondary" size="xsm">
            What the literature says about this standard
          </Text>
          <SourceList sources={row.researchSources} />
        </Stack>
      ) : null}

      <Divider label="COMPETITOR RATINGS" />
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

      {/* Same "Text label xsm + Link" idiom as exxat-gap-answer.tsx's and
          domain-scenario.tsx's single out-links, just three in a row — keeps
          this row's typography consistent with every other link-out in the
          app rather than introducing a one-off size/weight here. */}
      <Stack direction="horizontal" gap={3} wrap="wrap">
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
