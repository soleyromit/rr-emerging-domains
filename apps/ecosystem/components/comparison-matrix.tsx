"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Table, pixel, proportional, useTableStickyColumns } from "@astryxdesign/core/Table";
import type { ColumnWidth, TableColumn, TableDensity } from "@astryxdesign/core/Table";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Badge } from "@astryxdesign/core/Badge";
import { Divider } from "@astryxdesign/core/Divider";
import { useTableDetailPanel } from "@/lib/table-detail-panel";

// A generic row × column comparison matrix with a per-cell drill-down panel.
//
// The shape it exists for: "N subjects rated against M competitors/domains, and
// behind every rating there is evidence someone should be able to open." The app
// already had three hand-rolled versions of that shape (scorecard-table.tsx,
// domain-feature-comparison-table.tsx and accreditation-standards-table.tsx — the
// first two since retired), each re-solving the row/column/cell plumbing and only
// one of them (accreditation) solving the drill-down at all. This is that shape, once.
//
// It knows NOTHING about scorecards, standards, competitors, or any content
// vocabulary: the caller supplies the axes, the cell values, the cell renderer,
// and the drill-down panel's content. Every string it renders on its own is
// either a caller-supplied label or generic table chrome ("Show detail", "—").
//
// The drill-down reuses lib/table-detail-panel.tsx's useTableDetailPanel — the
// same mechanism accreditation-standards-table.tsx uses — rather than a second
// row-expansion implementation. Expansion state is per ROW (one full-width panel
// below the row, which is the only place a panel can go in a table), but the
// TRIGGER is per CELL: opening row R at column C tells `rowPanel` which
// intersection the reader actually clicked, so the panel can lead with that
// cell's evidence. Clicking a different cell in an open row re-focuses the panel
// instead of closing it; clicking the open cell again closes the row.
//
// `variant` is a real constraint, not a style flag. `"unverified"` is for data
// that is deliberately quarantined — present because someone asked for it, not
// because it is sourced — and it is typed so that there IS no `rowPanel` to
// pass: no drill-down exists to click, because there is no evidence to show. A
// future caller cannot accidentally attach one without changing the variant and
// having to justify it.

export interface ComparisonMatrixRow<RowId extends string> {
  id: RowId;
  /**
   * The row's name. A plain string, deliberately: the component owns this
   * column's typography so every matrix in the app scans the same way, and a
   * string can't smuggle unclamped prose into the row-label column.
   */
  label: string;
  /** Short qualifier under the label — e.g. "weight 25%". Clamped to 2 lines. */
  sublabel?: string;
}

export interface ComparisonMatrixColumn<ColId extends string> {
  id: ColId;
  /** Plain-text column name, used in the drill-down panel's header. */
  name: string;
  /**
   * Optional rich header (a logo + name Stack, a two-line label). Defaults to
   * `name`. Composite headers must set their own `wrap`/`textWrap` — see
   * accreditation-standards-table.tsx's competitor headers for why.
   */
  header?: ReactNode;
  /** Defaults to `proportional(1)`. */
  width?: ColumnWidth;
}

export interface ComparisonMatrixCell<RowId extends string, ColId extends string, TValue> {
  rowId: RowId;
  colId: ColId;
  value: TValue;
  /**
   * Set `false` for a cell that has a value but nothing to drill into (an
   * unresearched rating, a placeholder). That cell renders with no trigger
   * rather than opening an empty panel. Ignored entirely by `"unverified"`,
   * where no cell has a trigger. @default true
   */
  hasDetail?: boolean;
}

export interface ComparisonMatrixCellContext<RowId extends string, ColId extends string, TValue> {
  row: ComparisonMatrixRow<RowId>;
  column: ComparisonMatrixColumn<ColId>;
  value: TValue;
  /** True when the drill-down panel is open AND focused on this cell. */
  isOpen: boolean;
}

export interface ComparisonMatrixPanelContext<RowId extends string, ColId extends string, TValue> {
  row: ComparisonMatrixRow<RowId>;
  /**
   * The cell the reader clicked — `undefined` when they opened the panel from
   * the row-label column, i.e. they want the row as a whole, not one
   * intersection of it.
   */
  column?: ComparisonMatrixColumn<ColId>;
  /** The focused cell's value; `undefined` alongside an `undefined` column. */
  value?: TValue;
  /** Closes this row's panel — for a "done reading" affordance in long panels. */
  close: () => void;
}

interface ComparisonMatrixBaseProps<RowId extends string, ColId extends string, TValue> {
  rowAxis: readonly ComparisonMatrixRow<RowId>[];
  columnAxis: readonly ComparisonMatrixColumn<ColId>[];
  /**
   * The value at each intersection. Sparse by design — an absent row×column
   * pair renders `emptyCell` and carries no trigger, so a matrix does not have
   * to invent a value it does not have.
   */
  cells: readonly ComparisonMatrixCell<RowId, ColId, TValue>[];
  /** Renders one cell's value. Keep it to a badge/number + at most a clamped line. */
  renderCell: (ctx: ComparisonMatrixCellContext<RowId, ColId, TValue>) => ReactNode;
  /** Header for the row-label column — e.g. "Criterion (weight)". */
  rowAxisHeader: ReactNode;
  /** Row-label column width in pixels. @default 220 */
  rowAxisWidth?: number;
  /** Rendered where a row×column pair has no cell. @default an em dash */
  emptyCell?: ReactNode;
  /** @default "balanced" */
  density?: TableDensity;
  /**
   * The pinned row-label column paints an OPAQUE background so scrolled data
   * cells can't show through it — but every non-pinned cell is transparent,
   * so it inherits whatever the page's own container actually is. The design
   * system's plugin default (`--color-background-card`) coincidentally
   * matches one of `--color-background-surface` / `--color-background-muted`
   * depending on color scheme (theme-neutral: card matches surface in light
   * mode, muted in dark mode) — never both, and never reliably. Pass the real
   * ambient background token here; there is no correct default that works
   * for every caller in every color scheme, so this has none.
   */
  stickyRowBackground?: string;
}

interface ComparisonMatrixRigorousProps<RowId extends string, ColId extends string, TValue>
  extends ComparisonMatrixBaseProps<RowId, ColId, TValue> {
  variant: "rigorous";
  /**
   * The drill-down panel's content for the clicked row (and cell, when the
   * reader clicked one). Required: a "rigorous" matrix without evidence behind
   * its cells is just an unverified one that hasn't admitted it.
   *
   * Follow the two-zone shape inside it (see UI-DENSITY-PATTERNS.md) — the
   * component supplies the scan-layer header and the Divider; what you return
   * is the DEEP-DIVE zone, so it should be closed-by-default Collapsibles or
   * clamped FieldBlocks, not a wall of open prose. Anything that belongs ABOVE
   * the Divider goes in `rowPanelTakeaway`, not here.
   */
  rowPanel: (ctx: ComparisonMatrixPanelContext<RowId, ColId, TValue>) => ReactNode;
  /**
   * The panel's own scan layer: the ONE verdict a reader needs without opening
   * anything — typically a `<Takeaway>`, the way `StandardDetail` leads with
   * "Exxat is Compliant — Prism fit: Transfer" before its Divider.
   *
   * Rendered between the component-owned header row (row · column · value ·
   * close) and the `DEEP DIVE` Divider, so a caller can complete the two-zone
   * shape in its documented order instead of being forced to put its verdict
   * below the Divider — which would inverse the very pattern
   * UI-DENSITY-PATTERNS.md exists to enforce.
   *
   * Optional: a panel whose deep-dive sections speak for themselves can omit it
   * and nothing about the layout changes.
   */
  rowPanelTakeaway?: (ctx: ComparisonMatrixPanelContext<RowId, ColId, TValue>) => ReactNode;
  /** @default "Show detail" */
  detailTriggerLabel?: string;
  /** @default "Hide detail" */
  detailCloseLabel?: string;
}

interface ComparisonMatrixUnverifiedProps<RowId extends string, ColId extends string, TValue>
  extends ComparisonMatrixBaseProps<RowId, ColId, TValue> {
  variant: "unverified";
  /**
   * Not available on this variant, by construction. Quarantined data has no
   * evidence to drill into; a panel here would imply otherwise.
   */
  rowPanel?: never;
  /** Not available on this variant either — there is no panel to lead. */
  rowPanelTakeaway?: never;
  /** The badge shown above the matrix. @default "Unverified" */
  unverifiedLabel?: string;
  /** One line on where this data came from and why it isn't sourced. */
  unverifiedNote?: string;
}

export type ComparisonMatrixProps<RowId extends string, ColId extends string, TValue> =
  | ComparisonMatrixRigorousProps<RowId, ColId, TValue>
  | ComparisonMatrixUnverifiedProps<RowId, ColId, TValue>;

interface MatrixTableRow<RowId extends string> extends Record<string, unknown> {
  _id: string;
  row: ComparisonMatrixRow<RowId>;
}

// A literal "\u0000" escape rather than a printable separator: row and column ids are
// caller-supplied strings, and a slug containing the separator would otherwise
// let one pair's key collide with another's.
const cellKey = (rowId: string, colId: string) => `${rowId}\u0000${colId}`;

// The axes and cells are Maps/keys, so a repeated id is last-write-wins: the
// earlier row/column/cell silently disappears, and duplicate row ids also reach
// Table as duplicate React keys. Typed id unions make that unlikely, but ids
// built from content slugs at runtime can collide — and a silently dropped row
// in a comparison matrix reads as "we didn't research that," which is exactly
// the wrong conclusion. Dev-only: stripped from the production bundle.
function warnOnDuplicate(isDuplicate: boolean, what: string) {
  if (!isDuplicate) return;
  if (process.env.NODE_ENV === "production") return;
  console.warn(`ComparisonMatrix: ${what}. The later entry wins and the earlier one is dropped.`);
}

export function ComparisonMatrix<RowId extends string, ColId extends string, TValue>(
  props: ComparisonMatrixProps<RowId, ColId, TValue>,
) {
  const {
    rowAxis,
    columnAxis,
    cells,
    renderCell,
    rowAxisHeader,
    rowAxisWidth = 220,
    stickyRowBackground,
    emptyCell,
    density = "balanced",
  } = props;

  const rowPanel = props.variant === "rigorous" ? props.rowPanel : undefined;
  const rowPanelTakeaway = props.variant === "rigorous" ? props.rowPanelTakeaway : undefined;
  const triggerLabel = props.variant === "rigorous" ? (props.detailTriggerLabel ?? "Show detail") : "";
  const closeLabel = props.variant === "rigorous" ? (props.detailCloseLabel ?? "Hide detail") : "";

  // Which column each open row is focused on. `null` means the row was opened
  // from its label column — the panel is about the whole row, not one cell.
  const [focusByRow, setFocusByRow] = useState<Record<string, ColId | null>>({});

  const cellIndex = useMemo(() => {
    const index = new Map<string, ComparisonMatrixCell<RowId, ColId, TValue>>();
    for (const cell of cells) {
      const key = cellKey(cell.rowId, cell.colId);
      warnOnDuplicate(index.has(key), `two cells for ${cell.rowId} × ${cell.colId}`);
      index.set(key, cell);
    }
    return index;
  }, [cells]);

  const columnIndex = useMemo(() => {
    const index = new Map<string, ComparisonMatrixColumn<ColId>>();
    for (const column of columnAxis) {
      warnOnDuplicate(index.has(column.id), `duplicate column id "${column.id}" in columnAxis`);
      index.set(column.id, column);
    }
    return index;
  }, [columnAxis]);

  const tableRows = useMemo<MatrixTableRow<RowId>[]>(() => {
    const seen = new Set<string>();
    for (const row of rowAxis) {
      warnOnDuplicate(seen.has(row.id), `duplicate row id "${row.id}" in rowAxis`);
      seen.add(row.id);
    }
    return rowAxis.map((row) => ({ _id: row.id, row }));
  }, [rowAxis]);

  // The panel has to be able to close its own row, but the closer comes back
  // from the very hook the panel is handed to. A ref breaks that cycle without
  // a forward reference into the temporal dead zone: the hook gets one stable
  // indirection now, and the real renderer — closing over this render's focus
  // state and the hook's `close` — is installed below, before <Table> ever
  // calls it.
  const panelRendererRef = useRef<(item: MatrixTableRow<RowId>) => ReactNode>(() => null);
  const renderPanel = useCallback((item: MatrixTableRow<RowId>) => panelRendererRef.current(item), []);

  const { plugin: detailPanel, isOpen, open, close } = useTableDetailPanel<MatrixTableRow<RowId>>({
    rowId: (item) => item._id,
    // The row-label column plus one column per column-axis entry.
    columnCount: 1 + columnAxis.length,
    renderPanel,
  });

  // Pins the row-label column to the left edge on horizontal scroll — the
  // matrix's own subject stays readable no matter how many column-axis
  // entries scroll past it (Medicine's real 10-competitor grid is the case
  // this exists for).
  const stickyColumns = useTableStickyColumns<MatrixTableRow<RowId>>({ startKeys: ["__row_axis__"] });

  panelRendererRef.current = (item: MatrixTableRow<RowId>) => {
    if (!rowPanel) return null;
    const focusedId = focusByRow[item._id] ?? null;
    const column = focusedId === null ? undefined : columnIndex.get(focusedId);
    const cell = column ? cellIndex.get(cellKey(item._id, column.id)) : undefined;
    const panelCtx: ComparisonMatrixPanelContext<RowId, ColId, TValue> = {
      row: item.row,
      column,
      value: cell?.value,
      close: () => close(item._id),
    };
    return (
      <Stack gap={3}>
        {/* SCAN LAYER — which intersection this panel is about, and its value,
            before any of the caller's prose. The reader clicked a specific
            cell; the panel has to say so, or a wide matrix's panels all look
            alike once they're open. */}
        <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
          <Text type="body" weight="semibold">
            {item.row.label}
          </Text>
          {column ? (
            <>
              <Text type="supporting" size="xsm" color="secondary">
                ·
              </Text>
              <Text type="body" weight="semibold">
                {column.name}
              </Text>
            </>
          ) : null}
          {column && cell ? renderCell({ row: item.row, column, value: cell.value, isOpen: true }) : null}
          <Link size="sm" color="accent" hasUnderline onClick={() => close(item._id)}>
            {closeLabel}
          </Link>
        </Stack>

        {/* The caller's own scan layer — the verdict — still ABOVE the Divider,
            so the panel reads in UI-DENSITY-PATTERNS.md's documented order:
            takeaway first, deep dive behind a divider. */}
        {rowPanelTakeaway ? rowPanelTakeaway(panelCtx) : null}

        <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />

        {rowPanel(panelCtx)}
      </Stack>
    );
  };

  // Clicking the cell a panel is already focused on closes the row; clicking a
  // different cell of an open row re-focuses rather than closing then reopening
  // (which would flash the panel out and back in).
  const focusCell = (rowId: string, colId: ColId | null) => {
    const wasOpen = isOpen(rowId);
    const focused = focusByRow[rowId] ?? null;
    if (wasOpen && focused === colId) {
      close(rowId);
      return;
    }
    setFocusByRow((prev) => ({ ...prev, [rowId]: colId }));
    if (!wasOpen) open(rowId);
  };

  const isCellOpen = (rowId: string, colId: ColId | null) =>
    isOpen(rowId) && (focusByRow[rowId] ?? null) === colId;

  const columns: TableColumn<MatrixTableRow<RowId>>[] = [
    {
      key: "__row_axis__",
      header: rowAxisHeader,
      // A fixed floor, not proportional: with many column-axis entries a
      // proportional row-label column collapses to an unreadable width — the
      // same failure accreditation-standards-table.tsx's Element column hit at
      // six competitors.
      width: pixel(rowAxisWidth),
      renderCell: (item) => (
        <Stack gap={0.5}>
          <Text type="body" weight="semibold">
            {item.row.label}
          </Text>
          {item.row.sublabel ? (
            <Text type="supporting" maxLines={2}>
              {item.row.sublabel}
            </Text>
          ) : null}
          {rowPanel ? (
            // Same horizontal wrapper as the cell triggers — see the note there.
            <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
              <Link color="accent" hasUnderline onClick={() => focusCell(item._id, null)}>
                {isCellOpen(item._id, null) ? closeLabel : triggerLabel}
              </Link>
            </Stack>
          ) : null}
        </Stack>
      ),
    },
    ...columnAxis.map((column) => ({
      key: column.id,
      header: column.header ?? column.name,
      width: column.width ?? proportional(1),
      renderCell: (item: MatrixTableRow<RowId>) => {
        const cell = cellIndex.get(cellKey(item._id, column.id));
        if (!cell) {
          // Same "—" an absent value gets in accreditation-standards-table.tsx: a
          // real rating stays visually loud because the gaps around it are quiet.
          return (
            emptyCell ?? (
              <Text type="supporting" size="sm" color="secondary">
                —
              </Text>
            )
          );
        }
        const cellIsOpen = isCellOpen(item._id, column.id);
        const content = renderCell({ row: item.row, column, value: cell.value, isOpen: cellIsOpen });
        // No trigger without a panel to open: the "unverified" variant has no
        // rowPanel at all (it isn't in its prop type), and an individual cell
        // can opt out with hasDetail: false.
        if (!rowPanel || cell.hasDetail === false) return content;
        return (
          <Stack gap={0.5}>
            {/* The caller's content gets a HORIZONTAL Stack of its own rather
                than sitting directly in this vertical one. A vertical Stack
                stretches its children (align-items), which turns the Badge
                nearly every caller renders here into a full-width banner — the
                same failure accreditation-standards-table.tsx fixed with
                hAlign="start" on its directional-badge Stack. hAlign="start"
                is the wrong fix HERE, though: it shrink-wraps a text cell to
                max-content and lets long prose overflow the column. A
                horizontal row gives a badge its intrinsic width AND keeps a
                text child wrapping inside the column. */}
            <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
              {content}
            </Stack>
            {/* The trigger gets the same horizontal-row treatment as the content
                above it, and for the same reason: left in the vertical Stack it
                stretches to the full column, making the click target span dead
                space to the right of its own text. */}
            <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
              <Link size="sm" color="accent" hasUnderline onClick={() => focusCell(item._id, column.id)}>
                {cellIsOpen ? closeLabel : triggerLabel}
              </Link>
            </Stack>
          </Stack>
        );
      },
    })),
  ];

  // A plain div, not a design-system wrapper: its only job is putting
  // `--table-sticky-background` where the CSS custom property can cascade
  // down into the pinned column's cells (a real DOM property lookup, not a
  // StyleX-time value — `Table` itself has no plain `style` prop to carry
  // this). Omitted entirely when the caller passes nothing, so the plugin's
  // own default still applies exactly as it did before this prop existed.
  const table = (
    <div style={stickyRowBackground ? ({ "--table-sticky-background": stickyRowBackground } as CSSProperties) : undefined}>
      <Table<MatrixTableRow<RowId>>
        data={tableRows}
        idKey="_id"
        density={density}
        textOverflow="wrap"
        verticalAlign="top"
        plugins={rowPanel ? { detailPanel, stickyColumns } : { stickyColumns }}
        columns={columns}
      />
    </div>
  );

  if (props.variant === "unverified") {
    return (
      <Stack gap={2}>
        {/* Labeled above the data, not in a footnote under it: the point of the
            variant is that a reader cannot mistake this matrix for the sourced
            one while scanning it. */}
        <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
          {/* `neutral`, not `warning`: this is the SAME word DepthBadge already renders
              for its `unknown` depth (fit-badge.tsx), and that one is neutral gray. Two
              "Unverified" pills at two different severities is a collision — a reader
              can't tell whether the amber one means something worse. The loud signal on
              this variant is the warning Banner its caller wraps it in (see
              sales-reference-matrix.tsx), not a second amber pill inside it. */}
          <Badge variant="neutral" label={props.unverifiedLabel ?? "Unverified"} />
          {props.unverifiedNote ? (
            <Text type="supporting" size="xsm" color="secondary" maxLines={3}>
              {props.unverifiedNote}
            </Text>
          ) : null}
        </Stack>
        {table}
      </Stack>
    );
  }

  return table;
}
