import { useState } from 'react';
import {
  ChatMessageActionsMenu,
  type ChatFeedback,
  type ChatMessageCommandProps,
} from '../../src/components/chat-message-actions/chat-message-actions.js';
import {
  ChatMessage,
  ChatTranscript,
} from '../../src/components/chat-transcript/chat-transcript.js';
import { samplePicture } from './people-samples.js';

/** A fixed clock, so every time reads the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

export const feedbackReasons = ['Accurate', 'Helpful', 'Too long', 'Off topic'];

/** Formats what a rating reported, for a demo's log. */
export function describeFeedback(feedback: ChatFeedback): string {
  const parts = [`rating ${feedback.rating ?? 'cleared'}`];
  if (feedback.reasons.length > 0) parts.push(`reasons ${feedback.reasons.join(', ')}`);
  if (feedback.comment) parts.push(`comment "${feedback.comment}"`);
  return parts.join('; ');
}

const helper = {
  name: 'Travel helper',
  src: samplePicture,
  colorKey: 'helper',
  shape: 'rounded' as const,
};
const ana = { name: 'Ana Lima', colorKey: 'ana' };
const maria = { name: 'Maria Santos', colorKey: 'maria' };

interface DemoMessage {
  id: string;
  author: typeof ana | typeof helper;
  origin: 'sent' | 'received';
  minute: number;
  text: string;
  commands: (log: (entry: string) => void, message: MessageControls) => ChatMessageCommandProps;
}

interface MessageControls {
  edit: () => void;
  remove: () => void;
}

const messages: DemoMessage[] = [
  {
    id: 'question',
    author: maria,
    origin: 'sent',
    minute: 2,
    text: 'Which tram goes to the castle?',
    commands: (log, message) => ({
      onReply: () => log('reply to Maria'),
      onReact: (emoji) => log(`react ${emoji}`),
      onEdit: message.edit,
      onDelete: message.remove,
    }),
  },
  {
    id: 'answer',
    author: helper,
    origin: 'received',
    minute: 3,
    text: 'Take the 28 tram to the castle, then walk down to the river.',
    commands: (log) => ({
      copyText: 'Take the 28 tram to the castle, then walk down to the river.',
      onFeedback: (feedback) => log(describeFeedback(feedback)),
      feedbackReasons,
    }),
  },
  {
    id: 'ana',
    author: ana,
    origin: 'received',
    minute: 9,
    text: 'I can meet you at the river at noon.',
    commands: (log) => ({
      copyText: 'I can meet you at the river at noon.',
      onReply: () => log('reply to Ana'),
      onReact: (emoji) => log(`react ${emoji}`),
    }),
  },
];

/** A message's content: its text, the edit field while editing, or the deleted notice. */
function MessageContent({
  text,
  state,
  onSave,
}: {
  text: string;
  state: 'shown' | 'editing' | 'deleted';
  onSave: (text: string) => void;
}) {
  const [draft, setDraft] = useState(text);
  if (state === 'deleted') return <em>Message deleted</em>;
  if (state === 'shown') return text;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <input
        aria-label="Edit message"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button type="submit">Save</button>
    </form>
  );
}

/** One demo message wrapped in its context menu, with its bar. */
function DemoEntry({ message, log }: { message: DemoMessage; log: (entry: string) => void }) {
  const [text, setText] = useState(message.text);
  const [state, setState] = useState<'shown' | 'editing' | 'deleted'>('shown');
  const controls = {
    edit: () => setState('editing'),
    remove: () => (setState('deleted'), log(`delete ${message.id}`)),
  };
  const commands = state === 'deleted' ? {} : message.commands(log, controls);
  return (
    <ChatMessageActionsMenu {...commands}>
      {(actions) => (
        <ChatMessage
          origin={message.origin}
          author={message.author}
          time={new Date(2026, 3, 20, 10, message.minute).toISOString()}
          getNow={getNow}
          actions={actions}
          data-lab-message={message.id}
        >
          <MessageContent
            text={text}
            state={state}
            onSave={(next) => {
              setText(next);
              setState('shown');
              log(`edit saved "${next}"`);
            }}
          />
        </ChatMessage>
      )}
    </ChatMessageActionsMenu>
  );
}

/** A short conversation whose messages offer their commands in a bar and a context menu. */
export function ConversationDemo() {
  const [entries, setEntries] = useState<string[]>([]);
  const log = (entry: string) => setEntries((list) => [entry, ...list].slice(0, 4));
  return (
    <div data-lab-demo="conversation">
      <div style={{ height: 320 }}>
        <ChatTranscript aria-label="Trip planning">
          {messages.map((message) => (
            <DemoEntry key={message.id} message={message} log={log} />
          ))}
        </ChatTranscript>
      </div>
      <output data-lab-log="conversation">{entries.join(' · ')}</output>
    </div>
  );
}
