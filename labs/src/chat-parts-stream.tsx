// A streamed answer, one event at a time: reasoning, a tool call and its sources, then text citing
// them. The group of steps runs while it ends the message and collapses once the answer streams.
// The player that steps through it also steps through the lab's other streamed replies.

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
import { requireDefined } from './require-defined.js';
import { bookingCall, tripSources } from './chat-parts-samples.js';

/** A reply after one event of its stream. */
export type ReplyFrame = Pick<ChatMessageData, 'parts' | 'status' | 'statusText'>;

interface ReplyStreamProps {
  /** The reply after each event. */
  frames: readonly ReplyFrame[];
  /** Names the demo, as its `data-lab-demo`. */
  demo: string;
  /** The reply's message id. */
  messageId: string;
  /** Decides a tool call that waits for approval; shows Approve and Deny. */
  onDecide?: ((callId: string) => void) | undefined;
}

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
  kind: 'search',
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

/** The answer after each event of its stream. */
const answerFrames: ReplyFrame[] = [
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

/**
 * A reply streamed one event per press of Next (or per tick of Play). Reset starts a new run, which
 * forgets the reader's open and closed choices of the last one.
 */
export function ReplyStream({ frames, demo, messageId, onDecide }: ReplyStreamProps) {
  const [event, setEvent] = useState(0);
  const [run, setRun] = useState(0);
  const [wantsPlay, setPlaying] = useState(false);
  const last = frames.length - 1;
  // Play stops at the last event.
  const isPlaying = wantsPlay && event < last;
  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setTimeout(() => setEvent((value) => value + 1), tick);
    return () => window.clearTimeout(timer);
  }, [event, isPlaying]);
  const frame = requireDefined(frames[event]);
  const isStreaming = frame.status === 'streaming';
  return (
    <Stack space="sm" data-lab-demo={demo}>
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
            setRun(run + 1);
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
        <ChatParts
          key={run}
          parts={frame.parts}
          messageId={messageId}
          isStreaming={isStreaming}
          onApprove={onDecide}
          onDeny={onDecide}
        />
      </ChatMessage>
      <ChatStatusLine text={frame.statusText ?? ''} isRunning={isStreaming} />
    </Stack>
  );
}

/** The answer, streamed one event at a time. */
export function StreamedAnswer() {
  return <ReplyStream frames={answerFrames} demo="stream" messageId="stream-reply" />;
}

const meanwhileWords =
  'While the booking waits, here is the plan: arrive at 10:50, drop the bags and walk to the river.'.split(
    ' ',
  );

const meanwhileAt = (count: number): ChatPart => ({
  type: 'text',
  id: 'meanwhile',
  text: meanwhileWords.slice(0, count).join(' '),
  status: 'streaming',
});

/** A booking that waits for approval, then text streamed after it. */
const approvalFrames: ReplyFrame[] = [
  { parts: [bookingCall], status: 'streaming', statusText: 'Waiting for approval…' },
  ...[5, 11, 99].map(
    (count): ReplyFrame => ({
      parts: [bookingCall, meanwhileAt(count)],
      status: 'streaming',
      statusText: 'Writing the plan…',
    }),
  ),
];

/** A tool call waiting for approval while text streams after it, which keeps its Deny form. */
export function ApprovalStream() {
  return (
    <ReplyStream
      frames={approvalFrames}
      demo="approval-stream"
      messageId="approval-stream"
      onDecide={() => undefined}
    />
  );
}
