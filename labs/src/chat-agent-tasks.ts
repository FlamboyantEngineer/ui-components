// The trip planner's longer tasks for the Chat lab: asking questions, and working through a plan.

import type { ChatSendFunction } from '../../src/components/chat-controller/index.js';
import type { ChatQuestionItem } from '../../src/components/chat-question/index.js';
import { agentTiming, sleep, streamText } from './chat-agent-stream.js';
import { nextLabId } from './chat-samples.js';

const tripQuestions: ChatQuestionItem[] = [
  {
    id: 'pace',
    header: 'Pace',
    question: 'How full should each day be?',
    selectionMode: 'single',
    allowsOther: true,
    options: [
      {
        id: 'relaxed',
        label: 'Relaxed',
        description: 'Two sights a day',
        isRecommended: true,
        preview: '**Saturday**\n\n- Castle in the morning\n- Long lunch\n- River walk',
      },
      {
        id: 'packed',
        label: 'Packed',
        description: 'Something every hour',
        preview: '**Saturday**\n\n- Castle at 9\n- Tiles museum at 11\n- Belém at 14\n- Fado at 21',
      },
    ],
  },
  {
    id: 'food',
    header: 'Food',
    question: 'What should the meals include?',
    selectionMode: 'multiple',
    options: [
      { id: 'seafood', label: 'Seafood' },
      { id: 'pastries', label: 'Pastries', isRecommended: true },
      { id: 'vegetarian', label: 'Vegetarian dishes' },
    ],
  },
  {
    id: 'notes',
    header: 'Notes',
    question: 'Anything else I should know?',
    selectionMode: 'none',
    options: [],
  },
];

/** Asks three questions in one card, awaited, then sums up the answers. */
export const askTrip: ChatSendFunction = async function* (_messages, { signal, waitFor }) {
  const id = nextLabId('ask');
  yield* streamText('A few questions before I plan the days.', signal);
  yield { type: 'question', id, questions: tripQuestions, await: true };
  const response = await waitFor(id);
  if (response.type !== 'question' || response.status === 'dismissed') {
    yield* streamText(' No problem, I will choose for you.', signal);
  } else {
    const chosen = response.answers.flatMap((answer) => [
      ...answer.optionIds,
      answer.otherText ?? '',
    ]);
    yield* streamText(` Noted: ${chosen.filter(Boolean).join(', ')}.`, signal);
  }
  yield { type: 'finish' };
};

const planSteps = [
  { id: 'trains', label: 'Find trains' },
  { id: 'hotel', label: 'Pick a hotel' },
  { id: 'list', label: 'Update the packing list' },
  { id: 'save', label: 'Save the plan' },
];

const statusOfStep: Record<string, string> = {
  trains: 'Searching trains…',
  hotel: 'Comparing hotels…',
  list: 'Updating the packing list…',
  save: 'Saving the plan…',
};

/** Works through a plan with a live status line, then shows a diff and a terminal block. */
export const planTrip: ChatSendFunction = async function* (_messages, { signal }) {
  const planId = nextLabId('plan');
  yield {
    type: 'plan',
    id: planId,
    title: 'Weekend in Lisbon',
    steps: planSteps.map((step) => ({ ...step, status: 'pending' as const })),
  };
  for (const step of planSteps) {
    yield { type: 'status', text: statusOfStep[step.id] ?? '' };
    yield { type: 'plan-step', planId, stepId: step.id, status: 'in-progress' };
    await sleep(agentTiming.word * 10, signal);
    yield { type: 'plan-step', planId, stepId: step.id, status: 'done' };
  }
  yield { type: 'status', text: '' };
  yield { type: 'custom', name: 'weather-card', data: { city: 'Lisbon', high: 21 } };
  yield {
    type: 'diff',
    title: 'packing.md',
    oldText: 'jacket\nsunscreen\numbrella',
    newText: 'light jacket\nsunscreen\numbrella\nwalking shoes',
  };
  yield {
    type: 'code',
    variant: 'terminal',
    code: '$ trips save lisbon\nSaved lisbon.md (4 steps)',
  };
  yield* streamText('All set: the plan is saved and the packing list has walking shoes.', signal);
  yield { type: 'finish' };
};
