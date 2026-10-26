import { type RefObject } from 'react';
import { type FocusTarget } from '../../utils/focus-target.js';
/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type ModalFocusTarget = FocusTarget;
export interface InitialFocusProps {
    dialogRef: RefObject<HTMLElement | null>;
    bodyRef: RefObject<HTMLElement | null>;
    footerRef: RefObject<HTMLElement | null>;
    /** An element chosen by the caller, focused first when it resolves to one. */
    target?: ModalFocusTarget | undefined;
}
/**
 * Moves focus on open to the caller's target, else to the first focusable element of the body, else
 * of the footer, else of the whole dialog. It renders inside the dialog so its effect runs before
 * the dialog focuses itself, and without a target it leaves focus alone when an element with
 * `autoFocus` took it.
 */
export declare function InitialFocus({ dialogRef, bodyRef, footerRef, target }: InitialFocusProps): null;
export { useFocusReturn } from '../../utils/focus-target.js';
//# sourceMappingURL=modal-focus.d.ts.map