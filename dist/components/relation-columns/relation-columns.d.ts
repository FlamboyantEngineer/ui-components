import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { type RelationColumnsPath, type RelationDirection } from './relation-columns-model.js';
export interface RelationColumnsProps<T extends {
    id: Key;
}> extends BaseProps, AriaLabellingProps {
    /** The item the walk starts from, shown in the middle column. */
    item: T;
    /** The items related to an item upstream or downstream of it. */
    getRelated: (item: T, direction: RelationDirection) => readonly T[];
    /** An item's text, for typeahead, the trail and column titles. */
    getTextValue: (item: T) => string;
    /** Draws an item's title in its row. Defaults to its text. */
    renderItem?: ((item: T) => ReactNode) | undefined;
    /** The chosen items on each side, nearest first, controlled. */
    path?: RelationColumnsPath | undefined;
    /** The chosen items at first, uncontrolled; they reset when `item` changes. */
    defaultPath?: RelationColumnsPath | undefined;
    /** Called with the path after each choice. */
    onPathChange?: ((path: RelationColumnsPath) => void) | undefined;
    /** Called with the key of an item the reader activates (Enter or a double click), such as to start the walk from it. */
    onAction?: ((key: Key) => void) | undefined;
}
/**
 * Relation columns: the item in the middle, the items upstream of it in the column before and those
 * downstream in the column after. Choosing an item in a side column opens the column of its own
 * related items further along that side, Miller-column style; each column counts its items and each
 * item the items further along. A breadcrumb trail shows the chosen path, and the arrow keys move
 * between the items of a column and between columns.
 */
export declare function RelationColumns<T extends {
    id: Key;
}>({ item, getRelated, getTextValue, renderItem, path, defaultPath, onPathChange, onAction, className, ...rest }: RelationColumnsProps<T>): import("react").JSX.Element;
//# sourceMappingURL=relation-columns.d.ts.map