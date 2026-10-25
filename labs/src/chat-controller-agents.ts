// Fake streaming agents for the controller lab: each is a `send` that streams library events.

import type {
  ChatSendFunction,
  ChatStreamEvent,
} from '../../src/components/chat-controller/chat-controller.js';
import type { ChatMessageData } from '../../src/components/chat-parts/chat-parts.js';
import { agUiSend, aiSdkSend } from './chat-controller-adapters.js';

export const readerId = 'reader';
export const helperId = 'helper';

/** The behaviours the lab's fake agent offers. */
export const scenarios = {
  answer: 'Streamed answer',
  'approval-awaited': 'Approval, awaited',
  'approval-turn': 'Approval, next turn',
  question: 'Question, awaited',
  failure: 'Fails once',
  everything: 'Every part',
  'ag-ui': 'AG-UI-style stream',
  'ai-sdk': 'AI SDK-style stream',
} as const;

export type LabScenario = keyof typeof scenarios;

/** Waits `ms`, or rejects when the reader stops the reply. */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/** Streams `text` a word at a time. */
export async function* streamWords(
  text: string,
  signal: AbortSignal,
  pause = 90,
): AsyncGenerator<ChatStreamEvent> {
  for (const word of text.split(/(?<= )/)) {
    await sleep(pause, signal);
    yield { type: 'text-delta', text: word };
  }
}

let calls = 0;
/** A tool call id unique in the lab session. */
const nextId = (prefix: string) => `${prefix}-${++calls}`;

const answerText =
  'Soak the black beans overnight, then simmer them with onion, garlic and cumin for about an hour. Add the tomatoes in the last twenty minutes so they keep their shape, and season at the end, once the beans are tender.';

const answer: ChatSendFunction = async function* (_messages, { signal }) {
  yield { type: 'status', text: 'Looking up the recipe…' };
  yield {
    type: 'reasoning-delta',
    id: nextId('reasoning'),
    text: 'The reader wants a simple bean dish.',
  };
  await sleep(500, signal);
  yield { type: 'status', text: '' };
  yield* streamWords(answerText, signal);
  yield { type: 'finish' };
};

const approvalAwaited: ChatSendFunction = async function* (_messages, { signal, waitFor }) {
  const id = nextId('call');
  yield { type: 'status', text: 'Looking for old drafts…' };
  await sleep(300, signal);
  yield {
    type: 'tool-call',
    id,
    name: 'delete_draft',
    label: 'Delete the old spring menu',
    args: { draft: 'Spring menu (old)' },
  };
  yield { type: 'approval-request', id, scopeLabel: 'this conversation', await: true };
  yield { type: 'status', text: 'Waiting for your approval…' };
  const response = await waitFor(id);
  yield { type: 'status', text: '' };
  if (response.type === 'approval' && response.decision === 'denied') {
    yield { type: 'tool-result', id, error: 'The reader kept the draft.' };
    yield* streamWords('I kept the old spring menu.', signal);
  } else {
    await sleep(500, signal);
    yield { type: 'tool-result', id, result: { deleted: 'Spring menu (old)' } };
    yield* streamWords('Done: the old spring menu is gone.', signal);
  }
  yield { type: 'finish' };
};

/** The tool call the reader decided on in the reply the conversation ends with, if any. */
function findDecidedCall(message: ChatMessageData | undefined) {
  return message?.parts.find(
    (part) =>
      part.type === 'tool-call' &&
      part.result === undefined &&
      part.status !== 'cancelled' &&
      (part.approval?.decision !== undefined || part.approval?.isAutoApproved === true),
  );
}

const approvalTurn: ChatSendFunction = async function* (messages, { signal }) {
  const decided = findDecidedCall(messages.at(-1));
  if (decided?.type !== 'tool-call') {
    const id = nextId('call');
    await sleep(300, signal);
    yield {
      type: 'tool-call',
      id,
      name: 'rename_recipe',
      label: 'Rename the recipe to Weeknight chili',
    };
    yield { type: 'approval-request', id, scopeLabel: 'this conversation' };
    yield { type: 'finish' };
    return;
  }
  if (decided.status === 'denied') {
    yield* streamWords('I left the name as it was.', signal);
  } else {
    await sleep(400, signal);
    yield { type: 'tool-result', id: decided.id, result: { name: 'Weeknight chili' } };
    yield* streamWords('Renamed it to Weeknight chili.', signal);
  }
  yield { type: 'finish' };
};

const beans = [
  {
    id: 'black',
    label: 'Black beans',
    description: 'Earthy, hold their shape',
    isRecommended: true,
  },
  { id: 'kidney', label: 'Kidney beans', description: 'Classic and firm' },
  { id: 'pinto', label: 'Pinto beans', description: 'Creamy once cooked' },
];

const question: ChatSendFunction = async function* (_messages, { signal, waitFor }) {
  const id = nextId('question');
  await sleep(300, signal);
  yield {
    type: 'question',
    id,
    await: true,
    questions: [
      {
        id: 'beans',
        question: 'Which beans should the chili use?',
        header: 'Beans',
        selectionMode: 'single',
        options: beans,
        allowsOther: true,
      },
    ],
  };
  const response = await waitFor(id);
  const [first] = response.type === 'question' ? response.answers : [];
  const chosen =
    beans.find((bean) => first?.optionIds.includes(bean.id))?.label ?? first?.otherText;
  yield* streamWords(chosen ? `${chosen} it is.` : 'No problem, I will choose.', signal);
  yield { type: 'finish' };
};

const attempts = new Map<string, number>();

const failure: ChatSendFunction = async function* (messages, { signal }) {
  const key = messages.findLast((message) => message.authorId === readerId)?.id ?? '';
  const attempt = (attempts.get(key) ?? 0) + 1;
  attempts.set(key, attempt);
  yield* streamWords('Checking the pantry list', signal);
  if (attempt === 1) {
    yield { type: 'error', message: 'The pantry service is busy. Try again.' };
    return;
  }
  yield* streamWords(': you have rice, lentils and two onions.', signal);
  yield { type: 'finish' };
};

const everything: ChatSendFunction = async function* (_messages, { signal }) {
  const plan = nextId('plan');
  const call = nextId('call');
  const step = (stepId: string, status: 'in-progress' | 'done') =>
    ({ type: 'plan-step', planId: plan, stepId, status }) as const;
  yield {
    type: 'plan',
    id: plan,
    title: 'Dinner for four',
    steps: [
      { id: 'find', label: 'Find a recipe', status: 'in-progress' },
      { id: 'list', label: 'Write the shopping list', status: 'pending' },
    ],
  };
  yield { type: 'reasoning-delta', id: nextId('reasoning'), text: 'Four people, one pot.' };
  await sleep(300, signal);
  yield { type: 'tool-call', id: call, name: 'search_recipes', args: { query: 'one-pot dinner' } };
  await sleep(300, signal);
  yield { type: 'tool-result', id: call, result: ['Black bean chili'] };
  yield step('find', 'done');
  yield step('list', 'in-progress');
  yield {
    type: 'source',
    source: { id: 'guide', title: 'The bean guide', url: 'https://example.com/beans' },
  };
  yield* streamWords('Black bean chili feeds four [1].', signal);
  yield {
    type: 'code',
    code: 'beans: 500 g\nonions: 2\ntomatoes: 800 g',
    title: 'shopping-list.txt',
  };
  yield { type: 'code', code: '$ print shopping-list.txt\nbeans: 500 g', variant: 'terminal' };
  yield { type: 'diff', title: 'menu.md', oldText: 'Monday: soup', newText: 'Monday: chili' };
  yield {
    type: 'file',
    attachment: { id: nextId('file'), name: 'chili.pdf', mediaType: 'application/pdf' },
  };
  yield { type: 'custom', name: 'timer', data: { minutes: 60 } };
  yield step('list', 'done');
  yield { type: 'finish' };
};

export const agents: Record<LabScenario, ChatSendFunction> = {
  answer,
  'approval-awaited': approvalAwaited,
  'approval-turn': approvalTurn,
  question,
  failure,
  everything,
  'ag-ui': agUiSend,
  'ai-sdk': aiSdkSend,
};
