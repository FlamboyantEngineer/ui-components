import type { Ref } from 'react';
import type { ModalProps } from './modal.js';
import type { ModalActions } from './use-modal-actions.js';
export interface ModalFooterProps extends Pick<ModalProps, 'primaryAction' | 'secondaryAction' | 'cancelAction' | 'actions' | 'footerContent' | 'status' | 'error' | 'tone'> {
    /** The action lifecycle of this opening. */
    actionState: ModalActions;
    /** Disables Cancel. */
    isDismissDisabled: boolean;
    ref?: Ref<HTMLDivElement> | undefined;
}
/** The footer: caller content, the status or error message, and the action bar. */
export declare function ModalFooter({ actions, footerContent, status, error, ref, ...builtIn }: ModalFooterProps): import("react").JSX.Element | null;
//# sourceMappingURL=modal-footer.d.ts.map