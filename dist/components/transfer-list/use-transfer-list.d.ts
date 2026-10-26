import type { Key, Selection } from '../../core/props.js';
import { type TransferDrop } from './transfer-moves.js';
import type { TransferListItem, TransferListSide } from './transfer-pane.js';
export interface TransferListOptions {
    items: readonly TransferListItem[];
    value: readonly Key[] | undefined;
    defaultValue: readonly Key[] | undefined;
    onChange: ((value: Key[]) => void) | undefined;
    disabledKeys: Iterable<Key> | undefined;
    isDisabled: boolean;
}
/** One side's rows, filter and selection, as its pane draws them. */
export interface TransferSide {
    /** Every item on the side. */
    all: readonly TransferListItem[];
    /** The items the side's filter shows. */
    shown: readonly TransferListItem[];
    /** The selected keys among the shown items. */
    selected: ReadonlySet<Key>;
    /** The shown keys that can move. */
    movable: ReadonlySet<Key>;
    filterText: string;
}
type PerSide<T> = Record<TransferListSide, T>;
/**
 * A transfer list's model: the chosen keys (controlled or held here), each side's rows, filter and
 * selection, and the moves between and within the sides.
 */
export declare function useTransferList(options: TransferListOptions): {
    sides: PerSide<TransferSide>;
    blocked: ReadonlySet<Key>;
    transfer: (from: TransferListSide, keys: ReadonlySet<Key>) => void;
    /** Moves the actioned row, or the whole selection when it holds the row. */
    act: (from: TransferListSide, key: Key) => void;
    select: (side: TransferListSide, keys: Selection) => void;
    filter: (side: TransferListSide, text: string) => void;
    drop: (drop: TransferDrop) => void;
    up: {
        canStep: boolean;
        onStep: () => void;
    };
    down: {
        canStep: boolean;
        onStep: () => void;
    };
};
export {};
//# sourceMappingURL=use-transfer-list.d.ts.map