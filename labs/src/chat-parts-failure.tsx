// A run with a failure among successful steps, one event at a time: a hotel search fails between
// searches that succeed, then the run finishes with an answer. The group of steps stays open around
// the failure once the answer follows; closing it holds until another call newly fails.

import type { ChatPart, ChatToolCallPart } from '../../src/components/chat-parts/index.js';
import { ReplyStream, type ReplyFrame } from './chat-parts-stream.js';

type CallStatus = ChatToolCallPart['status'];

const plan: ChatPart = {
  type: 'reasoning',
  id: 'plan',
  text: 'Find a **train** first, then a hotel near the station, then check the weather.',
  status: 'complete',
  durationMs: 1800,
};

const trainsAt = (status: CallStatus): ChatPart => ({
  type: 'tool-call',
  id: 'trains',
  name: 'search_trains',
  label: 'Search trains to Porto',
  status,
  args: { from: 'Lisbon', to: 'Porto', date: 'Saturday' },
  result: status === 'succeeded' ? { departures: ['8:05', '9:05'] } : undefined,
  durationMs: status === 'succeeded' ? 1200 : undefined,
});

const hotelsAt = (status: CallStatus): ChatPart => ({
  type: 'tool-call',
  id: 'hotels',
  name: 'search_hotels',
  label: 'Search hotels in Porto',
  status,
  args: { city: 'Porto', nights: 2 },
  error: status === 'failed' ? 'The hotel service did not answer within 10 seconds.' : undefined,
  durationMs: status === 'failed' ? 10000 : undefined,
});

const forecastAt = (status: CallStatus): ChatPart => ({
  type: 'tool-call',
  id: 'forecast',
  name: 'get_forecast',
  label: 'Check the Porto forecast',
  status,
  args: { city: 'Porto', day: 'Saturday' },
  result: status === 'succeeded' ? { high: 21, sky: 'sunny' } : undefined,
  durationMs: status === 'succeeded' ? 700 : undefined,
});

const answer =
  'Take the **8:05** to Porto; Saturday looks sunny. The hotel search did not answer, so the hotel is still to book.';

const answerAt = (count: number, isDone = false): ChatPart => ({
  type: 'text',
  id: 'answer',
  text: answer.split(' ').slice(0, count).join(' '),
  status: isDone ? 'complete' : 'streaming',
});

const finishedSteps = [plan, trainsAt('succeeded'), hotelsAt('failed'), forecastAt('succeeded')];

/** The finished run: its failed hotel search between successful steps, then the answer. */
export const failedRunParts: ChatPart[] = [...finishedSteps, answerAt(99, true)];

/** The run after each event: the hotel search fails mid-run, and the run finishes after it. */
const failedRunFrames: ReplyFrame[] = [
  { parts: [plan, trainsAt('running')], status: 'streaming', statusText: 'Searching trains…' },
  {
    parts: [plan, trainsAt('succeeded'), hotelsAt('running')],
    status: 'streaming',
    statusText: 'Searching hotels…',
  },
  {
    parts: [plan, trainsAt('succeeded'), hotelsAt('failed'), forecastAt('running')],
    status: 'streaming',
    statusText: 'Checking the forecast…',
  },
  {
    parts: [...finishedSteps, answerAt(6)],
    status: 'streaming',
    statusText: 'Writing the answer…',
  },
  { parts: failedRunParts, status: 'complete', statusText: '' },
];

/** The run with a failed step, streamed one event at a time. */
export function FailedRun() {
  return <ReplyStream frames={failedRunFrames} demo="failed-run" messageId="failed-run" />;
}
