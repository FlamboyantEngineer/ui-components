// The Chat lab's conversation between two people: delivery, retry, edits, replies, reactions,
// deletion, typing, presence and the per-conversation draft.

import { useState } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import type { ChatMessageData } from '../../src/components/chat-parts/index.js';
import { usePeopleHost } from './chat-people-host.js';
import { ana, pairPeople, readerId, textMessage } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

const pairMessages: ChatMessageData[] = [
  textMessage({
    id: 'pair-1',
    authorId: 'ana',
    time: '2026-04-19T18:02:00',
    text: 'Are we still on for the market on Saturday?',
  }),
  textMessage({
    id: 'pair-1b',
    authorId: readerId,
    time: '2026-04-19T18:04:00',
    text: 'Yes! 9 at the main gate?',
    delivery: 'read',
  }),
  textMessage({
    id: 'pair-2',
    authorId: readerId,
    time: '2026-04-19T18:05:00',
    text: 'Yes! 9 at the main gate?',
    delivery: 'read',
  }),
  textMessage({
    id: 'pair-3',
    authorId: 'ana',
    time: '2026-04-19T18:06:00',
    text: 'Perfect. I will bring the big bags.',
    reactions: [{ emoji: '👍', isReacted: true, people: ['Sam Reed'] }],
  }),
  textMessage({
    id: 'pair-4',
    authorId: readerId,
    time: '2026-04-20T08:40:00',
    text: 'Can you also pick up coffee beans on the way?',
    delivery: 'failed',
  }),
];

const anaReplies = [
  'Sounds good!',
  'Sure, I will check the stall by the fountain.',
  'Ha, deal. See you there.',
];

/** The conversation with Ana, whose host owns the messages and answers each one. */
function PairDemo() {
  const host = usePeopleHost({
    initialMessages: pairMessages,
    replier: { id: ana.id, replies: anaReplies },
  });
  const [copied, setCopied] = useState('nothing');
  return (
    <div style={{ height: 520 }} data-lab-demo="pair">
      <Chat
        {...host}
        participants={pairPeople}
        currentUserId={readerId}
        conversationId="lab-pair-ana"
        title="Ana Lopez"
        placeholder="Message Ana"
        onCopy={(id) => setCopied(id)}
        headerActions={<output data-lab-output="pair-copied">Copied: {copied}</output>}
      />
    </div>
  );
}

export function ChatPeopleCases() {
  return (
    <LabSection
      title="Between two people"
      description="Your messages walk through Sending, Sent, Delivered and Read; the failed one offers Retry. Ana shows as Active in the header, types (the indicator under the transcript) and answers. Hover or focus a message for its actions: Reply quotes it in a banner above the composer, React adds an emoji, and on your own messages Edit (or Up in the empty composer) edits it in place and Delete asks first. Your first answer went twice with the same words: Edit on either starts from that message, leaving any edit of the other. Deleting the message you are replying to ends the reply and keeps your words. Ana's side takes a moment to store an edit: words you add while it saves stay in the composer for another Save. Your draft is kept for this conversation: type, reload the page, and it is still there."
    >
      <PairDemo />
    </LabSection>
  );
}
