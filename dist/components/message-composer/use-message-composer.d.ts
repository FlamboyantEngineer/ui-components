import { type RefObject, type TextareaHTMLAttributes } from 'react';
import { type TextCompletions } from '../completion-list/completion-list.js';
import type { ComposerFrameModel } from './composer-frame.js';
import type { MessageComposerProps, MessageComposerSharedProps } from './message-composer.js';
export interface MessageComposerModel {
    rootRef: RefObject<HTMLDivElement | null>;
    /** The text area's props: its value, name, limits and handlers. */
    inputProps: TextareaHTMLAttributes<HTMLTextAreaElement> & {
        ref: (node: HTMLTextAreaElement | null) => void;
    };
    completion: TextCompletions;
    /** What the frame around the text area shows and calls. */
    frame: ComposerFrameModel;
}
/** The input's name: the caller's label or labelling element, else the provider's `message`. */
export declare function toComposerLabelling(props: MessageComposerSharedProps, fallback: string): {
    'aria-label': string | undefined;
    'aria-labelledby': string | undefined;
    'aria-describedby': string | undefined;
    'aria-details': string | undefined;
};
/**
 * The plain composer: its text, the growing text area, its completions and its keys. The
 * completion list's keys come first, then the send chord, Escape and the recall arrows, then the
 * caller's keys.
 */
export declare function useMessageComposer(props: MessageComposerProps): MessageComposerModel;
//# sourceMappingURL=use-message-composer.d.ts.map