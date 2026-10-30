// The Chat lab's streaming caret: off by default, and with `streamingCaret` shown only while a
// reply's text streams in.

import { Chat } from '../../src/components/chat/index.js';
import type { ChatMessageData, ChatPart } from '../../src/components/chat-parts/index.js';
import { assistantPeople, getLabNow, plannerId, readerId, textMessage } from './chat-samples.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const replies = ['writing', 'thinking', 'tool call', 'complete', 'cancelled'] as const;

type Reply = (typeof replies)[number];

const text: ChatPart = {
  type: 'text',
  text: 'Saturday morning suits the castle',
  status: 'streaming',
};

const tool: ChatPart = {
  type: 'tool-call',
  id: 'hours',
  name: 'get_opening_hours',
  label: 'Checking opening hours',
  kind: 'fetch',
  status: 'running',
};

const replyByState: Record<Reply, Pick<ChatMessageData, 'status' | 'parts'>> = {
  writing: { status: 'streaming', parts: [text] },
  thinking: { status: 'streaming', parts: [] },
  'tool call': { status: 'streaming', parts: [text, tool] },
  complete: { status: 'complete', parts: [{ ...text, status: 'complete' }] },
  cancelled: { status: 'cancelled', parts: [text] },
};

/** The reader's question and the assistant's reply in `reply`, with ids unique to the cell. */
function caretMessages(reply: Reply, caret: string): ChatMessageData[] {
  const prefix = `caret-${caret}-${replies.indexOf(reply)}`;
  return [
    textMessage({
      id: `${prefix}-1`,
      authorId: readerId,
      time: '2026-04-20T10:00:00',
      text: 'Which day is best for the castle?',
    }),
    {
      id: `${prefix}-2`,
      authorId: plannerId,
      createdAt: '2026-04-20T10:00:05',
      ...replyByState[reply],
    },
  ];
}

export function ChatCaretCases() {
  return (
    <LabSection
      title="Streaming caret"
      description="No caret by default: a streaming reply is busy and keeps its thinking line either way. With streamingCaret a caret follows the reply only while its text streams in, not while it thinks or runs a tool, and not once it completes or is cancelled."
    >
      <StateMatrix
        axes={{ caret: ['default', 'streamingCaret'], reply: replies }}
        render={({ caret, reply }) => (
          <div style={{ height: 240 }}>
            <Chat
              aria-label={`Conversation (${caret}, ${reply})`}
              messages={caretMessages(reply, caret)}
              participants={assistantPeople}
              currentUserId={readerId}
              getNow={getLabNow}
              streamingCaret={caret === 'streamingCaret'}
              placeholder="Ask the trip planner…"
              onSend={() => undefined}
            />
          </div>
        )}
      />
    </LabSection>
  );
}
