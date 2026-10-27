// The Chat lab's send shortcuts and queue: a slow assistant, the submit chord, and what each key does.

import { useState } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import {
  useChatController,
  type ChatSendFunction,
} from '../../src/components/chat-controller/index.js';
import type { MessageComposerSubmitShortcut } from '../../src/components/message-composer/index.js';
import { Choice, ChoiceGroup } from '../../src/components/choice-group/choice-group.js';
import { Stack } from '../../src/components/layout/layout.js';
import { KeyHints, type KeyHint } from '../../src/components/shortcut/index.js';
import { agentTiming, sleep, streamText } from './chat-agent-stream.js';
import { assistantPeople, plannerId, readerId } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

/** Thinks for a moment, then echoes the reader's latest message slowly, so a queue can build up. */
const slowEcho: ChatSendFunction = async function* (messages, { signal }) {
  const latest = messages.findLast((message) => message.authorId === readerId);
  const text = latest?.parts.map((part) => (part.type === 'text' ? part.text : '')).join('') ?? '';
  yield { type: 'status', text: 'Reading your message…' };
  await sleep(agentTiming.word * 15, signal);
  yield* streamText(
    `Noted: **${text.trim() || 'an empty message'}**. I'll take my time answering, so anything you send meanwhile waits in the queue and goes out next, in order.`,
    signal,
  );
  yield { type: 'finish' };
};

const chords = {
  Enter: 'Enter sends',
  'Ctrl+Enter': 'Ctrl+Enter sends',
} as const satisfies Record<MessageComposerSubmitShortcut, string>;

/** The keys the composer answers to now: while idle, and while a reply runs. */
function keyHints(chord: MessageComposerSubmitShortcut, isPending: boolean): KeyHint[] {
  const newLine = chord === 'Enter' ? 'Shift+Enter' : 'Enter';
  return [
    { keys: [chord], action: isPending ? 'queue' : 'send' },
    { keys: [newLine], action: 'new line' },
    { keys: ['↑'], action: 'recall an earlier message' },
  ];
}

/** The slow assistant with a chord picker, the live key legend and the queue's state. */
function QueueDemo() {
  const [chord, setChord] = useState<MessageComposerSubmitShortcut>('Enter');
  const controller = useChatController({
    send: slowEcho,
    currentUserId: readerId,
    assistantId: plannerId,
  });
  const { isPending, queue } = controller.props;
  return (
    <Stack space="sm" data-lab-demo="queue">
      <ChoiceGroup
        label="Submit chord"
        orientation="horizontal"
        value={chord}
        onChange={(value) => setChord((value ?? 'Enter') as MessageComposerSubmitShortcut)}
      >
        {Object.entries(chords).map(([value, label]) => (
          <Choice key={value} value={value}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>
      <KeyHints aria-label="Composer keys" hints={keyHints(chord, isPending)} />
      <div style={{ height: 480, maxWidth: 560 }}>
        <Chat
          {...controller.props}
          participants={assistantPeople}
          currentUserId={readerId}
          conversationId="lab-queue"
          title="Slow assistant"
          placeholder={`Send a few messages in a row (${chord} sends)…`}
          submitShortcut={chord}
        />
      </div>
      <p>
        Reply: <output data-lab-output="queue-state">{isPending ? 'running' : 'idle'}</output>
        {' · '}
        Queued: <output data-lab-output="queue-count">{queue.length}</output>
      </p>
    </Stack>
  );
}

export function ChatQueueCases() {
  return (
    <LabSection
      title="Shortcuts and queue"
      description="A slow assistant that echoes each message, to try the send keys and the queue. Pick the submit chord: with Enter, Enter sends and Shift+Enter breaks the line; with Ctrl+Enter, Enter breaks the line. Ctrl+Enter (Cmd+Enter on macOS) sends with either, and on a touch screen Enter always breaks the line. While a reply runs the same chord queues the message: it waits above the composer, where Edit puts it back in the composer (Save keeps the change, Escape cancels) and Remove drops it, and once the reply ends the first queued message goes out, then the next. The send button is Send while there is text and Stop while the composer is empty; Stop ends the reply and holds the queue: the next message you send joins its end, and the first queued message goes out. The legend shows the keys for the current state."
    >
      <QueueDemo />
    </LabSection>
  );
}
