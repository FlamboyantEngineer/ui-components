// A host for the Chat lab's conversations between people: it owns the messages, walks a sent
// message through its delivery, shows the other person typing and has them answer, and loads
// older history.

import { useEffect, useRef, useState } from 'react';
import type { ChatAttachmentData } from '../../src/components/chat-attachment/chat-attachment.js';
import type {
  ChatMessageData,
  ChatPart,
  ChatTextToken,
} from '../../src/components/chat-parts/index.js';
import type { ReactionEntry } from '../../src/components/reaction-bar/index.js';
import { nextLabId, nowIso, reader, sentMessage } from './chat-samples.js';

/** Replaces the conversation from the one it holds, as React state or a chat controller does. */
export type LabSetMessages = (
  update: (messages: readonly ChatMessageData[]) => readonly ChatMessageData[],
) => void;

/** Who answers each message the reader sends, and what they say in turn. */
export interface LabReplier {
  id: string;
  replies: readonly string[];
}

interface PeopleHostOptions {
  initialMessages: readonly ChatMessageData[];
  replier?: LabReplier | undefined;
}

/** A message the reader sends to people: its text and tokens, what it replies to, its files. */
interface PeopleMessage {
  text: string;
  tokens?: readonly ChatTextToken[] | undefined;
  replyTo?: string | undefined;
  attachments?: readonly ChatAttachmentData[] | undefined;
}

/** The reactions with the reader's reaction to `emoji` added or taken back. */
function toggleReaction(
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

/** The reader's message, sending: its files, then its text with the mentions and commands. */
function toSentMessage(outgoing: PeopleMessage): ChatMessageData {
  const { text, tokens = [], replyTo, attachments = [] } = outgoing;
  const message = sentMessage(text, tokens, { delivery: 'sending', replyTo });
  if (attachments.length === 0) return message;
  const files: ChatPart = { type: 'files', attachments: [...attachments] };
  return { ...message, parts: text ? [files, ...message.parts] : [files] };
}

/**
 * Every callback a chat between people needs, over messages the caller keeps: sending walks a
 * message through its delivery while the replier types and answers.
 */
export function usePeopleCallbacks({
  setMessages,
  replier,
}: {
  setMessages: LabSetMessages;
  replier?: LabReplier | undefined;
}) {
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
  const send = (outgoing: PeopleMessage) => {
    const message = toSentMessage(outgoing);
    setMessages((list) => [...list, message]);
    deliver(message.id);
  };
  return {
    typingIds,
    send,
    onSend: (text: string, tokens?: readonly ChatTextToken[]) => send({ text, tokens }),
    onReply: (id: string, text: string, tokens: readonly ChatTextToken[]) =>
      send({ text, tokens, replyTo: id }),
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

/** The conversation and every callback a chat between people needs. */
export function usePeopleHost({ initialMessages, replier }: PeopleHostOptions) {
  const [messages, setMessages] = useState<readonly ChatMessageData[]>(initialMessages);
  return { messages, setMessages, ...usePeopleCallbacks({ setMessages, replier }) };
}

/** Older pages of history, newest page first, each loading into the conversation after a moment. */
export function useOlderHistory(
  pages: readonly (readonly ChatMessageData[])[],
  setMessages: LabSetMessages,
) {
  const [loaded, setLoaded] = useState(0);
  const [isLoadingOlder, setLoadingOlder] = useState(false);
  const later = useTimers();
  return {
    hasOlder: loaded < pages.length,
    isLoadingOlder,
    onLoadOlder: () => {
      setLoadingOlder(true);
      later(700, () => {
        setMessages((list) => [...(pages[loaded] ?? []), ...list]);
        setLoaded((count) => count + 1);
        setLoadingOlder(false);
      });
    },
  };
}
