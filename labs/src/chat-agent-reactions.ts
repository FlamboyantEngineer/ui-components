// The Chat lab agent's reactions: it marks the reader's message while it works on it, then reacts
// to it once the reply is done.

import { useEffect } from 'react';
import type {
  ChatController,
  ChatMessageData,
  ChatSendFunction,
} from '../../src/components/chat/index.js';
import { plannerId, readerId } from './chat-samples.js';

/** The agent's mark on the reader's message while it works on it. */
export const workingEmoji = '👀';

/** How the agent reacts to the reader's last message once it has answered it. */
function toAnsweredEmoji(messages: readonly ChatMessageData[]): string {
  const last = messages.findLast((message) => message.authorId === readerId);
  const text = last?.parts.map((part) => (part.type === 'text' ? part.text : '')).join(' ') ?? '';
  return /\bthank/i.test(text) ? '❤️' : '👍';
}

/**
 * Streams `send`'s reply with the agent's reactions to the reader's message, through stream
 * events: the working mark first, then, as the reply finishes, the mark taken back and a reaction.
 */
export function withReactions(send: ChatSendFunction): ChatSendFunction {
  return async function* (messages, context) {
    yield { type: 'reaction', emoji: workingEmoji };
    let isFinished = false;
    for await (const event of send(messages, context)) {
      if (event.type === 'finish') {
        isFinished = true;
        yield { type: 'reaction', emoji: workingEmoji, isReacted: false };
        yield { type: 'reaction', emoji: toAnsweredEmoji(messages) };
      }
      yield event;
    }
    if (!isFinished) {
      yield { type: 'reaction', emoji: workingEmoji, isReacted: false };
      yield { type: 'reaction', emoji: toAnsweredEmoji(messages) };
    }
  };
}

/** Whether the agent's working mark is on the message. */
function hasWorkingMark(message: ChatMessageData): boolean {
  return Boolean(
    message.reactions?.some(
      (reaction) => reaction.emoji === workingEmoji && reaction.participantIds?.includes(plannerId),
    ),
  );
}

/**
 * Takes the working mark back through the controller once no reply runs, as when the reader
 * stopped the reply or it failed before the stream could take the mark back itself.
 */
export function useWorkingMarkCleanup({ messages, isPending, setReaction }: ChatController) {
  const marked = isPending
    ? ''
    : messages
        .filter(hasWorkingMark)
        .map((message) => message.id)
        .join(' ');
  useEffect(() => {
    for (const messageId of marked.split(' ').filter(Boolean)) {
      setReaction({ messageId, emoji: workingEmoji, isReacted: false });
    }
  }, [marked, setReaction]);
}
