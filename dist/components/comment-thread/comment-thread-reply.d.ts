import { type ReactNode } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import { type AvatarIdentity } from '../avatar/avatar.js';
import type { MenuEntry } from '../menu/menu.js';
/** What a comment hands the editor that replaces its body while the reader edits it. */
export interface CommentEditorOptions {
    /** The comment's `text`, where the edit starts. */
    defaultValue: string;
    /** Saves the edited text through `onEdit` and closes the editor. */
    onSubmit: (text: string) => void;
    /** Closes the editor without saving. */
    onCancel: () => void;
}
export interface CommentThreadReplyProps extends BaseProps {
    /** Who wrote the comment. */
    author: AvatarIdentity;
    /** When it was posted: an ISO 8601 date and time. */
    time: string | null | undefined;
    /** Marks the comment as changed after it was posted. */
    isEdited?: boolean | undefined;
    /** The comment's plain text: the body when there are no `children`, and where an edit starts. */
    text?: string | undefined;
    /** The body as the caller renders it (plain text, Markdown or rich text). Defaults to `text`. */
    children?: ReactNode;
    /** Content under the body, usually a `ReactionBar`. */
    reactions?: ReactNode;
    /** Actions of the comment's menu, before the built-in Edit and Delete. */
    actions?: readonly MenuEntry[] | undefined;
    /** Called with the `id` of a caller action chosen in the menu. */
    onAction?: ((key: Key) => void) | undefined;
    /** Offers Edit in the menu, which swaps the body for an editor; called with the saved text. */
    onEdit?: ((text: string) => void) | undefined;
    /** Offers Delete in the menu, which asks for confirmation before calling it. */
    onDelete?: (() => void) | undefined;
    /** Renders the editor in place of the default `CommentComposer`, for mentions or rich text. */
    renderEditor?: ((options: CommentEditorOptions) => ReactNode) | undefined;
}
/**
 * One comment: its author, a live time, an edited marker, the body as caller content, reactions
 * and a menu of actions with Edit (in place) and Delete (after confirmation).
 */
export declare function CommentThreadReply({ author, time, isEdited, text, children, reactions, actions, onAction, onEdit, onDelete, renderEditor, className, ...rest }: CommentThreadReplyProps): import("react").JSX.Element;
//# sourceMappingURL=comment-thread-reply.d.ts.map