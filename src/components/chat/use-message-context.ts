import { useMemo } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import type { ChatFeedback } from '../chat-message-actions/chat-message-actions.js';
import type { ChatCommandHandlers } from './chat-commands.js';
import type { ChatComposerOptions } from './chat-composer.js';
import type { ChatParticipantIndex } from './chat-model.js';
import type { ChatMessageContext, ChatPartOptions } from './chat-message-view.js';
import type { ChatState } from './use-chat-state.js';

/** The chat props every message reads. */
export interface ChatMessageOptions
  extends ChatPartOptions, Pick<ChatComposerOptions, 'conversationId' | 'onEdit' | 'onReply'> {
  currentUserId: string;
  getNow?: (() => Date) | undefined;
  onRetry?: ((messageId: string) => void) | undefined;
  onCopy?: ((messageId: string) => void) | undefined;
  onFeedback?: ((messageId: string, feedback: ChatFeedback) => void) | undefined;
  feedbackReasons?: readonly string[] | undefined;
  onReact?: ((messageId: string, emoji: string, isReacted: boolean) => void) | undefined;
  onDelete?: ((messageId: string) => void) | undefined;
}

/** The command handlers: each present while its callback is, calling the latest callback. */
function useCommandHandlers(options: ChatMessageOptions, state: ChatState): ChatCommandHandlers {
  const latest = useLatest(options);
  const { startEdit, startReply } = state;
  const has = [
    options.onCopy,
    options.onFeedback,
    options.onReply,
    options.onReact,
    options.onEdit,
    options.onDelete,
  ].map((callback) => callback !== undefined);
  const [copy, feedback, reply, react, edit, remove] = has;
  return useMemo(
    () => ({
      copy: copy ? (id: string) => latest.current.onCopy?.(id) : undefined,
      feedback: feedback
        ? (id: string, rating: ChatFeedback) => latest.current.onFeedback?.(id, rating)
        : undefined,
      reply: reply ? startReply : undefined,
      react: react
        ? (id: string, emoji: string, isReacted: boolean) =>
            latest.current.onReact?.(id, emoji, isReacted)
        : undefined,
      edit: edit ? (id: string) => startEdit({ kind: 'message', id }) : undefined,
      delete: remove ? (id: string) => latest.current.onDelete?.(id) : undefined,
    }),
    [copy, feedback, reply, react, edit, remove, latest, startEdit, startReply],
  );
}

/**
 * What every message shares, kept while the chat's options stay the same, so a streamed token
 * re-renders the streaming message only.
 */
export function useMessageContext(
  options: ChatMessageOptions,
  state: ChatState,
  {
    participants,
    isAssistantChat,
  }: { participants: ChatParticipantIndex; isAssistantChat: boolean },
): ChatMessageContext {
  const handlers = useCommandHandlers(options, state);
  const latest = useLatest(options);
  const hasRetry = options.onRetry !== undefined;
  const onRetry = useMemo(
    () => (hasRetry ? (id: string) => latest.current.onRetry?.(id) : undefined),
    [hasRetry, latest],
  );
  const { textFormat, toolRenderers, renderPart, onApplyCode } = options;
  const { onApprove, onDeny, onAlwaysAllow, onAnswerQuestion, onDismissQuestion } = options;
  const parts = useMemo(
    () => ({
      ...{ textFormat, toolRenderers, renderPart, onApplyCode },
      ...{ onApprove, onDeny, onAlwaysAllow, onAnswerQuestion, onDismissQuestion },
    }),
    [
      textFormat,
      toolRenderers,
      renderPart,
      onApplyCode,
      onApprove,
      onDeny,
      onAlwaysAllow,
      onAnswerQuestion,
      onDismissQuestion,
    ],
  );
  const { conversationId, currentUserId, getNow, feedbackReasons } = options;
  const { jumpTo, setExpandedParts } = state;
  return useMemo(
    () => ({
      ...{ handlers, currentUserId, isAssistantChat, participants, feedbackReasons },
      ...{ conversationId, parts, getNow, onRetry },
      onQuotePress: jumpTo,
      onExpandedPartsChange: setExpandedParts,
    }),
    [
      handlers,
      currentUserId,
      isAssistantChat,
      participants,
      feedbackReasons,
      conversationId,
      parts,
      getNow,
      onRetry,
      jumpTo,
      setExpandedParts,
    ],
  );
}
