import type { MessageComposerSubmitShortcut } from './message-composer.js';
/** What the action button does: send, stop the pending reply, or save the edited message. */
export type ComposerActionMode = 'send' | 'stop' | 'save';
export interface ComposerActionProps {
    mode: ComposerActionMode;
    canSubmit: boolean;
    isPending: boolean;
    isDisabled: boolean;
    shortcut: MessageComposerSubmitShortcut;
    onSubmit: () => void;
    onStop: (() => void) | undefined;
}
/** Opens the system file chooser and hands the chosen files to `onAttach`. */
export declare function AttachButton({ onAttach, isDisabled, }: {
    onAttach: (files: File[]) => void;
    isDisabled: boolean;
}): import("react").JSX.Element;
/**
 * Opens the emoji picker; the chosen emoji (or a custom emoji's `:shortcode:`) goes in at the
 * caret, and focus goes back to the text once the picker has closed.
 */
export declare function EmojiButton({ onInsert, focusInput, isDisabled, }: {
    onInsert: (text: string) => void;
    focusInput: () => void;
    isDisabled: boolean;
}): import("react").JSX.Element;
/** Leaves edit mode without saving. */
export declare function CancelButton({ onCancel, isDisabled, }: {
    onCancel: (() => void) | undefined;
    isDisabled: boolean;
}): import("react").JSX.Element;
/** The send button, Stop while a stoppable reply is pending, or Save while editing: one button that keeps focus. */
export declare function ComposerAction(props: ComposerActionProps): import("react").JSX.Element;
//# sourceMappingURL=composer-tools.d.ts.map