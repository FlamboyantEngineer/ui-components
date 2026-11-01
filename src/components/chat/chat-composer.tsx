'use client';

import { CloseGlyph } from '../../core/glyphs.js';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { ChatAttachmentList, type ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';
import type { ChatMessageData, ChatTextToken } from '../chat-parts/chat-parts.js';
import { ChatQuote, type ChatQuoteData } from '../chat-transcript/chat-transcript.js';
import { Button } from '../button/button.js';
import {
  MessageComposerAttachButton,
  MessageComposerEmojiButton,
} from '../message-composer/message-composer.js';
import {
  RichMessageComposer,
  type MessageComposerHandle,
  type RichMessageComposerProps,
} from '../message-composer/rich/rich-message-composer.js';
import { useChatComposerHandle, type ChatDraftOptions } from './chat-composer-handle.js';
import { chatHooks as hooks } from './chat-hooks.js';
import {
  findLastOwnText,
  readMessageText,
  toComposerTokens,
  toExcerpt,
  toMessageText,
  type ChatMessageText,
  type ChatParticipantIndex,
} from './chat-model.js';
import { ChatQueue } from './chat-queue.js';
import { sendMessageNow, submitMessage } from './chat-submit.js';
import type { ChatState } from './use-chat-state.js';

/**
 * Sends a text with its mentions and commands about a message: an edit or a reply. A returned
 * promise holds the composer's message until it settles, as `onSend` does.
 */
export type ChatMessageTextHandler = (
  messageId: string,
  text: string,
  tokens: readonly ChatTextToken[],
) => void | Promise<unknown>;

/** The chat props the composer reads. */
export interface ChatComposerOptions
  extends
    ChatDraftOptions,
    Pick<
      RichMessageComposerProps,
      | 'isPending'
      | 'onStop'
      | 'isDisabled'
      | 'placeholder'
      | 'commands'
      | 'history'
      | 'onAttach'
      | 'shortcuts'
      | 'minRows'
      | 'maxRows'
      | 'getReference'
    > {
  /**
   * Sends the reader's message with its mentions and commands. Without it there is no composer. A
   * returned promise holds the message, its tokens and the quote until it settles: they clear once
   * it resolves, and stay for another try when it rejects.
   */
  onSend?:
    | ((text: string, tokens?: readonly ChatTextToken[]) => void | Promise<unknown>)
    | undefined;
  /**
   * Sends the reader's message at once while a reply runs (the composer's `sendNow` chord, Ctrl+Enter
   * by default), for a host that stops the reply and sends the message ahead of its queue. It
   * settles as `onSend` does. Without it, that chord queues the message.
   */
  onSendNow?:
    | ((text: string, tokens?: readonly ChatTextToken[]) => void | Promise<unknown>)
    | undefined;
  /** Called when `onSend`, `onSendNow`, `onReply` or `onEdit` throws or its promise rejects; the composer keeps the message. Without it the error is rethrown. */
  onSendError?: ((error: unknown) => void) | undefined;
  /** Sends a blank message too, as when context the host adds carries the request; a complete attachment allows it as well. */
  allowsEmptySubmit?: boolean | undefined;
  /**
   * Controls at the start of the row below the composer's input, such as its "+" menu button.
   * Defaults to the attach button (with `onAttach`) and, between people, the emoji button.
   */
  composerStartControls?: ReactNode;
  /** Controls at the end of the row below the composer's input, such as a model picker, before Send unless they hold it. */
  composerEndControls?: ReactNode;
  /** Names the conversation, so the composer keeps its draft in the provider's storage. */
  conversationId?: string | undefined;
  /** Messages waiting for the running reply to end, shown above the composer. */
  queue?: readonly ChatQueuedMessage[] | undefined;
  /** Replaces the queue when the reader edits or removes a queued message; lets them send while a reply runs. */
  onQueueChange?: ((queue: readonly ChatQueuedMessage[]) => void) | undefined;
  /** The files attached to the next message. */
  attachments?: readonly ChatAttachmentData[] | undefined;
  /** Removes a file from the next message. */
  onRemoveAttachment?: ((id: string) => void) | undefined;
  /** Uploads a failed file of the next message again. */
  onRetryAttachment?: ((id: string) => void) | undefined;
  /** Saves the reader's edit of their message; offers Edit on their messages in chats between people. */
  onEdit?: ChatMessageTextHandler | undefined;
  /** Sends a reply quoting a message; offers Reply on every message between people, and on finished messages with text in an assistant chat. */
  onReply?: ChatMessageTextHandler | undefined;
}

export interface ChatComposerProps {
  options: ChatComposerOptions;
  state: ChatState;
  messages: readonly ChatMessageData[];
  participants: ChatParticipantIndex;
  currentUserId: string;
  isAssistantChat: boolean;
}

/** A message as the composer reads and sends it: Markdown text and its tokens. */
type ComposerMessage = NonNullable<RichMessageComposerProps['editValue']>;

interface BannerContent {
  label: string;
  quote?: Omit<ChatQuoteData, 'messageId'> | undefined;
  onCancel?: (() => void) | undefined;
}

const noQueue: readonly ChatQueuedMessage[] = [];

/** The text the composer edits: the reader's message or a queued one, kept while its session and target are. */
function useEditValue({ state, messages, options }: ChatComposerProps) {
  const { editing } = state;
  let source: ChatMessageText | undefined;
  if (editing?.kind === 'message') {
    const message = messages.find((entry) => entry.id === editing.id);
    source = message && toMessageText(message);
  } else if (editing) {
    const entry = options.queue?.find((item) => item.id === editing.id);
    source = entry && { text: entry.text, tokens: toComposerTokens(entry.tokens ?? []) };
  }
  // A new value restarts the edit, so it changes with the edit's session and target (its
  // conversation, kind and id) only: another message with the same words restarts, while a reaction,
  // or the host applying a save the reader goes on editing after, does not.
  const target =
    source && editing
      ? JSON.stringify([options.conversationId, state.session, editing.kind, editing.id])
      : null;
  const [held, setHeld] = useState<{ target: string; value: ComposerMessage } | null>(null);
  if (target === null || !source) {
    if (held !== null) setHeld(null);
    return undefined;
  }
  if (held?.target === target) return held.value;
  const next = { target, value: { text: source.text, tokens: [...source.tokens] } };
  setHeld(next);
  return next.value;
}

/**
 * The edit and the reply, each kept only while what it targets is still there. Once the queued
 * message or message an edit edits is gone (sent from the queue, removed or deleted), or the message
 * a reply quotes is removed or deleted, it ends: the composer keeps its text and sends as usual, and
 * the target coming back does not bring it back.
 */
function useLiveTargets(props: ChatComposerProps) {
  const editValue = useEditValue(props);
  const { state, messages } = props;
  const isEditGone = state.editing !== null && editValue === undefined;
  const isReplyGone =
    state.replyingId !== null &&
    !messages.some((message) => message.id === state.replyingId && !message.isDeleted);
  const { cancelEdit, cancelReply } = state;
  useEffect(() => {
    if (isEditGone) cancelEdit();
  }, [isEditGone, cancelEdit]);
  useEffect(() => {
    if (isReplyGone) cancelReply();
  }, [isReplyGone, cancelReply]);
  if (!isEditGone && !isReplyGone) return { editValue, props };
  const live = {
    ...state,
    editing: isEditGone ? null : state.editing,
    replyingId: isReplyGone ? null : state.replyingId,
  };
  return { editValue, props: { ...props, state: live } };
}

/** The banner above the input: the message being replied to, or what is being edited. */
function useBanner(props: ChatComposerProps): BannerContent | undefined {
  const strings = useUiStrings();
  const { state, messages, participants } = props;
  if (state.editing) {
    const isQueued = state.editing.kind === 'queued';
    return { label: isQueued ? strings.chatEditingQueued : strings.chatEditingMessage };
  }
  const replied = messages.find((message) => message.id === state.replyingId);
  if (!replied) return undefined;
  const author = participants.get(replied.authorId ?? '');
  return {
    label: strings.chatReplyingTo,
    quote: { authorName: author?.name ?? '', excerpt: toExcerpt(readMessageText(replied)) },
    onCancel: state.cancelReply,
  };
}

function ComposerBanner({ id, banner }: { id: string; banner: BannerContent }) {
  const strings = useUiStrings();
  return (
    <>
      <div id={id} {...hooks.slot('banner')}>
        <span {...hooks.slot('banner-label')}>{banner.label}</span>
        {banner.quote ? <ChatQuote {...banner.quote} /> : null}
      </div>
      {banner.onCancel ? (
        <Button
          icon={CloseGlyph}
          label={strings.chatCancelReply}
          size="sm"
          className={hooks.slotClass('banner-cancel')}
          onPress={banner.onCancel}
        />
      ) : null}
    </>
  );
}

/** The people `@` mentions: every participant but the reader. */
function useMentions({ participants, currentUserId }: ChatComposerProps) {
  return useMemo(
    () =>
      [...participants.values()]
        .filter((participant) => participant.id !== currentUserId)
        .map(({ id, name, src, initials, colorKey }) => ({
          id,
          label: name,
          src,
          initials,
          colorKey,
        })),
    [participants, currentUserId],
  );
}

/**
 * Up in an empty composer edits the newest queued message while there is one, else the reader's
 * last message, between people with `onEdit`.
 */
function toEditLast({
  options,
  state,
  messages,
  currentUserId,
  isAssistantChat,
}: ChatComposerProps) {
  const queued = options.onQueueChange ? options.queue?.at(-1) : undefined;
  if (queued) return () => state.startEdit({ kind: 'queued', id: queued.id });
  if (isAssistantChat || !options.onEdit) return undefined;
  const last = findLastOwnText(messages, currentUserId);
  return last ? () => state.startEdit({ kind: 'message', id: last.id }) : undefined;
}

/**
 * The files of the next message, removable, with Retry for failed uploads; a disabled composer
 * shows them without Remove and Retry.
 */
function renderAttachments({ options, state }: ChatComposerProps) {
  if (!options.attachments?.length) return undefined;
  const isEditable = !options.isDisabled;
  return (
    <ChatAttachmentList
      attachments={options.attachments}
      onRemove={isEditable ? options.onRemoveAttachment : undefined}
      onRetry={isEditable ? options.onRetryAttachment : undefined}
      finalFocus={state.composerRef}
    />
  );
}

/** The host's start controls, else the attach button and, between people, the emoji button. */
function renderStartControls({ options, isAssistantChat }: ChatComposerProps) {
  if (options.composerStartControls !== undefined) return options.composerStartControls;
  return (
    <>
      <MessageComposerAttachButton />
      {isAssistantChat ? null : <MessageComposerEmojiButton />}
    </>
  );
}

/** Blank messages send when the host allows them or a complete attachment carries the message. */
function allowsEmptySubmit({ options }: ChatComposerProps) {
  const hasFile = options.attachments?.some((entry) => entry.status === 'complete');
  return Boolean(options.allowsEmptySubmit || hasFile);
}

/**
 * The queue of follow-ups, then the rich composer: mentions of the other participants, the host's
 * commands, a per-conversation draft, Up to edit the newest queued message, the reader's last
 * message (between people) or to recall earlier prompts (with an assistant), sending now while a
 * reply runs, the reply and edit banners, attachments, the host's
 * controls below the input, and Stop.
 */
export function ChatComposer(given: ChatComposerProps) {
  const { editValue, props } = useLiveTargets(given);
  const { options, state, isAssistantChat } = props;
  const { setComposer, cancelEdit } = state;
  const bannerId = useId();
  const banner = useBanner(props);
  const mentions = useMentions(props);
  const composerRef = useRef<MessageComposerHandle>(null);
  const reportDraft = useChatComposerHandle({
    handleRef: options.composerHandleRef,
    composerRef,
    conversationId: options.conversationId,
    onDraftChange: options.onDraftChange,
    focusComposer: state.focusComposer,
  });
  if (!options.onSend) return null;
  const onKeyDown = (event: KeyboardEvent) => {
    // A composing Escape cancels the input method's candidate, not the reply.
    if (isComposingKey(event.nativeEvent)) return;
    if (event.key !== 'Escape' || state.replyingId === null) return;
    // Handled, so an overlay around the chat stays open for the next Escape.
    event.preventDefault();
    state.cancelReply();
  };
  return (
    <>
      <ChatQueue
        queue={options.queue ?? noQueue}
        onQueueChange={options.onQueueChange}
        onEdit={(id) => state.startEdit({ kind: 'queued', id })}
        editingId={state.editing?.kind === 'queued' ? state.editing.id : undefined}
        composerRef={state.composerRef}
      />
      <RichMessageComposer
        ref={setComposer}
        handleRef={composerRef}
        onChange={reportDraft}
        className={hooks.slotClass('composer')}
        placeholder={options.placeholder}
        isDisabled={options.isDisabled}
        isPending={options.isPending}
        onStop={options.onStop}
        allowsPendingSubmit={options.onQueueChange !== undefined}
        mentions={mentions}
        commands={options.commands}
        getReference={options.getReference}
        history={isAssistantChat ? options.history : undefined}
        onEditLast={toEditLast(props)}
        persistKey={options.conversationId ? `chat-draft:${options.conversationId}` : undefined}
        editValue={editValue}
        onCancel={cancelEdit}
        banner={banner ? <ComposerBanner id={bannerId} banner={banner} /> : undefined}
        aria-describedby={banner ? bannerId : undefined}
        onAttach={options.onAttach}
        attachments={renderAttachments(props)}
        allowsEmptySubmit={allowsEmptySubmit(props)}
        shortcuts={options.shortcuts}
        minRows={options.minRows}
        maxRows={options.maxRows}
        startControls={renderStartControls(props)}
        endControls={options.composerEndControls}
        onKeyDown={onKeyDown}
        onSubmit={(message) => submitMessage(props, message, () => composerRef.current?.getValue())}
        onSubmitNow={options.onSendNow && ((message) => sendMessageNow(props, message))}
        onSubmitError={options.onSendError}
      />
    </>
  );
}
