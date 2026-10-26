import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChatMessage,
  type ChatMessageOrigin,
  type ChatMessageStatus,
} from '../../src/components/chat-transcript/index.js';
import { samplePicture } from './people-samples.js';

/** One message of the behaviour cases. */
interface SampleMessage {
  id: string;
  origin: ChatMessageOrigin;
  text: string;
  status: ChatMessageStatus;
}

export const reader = { name: 'Maria Santos', colorKey: 'maria' };
export const planner = { name: 'Trip Planner', src: samplePicture, colorKey: 'planner' };

const sentences = [
  'Which ferry gets us to the island before noon?',
  'The 9:40 ferry arrives at 11:05.',
  'Is there a bakery near the harbour?',
  'Two: one on the quay that opens at seven, and a smaller one up the hill behind the church that sells the almond buns everyone talks about.',
  'Great, we will stop there first.',
  'Remember the last ferry back leaves at 18:30.',
];

/**
 * A deterministic message for position `index`, alternating between the reader and the planner,
 * its id prefixed by the case it belongs to.
 */
function sampleMessage(prefix: string, index: number): SampleMessage {
  return {
    id: `${prefix}-m${index + 1}`,
    origin: index % 2 === 0 ? 'sent' : 'received',
    text: `${sentences[index % sentences.length]} (${index + 1})`,
    status: 'complete',
  };
}

/** Messages `start` up to (not including) `end`. */
export function sampleMessages(prefix: string, start: number, end: number): SampleMessage[] {
  return Array.from({ length: end - start }, (_, offset) => sampleMessage(prefix, start + offset));
}

const replyWords =
  'The morning ferry is the easiest: buy tickets at the kiosk by the pier, sit on the left for the view of the lighthouse, and walk ten minutes along the quay to the bakery. The afternoon is free for the beach on the north side, and the last ferry back leaves at half past six.'.split(
    ' ',
  );

/** Draws a sample message, its author from its origin. */
export function SampleMessageView({ message }: { message: SampleMessage }) {
  return (
    <ChatMessage
      id={message.id}
      origin={message.origin}
      status={message.status}
      author={
        message.origin === 'sent' ? reader : message.origin === 'received' ? planner : undefined
      }
      data-lab-message={message.id}
    >
      {message.text}
    </ChatMessage>
  );
}

/**
 * A conversation whose replies stream in word by word: `send` adds the reader's message and a
 * reply, `receive` adds a message from someone else, `stop` ends a reply early.
 */
export function useSimulatedChat(prefix: string, initial: () => SampleMessage[]) {
  const [messages, setMessages] = useState(initial);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const count = useRef(0);
  const clear = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);
  const update = (id: string, change: Partial<SampleMessage>) =>
    setMessages((list) => list.map((item) => (item.id === id ? { ...item, ...change } : item)));
  const nextId = (kind: string) => {
    count.current += 1;
    return `${prefix}-${kind}-${count.current}`;
  };
  const send = (text: string) => {
    const sentId = nextId('sent');
    const id = nextId('reply');
    setMessages((list) => [
      ...list,
      { id: sentId, origin: 'sent', text, status: 'complete' },
      { id, origin: 'received', text: '', status: 'streaming' },
    ]);
    setStreamingId(id);
    let words = 0;
    clear();
    timer.current = window.setInterval(() => {
      words += 1;
      const done = words >= replyWords.length;
      update(id, {
        text: replyWords.slice(0, words).join(' '),
        status: done ? 'complete' : 'streaming',
      });
      if (done) {
        clear();
        setStreamingId(null);
      }
    }, 150);
  };
  const stop = () => {
    clear();
    if (streamingId !== null) update(streamingId, { status: 'complete' });
    setStreamingId(null);
  };
  const receive = (text: string) =>
    setMessages((list) => [
      ...list,
      { id: nextId('in'), origin: 'received', text, status: 'complete' },
    ]);
  return { messages, setMessages, isStreaming: streamingId !== null, send, stop, receive };
}

/**
 * Shows sighted testers what the transcript inside announced last, read from its visually hidden
 * live region.
 */
export function AnnouncementEcho({ children, name }: { children: ReactNode; name: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [last, setLast] = useState('');
  useEffect(() => {
    const region = frame.current?.querySelector('.ui-chat-transcript__announcer');
    if (!region) return undefined;
    const observer = new MutationObserver(() => {
      const text = region.textContent?.replace('​', '') ?? '';
      if (text) setLast(text);
    });
    observer.observe(region, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={frame}>
      {children}
      <p aria-hidden="true" data-lab-announcement={name}>
        Last announcement: {last || '(none yet)'}
      </p>
    </div>
  );
}
