import { type FocusEvent } from 'react';
export interface FieldFocusOptions {
    getRoot: () => HTMLElement | null;
    getControl: () => HTMLElement | null;
    /** Called once focus has left the field: its control, its buttons and the popovers they open. */
    onLeave: () => void;
}
export interface FieldFocus {
    isFocused: boolean;
    onFocus: (event: FocusEvent) => void;
    onBlur: (event: FocusEvent) => void;
}
/**
 * Whether focus is inside the field, popovers it opens included, and the handlers that track it.
 * Focus moving between the field's parts never leaves it. Focus that moves out of the root's DOM may
 * be entering a popover the field opened, which React reports through the root's `onFocus` before
 * the `focusin` reaches the window, so the field decides only then (or on the next task, if no
 * `focusin` follows). A browser renders between `focusout` and `focusin`, so deciding at `focusout`
 * would leave the field for a moment.
 */
export declare function useFieldFocus(options: FieldFocusOptions): FieldFocus;
//# sourceMappingURL=field-focus.d.ts.map