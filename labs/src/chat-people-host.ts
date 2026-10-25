// A host for the Chat lab's conversations between people: it owns the messages, walks a sent
// message through its delivery, shows the other person typing and has them answer.

import { useEffect, useRef, useState } from 'react';
import type { ChatMessageData, ChatTextToken } from '../../src/components/chat-parts/index.js';
import type { ReactionEntry } from '../../src/components/reaction-bar/index.js';
import { nextLabId, nowIso, reader, sentMessage } from './chat-samples.js';

export interface PeopleHostOptions {
  initialMessages: readonly ChatMessageData[];
  /** Who answers each message the reader sends, and what they say in turn. */
  replier?: { id: string; replies: readonly string[] } | undefined;
}

/** The reactions with the reader's reaction to `emoji` added or taken back. */
export function toggleReaction(
  reactions: readonly ReactionEntry[] = [],
  emoji: string,
  isReacted: boolean,
): ReactionEntry[] {
  const found = reactions.find((entry) => entry.emoji === emoji);
  const others = (found?.people ?? []).filter((name) => name !== reader.name);
  const people = isReacted ? [...others, reader.name] : others;
  const next = { emoji, isReacted, people };
  if (!found) return isReacted ? [...reactions, next] : [...reactions];
  return reactions
    .map((entry) => (entry === found ? next : entry))
    .filter((entry) => (entry.people?.length ?? 0) > 0);
}

/** Runs each callback after its delay, and forgets them all on unmount. */
function useTimers() {
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  return (delay: number, run: () => void) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      run();
    }, delay);
    timers.current.add(timer);
  };
}

/** The conversation and every callback a chat between people needs. */
export function usePeopleHost({ initialMessages, replier }: PeopleHostOptions) {
  const [messages, setMessages] = useState<readonly ChatMessageData[]>(initialMessages);
  const [typingIds, setTypingIds] = useState<string[]>([]);
  const replies = useRef(0);
  const later = useTimers();
  const update = (id: string, change: (message: ChatMessageData) => ChatMessageData) =>
    setMessages((list) => list.map((message) => (message.id === id ? change(message) : message)));
  const answer = (repliedId: string) => {
    if (!replier) return;
    const text = replier.replies[replies.current % replier.replies.length] ?? '';
    replies.current += 1;
    later(1400, () => setTypingIds([replier.id]));
    later(2800, () => {
      setTypingIds([]);
      update(repliedId, (message) => ({ ...message, delivery: 'read' }));
      const reply = { id: nextLabId('reply'), authorId: replier.id, createdAt: nowIso() };
      setMessages((list) => [...list, { ...reply, parts: [{ type: 'text', text }] }]);
    });
  };
  const deliver = (id: string) => {
    later(500, () => update(id, (message) => ({ ...message, delivery: 'sent' })));
    later(1100, () => update(id, (message) => ({ ...message, delivery: 'delivered' })));
    answer(id);
  };
  const send = (text: string, tokens: readonly ChatTextToken[] = [], replyTo?: string) => {
    const message = sentMessage(text, tokens, { delivery: 'sending', replyTo });
    setMessages((list) => [...list, message]);
    deliver(message.id);
  };
  return {
    messages,
    setMessages,
    typingIds,
    onSend: (text: string, tokens?: readonly ChatTextToken[]) => send(text, tokens),
    onReply: (id: string, text: string, tokens: readonly ChatTextToken[]) => send(text, tokens, id),
    onRetry: (id: string) => {
      update(id, (message) => ({ ...message, delivery: 'sending' }));
      deliver(id);
    },
    onEdit: (id: string, text: string, tokens: readonly ChatTextToken[]) =>
      update(id, (message) => ({
        ...message,
        isEdited: true,
        parts: message.parts.map((part) =>
          part.type === 'text' ? { ...part, text, tokens: [...tokens] } : part,
        ),
      })),
    onReact: (id: string, emoji: string, isReacted: boolean) =>
      update(id, (message) => ({
        ...message,
        reactions: toggleReaction(message.reactions, emoji, isReacted),
      })),
    onDelete: (id: string) => update(id, (message) => ({ ...message, isDeleted: true })),
  };
}
