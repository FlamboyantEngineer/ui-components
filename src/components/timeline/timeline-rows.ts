// The timeline's rows: groups with children, flattened to the rows on screen (specs/TIMELINE.md).

import type { Key } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';
import { walkTree } from '../../utils/walk-tree.js';

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
  const stack = [{ rows, index: 0 }];
  while (stack.length > 0) {
    const frame = requireDefined(stack.at(-1));
    const row = frame.rows[frame.index++];
    if (!row) {
      stack.pop();
      continue;
    }
    const hasChildren = (row.children?.length ?? 0) > 0;
    const isExpanded = hasChildren && (expandedKeys?.has(row.id) ?? true);
    result.push({ row, level: stack.length, hasChildren, isExpanded });
    if (isExpanded) stack.push({ rows: requireDefined(row.children), index: 0 });
  }
  return result;
}

/** The ids of every group, expanded by default. */
export function collectGroupKeys(rows: readonly TimelineRow[]): Key[] {
  const keys: Key[] = [];
  for (const row of walkTree(rows, (entry) => entry.children)) {
    if (row.children?.length) keys.push(row.id);
  }
  return keys;
}
