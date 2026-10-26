import type { Key } from '../../core/props.js';
import type { BoardLane } from './board.js';
import { type BoardCellOptions } from './board-cell.js';
import type { BoardModel } from './use-board-model.js';
export interface BoardCellsProps<T> {
    model: BoardModel<T>;
    /** The lane the cells belong to; `null` on a board without lanes. */
    lane: Key | null;
    /** The id of the lane's title, which names its cells with their column's title. */
    laneTitleId?: string | undefined;
    options: BoardCellOptions<T>;
}
export interface BoardLaneGroupProps<T> {
    model: BoardModel<T>;
    lane: BoardLane;
    index: number;
    options: BoardCellOptions<T>;
}
/** One cell per column of a lane, or of a board without lanes. */
export declare function BoardCells<T extends {
    id: Key;
}>({ model, lane, laneTitleId, options, }: BoardCellsProps<T>): import("react").JSX.Element;
/**
 * A lane: a group named by its header (collapse toggle, title, card count) holding one cell per
 * column, which a collapsed lane hides.
 */
export declare function BoardLaneGroup<T extends {
    id: Key;
}>({ model, lane, index, options, }: BoardLaneGroupProps<T>): import("react").JSX.Element;
//# sourceMappingURL=board-lane.d.ts.map