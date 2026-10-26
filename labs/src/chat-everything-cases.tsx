// The Chat lab's first section: one chat with every feature, where a team and a trip planner talk.

import { useState } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import { Stack } from '../../src/components/layout/layout.js';
import { useCallbackLog } from './chat-assistant-host.js';
import { useEverythingChat } from './chat-everything-host.js';
import {
  everythingFirstUnread,
  everythingPeople,
  everythingReadPositions,
  plannerCommands,
} from './chat-everything-samples.js';
import { forecastRenderer, renderLabPart } from './chat-parts-samples.js';
import { readerId } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

/** Each feature and how to try it. */
function FeatureList() {
  return (
    <ul data-lab-features="">
      <li>
        <strong>History:</strong> scroll to the top to load two older pages; a date separator leads
        each day and messages group by author.
      </li>
      <li>
        <strong>Unread and receipts:</strong> the New messages divider, the unread bar with Jump,
        and the avatars of who read up to a message (press them for the list).
      </li>
      <li>
        <strong>Delivery, typing and presence:</strong> message the team and watch Sending, Sent,
        Delivered and Read while Ana types and answers; Retry the failed pastries message. The
        header lists everyone with their presence.
      </li>
      <li>
        <strong>Messages:</strong> reactions on Ben&apos;s message, Ana&apos;s quote that jumps to
        the message it answers, an edited and a deleted message, mention pills, and photos that open
        the media viewer beside a PDF.
      </li>
      <li>
        <strong>The planner:</strong> type / and pick <code>summarize</code> (steps with a custom
        forecast, a status line, then Markdown with a table, code with Copy and Apply, and citations
        with sources), <code>book</code> (an approval awaited in the stream: Approve, Deny with a
        reason, Always allow), <code>cancel</code> (an approval answered by a new turn),{' '}
        <code>ask</code> (questions with previews), <code>plan</code> (a plan with its status line,
        a diff and a terminal block) or <code>ferry</code> (fails once: Retry). Mention @Trip
        planner for a plain answer.
      </li>
      <li>
        <strong>Stop and queue:</strong> Stop ends a reply and keeps its text; messages to the
        planner sent while it replies wait above the composer, where you can edit or remove them.
      </li>
      <li>
        <strong>Composer:</strong> @ mentions and / commands become pills; attached files show their
        upload (a file named broken… fails once: Retry); the draft survives a reload; Up in the
        empty composer recalls what you sent.
      </li>
      <li>
        <strong>Model picker:</strong> choose the model and effort beside Send; each planner reply
        names them.
      </li>
      <li>
        <strong>Commands and search:</strong> hover a message to copy it, rate a planner reply with
        reasons, and search the conversation from the header.
      </li>
      <li>
        <strong>Not here:</strong> with an assistant in the conversation, Chat offers the
        assistant&apos;s commands rather than Reply, React, Edit, Delete and the emoji picker; try
        those in Between two people and Group conversation.
      </li>
    </ul>
  );
}

/** The team's conversation with the planner, and what the host received. */
function EverythingDemo() {
  const [log, record] = useCallbackLog();
  const [lastRead, setLastRead] = useState('none');
  const { allowed, chatProps } = useEverythingChat(record);
  return (
    <Stack space="sm" data-lab-demo="everything">
      <div style={{ height: 680 }}>
        <Chat
          {...chatProps}
          participants={everythingPeople}
          currentUserId={readerId}
          conversationId="lab-everything"
          title="Lisbon weekend"
          showSearch
          placeholder="Message the team, or type / for the trip planner"
          commands={plannerCommands}
          toolRenderers={{ get_weather: forecastRenderer }}
          renderPart={renderLabPart}
          readPositions={everythingReadPositions}
          firstUnreadId={everythingFirstUnread}
          onRead={setLastRead}
        />
      </div>
      <p>
        Read up to <output data-lab-output="everything-read">{lastRead}</output>
        {' · '}
        Always allowed:{' '}
        <output data-lab-output="everything-allowed">{allowed.join(', ') || 'nothing'}</output>
        {' · '}
        Host callbacks:{' '}
        <output data-lab-output="everything-log">{log.join(' · ') || 'none'}</output>
      </p>
    </Stack>
  );
}

export function ChatEverythingCases() {
  return (
    <LabSection
      title="Everything in one chat"
      description="A team plans a weekend with a trip planner in the conversation. A message with a / command or an @Trip planner mention goes to the planner, a fake agent streaming through useChatController; any other message goes to the team."
    >
      <FeatureList />
      <EverythingDemo />
    </LabSection>
  );
}
