import type { Key } from '../../core/props.js';
import { type PendingChangeHandler } from './pending-change.js';
export type SegmentedChoiceSelectionMode = 'single' | 'multiple';
/** One value or none for a single choice, the pressed values for a multiple one. */
export type SegmentedChoiceValue<M extends SegmentedChoiceSelectionMode = 'single'> = M extends 'multiple' ? string[] : string | null;
export interface ChoiceSelectionOptions<M extends SegmentedChoiceSelectionMode> {
    options: readonly {
        value: string;
    }[];
    selectionMode?: M | undefined;
    value?: SegmentedChoiceValue<M> | undefined;
    defaultValue?: SegmentedChoiceValue<M> | undefined;
    onChange?: PendingChangeHandler<SegmentedChoiceValue<M>> | undefined;
    isInherited: boolean;
    isClearable: boolean;
    isReadOnly: boolean;
}
export interface ChoiceSelection {
    selectionMode: SegmentedChoiceSelectionMode;
    /** A change waits for the promise `onChange` returned. */
    isPending: boolean;
    selectedKeys: string[];
    onSelectionChange: (keys: Set<Key>) => void;
}
/**
 * The group's selection mode, selected keys and selection handler. A single choice applies the
 * rules for picking the selected segment again; a multiple one reports its values in option order.
 */
export declare function useChoiceSelection<M extends SegmentedChoiceSelectionMode>({ options, selectionMode, value, defaultValue, onChange, isInherited, isClearable, isReadOnly, }: ChoiceSelectionOptions<M>): ChoiceSelection;
//# sourceMappingURL=choice-selection.d.ts.map