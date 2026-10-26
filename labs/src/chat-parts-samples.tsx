// Sample parts for the Chat Parts lab: a trip planner that searches, cites and asks.

import type {
  ChatCustomPart,
  ChatPart,
  ChatQuestionPart,
  ChatTextToken,
  ChatToolCallPart,
  ChatToolRenderer,
} from '../../src/components/chat-parts/index.js';
import type { ChatSource } from '../../src/components/chat-sources/index.js';
import { requireDefined } from '../../src/utils/require-defined.js';
import { kindSamples, tripAttachments } from './chat-attachment-samples.js';
import { ForecastCard, recipeArgs, recipeResult } from './chat-tool-call-samples.js';
import { labRecords } from './reference-samples.js';

export const tripSources: ChatSource[] = [
  {
    id: 'weather',
    title: 'Porto weather in spring',
    url: 'https://example.com/porto-weather',
    siteName: 'Example Weather',
    snippet: 'Mild days around 20 °C, cool evenings and the odd shower.',
  },
  {
    id: 'rail',
    title: 'Lisbon to Porto timetable',
    url: 'https://example.com/rail/lisbon-porto',
    snippet: 'Fast trains leave hourly from 6:00; the 8:05 arrives at 10:50.',
  },
];

/** A token over the first occurrence of `covered` in `text`. */
export function tokenOver(
  text: string,
  covered: string,
  token: Omit<ChatTextToken, 'start' | 'end'>,
): ChatTextToken {
  const start = text.indexOf(covered);
  return { ...token, start, end: start + covered.length };
}

export const tokenText = '/plan a weekend in Porto with **@Ana Lopez**, then share it in `@Ana`.';

const codeMention = tokenText.lastIndexOf('@Ana');

/** A command, a mention in bold, and a mention inside code, which stays as written. */
export const textTokens: ChatTextToken[] = [
  tokenOver(tokenText, '/plan', { kind: 'command', id: 'plan', label: '/plan' }),
  tokenOver(tokenText, '@Ana Lopez', { kind: 'mention', id: 'ana', label: '@Ana Lopez' }),
  { start: codeMention, end: codeMention + 4, kind: 'mention', id: 'ana', label: '@Ana Lopez' },
];

export const referenceText =
  'Compare TRIP-4 with NOTE-12, and drop NOTE-9.\nTRIP-2 stays as it is.';

/** References to the lab's records, a missing and a restricted one among them, by their ids. */
export const referenceTokens: ChatTextToken[] = labRecords.map((record) =>
  tokenOver(referenceText, record.label, {
    kind: 'reference',
    id: record.id,
    label: record.label,
    recordType: record.recordType,
  }),
);

export const linesText =
  'Saturday: the river walk\nSunday: the market, then lunch\n\nBack by 18:00';

export const searchCall: ChatToolCallPart = {
  type: 'tool-call',
  id: 'call-1',
  name: 'search_recipes',
  label: 'Searched recipes',
  status: 'succeeded',
  args: recipeArgs,
  result: recipeResult,
  durationMs: 1300,
};

export const weatherCall: ChatToolCallPart = {
  type: 'tool-call',
  id: 'call-weather',
  name: 'get_weather',
  label: 'Checked the Porto forecast',
  status: 'succeeded',
  args: { city: 'Porto' },
  durationMs: 900,
};

export const bookingCall: ChatToolCallPart = {
  type: 'tool-call',
  id: 'call-booking',
  name: 'book_train',
  label: 'Book the 8:05 to Porto',
  status: 'approval-requested',
  args: { train: '8:05', seats: 2 },
  approval: { scopeLabel: 'this trip' },
};

export const tripQuestion: ChatQuestionPart = {
  type: 'question',
  id: 'ask-1',
  status: 'pending',
  questions: [
    {
      id: 'pace',
      question: 'How full should each day be?',
      header: 'Pace',
      selectionMode: 'single',
      allowsOther: true,
      options: [
        { id: 'relaxed', label: 'Relaxed', description: 'Two sights a day.', isRecommended: true },
        { id: 'packed', label: 'Packed', description: 'Something every hour.' },
      ],
    },
  ],
};

export const weatherCard: ChatCustomPart = {
  type: 'custom',
  name: 'weather-card',
  data: { city: 'Porto', high: 21 },
};

/** Draws the lab's custom parts: a small weather card. */
export function renderLabPart(part: ChatCustomPart) {
  const data = part.data as { city: string; high: number };
  return (
    <p data-lab-custom={part.name}>
      <strong>{data.city}</strong> · {data.high} °C tomorrow
    </p>
  );
}

/** The forecast tool draws its own body inside the default card. */
export const forecastRenderer: ChatToolRenderer = { render: () => <ForecastCard /> };

/** One sample of each part type, for the part matrix. */
export const partSamples = {
  markdown: [
    {
      type: 'text',
      text: 'Pack **layers** and a light jacket: Porto is *mild* in spring, with the odd shower.',
    },
  ],
  plain: [{ type: 'text', format: 'plain', text: 'Pack **layers**\nand a light jacket.' }],
  reasoning: [
    {
      type: 'reasoning',
      id: 'r1',
      text: 'The reader wants a **calm** weekend, so two sights a day is enough.',
      status: 'complete',
      durationMs: 4200,
    },
  ],
  'tool-call': [searchCall],
  question: [tripQuestion],
  plan: [
    {
      type: 'plan',
      id: 'plan',
      title: 'Weekend in Porto',
      steps: [
        { id: 'trains', label: 'Find trains', status: 'done' },
        { id: 'hotel', label: 'Pick a hotel', status: 'in-progress' },
        { id: 'dinner', label: 'Book dinner', status: 'pending' },
      ],
    },
  ],
  sources: [{ type: 'sources', sources: tripSources }],
  files: [
    {
      type: 'files',
      attachments: [
        requireDefined(tripAttachments[0]),
        kindSamples.pdf,
        { ...kindSamples.text, status: 'error' },
      ],
    },
  ],
  code: [
    { type: 'code', code: 'const nights = 2;\nconst budget = nights * 90;', title: 'budget.ts' },
  ],
  terminal: [{ type: 'code', code: '$ ls trips\nporto.md', variant: 'terminal' }],
  diff: [
    {
      type: 'diff',
      title: 'packing.md',
      oldText: 'jacket\nsunscreen\numbrella',
      newText: 'light jacket\nsunscreen\numbrella\nwalking shoes',
    },
  ],
  custom: [weatherCard],
} satisfies Record<string, ChatPart[]>;

export const partTypes = Object.keys(partSamples) as Array<keyof typeof partSamples>;
