import type { Key } from '../../core/props.js';
import type { BoardColumn, BoardProps } from './board.js';
import { type BoardLayout } from './board-moves.js';
import { type CollapsedKeys } from './use-board-collapse.js';
/** What the board's parts read: its cells, counts, collapsed state and title ids. */
export interface BoardModel<T> {
    columns: readonly BoardColumn[];
    columnKeys: readonly Key[];
    layout: BoardLayout;
    itemsByKey: ReadonlyMap<Key, T>;
    collapsedColumns: CollapsedKeys;
    collapsedLanes: CollapsedKeys;
    /** The id of a column's title, by the column's index. */
    columnTitleId: (index: number) => string;
    /** The id of a lane's title, by the lane's index. */
    laneTitleId: (index: number) => string;
    /** The cards of a column across lanes. */
    countColumn: (column: Key) => number;
    /** The cards of a lane across columns. */
    countLane: (lane: Key) => number;
    /** Whether a column holds more cards than its limit. */
    isOverLimit: (column: BoardColumn) => boolean;
    /** The items of one cell, in order. */
    getCellItems: (column: Key, lane: Key | null) => T[];
}
type BoardModelProps<T extends {
    id: Key;
}> = Pick<BoardProps<T>, 'columns' | 'lanes' | 'items' | 'getColumn' | 'getLane' | 'collapsedColumns' | 'defaultCollapsedColumns' | 'onCollapsedColumnsChange' | 'collapsedLanes' | 'defaultCollapsedLanes' | 'onCollapsedLanesChange' | 'persistKey'>;
/** The board's cells, counts and collapsed columns and lanes, from its props. */
export declare function useBoardModel<T extends {
    id: Key;
}>(props: BoardModelProps<T>): BoardModel<T>;
export {};
//# sourceMappingURL=use-board-model.d.ts.map