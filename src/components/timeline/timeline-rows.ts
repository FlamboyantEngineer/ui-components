// The timeline's rows: groups with children, flattened to the rows on screen (specs/TIMELINE.md).

import type { Key } from '../../core/props.js';

/** A row of the timeline; a row with children is a group that collapses. */
export interface TimelineRow {
  /** Identifies the row; items name it as their `rowId`. */
  id: Key;
  /** The row's name, in the row list and the table view. */
  label: string;
  /** Nested rows. */
  children?: readonly TimelineRow[] | undefined;
}

/** A row on screen, with its depth from 1 and whether it is an expanded group. */
export interface VisibleRow {
  row: TimelineRow;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

/**
 * The rows on screen in display order, with their depth: the rows whose groups are all in
 * `expandedKeys`, or every row when it is not given.
 */
export function flattenTimelineRows(
  rows: readonly TimelineRow[],
  expandedKeys?: ReadonlySet<Key>,
): VisibleRow[] {
  const result: VisibleRow[] = [];
  const visit = (row: TimelineRow, level: number) => {
    const hasChildren = (row.children?.length ?? 0) > 0;
    const isExpanded = hasChildren && (expandedKeys?.has(row.id) ?? true);
    result.push({ row, level, hasChildren, isExpanded });
    if (isExpanded) {
      for (const child of row.children!) visit(child, level + 1);
    }
  };
  for (const row of rows) visit(row, 1);
  return result;
}

/** The ids of every group, expanded by default. */
export function collectGroupKeys(rows: readonly TimelineRow[]): Key[] {
  return flattenTimelineRows(rows)
    .filter((entry) => entry.hasChildren)
    .map((entry) => entry.row.id);
}
