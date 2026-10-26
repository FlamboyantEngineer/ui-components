import { type ReactNode } from 'react';
import type { ExpansionProps } from '../../core/events.js';
import type { Key } from '../../core/props.js';
import type { TableGroup, TableGroupBy } from './table-groups.js';
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
type ExpansionOptions = ExpansionProps & Pick<TableGroupingProps<never>, 'collapsedGroups' | 'defaultCollapsedGroups' | 'onCollapsedGroupsChange'>;
/** Which rows and groups are expanded, as React Aria's table takes them. */
export interface TableExpansion {
    expandedKeys: Set<Key>;
    onExpandedChange: (keys: Set<Key>) => void;
}
/**
 * Expansion of nested rows and of group header rows as one set for React Aria. Rows are collapsed
 * until expanded (`expandedKeys`); groups are expanded until collapsed (`collapsedGroups`), so new
 * groups open. A change reports only the part it touches, and keeps collapsed groups that are not
 * drawn now, such as those of another page.
 */
export declare function useTableExpansion(options: ExpansionOptions, groupKeys: readonly string[]): TableExpansion;
export {};
//# sourceMappingURL=use-table-expansion.d.ts.map