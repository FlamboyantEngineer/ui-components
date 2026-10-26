import { type ReactNode } from 'react';
import type { ModalController } from '../modal-controller/modal-controller.js';
import { type ModalProps } from './modal.js';
import { type ConfirmOptions } from './modal-confirm.js';
/** Options of `alert`: a confirm dialog whose one action acknowledges it. */
export type AlertOptions = Omit<ConfirmOptions, 'cancelLabel' | 'secondaryActionLabel' | 'onSecondaryAction' | 'autoFocusConfirm'>;
/** Options of `prompt`: a dialog that asks for one line of text. */
export interface PromptOptions extends Pick<ModalProps, 'title'> {
    /** What the text is for, under the title. */
    message?: ReactNode;
    /** Names the text field. */
    label: string;
    /** The text the field starts with. */
    defaultValue?: string | undefined;
    /** Defaults to the provider's `ok` string. */
    confirmLabel?: ReactNode;
    /** Defaults to the provider's `cancel` string. */
    cancelLabel?: ReactNode;
}
/**
 * Opens an alert through `controller`: a `ModalConfirmation` (tone `info` by default) whose one action,
 * labelled by the provider's `ok` string, acknowledges it. Resolves once it closes, however it closes.
 */
export declare function alert(controller: ModalController, options: AlertOptions): Promise<void>;
/**
 * Opens a dialog through `controller` that asks for one line of text, and resolves to the text when
 * the reader confirms (the action or Enter), or `null` when they cancel or dismiss it.
 */
export declare function prompt(controller: ModalController, options: PromptOptions): Promise<string | null>;
//# sourceMappingURL=modal-prompts.d.ts.map