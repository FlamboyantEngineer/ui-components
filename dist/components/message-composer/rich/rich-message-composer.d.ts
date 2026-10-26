import { type FocusEvent, type Ref } from 'react';
import type { AvatarIdentity } from '../../avatar/avatar.js';
import type { RecordLabelResolver } from '../../record-label/record-label.js';
import { type MessageComposerMessage } from '../composer-message.js';
import type { MessageComposerSharedProps } from '../message-composer.js';
import { type MessageComposerHandle } from './use-composer-handle.js';
export type { MessageComposerHandle, MessageComposerInsertResult } from './use-composer-handle.js';
/** A person `@` can mention: shown with their avatar in the list, then as a pill. */
export interface MessageComposerMention extends Pick<AvatarIdentity, 'src' | 'initials' | 'colorKey'> {
    id: string;
    /** The name shown in the list and in the pill, after `@`. */
    label: string;
    /** A second line in the list, such as a role. */
    description?: string | undefined;
}
/** A command `/` can insert as a pill, for the host to act on when the message is sent. */
export interface MessageComposerCommand {
    id: string;
    /** The command's name, shown after `/`. */
    label: string;
    /** What the command does, shown beside it in the list. */
    description?: string | undefined;
}
export interface RichMessageComposerProps extends MessageComposerSharedProps {
    /** The message, controlled: Markdown text and its tokens. */
    value?: MessageComposerMessage | undefined;
    /** The message at first, uncontrolled. */
    defaultValue?: MessageComposerMessage | undefined;
    /** Called with the message after each edit. */
    onChange?: ((value: MessageComposerMessage) => void) | undefined;
    /**
     * Called with the message when the reader sends it; the composer then empties. A returned
     * promise holds sending until it settles, and the composer empties once it resolves.
     */
    onSubmit?: ((value: MessageComposerMessage) => void | Promise<unknown>) | undefined;
    /** The message being edited: while set, the composer shows it in place of the draft, with Save and Cancel. */
    editValue?: MessageComposerMessage | undefined;
    /** The people `@` mentions. */
    mentions?: readonly MessageComposerMention[] | undefined;
    /** The commands `/` inserts. */
    commands?: readonly MessageComposerCommand[] | undefined;
    /** Looks up how a record reference's chip shows its record: name, icon, link, preview or unavailability. */
    getReference?: RecordLabelResolver | undefined;
    onFocus?: ((event: FocusEvent<HTMLDivElement>) => void) | undefined;
    onBlur?: ((event: FocusEvent<HTMLDivElement>) => void) | undefined;
    /** The editable text box. */
    ref?: Ref<HTMLDivElement> | undefined;
    /** Receives `insertToken` and `getDraft`, for the host's own controls outside the composer. */
    handleRef?: Ref<MessageComposerHandle> | undefined;
}
/**
 * `MessageComposer`'s rich mode, on ProseMirror: mentions and commands as atomic pills chosen from
 * the completion list or inserted by a menu item, record references as atomic record chips, Markdown as typed with code blocks after three
 * backticks and Ctrl+B or Ctrl+I wrapping the selection, plain-text paste, and the plain composer's
 * frame, sending, attaching, editing, recall and draft. It sends Markdown text with the pills'
 * token ranges.
 */
export declare function RichMessageComposer(props: RichMessageComposerProps): import("react").JSX.Element;
//# sourceMappingURL=rich-message-composer.d.ts.map