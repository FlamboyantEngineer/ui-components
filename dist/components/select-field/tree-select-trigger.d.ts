import { type ReactNode } from 'react';
import type { FieldControlProps } from '../field/field.js';
export interface TreeSelectTriggerProps {
    control: FieldControlProps;
    /** The chosen value's text, or the placeholder. */
    text: string;
    /** Nothing is chosen: `text` is the placeholder. */
    isPlaceholder: boolean;
    /** The chosen key matches no loaded node. */
    isMissing: boolean;
    /** Names the clear button after the trigger; `null` draws none. */
    clearLabel: string | null;
    onClear: () => void;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    /** The popover the trigger opens. */
    popover: ReactNode;
}
/**
 * The frame of a tree select field: the trigger, named by the field's label and its value, with a
 * chevron, which opens the popover, then the clear button, which returns focus to the trigger. The
 * clear button stays outside the dialog trigger, where every press would open the popover.
 */
export declare function TreeSelectTrigger({ control, text, isPlaceholder, isMissing, clearLabel, onClear, isOpen, onOpenChange, popover, }: TreeSelectTriggerProps): import("react").JSX.Element;
//# sourceMappingURL=tree-select-trigger.d.ts.map