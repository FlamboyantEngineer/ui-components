import type { Key } from '../../core/props.js';
import type { FieldControlProps, FieldInputProps, FieldState } from '../field/field.js';
import type { TreeItemData } from '../tree/tree.js';
import type { SelectTreeFieldProps, SelectFieldValueDisplay } from './select-tree-field.js';
type TreeSelectConfig<T extends TreeItemData> = Omit<SelectTreeFieldProps<T, 'single' | 'multiple'>, keyof FieldInputProps<unknown> | 'selectionMode' | 'valueDisplay' | 'mode'> & {
    name?: string | undefined;
};
export interface TreeSelectControlProps<T extends TreeItemData> extends TreeSelectConfig<T> {
    control: FieldControlProps;
    state: FieldState<Key | Key[] | null>;
    /** The field's label, which names the popover, the chips and the clear button. */
    label: string;
    isMultiple: boolean;
    valueDisplay: SelectFieldValueDisplay;
}
/**
 * A tree select field's control: the framed trigger that opens the popover, the clear button, the
 * chips of a multiple choice and the hidden inputs a form submits.
 */
export declare function TreeSelectControl<T extends TreeItemData>(props: TreeSelectControlProps<T>): import("react").JSX.Element;
export {};
//# sourceMappingURL=tree-select-control.d.ts.map