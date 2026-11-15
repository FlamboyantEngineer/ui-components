// The conversations of the Chat lab's agent app: four earlier chats with a trip planner, each holding
// the kinds of content an agent writes: photos, reasoning, tool calls, sources, questions, plans,
// code, diffs and terminal output.

import type { AttachmentData } from '../../src/components/attachment/attachment.js';
import type { ChatMessageData, ChatPart } from '../../src/components/chat/index.js';
import { tripAttachments } from './attachment-samples.js';
import { tripQuestions } from './chat-agent-tasks.js';
import { tripSources } from './chat-parts-samples.js';
import { plannerId, readerId } from './chat-samples.js';

/** A drawn photo of a place with its name across it, as an SVG data URL. */
function placePhoto(name: string, sky: string, ground: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 120 80"><rect width="120" height="80" fill="${sky}"/><circle cx="92" cy="20" r="8" fill="#fde68a"/><path d="M0 58 L22 40 L40 52 L64 30 L88 50 L120 36 V80 H0 Z" fill="${ground}"/><rect x="18" y="44" width="10" height="14" fill="#f8fafc"/><rect x="46" y="38" width="12" height="20" fill="#fef3c7"/><text x="60" y="74" font-family="sans-serif" font-size="7" text-anchor="middle" fill="#f8fafc">${name}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A photo of `name` as an attachment. */
export function photoOf(name: string, sky: string, ground: string): AttachmentData {
  const id = `photo-${name.toLowerCase().replaceAll(' ', '-')}`;
  return {
    id,
    name: `${name}.svg`,
    mediaType: 'image/svg+xml',
    url: placePhoto(name, sky, ground),
  };
}

/** The photos the planner finds for a weekend in Lisbon. */
export const lisbonPhotos: AttachmentData[] = [
  photoOf('Alfama', '#bae6fd', '#9a3412'),
  photoOf('Belém', '#e0f2fe', '#0f766e'),
  photoOf('Miradouro', '#fecaca', '#7c2d12'),
];

/** The local time `time` (`HH:MM`) `days` days before today, as an ISO string. */
function daysAgo(days: number, time: string): string {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/** A message of the conversation `prefix`, numbered `index`. */
function entry(
  prefix: string,
  index: number,
  from: 'reader' | 'planner',
  at: string,
  parts: readonly ChatPart[],
): ChatMessageData {
  const authorId = from === 'reader' ? readerId : plannerId;
  return { id: `${prefix}-${String(index)}`, authorId, createdAt: at, parts };
}

const text = (value: string): ChatPart => ({ type: 'text', text: value });

/** Photos from an earlier trip, then a reply with steps, sources, photos and a booking. */
function lisbonConversation(): ChatMessageData[] {
  // Today's messages are minutes old, so they are never ahead of the clock.
  const at = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
  return [
    {
      ...entry('agent-lisbon', 1, 'reader', at(42), [
        text('Here is what we loved last time. Plan something like it for Lisbon, two days.'),
        { type: 'files', attachments: tripAttachments.slice(0, 2) },
      ]),
      // The planner reacted to the photos as it read them.
      reactions: [{ emoji: '😍', participantIds: [plannerId] }],
    },
    entry('agent-lisbon', 2, 'planner', at(41), [
      {
        type: 'reasoning',
        id: 'agent-lisbon-thought',
        text: 'The photos show a **harbour** and an old **tower**: views and water. Lisbon has both, so I will look for viewpoints and the river front, and check the weather.',
        status: 'complete',
        durationMs: 6200,
      },
      {
        type: 'tool-call',
        id: 'agent-lisbon-places',
        name: 'search_places',
        label: 'Searched viewpoints near the river',
        source: 'Maps',
        kind: 'search',
        status: 'succeeded',
        args: { city: 'Lisbon', near: 'Tagus river', type: 'viewpoint' },
        result: { places: ['Miradouro da Graça', 'Belém Tower', 'Alfama'] },
        durationMs: 1400,
      },
      {
        type: 'tool-call',
        id: 'agent-lisbon-weather',
        name: 'get_weather',
        label: 'Checked the forecast',
        kind: 'fetch',
        status: 'succeeded',
        args: { city: 'Lisbon' },
        result: { high: 21, low: 13 },
        durationMs: 900,
      },
      text(
        '## Two days by the water\n\nSpring is mild, around 20 °C [1], and the river front is flat and easy on foot [2].\n\n| Day | Morning | Evening |\n| --- | --- | --- |\n| Saturday | Alfama and the castle | Sunset at the Miradouro |\n| Sunday | Belém by tram | Dinner by the river |',
      ),
      { type: 'sources', id: 'agent-lisbon-sources', sources: tripSources },
      { type: 'files', attachments: lisbonPhotos },
      text('Shall I book dinner for Sunday?'),
    ]),
    entry('agent-lisbon', 3, 'reader', at(39), [text('Yes please, for two at eight.')]),
    entry('agent-lisbon', 4, 'planner', at(38), [
      {
        type: 'tool-call',
        id: 'agent-lisbon-book',
        grouping: 'standalone',
        name: 'book_table',
        label: 'Book a table for two at Casa do Rio',
        source: 'Tables',
        status: 'succeeded',
        args: { day: 'Sunday', time: '20:00', people: 2 },
        result: { booked: 'Casa do Rio', time: '20:00' },
        approval: { scopeLabel: 'this trip', decision: 'approved' },
        durationMs: 2100,
      },
      text('Booked: **Casa do Rio**, Sunday at 20:00. The confirmation is in your inbox.'),
    ]),
  ];
}

/** A card of questions the reader answered, then a plan that ran and changed the packing list. */
function packingConversation(): ChatMessageData[] {
  const at = (time: string) => daysAgo(1, time);
  return [
    {
      ...entry('agent-packing', 1, 'reader', at('18:40'), [text('Help me pack for the weekend.')]),
      reactions: [{ emoji: '👍', participantIds: [plannerId] }],
    },
    entry('agent-packing', 2, 'planner', at('18:40'), [
      text('A few questions first.'),
      {
        type: 'question',
        id: 'agent-packing-ask',
        status: 'answered',
        questions: tripQuestions,
        answers: [
          { questionId: 'pace', optionIds: ['relaxed'] },
          { questionId: 'food', optionIds: ['seafood', 'pastries'] },
          { questionId: 'notes', optionIds: [], otherText: 'We walk a lot' },
        ],
      },
    ]),
    entry('agent-packing', 3, 'planner', at('18:42'), [
      {
        type: 'plan',
        id: 'agent-packing-plan',
        title: 'Packing for Lisbon',
        steps: [
          { id: 'weather', label: 'Read the forecast', status: 'done' },
          { id: 'list', label: 'Update the packing list', status: 'done' },
          { id: 'save', label: 'Save the list', status: 'done' },
        ],
      },
      {
        type: 'diff',
        title: 'packing.md',
        oldText: 'jacket\nsunscreen\numbrella',
        newText: 'light jacket\nsunscreen\numbrella\nwalking shoes',
      },
      text('Walking shoes are on the list, since you walk a lot.'),
    ]),
  ];
}

/** Code, a command that ran and its terminal output. */
function budgetConversation(): ChatMessageData[] {
  const at = (time: string) => daysAgo(3, time);
  return [
    entry('agent-budget', 1, 'reader', at('20:05'), [
      text('Can you work out the budget for two nights?'),
    ]),
    entry('agent-budget', 2, 'planner', at('20:06'), [
      {
        type: 'tool-call',
        id: 'agent-budget-read',
        name: 'read_file',
        label: 'Read budget.ts',
        target: 'budget.ts',
        kind: 'read',
        status: 'succeeded',
        durationMs: 300,
      },
      {
        type: 'tool-call',
        id: 'agent-budget-run',
        name: 'run_command',
        label: 'Ran the budget',
        kind: 'command',
        status: 'succeeded',
        args: { command: 'npx tsx budget.ts' },
        durationMs: 1800,
      },
      text('Two nights at 90 plus the trains come to **225**:'),
      {
        type: 'code',
        title: 'budget.ts',
        language: 'ts',
        code: 'const nights = 2;\nconst trains = 45;\nexport const budget = nights * 90 + trains;',
      },
      { type: 'code', variant: 'terminal', code: '$ npx tsx budget.ts\nbudget: 225' },
    ]),
  ];
}

/** A search that failed and was tried again, and a cancellation the reader denied. */
function museumConversation(): ChatMessageData[] {
  const at = (time: string) => daysAgo(6, time);
  return [
    entry('agent-museum', 1, 'reader', at('11:30'), [
      text('Which museums are open on Monday? And cancel the old hotel.'),
    ]),
    entry('agent-museum', 2, 'planner', at('11:31'), [
      {
        type: 'tool-call',
        id: 'agent-museum-first',
        name: 'search_museums',
        label: 'Searched museums',
        source: 'Guide',
        kind: 'search',
        status: 'failed',
        error: 'The guide service timed out.',
        durationMs: 5000,
      },
      {
        type: 'tool-call',
        id: 'agent-museum-again',
        name: 'search_museums',
        label: 'Searched museums again',
        source: 'Guide',
        kind: 'search',
        status: 'succeeded',
        result: { open: ['Tile Museum', 'Maritime Museum'] },
        durationMs: 1200,
      },
      {
        type: 'tool-call',
        id: 'agent-museum-cancel',
        grouping: 'standalone',
        name: 'cancel_hotel',
        label: 'Cancel the old hotel booking',
        status: 'denied',
        args: { hotel: 'Old Town Inn' },
        approval: { decision: 'denied', reason: 'I still need it for Friday' },
      },
      text('The **Tile Museum** and the **Maritime Museum** open on Mondays. I kept the hotel.'),
    ]),
  ];
}

/** One of the agent app's conversations: its title and its messages. */
export interface AgentConversationSample {
  id: string;
  title: string;
  messages: readonly ChatMessageData[];
}

/** The agent app's conversations, newest first. */
export function agentConversations(): AgentConversationSample[] {
  return [
    { id: 'agent-lisbon', title: 'Two days in Lisbon', messages: lisbonConversation() },
    { id: 'agent-packing', title: 'Packing list', messages: packingConversation() },
    { id: 'agent-budget', title: 'Weekend budget', messages: budgetConversation() },
    { id: 'agent-museum', title: 'Museums on Monday', messages: museumConversation() },
  ];
}
