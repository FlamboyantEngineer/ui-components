// The Chat lab's message display: avatars, author names, time placement and message backgrounds.

import { useState } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import { useChatController } from '../../src/components/chat-controller/index.js';
import type { ChatMessageData } from '../../src/components/chat-parts/index.js';
import type { ChatMessageTimePlacement } from '../../src/components/chat-transcript/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Choice, ChoiceGroup } from '../../src/components/choice-group/choice-group.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { agents } from './chat-agent.js';
import { assistantPeople, plannerId, readerId, textMessage } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

const initialMessages: ChatMessageData[] = [
  textMessage({
    id: 'display-1',
    authorId: readerId,
    time: '2026-04-20T10:00:00',
    text: 'Which day suits the castle best?',
  }),
  textMessage({
    id: 'display-2',
    authorId: plannerId,
    time: '2026-04-20T10:01:00',
    text: 'Go on **Tuesday** morning: the queues are shortest before ten, and the gardens open at nine.',
  }),
  textMessage({
    id: 'display-3',
    authorId: readerId,
    time: '2026-04-20T10:02:00',
    text: 'And where should we eat after?',
  }),
  textMessage({
    id: 'display-4',
    authorId: plannerId,
    time: '2026-04-20T10:03:00',
    text: 'The square below the castle has a few small cafes with lunch menus.',
  }),
];

const timePlacements: Record<ChatMessageTimePlacement, string> = {
  none: 'Hidden',
  header: 'Beside the name',
  footer: 'Under the message, on hover',
};

/** A trip planner with every display option under the reader's control; it starts with the minimal look. */
function DisplayDemo() {
  const controller = useChatController({
    send: agents.answer,
    currentUserId: readerId,
    assistantId: plannerId,
    initialMessages,
  });
  const [showAvatars, setShowAvatars] = useState(false);
  const [showAuthorNames, setShowAuthorNames] = useState(false);
  const [timePlacement, setTimePlacement] = useState<ChatMessageTimePlacement>('footer');
  const [sentBubble, setSentBubble] = useState(true);
  const [receivedBubble, setReceivedBubble] = useState(false);
  return (
    <Stack space="sm" data-lab-demo="display">
      <Cluster space="md">
        <Checkbox isSelected={showAvatars} onChange={setShowAvatars}>
          Avatars
        </Checkbox>
        <Checkbox isSelected={showAuthorNames} onChange={setShowAuthorNames}>
          Names
        </Checkbox>
        <Checkbox isSelected={sentBubble} onChange={setSentBubble}>
          Background on my messages
        </Checkbox>
        <Checkbox isSelected={receivedBubble} onChange={setReceivedBubble}>
          Background on replies
        </Checkbox>
      </Cluster>
      <ChoiceGroup
        label="Times"
        orientation="horizontal"
        value={timePlacement}
        onChange={(value) => setTimePlacement((value ?? 'footer') as ChatMessageTimePlacement)}
      >
        {Object.entries(timePlacements).map(([value, label]) => (
          <Choice key={value} value={value}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>
      <div style={{ height: 460, maxWidth: 640 }}>
        <Chat
          {...controller.props}
          aria-label="Conversation with the trip planner"
          participants={assistantPeople}
          currentUserId={readerId}
          placeholder="Ask the trip planner…"
          showAvatars={showAvatars}
          showAuthorNames={showAuthorNames}
          timePlacement={timePlacement}
          sentVariant={sentBubble ? 'bubble' : 'plain'}
          receivedVariant={receivedBubble ? 'bubble' : 'plain'}
          onCopy={() => undefined}
        />
      </div>
    </Stack>
  );
}

export function ChatDisplayCases() {
  return (
    <LabSection
      title="Message display"
      description="Avatars, author names, times and message backgrounds are each optional. The demo starts minimal: no avatars or names, each time under its message only while the message is hovered or holds focus, with its actions (the day separators stay), your messages in bubbles and the planner's replies as plain text across the width. Each message keeps its author and time in its accessible name. Toggle the options to compare with the default look."
    >
      <DisplayDemo />
    </LabSection>
  );
}
