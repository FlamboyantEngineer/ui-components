import { useMemo, type ReactNode } from 'react';
import type { ExpansionProps } from '../../core/events.js';
import type { Key } from '../../core/props.js';
import { useControllableState } from '../../core/controllable-state.js';
import { isGroupKey, type TableGroup, type TableGroupBy } from './table-groups.js';

/** A table's row grouping: the groupings, the group headers and which groups are collapsed. */
export interface TableGroupingProps<T> {
  /**
   * Groups the rows of the current page under group header rows: by the first entry's values,
   * then inside each group by the next entry's, and so on.
   */
  groupBy?: readonly TableGroupBy<T>[] | undefined;
  /** A group header's label. Defaults to the grouping's name and the group's value. */
  renderGroupLabel?: ((group: TableGroup<T>) => ReactNode) | undefined;
  /** The keys of the collapsed groups, controlled. Groups are expanded otherwise. */
  collapsedGroups?: Iterable<Key> | undefined;
  /** The keys of the groups collapsed at first, uncontrolled. */
  defaultCollapsedGroups?: Iterable<Key> | undefined;
  /** Called with the keys of the collapsed groups after each change. */
  onCollapsedGroupsChange?: ((keys: Set<Key>) => void) | undefined;
}

type ExpansionOptions = ExpansionProps &
  Pick<
    TableGroupingProps<never>,
    'collapsedGroups' | 'defaultCollapsedGroups' | 'onCollapsedGroupsChange'
  >;

/** Which rows and groups are expanded, as React Aria's table takes them. */
export interface TableExpansion {
  expandedKeys: Set<Key>;
  onExpandedChange: (keys: Set<Key>) => void;
}

function toSet(keys: Iterable<Key> | undefined): Set<Key> | undefined {
  return keys === undefined ? undefined : new Set(keys);
}

function isSameSet(left: ReadonlySet<Key>, right: ReadonlySet<Key>): boolean {
  return left.size === right.size && [...left].every((key) => right.has(key));
}

/**
 * Expansion of nested rows and of group header rows as one set for React Aria. Rows are collapsed
 * until expanded (`expandedKeys`); groups are expanded until collapsed (`collapsedGroups`), so new
 * groups open. A change reports only the part it touches, and keeps collapsed groups that are not
 * drawn now, such as those of another page.
 */
export function useTableExpansion(
  options: ExpansionOptions,
  groupKeys: readonly string[],
): TableExpansion {
  const controlledRows = useMemo(() => toSet(options.expandedKeys), [options.expandedKeys]);
  const controlledGroups = useMemo(() => toSet(options.collapsedGroups), [options.collapsedGroups]);
  const [rows, setRows] = useControllableState(
    controlledRows,
    toSet(options.defaultExpandedKeys) ?? new Set<Key>(),
    options.onExpandedChange,
  );
  const [collapsed, setCollapsed] = useControllableState(
    controlledGroups,
    toSet(options.defaultCollapsedGroups) ?? new Set<Key>(),
    options.onCollapsedGroupsChange,
  );
  const expandedKeys = useMemo(
    () => new Set([...rows, ...groupKeys.filter((key) => !collapsed.has(key))]),
    [rows, groupKeys, collapsed],
  );
  const onExpandedChange = (keys: Set<Key>) => {
    const nextRows = new Set([...keys].filter((key) => !isGroupKey(key)));
    const drawn = new Set<Key>(groupKeys);
    const nextCollapsed = new Set([
      ...[...collapsed].filter((key) => !drawn.has(key)),
      ...groupKeys.filter((key) => !keys.has(key)),
    ]);
    if (!isSameSet(nextRows, rows)) setRows(nextRows);
    if (!isSameSet(nextCollapsed, collapsed)) setCollapsed(nextCollapsed);
  };
  return { expandedKeys, onExpandedChange };
}
