import type { ModalProps } from './modal.js';
export type ModalDialogProps = Omit<ModalProps, 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDismissable' | 'isKeyboardDismissDisabled' | 'shouldCloseOnInteractOutside' | 'isNonModal' | 'placement' | 'size' | 'bodyLayout' | 'className'> & Required<Pick<ModalProps, 'tone' | 'initialFocus' | 'isDismissDisabled'>> & {
    /** Escape would close the dialog: neither keyboard dismissal nor every dismissal is refused. */
    canEscape: boolean;
    /** The dialog floats over a page it does not block, so it handles Escape and focus return. */
    isFloating: boolean;
};
/** The dialog element: header, body and footer, with its focus, Escape and shortcut handling. */
export declare function ModalDialog({ title, description, headerActions, showCloseButton, children, initialFocus, finalFocus, isDismissDisabled, canEscape, isFloating, shouldCloseOnEscape, onExitComplete, role, id, 'aria-label': ariaLabel, 'aria-describedby': ariaDescribedby, onKeyDown: onCallerKeyDown, ...footer }: ModalDialogProps): import("react").JSX.Element;
//# sourceMappingURL=modal-dialog.d.ts.map