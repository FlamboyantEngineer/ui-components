import {
  reduceChatStream,
  type ChatStreamEvent,
} from '../../src/components/chat-controller/chat-controller.js';
import type { ChatMessageData } from '../../src/components/chat-parts/chat-parts.js';
import { helperId } from './chat-controller-agents.js';
import { ChatControllerDemo } from './chat-controller-demo.js';
import { LabMessage } from './chat-controller-parts.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const reply: ChatMessageData = {
  id: 'matrix-reply',
  authorId: helperId,
  createdAt: '2026-04-20T10:00:00.000Z',
  parts: [],
  status: 'streaming',
};

const sample: ChatStreamEvent[] = [
  { type: 'status', text: 'Looking up the recipe…' },
  { type: 'reasoning-delta', id: 'r', text: 'A quick weeknight dish.' },
  { type: 'reasoning-end', id: 'r', durationMs: 1200 },
  { type: 'tool-call', id: 'matrix-call', name: 'search_recipes', args: { query: 'beans' } },
  { type: 'tool-result', id: 'matrix-call', result: ['Black bean chili'], durationMs: 800 },
  { type: 'text-delta', text: 'Black bean chili ' },
  { type: 'text-delta', text: 'takes an hour.' },
];

const endings = {
  finish: { type: 'finish' },
  error: { type: 'error', message: 'The recipe service is busy.' },
} as const satisfies Record<string, ChatStreamEvent>;

/** The reply after the first `count` events, then the ending once every sample event is in. */
function foldSample(ending: keyof typeof endings, count: string): ChatMessageData {
  const events = count === 'end' ? [...sample, endings[ending]] : sample.slice(0, Number(count));
  return events.reduce((message, event) => reduceChatStream(message, event), reply);
}

mountLab(
  <>
    <LabSection
      title="Fake agent"
      description="Pick a behaviour and send a message. Approval, next turn pauses before finishing: approve during that pause and the call keeps running into the continuation until its result arrives. Choose Always allow, then send another message to see automatic approval follow the same path. Messages sent while a reply runs wait in the queue; approvals and questions answer through the cards, and Send the wrong kind of response (a decision for a question, answers for an approval) changes nothing; files named broken… fail their first upload. Send now stops the running reply and sends its message ahead of the queue, which follows once that reply ends. Add an older message edits the conversation through updateMessages while a reply streams, keeping the reply, the queue and the uploads. Load the soup conversation replaces it through resetConversation with another history, dropping the running reply, the queue and the files. Streamed deltas reach the chat once per frame, however fast they arrive."
    >
      <ChatControllerDemo />
    </LabSection>
    <LabSection
      title="Reducer"
      description="reduceChatStream folds a sample stream into a reply: after the first events, and once it ends."
    >
      <StateMatrix
        axes={{ ending: ['finish', 'error'], events: ['1', '3', '5', '7', 'end'] } as const}
        render={({ ending, events }) => <LabMessage message={foldSample(ending, events)} />}
      />
    </LabSection>
  </>,
);
