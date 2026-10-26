import { type RefObject } from 'react';
import { type MessageComposerMessage } from '../composer-message.js';
import type { MessageComposerSubmitShortcut } from '../message-composer.js';
import type { ComposerState } from '../use-composer-state.js';
import { type PillAttributes } from './composer-schema.js';
import type { RichMessageComposerProps } from './rich-message-composer.js';
/** What the frame's tools call on the editor. */
export interface RichEditorHandle {
    insertText: (text: string) => void;
    insertPill: (pill: PillAttributes) => void;
    /** Adds a pill at the caret, or after the selection, as its own undo step. */
    addPill: (pill: PillAttributes) => void;
    focus: () => void;
}
export interface RichComposerEditorProps {
    props: RichMessageComposerProps;
    state: ComposerState<MessageComposerMessage>;
    shortcut: MessageComposerSubmitShortcut;
    rootRef: RefObject<HTMLDivElement | null>;
    handleRef: RefObject<RichEditorHandle | null>;
}
/** The rich composer's ProseMirror editor, in step with the composer's message. */
export declare function RichComposerEditor(editor: RichComposerEditorProps): import("react").JSX.Element;
//# sourceMappingURL=rich-editor.d.ts.map