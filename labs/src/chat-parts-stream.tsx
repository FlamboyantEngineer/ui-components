// A streamed answer, one event at a time: reasoning, a tool call and its sources, then text citing
// them. The group of steps runs while it ends the message and collapses once the answer streams.

import { useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ChatStatusLine } from '../../src/components/chat-activity/index.js';
import {
  ChatParts,
  type ChatMessageData,
  type ChatPart,
} from '../../src/components/chat-parts/index.js';
import { ChatMessage } from '../../src/components/chat-transcript/chat-transcript.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { tripSources } from './chat-parts-samples.js';

/** One tick of Play, in milliseconds. */
const tick = 700;

const reasoningWords =
  'The reader wants an early train. The **8:05** is fast, arrives before noon and is the cheapest fare.'.split(
    ' ',
  );

const answerWords =
  'Take the **8:05** from Lisbon: it arrives at 10:50 [2]. Porto is *mild* in spring [1], so pack a light jacket and walking shoes.'.split(
    ' ',
  );

const reasoningAt = (count: number): ChatPart => ({
  type: 'reasoning',
  id: 'think',
  text: reasoningWords.slice(0, count).join(' '),
  status: count < reasoningWords.length ? 'streaming' : 'complete',
  durationMs: 2400,
});

const searchAt = (isDone: boolean): ChatPart => ({
  type: 'tool-call',
  id: 'search',
  name: 'search_trains',
  label: isDone ? 'Searched trains to Porto' : 'Searching trains to Porto…',
  status: isDone ? 'succeeded' : 'running',
  args: { from: 'Lisbon', to: 'Porto', date: 'Saturday' },
  result: isDone ? { departures: ['8:05', '9:05'] } : undefined,
  durationMs: isDone ? 1600 : undefined,
});

const answerAt = (count: number, isDone = false): ChatPart => ({
  type: 'text',
  id: 'answer',
  text: answerWords.slice(0, count).join(' '),
  status: isDone ? 'complete' : 'streaming',
});

/** The search's sources, which arrive with its result, ahead of the answer that cites them. */
const sources: ChatPart = { type: 'sources', id: 'sources', sources: tripSources };

/** The reply after each event of the stream. */
const frames: Array<Pick<ChatMessageData, 'parts' | 'status' | 'statusText'>> = [
  { parts: [reasoningAt(5)], status: 'streaming', statusText: 'Thinking…' },
  { parts: [reasoningAt(12)], status: 'streaming', statusText: 'Thinking…' },
  {
    parts: [reasoningAt(99), searchAt(false)],
    status: 'streaming',
    statusText: 'Searching trains…',
  },
  {
    parts: [reasoningAt(99), searchAt(true), answerAt(4), sources],
    status: 'streaming',
    statusText: 'Writing the answer…',
  },
  {
    parts: [reasoningAt(99), searchAt(true), answerAt(13), sources],
    status: 'streaming',
    statusText: 'Writing the answer…',
  },
  {
    parts: [reasoningAt(99), searchAt(true), answerAt(99, true), sources],
    status: 'complete',
    statusText: '',
  },
];

/** The reply, streamed one event per press of Next (or per tick of Play). */
export function StreamedAnswer() {
  const [event, setEvent] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const last = frames.length - 1;
  useEffect(() => {
    if (!isPlaying) return undefined;
    if (event >= last) {
      setPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setEvent((value) => value + 1), tick);
    return () => window.clearTimeout(timer);
  }, [event, isPlaying, last]);
  const frame = frames[event]!;
  const isStreaming = frame.status === 'streaming';
  return (
    <Stack space="sm" data-lab-demo="stream">
      <Cluster space="sm">
        <Button isDisabled={event >= last} onPress={() => setEvent(event + 1)}>
          Next event
        </Button>
        <Button isDisabled={isPlaying || event >= last} onPress={() => setPlaying(true)}>
          Play
        </Button>
        <Button
          onPress={() => {
            setPlaying(false);
            setEvent(0);
          }}
        >
          Reset
        </Button>
        <span>
          Event {event + 1} of {frames.length}
        </span>
      </Cluster>
      <ChatMessage
        origin="received"
        author={{ name: 'Trip planner', colorKey: 'planner' }}
        status={frame.status}
      >
        <ChatParts parts={frame.parts} messageId="stream-reply" isStreaming={isStreaming} />
      </ChatMessage>
      <ChatStatusLine text={frame.statusText ?? ''} isRunning={isStreaming} />
    </Stack>
  );
}
