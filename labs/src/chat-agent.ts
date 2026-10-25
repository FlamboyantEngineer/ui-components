// A fake streaming trip planner for the Chat lab: each behaviour is a `send` that streams events.

import type {
  ChatSendFunction,
  ChatUploadFunction,
} from '../../src/components/chat-controller/index.js';
import type { ChatMessageData } from '../../src/components/chat-parts/index.js';
import { nextLabId, readerId } from './chat-samples.js';
import { askTrip, planTrip } from './chat-agent-tasks.js';
import { agentTiming, sleep, streamText } from './chat-agent-stream.js';

/** What the lab's agent does with the next message. */
export const agentBehaviours = {
  answer: 'Answer with tools and sources',
  'approval-awaited': 'Approval, awaited',
  'approval-turn': 'Approval, next turn',
  question: 'Questions with previews',
  plan: 'Plan, diff and terminal',
  failure: 'Fails once',
} as const;

export type AgentBehaviour = keyof typeof agentBehaviours;

const answer =
  'Spring is **mild**, around 20 °C with the odd shower [1], and the fast train takes under three hours [2].\n\n| Day | Morning | Evening |\n| --- | --- | --- |\n| Saturday | Castle and Alfama | Fado in Mouraria |\n| Sunday | Belém by tram | Sunset at the river |\n\nTo keep the budget handy:\n\n```ts\nconst nights = 2;\nconst budget = nights * 90 + 45;\n```\n\nShall I book a table for Saturday?';

const sources = [
  {
    id: 'weather',
    title: 'Lisbon weather in spring',
    url: 'https://example.com/lisbon-weather',
    siteName: 'Example Weather',
    snippet: 'Mild days around 20 °C, cool evenings and the odd shower.',
  },
  {
    id: 'rail',
    title: 'Porto to Lisbon timetable',
    url: 'https://example.com/rail/porto-lisbon',
    snippet: 'Fast trains leave hourly from 6:00 and take 2 h 49 min.',
  },
];

/** Reasoning, the forecast and the trains as steps, then a cited answer with a table and code. */
const answerTrip: ChatSendFunction = async function* (messages, { signal }) {
  const reasoning = nextLabId('reasoning');
  yield { type: 'status', text: 'Thinking about the weekend…' };
  for (const text of [
    'The reader wants ',
    'a calm weekend, ',
    'so two sights a day ',
    'is enough.',
  ]) {
    await sleep(agentTiming.word * 3, signal);
    yield { type: 'reasoning-delta', id: reasoning, text };
  }
  yield { type: 'reasoning-end', id: reasoning };
  const weather = nextLabId('weather');
  yield { type: 'status', text: 'Checking the forecast…' };
  yield {
    type: 'tool-call',
    id: weather,
    name: 'get_weather',
    label: 'Checked the forecast',
    args: { city: 'Lisbon' },
  };
  await sleep(agentTiming.word * 8, signal);
  yield { type: 'tool-result', id: weather, result: { high: 21, low: 13 } };
  const trains = nextLabId('trains');
  yield { type: 'status', text: 'Searching trains…' };
  yield {
    type: 'tool-call',
    id: trains,
    name: 'search_trains',
    label: 'Searched trains to Lisbon',
    args: { from: 'Porto', to: 'Lisbon', day: 'Saturday' },
  };
  await sleep(agentTiming.word * 8, signal);
  yield {
    type: 'tool-result',
    id: trains,
    result: { departures: ['8:05', '9:05'], duration: '2 h 49 min' },
  };
  yield { type: 'status', text: 'Writing the plan…' };
  // The heading streams first, so the answer's text comes before its list of sources.
  yield* streamText(`${commandNote(messages)}## Two days in Lisbon\n\n`, signal);
  for (const source of sources) yield { type: 'source', source };
  yield* streamText(answer, signal);
  yield { type: 'status', text: '' };
  yield { type: 'finish' };
};

/** A line about the slash command the reader chose, when they chose one. */
function commandNote(messages: readonly ChatMessageData[]): string {
  const last = messages.findLast((message) => message.authorId === readerId);
  const part = last?.parts.find((entry) => entry.type === 'text');
  const command =
    part?.type === 'text' ? part.tokens?.find((token) => token.kind === 'command') : undefined;
  return command ? `You chose **${command.label}**, so here it is in short.\n\n` : '';
}

/** A booking awaited in the stream: it continues with the reader's decision. */
const approvalAwaited: ChatSendFunction = async function* (_messages, { signal, waitFor }) {
  const id = nextLabId('book');
  yield { type: 'status', text: 'Finding a table…' };
  await sleep(agentTiming.word * 5, signal);
  yield {
    type: 'tool-call',
    id,
    name: 'book_table',
    label: 'Book a table for two at Casa do Rio',
    args: { day: 'Saturday', time: '20:00', people: 2 },
  };
  yield { type: 'approval-request', id, scopeLabel: 'this trip', await: true };
  yield { type: 'status', text: 'Waiting for your approval…' };
  const response = await waitFor(id);
  yield { type: 'status', text: '' };
  if (response.type === 'approval' && response.decision === 'denied') {
    yield { type: 'tool-result', id, error: response.reason ?? 'You chose not to book.' };
    yield* streamText('No booking then. I can look for another place.', signal);
  } else {
    await sleep(agentTiming.word * 5, signal);
    yield { type: 'tool-result', id, result: { booked: 'Casa do Rio', time: '20:00' } };
    yield* streamText('Booked: Casa do Rio, Saturday at 20:00.', signal);
  }
  yield { type: 'finish' };
};

/** The tool call the reader decided on in the reply the conversation ends with. */
function findDecidedCall(message: ChatMessageData | undefined) {
  const part = message?.parts.find(
    (entry) =>
      entry.type === 'tool-call' &&
      entry.result === undefined &&
      entry.approval?.decision !== undefined,
  );
  return part?.type === 'tool-call' ? part : undefined;
}

/** A cancellation asked at the end of a turn: the reader's decision starts the next one. */
const approvalTurn: ChatSendFunction = async function* (messages, { signal }) {
  const decided = findDecidedCall(messages.at(-1));
  if (!decided) {
    const id = nextLabId('cancel');
    await sleep(agentTiming.word * 5, signal);
    yield {
      type: 'tool-call',
      id,
      name: 'cancel_hotel',
      label: 'Cancel the old hotel booking',
      args: { hotel: 'Old Town Inn' },
    };
    yield { type: 'approval-request', id, scopeLabel: 'this trip' };
    yield { type: 'finish' };
    return;
  }
  if (decided.status === 'denied') {
    yield* streamText('I kept the old booking.', signal);
  } else {
    await sleep(agentTiming.word * 5, signal);
    yield { type: 'tool-result', id: decided.id, result: { cancelled: 'Old Town Inn' } };
    yield* streamText('Cancelled the old booking.', signal);
  }
  yield { type: 'finish' };
};

const attempts = new Map<string, number>();

/** Fails its first attempt at each message, then answers. */
const failure: ChatSendFunction = async function* (messages, { signal }) {
  const key = messages.findLast((message) => message.authorId === readerId)?.id ?? '';
  const attempt = (attempts.get(key) ?? 0) + 1;
  attempts.set(key, attempt);
  yield* streamText('Checking the ferry times', signal);
  if (attempt === 1) {
    yield { type: 'error', message: 'The timetable service is busy. Try again.' };
    return;
  }
  yield* streamText(': ferries cross every 20 minutes until midnight.', signal);
  yield { type: 'finish' };
};

export const agents: Record<AgentBehaviour, ChatSendFunction> = {
  answer: answerTrip,
  'approval-awaited': approvalAwaited,
  'approval-turn': approvalTurn,
  question: askTrip,
  plan: planTrip,
  failure,
};

/** Uploads in a second, a quarter at a time; a file named `broken…` fails its first upload. */
const failedOnce = new Set<string>();
export const fakeUpload: ChatUploadFunction = (file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let progress = 0;
    const timer = setInterval(() => {
      progress += 0.25;
      onProgress(progress);
      if (progress < 1) return;
      clearInterval(timer);
      if (file.name.startsWith('broken') && !failedOnce.has(file.name)) {
        failedOnce.add(file.name);
        reject(new Error(`${file.name} did not arrive. Try again.`));
        return;
      }
      const url = URL.createObjectURL(file);
      resolve(file.type.startsWith('image/') ? { url, thumbnailUrl: url } : { url });
    }, 250);
    signal.addEventListener('abort', () => clearInterval(timer));
  });
