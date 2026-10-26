import { type ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import type { RelationColumn, RelationDirection } from './relation-columns-model.js';
/** What every column of a walk shares. */
export interface RelationColumnContext<T> {
    getRelated: (item: T, direction: RelationDirection) => readonly T[];
    getTextValue: (item: T) => string;
    renderItem: ((item: T) => ReactNode) | undefined;
    onAction: ((key: Key) => void) | undefined;
    onSelect: (column: RelationColumn<T>, key: Key) => void;
}
export interface RelationColumnViewProps<T> {
    column: RelationColumn<T>;
    context: RelationColumnContext<T>;
}
/**
 * One column of a relation walk: a header with its title and item count, then a `ListView` of
 * its items, each with the count of items further along its side. In a side column a press or the
 * arrow keys choose an item (single selection that follows focus); the start item's column only
 * shows it.
 */
export declare function RelationColumnView<T extends {
    id: Key;
}>({ column, context, }: RelationColumnViewProps<T>): import("react").JSX.Element;
//# sourceMappingURL=relation-column.d.ts.map