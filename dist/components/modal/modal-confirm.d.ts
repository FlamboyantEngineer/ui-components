import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type IconSource } from '../icon/icon.js';
import type { ModalController } from '../modal-controller/modal-controller.js';
import { type ModalAction, type ModalProps, type ModalTone } from './modal.js';
export interface ModalConfirmationProps extends Pick<ModalProps, 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDismissable' | 'title' | 'size' | 'placement'>, Pick<ModalAction, 'pendingLabel'>, BaseProps {
    /** What happens if the reader confirms; it describes the dialog. */
    message?: ReactNode;
    /** More content under the message. */
    children?: ReactNode;
    /** Defaults to `neutral`. */
    tone?: ModalTone | undefined;
    /** Drawn before the title; defaults to the tone's glyph for `info`, `success` and `warning`. */
    icon?: IconSource;
    /** Defaults to the provider's `confirm` string. */
    confirmLabel?: ReactNode;
    /** Defaults to the provider's `cancel` string; `null` leaves Cancel out, for an acknowledgement. */
    cancelLabel?: ReactNode;
    /** Labels a third action between Cancel and the confirm action, such as "Don't save". */
    secondaryActionLabel?: ReactNode;
    /** Runs on confirm; a returned promise keeps the dialog pending until it settles, open if it rejects. */
    onConfirm?: (() => void | Promise<unknown>) | undefined;
    /** Runs on the third action, then closes the dialog, like `onConfirm`. */
    onSecondaryAction?: (() => void | Promise<unknown>) | undefined;
    /** Runs when the dialog closes without an action: Cancel, Escape or an outside press. */
    onCancel?: (() => void) | undefined;
    /** Focuses the confirm action on open instead of Cancel. */
    autoFocusConfirm?: boolean | undefined;
}
/** `ModalConfirmation`'s props, less those the controller owns. */
export type ConfirmOptions = Omit<ModalConfirmationProps, 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'onCancel'>;
/**
 * A yes-or-no decision in a modal alert dialog: a question, what confirming does, Cancel and a
 * confirm action, optionally a third action. Focus starts on Cancel, the safe choice.
 */
export declare function ModalConfirmation({ message, children, tone, icon, title, confirmLabel, cancelLabel, secondaryActionLabel, pendingLabel, onConfirm, onSecondaryAction, onCancel, onOpenChange, autoFocusConfirm, className, ...rest }: ModalConfirmationProps): import("react").JSX.Element;
/**
 * Opens a `ModalConfirmation` through `controller` and resolves `true` when the reader confirms (after
 * `onConfirm` succeeds), `false` when they cancel, take the third action or dismiss it otherwise.
 */
export declare function confirm(controller: ModalController, options: ConfirmOptions): Promise<boolean>;
//# sourceMappingURL=modal-confirm.d.ts.map