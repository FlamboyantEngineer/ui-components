'use client';

import { useCallback, useRef, type FocusEvent, type Ref } from 'react';
import type { AvatarIdentity } from '../../avatar/avatar.js';
import type { RecordLabelResolver } from '../../record-label/record-label.js';
import { ComposerFrame } from '../composer-frame.js';
import { useComposerKeys } from '../composer-keys.js';
import {
  createMessageCodec,
  emptyMessage,
  type MessageComposerMessage,
} from '../composer-message.js';
import type { MessageComposerSharedProps } from '../message-composer.js';
import { useComposerState, type ComposerFormat } from '../use-composer-state.js';
import type { PillAttributes } from './composer-schema.js';
import { RichComposerEditor, type RichEditorHandle } from './rich-editor.js';
import type { MessageComposerRange } from './composer-edits.js';
import type { MessageComposerTrigger } from './composer-triggers.js';
import type { MessageComposerPaste, MessageComposerPasteResult } from './composer-paste.js';
import { useComposerHandle, type MessageComposerHandle } from './use-composer-handle.js';

export type {
  MessageComposerContent,
  MessageComposerEditResult,
  MessageComposerHandle,
  MessageComposerInsertResult,
  MessageComposerRefusal,
} from './use-composer-handle.js';
export type { MessageComposerRange } from './composer-edits.js';
export type {
  MessageComposerSuggestion,
  MessageComposerTrigger,
  MessageComposerTriggerContext,
} from './composer-triggers.js';
export type { MessageComposerPaste, MessageComposerPasteResult } from './composer-paste.js';

/** A person `@` can mention: shown with their avatar in the list, then as a pill. */
export interface MessageComposerMention extends Pick<
  AvatarIdentity,
  'src' | 'initials' | 'colorKey'
> {
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
  /**
   * Called with the message when the reader sends it at once while a reply runs (the `sendNow`
   * chord), for a host that stops the reply and sends it ahead of its queue; it settles as
   * `onSubmit` does. Without it, that chord sends through `onSubmit`.
   */
  onSubmitNow?: ((value: MessageComposerMessage) => void | Promise<unknown>) | undefined;
  /** The message being edited: while set, the composer shows it in place of the draft, with Save and Cancel. */
  editValue?: MessageComposerMessage | undefined;
  /** The people `@` mentions. */
  mentions?: readonly MessageComposerMention[] | undefined;
  /** The commands `/` inserts. */
  commands?: readonly MessageComposerCommand[] | undefined;
  /**
   * The host's own triggers, each a character that opens its vocabulary from a source answered at
   * once or later; one with the character `@` or `/` takes its place from `mentions` or `commands`.
   * Keep the array and its sources stable: a new source asks again.
   */
  triggers?: readonly MessageComposerTrigger[] | undefined;
  /** Looks up how a record reference's chip shows its record: name, icon, link, preview or unavailability. */
  getReference?: RecordLabelResolver | undefined;
  onFocus?: ((event: FocusEvent<HTMLDivElement>) => void) | undefined;
  onBlur?: ((event: FocusEvent<HTMLDivElement>) => void) | undefined;
  /** The editable text box. */
  ref?: Ref<HTMLDivElement> | undefined;
  /**
   * Receives the handle for the host's own controls outside the composer: insertion, the draft,
   * the selection and range replacement.
   */
  handleRef?: Ref<MessageComposerHandle> | undefined;
  /**
   * Called with the selection, or the caret as a collapsed range, in the shown message's text
   * whenever it changes, by an edit too.
   */
  onSelectionChange?: ((range: MessageComposerRange) => void) | undefined;
  /**
   * Sees pasted text first, with the range it replaces: answer nothing to paste it as plain text,
   * `null` to refuse it, a fragment to paste in its place, or a promise of one: the plain text then
   * goes in at once and the fragment replaces it once it resolves, if the pasted text is still
   * there unchanged in the same draft.
   */
  onPaste?: ((paste: MessageComposerPaste) => MessageComposerPasteResult) | undefined;
}

const richFormat: ComposerFormat<MessageComposerMessage> = {
  empty: emptyMessage,
  toText: (message) => message.text,
  fromText: (text) => ({ text, tokens: [] }),
  codec: createMessageCodec(
    (message) => message,
    (message) => message,
  ),
};

/**
 * `MessageComposer`'s rich mode, on ProseMirror: mentions and commands as atomic pills chosen from
 * the completion list or inserted by a menu item, record references as atomic record chips, Markdown as typed with code blocks after three
 * backticks and Ctrl+B or Ctrl+I wrapping the selection, plain-text paste, and the plain composer's
 * frame, sending, attaching, editing, recall and draft. It sends Markdown text with the pills'
 * token ranges.
 */
export function RichMessageComposer(props: RichMessageComposerProps) {
  const { isPending = false, isDisabled = false } = props;
  const state = useComposerState({
    ...props,
    isBlocked: isDisabled || (isPending && !props.allowsPendingSubmit),
    onSubmitNow: isPending && !isDisabled ? props.onSubmitNow : undefined,
    format: richFormat,
  });
  const keys = useComposerKeys(props.shortcuts, { isPending, isEditing: state.isEditing });
  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RichEditorHandle | null>(null);
  // A disabled composer takes nothing from its tools, such as an emoji chosen as it locked.
  const insertText = useCallback(
    (text: string) => {
      if (!isDisabled) handleRef.current?.insertText(text);
    },
    [isDisabled],
  );
  const insertPill = useCallback(
    (pill: PillAttributes) => {
      if (!isDisabled) handleRef.current?.insertPill(pill);
    },
    [isDisabled],
  );
  const focusInput = useCallback(() => handleRef.current?.focus(), []);
  useComposerHandle({ handleRef: props.handleRef, editorRef: handleRef, state, isDisabled });
  return (
    <ComposerFrame
      props={props}
      rootRef={rootRef}
      model={{ ...state, keys, insertText, insertPill, focusInput }}
    >
      <RichComposerEditor
        props={props}
        state={state}
        keys={keys}
        rootRef={rootRef}
        handleRef={handleRef}
      />
    </ComposerFrame>
  );
}
