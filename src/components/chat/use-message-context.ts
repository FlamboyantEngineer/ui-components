'use client';

import { isValidElement, type ReactNode, useMemo } from 'react';
import { useEqualValue } from '../../utils/use-equal-value.js';
import { useLatest } from '../../utils/use-latest.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';
import type {
  ChatFeedback,
  ChatMessageMenuIcons,
} from '../chat-message-actions/chat-message-actions.js';
import type { ChatPartsProps } from '../chat-parts/chat-parts.js';
import type { ChatCommandHandlers } from './chat-commands.js';
import type { ChatComposerOptions } from './chat-composer.js';
import type { ChatMessageContext, ChatPartOptions } from './chat-message-view.js';
import type { ChatParticipantIndex, ChatThinkingUntil } from './chat-model.js';
import type { ChatState } from './use-chat-state.js';

/** The chat props every message reads. */
export interface ChatMessageOptions
  extends
    ChatPartOptions,
    Pick<ChatPartsProps, 'toolRenderers' | 'renderPart' | 'getReference'>,
    Pick<ChatComposerOptions, 'conversationId' | 'onEdit' | 'onReply'> {
  currentUserId: string;
  getNow?: (() => Date) | undefined;
  onRetry?: ((messageId: string) => void) | undefined;
  onCopy?: ((messageId: string) => void) | undefined;
  onFeedback?: ((messageId: string, feedback: ChatFeedback) => void) | undefined;
  feedbackReasons?: readonly string[] | undefined;
  /**
   * Icons for each message menu's commands, by command, as `ChatMessageActionsMenu`'s `menuIcons`.
   * Compared by what it holds, so a map written inline keeps the messages.
   */
  messageMenuIcons?: ChatMessageMenuIcons | undefined;
  onReact?: ((messageId: string, emoji: string, isReacted: boolean) => void) | undefined;
  onDelete?: ((messageId: string) => void) | undefined;
  /** What a reply that streams says while the assistant thinks, unless it says what it is doing. Defaults to "Thinking…". */
  thinkingText?: string | undefined;
  /** Omitted uses the busy indicator; `null` gives text only; a supplied node replaces it. */
  thinkingIcon?: ReactNode;
  /** Until what a reply's thinking line shows: its first `content`, its `text` or its `end`. Defaults to `text`. */
  thinkingUntil?: ChatThinkingUntil | undefined;
}

const noReasons: readonly string[] = [];
const noIcons: ChatMessageMenuIcons = {};
const noGlyphs: NonNullable<ChatPartOptions['toolGlyphs']> = {};

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

/** Whether two nodes draw the same: the same value, or elements of one type and key whose props do. */
function isSameNode(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((node, at) => isSameNode(node, right[at]));
  }
  if (!isValidElement<Record<string, unknown>>(left)) return false;
  if (!isValidElement<Record<string, unknown>>(right)) return false;
  if (left.type !== right.type || left.key !== right.key) return false;
  const keys = Object.keys(left.props);
  if (keys.length !== Object.keys(right.props).length) return false;
  return keys.every(
    (key) => Object.hasOwn(right.props, key) && isSameNode(left.props[key], right.props[key]),
  );
}

/** `node`, or the one an earlier render passed while it draws the same, such as `<Spinner />`. */
function useSameNode(node: ReactNode): ReactNode {
  return useEqualValue(node, isSameNode);
}

/**
 * The part options, each callback present while the chat's is and calling the one of the latest
 * render, so callbacks written inline keep every message that did not change from rendering again.
 */
function usePartOptions(options: ChatMessageOptions): ChatPartOptions {
  const current = useLatest(options);
  const has = [
    options.onApprove,
    options.onDeny,
    options.onAlwaysAllow,
    options.onAnswerQuestion,
    options.onDismissQuestion,
    options.onApplyCode,
  ].map((callback) => callback !== undefined);
  const [approve, deny, alwaysAllow, answer, dismiss, applyCode] = has;
  const callbacks = useMemo(
    (): ChatPartOptions => ({
      onApprove: approve ? (id) => current.current.onApprove?.(id) : undefined,
      onDeny: deny ? (id, reason) => current.current.onDeny?.(id, reason) : undefined,
      onAlwaysAllow: alwaysAllow ? (id) => current.current.onAlwaysAllow?.(id) : undefined,
      onAnswerQuestion: answer
        ? (id, answers) => current.current.onAnswerQuestion?.(id, answers)
        : undefined,
      onDismissQuestion: dismiss ? (id) => current.current.onDismissQuestion?.(id) : undefined,
      onApplyCode: applyCode
        ? (code, part) => current.current.onApplyCode?.(code, part)
        : undefined,
    }),
    [approve, deny, alwaysAllow, answer, dismiss, applyCode, current],
  );
  const { textFormat, expandsActivity, questionAnsweredMark } = options;
  // Compared by what it holds, so a map written inline keeps the messages.
  const glyphs = useShallowStable(options.toolGlyphs ?? noGlyphs);
  const toolGlyphs = options.toolGlyphs && glyphs;
  return useShallowStable({
    ...callbacks,
    ...{ textFormat, expandsActivity, questionAnsweredMark, toolGlyphs },
  });
}

/**
 * What every message shares. It keeps its identity while the chat's options say the same, whatever
 * the identity of its callbacks and however its `thinkingIcon` element is created, so a streamed
 * token re-renders the streaming message only.
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
  const parts = usePartOptions(options);
  const thinkingIcon = useSameNode(options.thinkingIcon);
  const reasons = useShallowStable(options.feedbackReasons ?? noReasons);
  const feedbackReasons = options.feedbackReasons && reasons;
  const icons = useShallowStable(options.messageMenuIcons ?? noIcons);
  const messageMenuIcons = options.messageMenuIcons && icons;
  const { conversationId, currentUserId } = options;
  const { thinkingText, thinkingUntil = 'text' } = options;
  return useShallowStable({
    ...{ handlers, currentUserId, isAssistantChat, participants, feedbackReasons },
    ...{ conversationId, parts, onRetry, messageMenuIcons },
    ...{ thinkingText, thinkingIcon, thinkingUntil },
    onQuotePress: state.jumpTo,
    onExpandedPartsChange: state.setExpandedParts,
  });
}
