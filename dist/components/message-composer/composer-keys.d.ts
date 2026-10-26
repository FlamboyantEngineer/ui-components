import type { MessageComposerSubmitShortcut } from './message-composer.js';
import type { RecallDirection } from './use-composer-state.js';
/** What the composer reads from a native key event. */
export type ComposerKey = Pick<KeyboardEvent, 'key' | 'keyCode' | 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'isComposing'>;
/** What the composer does with its keys. */
export interface ComposerKeyActions {
    shortcut: MessageComposerSubmitShortcut;
    submit: () => void;
    isEditing: boolean;
    onCancel: (() => void) | undefined;
    recall: (direction: RecallDirection) => boolean;
}
/**
 * Whether a key is part of an input method composition: during it, or the Enter that some
 * browsers report (as key code 229) right after it ends.
 */
export declare function isComposingKey(event: ComposerKey): boolean;
/** Whether the primary pointer is coarse (a touch screen), followed as it changes. */
export declare function useCoarsePointer(): boolean;
/** The chord that sends: on a touch screen Enter breaks the line, so Ctrl+Enter sends. */
export declare function resolveSubmitShortcut(shortcut: MessageComposerSubmitShortcut | undefined, isCoarsePointer: boolean): MessageComposerSubmitShortcut;
/**
 * Runs the composer's own key: the send chord, Escape to cancel an edit, and the arrows that
 * recall earlier messages; returns whether it used the key.
 */
export declare function runComposerKey(event: ComposerKey, actions: ComposerKeyActions): boolean;
//# sourceMappingURL=composer-keys.d.ts.map