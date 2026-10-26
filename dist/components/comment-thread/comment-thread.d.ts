import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type CommentComposerProps } from '../comment-composer/comment-composer.js';
export interface CommentThreadProps extends BaseProps, AriaLabellingProps {
    /** The comments, usually `CommentThreadReply` elements: the opening comment, then the replies. */
    children?: ReactNode;
    /** The commented text or other anchor the thread is about, quoted above the comments. */
    quote?: ReactNode;
    /** Whether the discussion is closed, controlled. */
    isResolved?: boolean | undefined;
    /** Whether the discussion starts closed, uncontrolled. */
    defaultResolved?: boolean | undefined;
    /** Offers Resolve and Reopen; called with the new state. */
    onResolvedChange?: ((isResolved: boolean) => void) | undefined;
    /** Shows the comments without the composer, the resolve button or the comments' menus. */
    isReadOnly?: boolean | undefined;
    /** The thread is the current one, such as when its anchor is selected. */
    isSelected?: boolean | undefined;
    /**
     * How many of the latest replies a long thread shows; the replies between them and the opening
     * comment hide behind a button that reveals them. Defaults to every reply.
     */
    visibleReplies?: number | undefined;
    /** Draws the default `CommentComposer` and receives its text, like its `onSubmit`. */
    onReply?: CommentComposerProps['onSubmit'] | undefined;
    /** The caller's own composer, in place of the default one. */
    composer?: ReactNode;
    /** A failure to report under the comments, such as a reply that could not be posted. */
    error?: ReactNode;
}
/**
 * A discussion: the quoted anchor, an opening comment and its replies, resolve and reopen, an error
 * and a composer for the next reply. A long thread hides its middle replies behind a button.
 */
export declare function CommentThread({ children, quote, isResolved, defaultResolved, onResolvedChange, isReadOnly, isSelected, visibleReplies, onReply, composer, error, className, ...rest }: CommentThreadProps): import("react").JSX.Element;
//# sourceMappingURL=comment-thread.d.ts.map