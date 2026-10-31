// The Chat lab's inline options: a host that writes its callbacks and thinking icon inline, so
// they are new on every render, while a reply streams word by word.

import { useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Chat } from '../../src/components/chat/index.js';
import type { ChatCustomPart, ChatMessageData } from '../../src/components/chat-parts/index.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { assistantPeople, plannerId, readerId, textMessage } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

const words = 'The castle opens at nine, so a Saturday morning visit beats the crowds.'.split(' ');

/** One word of the reply, in milliseconds. */
const tick = 150;

const earlier: ChatMessageData[] = [
  textMessage({
    id: 'inline-1',
    authorId: readerId,
    time: '2026-04-20T10:00:00',
    text: 'Save the castle for the weekend.',
  }),
  {
    id: 'inline-2',
    authorId: plannerId,
    createdAt: '2026-04-20T10:00:05',
    status: 'complete',
    parts: [
      { type: 'text', text: 'Saved to your trip:' },
      { type: 'custom', id: 'place', name: 'place', data: 'Hill castle, open 9:00 to 17:00' },
    ],
  },
  textMessage({
    id: 'inline-3',
    authorId: readerId,
    time: '2026-04-20T10:01:00',
    text: 'When should we go?',
  }),
];

/** The streaming reply after `count` words. */
function replyAfter(count: number): ChatMessageData {
  const isDone = count >= words.length;
  return {
    id: 'inline-4',
    authorId: plannerId,
    createdAt: '2026-04-20T10:01:05',
    status: isDone ? 'complete' : 'streaming',
    parts:
      count === 0
        ? []
        : [
            {
              type: 'text',
              text: words.slice(0, count).join(' '),
              status: isDone ? 'complete' : 'streaming',
            },
          ],
  };
}

/** A host that renders on every word and passes every option inline. */
function InlineOptionsHost() {
  const [count, setCount] = useState(words.length);
  const [tally] = useState(() => ({ draws: 0 }));
  useEffect(() => {
    if (count >= words.length) return undefined;
    const timer = window.setTimeout(() => setCount((value) => value + 1), tick);
    return () => window.clearTimeout(timer);
  }, [count]);
  const isPlaying = count < words.length;
  return (
    <Stack space="sm" data-lab-demo="inline-options">
      <Cluster space="sm">
        <Button
          isDisabled={isPlaying}
          onPress={() => {
            tally.draws = 0;
            setCount(0);
          }}
        >
          Stream a reply
        </Button>
        <span>{isPlaying ? 'Streaming' : 'Done'}</span>
        <span>Saved place drawn again: {tally.draws}</span>
      </Cluster>
      <div style={{ height: 360 }}>
        <Chat
          aria-label="Conversation with inline options"
          messages={[...earlier, replyAfter(count)]}
          participants={assistantPeople}
          currentUserId={readerId}
          getNow={() => new Date('2026-04-20T10:30:00')}
          scrollMode="follow"
          thinkingIcon={
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <circle cx="8" cy="8" r="6" />
            </svg>
          }
          renderPart={(part: ChatCustomPart) => {
            tally.draws += 1;
            return <strong>{String(part.data)}</strong>;
          }}
          onCopy={() => undefined}
          onRetry={() => undefined}
          placeholder="Ask the trip planner…"
          onSend={() => undefined}
        />
      </div>
    </Stack>
  );
}

export function ChatInlineOptionsCases() {
  return (
    <LabSection
      title="Inline options"
      description="A host that renders on every streamed word and writes renderPart, getNow, onCopy, onRetry and a thinkingIcon element inline, so each is new on every render. Only the streaming reply renders again: the saved place drawn by renderPart in an earlier reply is not drawn again while the reply streams."
    >
      <InlineOptionsHost />
    </LabSection>
  );
}
