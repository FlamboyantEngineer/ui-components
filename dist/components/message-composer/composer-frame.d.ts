import type { ReactNode, RefObject } from 'react';
import type { MessageComposerToken } from './composer-message.js';
import type { MessageComposerSharedProps, MessageComposerSubmitShortcut } from './message-composer.js';
/** What the frame needs from the composer's input, plain or rich. */
export interface ComposerFrameModel {
    isEditing: boolean;
    canSubmit: boolean;
    isSubmitting: boolean;
    submit: () => void;
    shortcut: MessageComposerSubmitShortcut;
    /** Inserts text at the caret, as a chosen emoji. */
    insertText: (text: string) => void;
    /** Inserts a mention or command at the caret: a pill in the rich composer, its text in the plain one. */
    insertPill: (pill: Pick<MessageComposerToken, 'kind' | 'id' | 'label' | 'recordType'>) => void;
    focusInput: () => void;
}
export interface ComposerFrameProps {
    props: MessageComposerSharedProps;
    rootRef: RefObject<HTMLDivElement | null>;
    model: ComposerFrameModel;
    /** The input and its completion list. */
    children: ReactNode;
}
/**
 * The composer around its input: the banner, the attachments, the input, then the tools, Cancel
 * while editing and the action button. Files dragged onto it, pasted or chosen go to `onAttach`.
 */
export declare function ComposerFrame({ props, rootRef, model, children }: ComposerFrameProps): import("react").JSX.Element;
//# sourceMappingURL=composer-frame.d.ts.map