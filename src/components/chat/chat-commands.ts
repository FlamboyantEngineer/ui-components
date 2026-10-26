// The commands each message offers, from the callbacks the chat was given.

import type {
  ChatFeedback,
  ChatMessageCommandProps,
} from '../chat-message-actions/chat-message-actions.js';
import type { ChatMessageData } from '../chat-parts/chat-parts.js';
import { isOwnText, readMessageText, type ChatParticipantIndex } from './chat-model.js';

/**
 * The message commands a chat offers, each bound to a message id and present only when the chat
 * has the callback behind it. Their identities stay the same while that presence does.
 */
export interface ChatCommandHandlers {
  copy?: ((messageId: string) => void) | undefined;
  feedback?: ((messageId: string, feedback: ChatFeedback) => void) | undefined;
  reply?: ((messageId: string) => void) | undefined;
  react?: ((messageId: string, emoji: string, isReacted: boolean) => void) | undefined;
  edit?: ((messageId: string) => void) | undefined;
  delete?: ((messageId: string) => void) | undefined;
}

/** What the commands of a message depend on besides the message. */
export interface ChatCommandContext {
  handlers: ChatCommandHandlers;
  currentUserId: string;
  isAssistantChat: boolean;
  participants: ChatParticipantIndex;
  feedbackReasons: readonly string[] | undefined;
}

/** Whether the reader already reacts to the message with `emoji`. */
function isReactedWith(message: ChatMessageData, emoji: string): boolean {
  return Boolean(message.reactions?.some((entry) => entry.emoji === emoji && entry.isReacted));
}

/** Copy, once the message has text and has finished, and the ratings of an assistant's reply. */
function toReplyCommands(
  message: ChatMessageData,
  context: ChatCommandContext,
): ChatMessageCommandProps {
  const { copy, feedback } = context.handlers;
  const id = message.id;
  if ((message.status ?? 'complete') !== 'complete') return {};
  const text = readMessageText(message);
  const isAssistant = context.participants.get(message.authorId ?? '')?.kind === 'assistant';
  const canRate = feedback !== undefined && isAssistant;
  return {
    ...(copy && text ? { copyText: text, onCopy: () => copy(id) } : {}),
    ...(canRate
      ? {
          feedback: message.feedback,
          feedbackReasons: context.feedbackReasons,
          onFeedback: (rating: ChatFeedback) => feedback(id, rating),
        }
      : {}),
  };
}

/** Reply and React on any message, Edit and Delete on the reader's own: in chats between people. */
function toPeopleCommands(
  message: ChatMessageData,
  context: ChatCommandContext,
): ChatMessageCommandProps {
  const { reply, react, edit, delete: remove } = context.handlers;
  const id = message.id;
  const isOwn = message.authorId === context.currentUserId;
  const canEdit = edit !== undefined && isOwnText(message, context.currentUserId);
  return {
    ...(reply ? { onReply: () => reply(id) } : {}),
    ...(react
      ? { onReact: (emoji: string) => react(id, emoji, !isReactedWith(message, emoji)) }
      : {}),
    ...(canEdit ? { onEdit: () => edit(id) } : {}),
    ...(remove && isOwn ? { onDelete: () => remove(id) } : {}),
  };
}

/** Reply, quoting a finished message that has text: in chats with an assistant. */
function toQuoteCommands(
  message: ChatMessageData,
  context: ChatCommandContext,
): ChatMessageCommandProps {
  const { reply } = context.handlers;
  const isFinished = (message.status ?? 'complete') === 'complete';
  if (!reply || !isFinished || !readMessageText(message)) return {};
  return { onReply: () => reply(message.id) };
}

/**
 * The commands a message offers: none for a deleted message or a notice; Copy and the ratings once
 * a reply has finished; in chats without an assistant, Reply, React, and Edit and Delete on the
 * reader's own messages; and in chats with one, Reply on finished messages that have text.
 */
export function toMessageCommands(
  message: ChatMessageData,
  context: ChatCommandContext,
): ChatMessageCommandProps {
  if (message.isDeleted || !message.authorId) return {};
  return {
    ...toReplyCommands(message, context),
    ...(context.isAssistantChat
      ? toQuoteCommands(message, context)
      : toPeopleCommands(message, context)),
  };
}
