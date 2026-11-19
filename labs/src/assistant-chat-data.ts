import type { ChatMessageData, ChatSendFunction } from '../../src/components/chat/index.js';
import { sleep } from './chat-agent-stream.js';

const itinerary = [
  'Start Saturday at the market. Arrive early enough for coffee and take a short walk along the river while the city is quiet.',
  'Follow the river to the old ferry terminal. The restored ticket hall tells the story of trade across the water.',
  'For lunch, try a seat at the communal table near the market. There is usually a soup or sandwich made from the morning produce.',
  'Spend Saturday afternoon at the botanical garden. The glasshouse is a good stop if the weather changes.',
  'Leave time for a walk after dinner. The small streets above the square have wide views and little traffic.',
  'On Sunday, take the first ferry. Carry a light jacket for the crossing and make a note of the return schedule.',
  'There is a bakery opposite the landing. It makes a convenient place to pause before heading up to the park.',
  'The park has a short loop for an hour outside and a longer trail through the woods for the rest of the morning.',
  'Spend your last afternoon at the museum beside the station. Its upstairs gallery is quieter and overlooks the courtyard.',
  'Save time to collect your bag and get to the station. Take the main road if you are travelling after dark.',
  'Final note: leave one stop optional so you can linger somewhere you enjoy.',
] as const;

export const recipeReply: ChatSendFunction = async function* (messages, { signal, waitFor }) {
  yield {
    type: 'reasoning-delta',
    id: 'outline',
    text: 'I’ll group nearby stops and leave time to travel between them.',
  };
  await sleep(650, signal);
  yield { type: 'reasoning-end', id: 'outline' };
  yield {
    type: 'tool-call',
    id: 'schedule',
    name: 'check_schedule',
    label: 'Check the ferry schedule',
    kind: 'search',
  };
  const asksForApproval = messages
    .at(-1)
    ?.parts.some((part) => part.type === 'text' && /approval/i.test(part.text));
  if (asksForApproval) {
    yield { type: 'approval-request', id: 'schedule', await: true };
    await waitFor('schedule');
  }
  await sleep(350, signal);
  yield { type: 'tool-result', id: 'schedule', result: { crossings: 'Hourly' } };
  for (const paragraph of itinerary) {
    await sleep(210, signal);
    yield { type: 'text-delta', text: `${paragraph}\n\n` };
  }
};

function historyMessage(id: number, text: string): ChatMessageData {
  return {
    id: `history-${id}`,
    authorId: id % 2 === 0 ? 'reader' : 'guide',
    createdAt: '2026-05-01T12:00:00Z',
    parts: [{ type: 'text', text }],
  };
}

export const recipeHistory = itinerary.map((paragraph, index) =>
  historyMessage(index + 4, paragraph),
);
export const recipeOlder = [
  historyMessage(0, 'Could you suggest an easy weekend trip?'),
  historyMessage(1, 'Yes. We can plan around train and ferry connections.'),
  historyMessage(2, 'What would you recommend near the waterfront?'),
  historyMessage(3, 'The path from the market to the ferry is a good start.'),
];
