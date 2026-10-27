// The Chat lab's message display: avatars, author names, time placements and message backgrounds.

import { useState } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import { useChatController } from '../../src/components/chat-controller/index.js';
import type { ChatMessageData } from '../../src/components/chat-parts/index.js';
import type { ChatSource } from '../../src/components/chat-sources/index.js';
import type { ChatMessageTimePlacement } from '../../src/components/chat-transcript/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Choice, ChoiceGroup } from '../../src/components/choice-group/choice-group.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { agents } from './chat-agent.js';
import { assistantPeople, plannerId, readerId, textMessage } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

const cafeSource: ChatSource = {
  id: 'cafes',
  title: 'Cafes on Castle square',
  url: 'https://example.com/castle-square/cafes',
  snippet: 'Three cafes serve lunch from noon, with tables on the square.',
};

const gardenSource: ChatSource = {
  id: 'gardens',
  title: 'Castle gardens opening hours',
  url: 'https://example.com/castle/gardens',
  snippet: 'The gardens open at nine every day except Monday.',
};

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
  {
    id: 'display-4',
    authorId: plannerId,
    createdAt: '2026-04-20T10:02:30',
    parts: [
      {
        type: 'reasoning',
        id: 'display-4-reasoning',
        text: 'Lunch near the castle: look for cafes on the square below it.',
        status: 'complete',
        durationMs: 1800,
      },
      {
        type: 'tool-call',
        id: 'display-4-search',
        name: 'search_places',
        label: 'Searched cafes near the castle',
        kind: 'search',
        status: 'succeeded',
        args: { near: 'Castle square', type: 'cafe' },
        result: { count: 3 },
      },
    ],
  },
  {
    id: 'display-5',
    authorId: plannerId,
    createdAt: '2026-04-20T10:03:00',
    parts: [
      {
        type: 'text',
        text: 'The square below the castle has a few small cafes with lunch menus [1].',
      },
      { type: 'sources', sources: [cafeSource] },
    ],
  },
  {
    id: 'display-6',
    authorId: plannerId,
    createdAt: '2026-04-20T10:03:10',
    parts: [{ type: 'sources', sources: [gardenSource] }],
  },
];

const timePlacements: Record<ChatMessageTimePlacement, string> = {
  none: 'Hidden',
  header: 'Beside the name',
  footer: 'Under the message, on hover',
  tooltip: 'In a tooltip, on hover',
};

/** A row of time placements for one kind of message. */
function TimePlacementChoice({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ChatMessageTimePlacement;
  onChange: (value: ChatMessageTimePlacement) => void;
}) {
  return (
    <ChoiceGroup
      label={label}
      orientation="horizontal"
      value={value}
      onChange={(next) => onChange((next ?? value) as ChatMessageTimePlacement)}
    >
      {Object.entries(timePlacements).map(([placement, placementLabel]) => (
        <Choice key={placement} value={placement}>
          {placementLabel}
        </Choice>
      ))}
    </ChoiceGroup>
  );
}

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
  const [activityTimePlacement, setActivityTimePlacement] =
    useState<ChatMessageTimePlacement>('none');
  const [collapseFooterTime, setCollapseFooterTime] = useState(true);
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
        <Checkbox isSelected={collapseFooterTime} onChange={setCollapseFooterTime}>
          Room for the time only on hover
        </Checkbox>
        <Checkbox isSelected={receivedBubble} onChange={setReceivedBubble}>
          Background on replies
        </Checkbox>
      </Cluster>
      <TimePlacementChoice
        label="Message times"
        value={timePlacement}
        onChange={setTimePlacement}
      />
      <TimePlacementChoice
        label="Times without written text"
        value={activityTimePlacement}
        onChange={setActivityTimePlacement}
      />
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
          activityTimePlacement={activityTimePlacement}
          collapseFooterTime={collapseFooterTime}
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
      description="Avatars, author names, times and message backgrounds are each optional. The demo starts minimal: no avatars or names, each time under its message only while the message is hovered or holds focus, with its actions, its line taking no room until it opens after a short pause (the day separators stay), and no time on the planner's entries without written text, such as its reasoning, tool calls and sources, your messages in bubbles and the planner's replies as plain text across the width. Each message keeps its author and time in its accessible name. Messages without written text take their own time placement; a written reply with sources keeps its one time. Without room for the time only on hover, each message keeps the time's line. A tooltip shows the time over a message after the tooltip delay. Toggle the options to compare with the default look."
    >
      <DisplayDemo />
    </LabSection>
  );
}
