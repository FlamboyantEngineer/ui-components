import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { type TransferListItem } from './transfer-pane.js';
export type { TransferListItem, TransferListSide } from './transfer-pane.js';
export interface TransferListProps extends BaseProps, AriaLabellingProps {
    /** Every item, in the order the available side lists them. */
    items: readonly TransferListItem[];
    /** The chosen item ids, in the chosen side's order, controlled. */
    value?: readonly Key[] | undefined;
    /** The chosen item ids at first, uncontrolled. */
    defaultValue?: readonly Key[] | undefined;
    /** Called with the chosen item ids after each move or reorder. */
    onChange?: ((value: Key[]) => void) | undefined;
    /** The available side's title. Defaults to the provider's `availableItems`. */
    availableLabel?: string | undefined;
    /** The chosen side's title. Defaults to the provider's `chosenItems`. */
    chosenLabel?: string | undefined;
    /** Items that cannot be selected or moved. */
    disabledKeys?: Iterable<Key> | undefined;
    /** Lets the reader reorder the chosen side by drag and drop and with move up and down buttons. */
    reorderable?: boolean | undefined;
    /** Locks every row, filter and button. */
    isDisabled?: boolean | undefined;
}
/**
 * Chooses a subset of items, in order, between two lists: the available items and the chosen ones.
 * Each side filters its rows, counts them and selects several (Shift and Ctrl or Cmd); buttons move
 * the selection or every shown item across, a double click or Enter moves a row, and with
 * `reorderable` the chosen side reorders by drag and drop and with move up and down buttons.
 */
export declare function TransferList({ items, value, defaultValue, onChange, availableLabel, chosenLabel, disabledKeys, reorderable, isDisabled, className, id, ...rest }: TransferListProps): import("react").JSX.Element;
//# sourceMappingURL=transfer-list.d.ts.map