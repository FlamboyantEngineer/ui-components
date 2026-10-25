import type { FocusEvent, ReactNode, Ref } from 'react';
import { TextArea } from '../../primitives/index.js';
import type { AriaLabellingProps, KeyboardEventProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import {
  ControlCompletionList,
  type Completion,
  type CompletionListItemState,
  type CompletionSource,
} from '../completion-list/completion-list.js';
import { ComposerFrame } from './composer-frame.js';
import { composerHooks as hooks } from './composer-hooks.js';
import { useMessageComposer } from './use-message-composer.js';

/** The chord that sends: Enter (Shift+Enter breaks the line), or Ctrl+Enter (Cmd+Enter on macOS). */
export type MessageComposerSubmitShortcut = 'Enter' | 'Ctrl+Enter';

/** The props both composers take: the frame, sending, attaching, editing, recall and the draft. */
export interface MessageComposerSharedProps
  extends BaseProps, AriaLabellingProps, KeyboardEventProps {
  /** Called when the reader stops the pending reply; with it, a pending composer offers Stop. */
  onStop?: (() => void) | undefined;
  /** A reply is on its way: sending waits, and Send becomes Stop when `onStop` is set. */
  isPending?: boolean | undefined;
  /** Refuses focus, edits and sending. */
  isDisabled?: boolean | undefined;
  /** Shown while the text is empty. */
  placeholder?: string | undefined;
  /** The chord that sends. Defaults to `Enter`; on a touch screen Enter breaks the line. */
  submitShortcut?: MessageComposerSubmitShortcut | undefined;
  /** The rows the input shows at least. Defaults to 1. */
  minRows?: number | undefined;
  /** The rows the input grows to before it scrolls. Defaults to 8. */
  maxRows?: number | undefined;
  /** Sends blank text too, as when attachments carry the message. */
  allowsEmptySubmit?: boolean | undefined;
  /** Content above the input and below the banner, such as the files attached to the message. */
  attachments?: ReactNode;
  /** A line above everything else, such as the message being replied to or edited. */
  banner?: ReactNode;
  /** Tools before the send button, after the built-in attach and emoji buttons. */
  toolbar?: ReactNode;
  /** Called with files chosen with the attach button, dropped on the composer or pasted. */
  onAttach?: ((files: File[]) => void) | undefined;
  /** Shows a button that opens the emoji picker and inserts the chosen emoji at the caret. */
  showEmojiPicker?: boolean | undefined;
  /** Called when the reader cancels an edit, with Cancel or Escape. */
  onCancel?: (() => void) | undefined;
  /** Called on the Up arrow in an empty composer, to edit the reader's last message. */
  onEditLast?: (() => void) | undefined;
  /** The reader's earlier messages, oldest first, which the Up and Down arrows recall. */
  history?: readonly string[] | undefined;
  /** Keeps the uncontrolled draft in the provider's storage under this key. */
  persistKey?: string | undefined;
}

export interface MessageComposerProps extends MessageComposerSharedProps {
  /** The text, controlled. */
  value?: string | undefined;
  /** The text at first, uncontrolled. */
  defaultValue?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  /** Called with the text when the reader sends it; the composer then empties. */
  onSubmit?: ((value: string) => void) | undefined;
  /** The message being edited: while set, the composer shows it in place of the draft, with Save and Cancel. */
  editValue?: string | undefined;
  /** The most characters the text may hold. */
  maxLength?: number | undefined;
  /** A vocabulary for the word before the caret, or a source such as `@` mentions. */
  completions?: readonly Completion[] | CompletionSource | undefined;
  /** Draws a completion's content in the list instead of its label and description. */
  renderCompletion?:
    | ((completion: Completion, state: CompletionListItemState) => ReactNode)
    | undefined;
  onFocus?: ((event: FocusEvent<HTMLTextAreaElement>) => void) | undefined;
  onBlur?: ((event: FocusEvent<HTMLTextAreaElement>) => void) | undefined;
  /** The text area. */
  ref?: Ref<HTMLTextAreaElement> | undefined;
}

/**
 * A composer for chat messages and comments: a text area that grows with its text and sends on
 * Enter (or Ctrl+Enter), with a banner, attachments above it, attach, emoji and caller tools and a
 * send button below, completions such as `@` mentions, an edit mode, recall of earlier messages,
 * a persisted draft, and a pending state that offers Stop while a reply streams.
 */
export function MessageComposer(props: MessageComposerProps) {
  const composer = useMessageComposer(props);
  return (
    <ComposerFrame props={props} rootRef={composer.rootRef} model={composer.frame}>
      <TextArea {...composer.inputProps} {...hooks.slot('input')} />
      {props.completions ? (
        <ControlCompletionList
          model={composer.completion.model}
          listId={composer.completion.listId}
          anchorRef={composer.rootRef}
          renderCompletion={props.renderCompletion}
          className={hooks.slotClass('completions')}
        />
      ) : null}
    </ComposerFrame>
  );
}
