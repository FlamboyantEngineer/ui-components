import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { type BoardCellAddress, type BoardColumnMove, type BoardMove } from './board-moves.js';
/** A column of the board. */
export interface BoardColumn {
    id: Key;
    /** The header text, which also names the column's cells. */
    title: string;
    /** The most cards the column should hold; more publish `data-over-limit`. */
    limit?: number | undefined;
}
/** A lane (swimlane) of the board: a row that repeats every column. */
export interface BoardLane {
    id: Key;
    /** The header text, which also names the lane. */
    title: string;
}
export interface BoardProps<T extends {
    id: Key;
}> extends BaseProps, AriaLabellingProps {
    /** The columns, in order. */
    columns: readonly BoardColumn[];
    /** The lanes, in order. Without them the board is one row of columns. */
    lanes?: readonly BoardLane[] | undefined;
    /** The cards as data, in order within each cell. */
    items: readonly T[];
    /** The column a card belongs to. */
    getColumn: (item: T) => Key;
    /** The lane a card belongs to, on a board with lanes. */
    getLane?: ((item: T) => Key) | undefined;
    /** A card's text, for typeahead, its drag handle and what it carries when dragged. */
    getTextValue: (item: T) => string;
    /** Draws a card's content, such as a `Card` body or a custom layout. */
    renderCard: (item: T) => ReactNode;
    /** Turns on card moves by drag and drop and Alt+Arrow keys, and reports each one. */
    onMove?: ((move: BoardMove) => void) | undefined;
    /** Turns on column moves by drag and drop and Alt+Arrow keys, and reports each one. */
    onColumnMove?: ((move: BoardColumnMove) => void) | undefined;
    /** Called with the key of the card the reader activates. */
    onAction?: ((key: Key) => void) | undefined;
    /** Draws controls at the end of a column's header, such as a menu or a button, for each column. */
    renderColumnActions?: ((column: BoardColumn) => ReactNode) | undefined;
    /** Shows an add-card button in every cell and reports which cell it was pressed in. */
    onAddCard?: ((cell: BoardCellAddress) => void) | undefined;
    /** The collapsed columns, controlled. */
    collapsedColumns?: Iterable<Key> | undefined;
    /** The columns collapsed at first, uncontrolled. */
    defaultCollapsedColumns?: Iterable<Key> | undefined;
    /** Called with the collapsed columns after each change. */
    onCollapsedColumnsChange?: ((keys: Set<Key>) => void) | undefined;
    /** The collapsed lanes, controlled. */
    collapsedLanes?: Iterable<Key> | undefined;
    /** The lanes collapsed at first, uncontrolled. */
    defaultCollapsedLanes?: Iterable<Key> | undefined;
    /** Called with the collapsed lanes after each change. */
    onCollapsedLanesChange?: ((keys: Set<Key>) => void) | undefined;
    /** Remembers uncontrolled collapsed columns and lanes through the provider storage. */
    persistKey?: string | undefined;
    /** Renders only the cards in view in each cell; the stylesheet must bound the cells' height. */
    virtualized?: boolean | undefined;
}
/**
 * A board: columns of cards with a header each (title, count against an optional limit, collapse
 * toggle, optional caller actions), optionally repeated in collapsible lanes. Cards are the caller's content in a React Aria
 * grid list per cell; with `onMove` they move within and between cells by pointer or keyboard drag
 * and drop and Alt+Arrow keys, and with `onColumnMove` columns reorder. The board never moves cards
 * or columns itself: the owner applies each reported move.
 */
export declare function Board<T extends {
    id: Key;
}>({ columns, lanes, items, getColumn, getLane, getTextValue, renderCard, onMove, onColumnMove, onAction, renderColumnActions, onAddCard, collapsedColumns, defaultCollapsedColumns, onCollapsedColumnsChange, collapsedLanes, defaultCollapsedLanes, onCollapsedLanesChange, persistKey, virtualized, className, ...rest }: BoardProps<T>): import("react").JSX.Element;
//# sourceMappingURL=board.d.ts.map