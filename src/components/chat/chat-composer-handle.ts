'use client';
import { useEffect, useImperativeHandle, type Ref, type RefObject } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import type { ChatTextToken } from '../chat-parts/chat-parts.js';
import type {
  MessageComposerContent,
  MessageComposerHandle,
  MessageComposerRange,
  RichMessageComposerProps,
} from '../message-composer/rich/rich-message-composer.js';
import { toComposerTokens, toDisplayTokens } from './chat-model.js';

/**
 * What `insertToken` did: `inserted`, or why it changed nothing: the chat now shows an
 * `other-conversation` than the one asked for or the handle was made for, the composer is
 * `disabled`, is `editing` a message, is `submitting` a message the host has not accepted yet, or
 * is `unavailable` (a chat without `onSend` has no composer).
 */
export type ChatComposerInsertResult =
  'inserted' | 'other-conversation' | 'disabled' | 'editing' | 'submitting' | 'unavailable';

/** A conversation's draft: its text and tokens, as `onSend` would receive them. */
export interface ChatDraft {
  conversationId: string | undefined;
  text: string;
  tokens: ChatTextToken[];
}

/** Where `insertToken` may insert. */
export interface ChatComposerInsertOptions {
  /** Inserts only while the chat shows this conversation. */
  conversationId?: string | undefined;
}

/**
 * What a selection or range edit did: `applied`, or why it changed nothing: as for `insertToken`,
 * or `invalid` for a range outside the shown message's text.
 */
export type ChatComposerEditResult =
  | 'applied'
  | 'other-conversation'
  | 'disabled'
  | 'editing'
  | 'submitting'
  | 'unavailable'
  | 'invalid';

/** What replaces a range of the composer's text: plain text, or text with its own tokens. */
export type ChatComposerContent = string | { text: string; tokens: readonly ChatTextToken[] };

/** What a host's own controls call on a chat's composer, through `composerHandleRef`. */
export interface ChatComposerHandle {
  /**
   * Adds a token to the conversation's draft as a pill at the caret, or where the caret was when
   * the composer lost focus, else at the end, keeping the rest of the draft and the reply's quote;
   * then focuses the composer. A handle serves the conversation it was made for.
   */
  insertToken: (
    token: Omit<ChatTextToken, 'start' | 'end'>,
    options?: ChatComposerInsertOptions,
  ) => ChatComposerInsertResult;
  /** The shown conversation's draft as it is now. */
  getDraft: () => ChatDraft;
  /**
   * The composer's selection in its shown message's text (`MessageComposerHandle`), or `null` for
   * another conversation or without a composer.
   */
  getSelection: (options?: ChatComposerInsertOptions) => MessageComposerRange | null;
  /** Selects a range of the composer's shown message without taking focus. */
  setSelection: (
    range: MessageComposerRange,
    options?: ChatComposerInsertOptions,
  ) => ChatComposerEditResult;
  /** Replaces a range of the draft's text with text or a fragment, as one undo step. */
  replaceRange: (
    range: MessageComposerRange,
    content: ChatComposerContent,
    options?: ChatComposerInsertOptions,
  ) => ChatComposerEditResult;
  /** Replaces the composer's selection, or where it was when it lost focus. */
  replaceSelection: (
    content: ChatComposerContent,
    options?: ChatComposerInsertOptions,
  ) => ChatComposerEditResult;
}

/** The chat props for the host's own controls outside the chat. */
export interface ChatDraftOptions {
  /** Receives `insertToken` and `getDraft`, for the host's own controls outside the chat. */
  composerHandleRef?: Ref<ChatComposerHandle> | undefined;
  /** Called with the conversation's draft when it loads and after each edit, as when a pill is added or removed. */
  onDraftChange?: ((draft: ChatDraft) => void) | undefined;
  /** The composer's text box id, apart from the chat's own `id`. */
  composerInputId?: string | undefined;
  /** The composer's `onPaste`: sees text pasted into the composer first (`RichMessageComposer`). */
  onComposerPaste?: RichMessageComposerProps['onPaste'];
  /** The composer's `onSelectionChange`: the selection in the shown message's text. */
  onComposerSelectionChange?: RichMessageComposerProps['onSelectionChange'];
  /** Host vocabularies for the composer, each opened by its own character (`RichMessageComposer`). */
  triggers?: RichMessageComposerProps['triggers'];
}

/** The composer props that `ChatDraftOptions` forwards. */
export function toComposerDraftProps(options: ChatDraftOptions) {
  return {
    inputId: options.composerInputId,
    onPaste: options.onComposerPaste,
    onSelectionChange: options.onComposerSelectionChange,
    triggers: options.triggers,
  };
}

interface ChatComposerHandleOptions {
  handleRef: Ref<ChatComposerHandle> | undefined;
  composerRef: RefObject<MessageComposerHandle | null>;
  conversationId: string | undefined;
  onDraftChange: ((draft: ChatDraft) => void) | undefined;
  focusComposer: () => void;
}

function toChatDraft(draft: { text: string; tokens: readonly ChatTextToken[] }) {
  return { text: draft.text, tokens: toDisplayTokens(draft.tokens) };
}

/** The composer's draft as the chat reports it, for the conversation it shows. */
function readChatDraft(
  composer: MessageComposerHandle | null,
  conversationId: string | undefined,
): ChatDraft {
  return { conversationId, ...toChatDraft(composer?.getDraft() ?? { text: '', tokens: [] }) };
}

/** Content as the composer takes it: tokens by their bare labels. */
export function toComposerContent(content: ChatComposerContent): MessageComposerContent {
  if (typeof content === 'string') return content;
  return { text: content.text, tokens: toComposerTokens(content.tokens) };
}

/**
 * Gives `handleRef` a handle bound to the shown conversation, and reports the draft to
 * `onDraftChange` when it loads (on mount and on each change of conversation); the composer's
 * edits report through the returned function.
 */
export function useChatComposerHandle(options: ChatComposerHandleOptions) {
  const { handleRef, composerRef, conversationId } = options;
  const latest = useLatest(options);
  useImperativeHandle(handleRef, () => {
    /** The composer, while the chat shows the conversation asked for and the handle's own. */
    const reach = (insert: ChatComposerInsertOptions | undefined) => {
      const shown = latest.current.conversationId;
      const asked = insert?.conversationId ?? conversationId;
      if (shown !== conversationId || asked !== shown) return 'other-conversation' as const;
      return composerRef.current ?? ('unavailable' as const);
    };
    const edit = (
      insert: ChatComposerInsertOptions | undefined,
      run: (composer: MessageComposerHandle) => ChatComposerEditResult,
    ): ChatComposerEditResult => {
      const composer = reach(insert);
      return typeof composer === 'string' ? composer : run(composer);
    };
    return {
      insertToken: (token, insert) => {
        const shown = latest.current.conversationId;
        const asked = insert?.conversationId ?? conversationId;
        if (shown !== conversationId || asked !== shown) return 'other-conversation';
        const composer = composerRef.current;
        if (!composer) return 'unavailable';
        const [pill = token] = toComposerTokens([token]);
        const result = composer.insertToken(pill);
        if (result === 'inserted') latest.current.focusComposer();
        return result;
      },
      getDraft: () => readChatDraft(composerRef.current, latest.current.conversationId),
      getSelection: (insert) => {
        const composer = reach(insert);
        return typeof composer === 'string' ? null : composer.getSelection();
      },
      setSelection: (range, insert) => edit(insert, (composer) => composer.setSelection(range)),
      replaceRange: (range, content, insert) =>
        edit(insert, (composer) => composer.replaceRange(range, toComposerContent(content))),
      replaceSelection: (content, insert) =>
        edit(insert, (composer) => composer.replaceSelection(toComposerContent(content))),
    };
  }, [conversationId, composerRef, latest]);
  useEffect(() => {
    const composer = composerRef.current;
    if (composer) latest.current.onDraftChange?.(readChatDraft(composer, conversationId));
  }, [composerRef, conversationId, latest]);
  return (draft: { text: string; tokens: readonly ChatTextToken[] }) =>
    latest.current.onDraftChange?.({ conversationId, ...toChatDraft(draft) });
}
