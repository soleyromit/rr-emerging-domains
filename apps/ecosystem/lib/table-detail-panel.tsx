"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { TablePlugin } from "@astryxdesign/core/Table";

// The shared row-drill-down mechanism for this app's `Table`s. Extracted verbatim
// from accreditation-standards-table.tsx, which built it first and for a specific
// reason worth preserving here rather than losing in the move:
//
// Table ships its own `useTableRowExpansion`, and we deliberately don't use it.
// That hook auto-inserts a 40px chevron column whose 24px icon has no room once a
// table's cells pick up context-menu padding relocation (TableCell moves density
// padding onto an inner "trigger" wrapper for any cell carrying a context-menu
// action, which the hook attaches to every cell) — the icon renders, overflows
// into the next column, and becomes unclickable. So this mechanism inserts NO
// column of its own: it only appends the open row's panel as a full-width sibling
// `<tr>` via `transformBodyRow`'s `afterRow`, and leaves the open/close trigger
// entirely to the caller, who places a normal text `Link` inside one of its own
// columns (a column that has real width to work with) wired to `toggle`.
//
// Deliberately generic: this module knows nothing about standards, scorecards,
// competitors, or any row shape beyond "it has an id". Callers supply the id
// accessor, the column count for the panel's `colSpan`, and the panel content.

export interface UseTableDetailPanelOptions<T extends Record<string, unknown>> {
  /** Stable id for a row — the key this panel's open/closed state is tracked by. */
  rowId: (item: T) => string;
  /**
   * How many columns the table renders, for the panel `<td>`'s `colSpan`.
   * Pass the real count (including any row-label column); a short count leaves
   * the panel narrower than the table and a long one widens the table.
   */
  columnCount: number;
  /**
   * The open row's panel content. Called only for rows that are currently open,
   * so it's safe to build something expensive here.
   */
  renderPanel: (item: T) => ReactNode;
}

export interface TableDetailPanel<T extends Record<string, unknown>> {
  /** Pass to `<Table plugins={{ detailPanel: plugin }}>`. */
  plugin: TablePlugin<T>;
  /** Whether the row with this id currently has its panel open. */
  isOpen: (id: string) => boolean;
  /** Open a closed row's panel / close an open one. Wire this to your own trigger. */
  toggle: (id: string) => void;
  /** Open a row's panel, whether or not it's already open. */
  open: (id: string) => void;
  /** Close a row's panel, whether or not it's already closed. */
  close: (id: string) => void;
  /** Close every open panel. */
  closeAll: () => void;
  /** The ids currently open — read-only; mutate through the functions above. */
  openIds: ReadonlySet<string>;
}

export function useTableDetailPanel<T extends Record<string, unknown>>({
  rowId,
  columnCount,
  renderPanel,
}: UseTableDetailPanelOptions<T>): TableDetailPanel<T> {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const isOpen = useCallback((id: string) => openIds.has(id), [openIds]);

  const toggle = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const open = useCallback((id: string) => {
    setOpenIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const close = useCallback((id: string) => {
    setOpenIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const closeAll = useCallback(() => {
    setOpenIds((prev) => (prev.size ? new Set<string>() : prev));
  }, []);

  // Rebuilt whenever the open set, the column count, or the panel renderer
  // changes — the plugin closes over all three, so a stale object would render
  // yesterday's panel. Callers usually pass an inline `renderPanel` arrow, which
  // changes every render; that's the same cost the inline version had and is
  // cheap (the object is three property reads), so it is not worth asking every
  // caller to memoize.
  const plugin = useMemo<TablePlugin<T>>(
    () => ({
      transformBodyRow(props, item) {
        const id = rowId(item);
        if (!openIds.has(id)) return props;
        const panel = (
          <tr key={`${id}-detail`}>
            <td colSpan={columnCount} style={{ padding: "16px 20px", background: "var(--color-background-muted)" }}>
              {renderPanel(item)}
            </td>
          </tr>
        );
        return { ...props, afterRow: props.afterRow ? <>{props.afterRow}{panel}</> : panel };
      },
    }),
    [openIds, columnCount, renderPanel, rowId],
  );

  return { plugin, isOpen, toggle, open, close, closeAll, openIds };
}
