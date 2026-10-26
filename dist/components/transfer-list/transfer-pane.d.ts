import { type ReactNode } from 'react';
import type { Key, Selection } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';
import type { TransferDrop } from './transfer-moves.js';
/** An item a transfer list moves between its sides. */
export interface TransferListItem {
    /** Unique among the items. */
    id: Key;
    /** The row's title, its accessible name and the text a side's filter matches. */
    label: string;
    /** Secondary text below the title. */
    description?: string | undefined;
    /** A built-in glyph name or icon node before the title. */
    icon?: IconSource | undefined;
}
/** Which side of a transfer list: the items not chosen, or the chosen ones. */
export type TransferListSide = 'available' | 'chosen';
export interface TransferPaneProps {
    side: TransferListSide;
    label: string;
    /** Every item on this side, before filtering. */
    total: number;
    /** The items this side shows through its filter. */
    items: readonly TransferListItem[];
    selected: ReadonlySet<Key>;
    onSelectionChange: (keys: Selection) => void;
    /** Moves the actioned row, or the selection holding it, to the other side. */
    onAction: (key: Key) => void;
    filterText: string;
    onFilterTextChange: (text: string) => void;
    disabledKeys: ReadonlySet<Key>;
    isDisabled: boolean;
    /** Reorders the side's rows by drag and drop, when set. */
    onReorder?: ((drop: TransferDrop) => void) | undefined;
    /** Controls under the side's header, such as the reorder buttons. */
    tools?: ReactNode;
}
/**
 * One side of a transfer list: its title and counts, its filter and its rows on a `ListView`, where
 * a press selects, Shift and Ctrl or Cmd extend the selection, and a double click or Enter moves.
 */
export declare function TransferPane({ side, label, total, items, selected, onSelectionChange, onAction, filterText, onFilterTextChange, disabledKeys, isDisabled, onReorder, tools, }: TransferPaneProps): import("react").JSX.Element;
//# sourceMappingURL=transfer-pane.d.ts.map