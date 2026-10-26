import type { ModalProps } from './modal.js';
export interface ModalHeaderProps extends Pick<ModalProps, 'title' | 'description' | 'headerActions' | 'showCloseButton'> {
    /** The description's id, which the dialog's `aria-describedby` names. */
    descriptionId: string;
    /** Disables the close button. */
    isDismissDisabled: boolean;
    onClose: () => void;
}
/** The header row: the title and description, caller content, then an optional close button. */
export declare function ModalHeader({ title, description, descriptionId, headerActions, showCloseButton, isDismissDisabled, onClose, }: ModalHeaderProps): import("react").JSX.Element;
//# sourceMappingURL=modal-header.d.ts.map