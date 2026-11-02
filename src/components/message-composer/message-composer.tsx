'use client';

import type { FocusEvent, ReactNode, Ref } from 'react';
import { TextArea } from '../../primitives/index.js';
import type { AriaLabellingProps, KeyboardEventProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import type { ShortcutChord } from '../shortcut/shortcut.js';
import {
  ControlCompletionList,
  type Completion,
  type CompletionListItemState,
  type CompletionSource,
} from '../completion-list/completion-list.js';
import { ComposerFrame } from './composer-frame.js';
import { composerHooks as hooks } from './composer-hooks.js';
import { useMessageComposer } from './use-message-composer.js';

export { ComposerControlButton } from './composer-control-button.js';
export { useMessageComposerControls } from './composer-controls.js';
export { MessageComposerAttachButton, MessageComposerEmojiButton } from './composer-tools.js';

/** The chords of one composer action, in Shortcut notation: one, or several that all do it. */
export type MessageComposerChords = ShortcutChord | readonly ShortcutChord[];

/**
 * The chords that send, by the composer's state. Each defaults on its own, and an Enter no chord
 * takes breaks the line.
 */
export interface MessageComposerShortcuts {
  /** Sends, or saves an edit, while no reply runs. Defaults to Enter and Ctrl+Enter. */
  send?: MessageComposerChords | undefined;
  /** Sends while a reply runs, for a host that queues the message. Defaults to Enter. */
  queue?: MessageComposerChords | undefined;
  /** Sends at once while a reply runs, through `onSubmitNow`. Defaults to Ctrl+Enter. */
  sendNow?: MessageComposerChords | undefined;
}

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
  /**
   * The chords that send while idle, queue while a reply runs and send at once. On a touch screen
   * Enter breaks the line.
   */
  shortcuts?: MessageComposerShortcuts | undefined;
  /** The rows the input shows at least. Defaults to 1. */
  minRows?: number | undefined;
  /** The rows the input grows to before it scrolls. Defaults to 8. */
  maxRows?: number | undefined;
  /** Sends blank text too, as when attachments carry the message. */
  allowsEmptySubmit?: boolean | undefined;
  /** Called when `onSubmit` throws or its promise rejects; the composer keeps the message. Without it the error is rethrown. */
  onSubmitError?: ((error: unknown) => void) | undefined;
  /**
   * Sends while `isPending` too, for a host that queues the message until the reply ends: the
   * button is then Send while there is something to send, and Stop otherwise.
   */
  allowsPendingSubmit?: boolean | undefined;
  /** Content above the input and below the banner, such as the files attached to the message. */
  attachments?: ReactNode;
  /** A line above everything else, such as the message being replied to or edited. */
  banner?: ReactNode;
  /** Controls at the start of the row below the input, in order, such as the "+" menu button. */
  startControls?: ReactNode;
  /** Controls at the end of the row below the input, in order, before the send button unless they hold it. */
  endControls?: ReactNode;
  /** Called with files chosen with the attach button or a menu item, dropped on the composer or pasted. */
  onAttach?: ((files: File[]) => void) | undefined;
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
  /**
   * Called with the text when the reader sends it; the composer then empties. A returned promise
   * holds sending until it settles, and the composer empties once it resolves.
   */
  onSubmit?: ((value: string) => void | Promise<unknown>) | undefined;
  /**
   * Called with the text when the reader sends it at once while a reply runs (the `sendNow` chord),
   * for a host that stops the reply and sends it ahead of its queue; it settles as `onSubmit` does.
   * Without it, that chord sends through `onSubmit`.
   */
  onSubmitNow?: ((value: string) => void | Promise<unknown>) | undefined;
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
 * the host's chords (Enter by default, another while a reply runs), with a banner and attachments above it, a row of the host's controls and
 * the send button below, completions such as `@` mentions, an edit mode, recall of earlier messages,
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
