// The Chat lab's group conversations: days, groups, mentions, receipts, unread, older history,
// quotes, and a very long virtualized history.

import { useMemo, useState } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import { useOlderHistory, usePeopleHost } from './chat-people-host.js';
import { getLabNow, readerId, teamPeople } from './chat-samples.js';
import {
  createLongHistory,
  teamFirstUnread,
  teamMessages,
  teamOlderPages,
  teamReadPositions,
} from './chat-team-samples.js';
import { LabSection } from './chrome/index.js';

/** The team's conversation, with older pages that load near the top. */
function TeamDemo() {
  const host = usePeopleHost({ initialMessages: teamMessages });
  const older = useOlderHistory(teamOlderPages, host.setMessages);
  const [lastRead, setLastRead] = useState('none');
  return (
    <div style={{ height: 460 }} data-lab-demo="team">
      <Chat
        {...host}
        participants={teamPeople}
        currentUserId={readerId}
        conversationId="lab-team"
        title="Hiking group"
        placeholder="Message the hiking group"
        getNow={getLabNow}
        readPositions={teamReadPositions}
        firstUnreadId={teamFirstUnread}
        onRead={setLastRead}
        {...older}
        headerActions={<output data-lab-output="team-read">Read up to {lastRead}</output>}
      />
    </div>
  );
}

/** Five thousand messages, mounted only near the view, searched as data. */
function LongHistoryDemo() {
  const initialMessages = useMemo(() => createLongHistory(5000), []);
  const host = usePeopleHost({ initialMessages });
  return (
    <div style={{ height: 420 }} data-lab-demo="long">
      <Chat
        {...host}
        participants={teamPeople}
        currentUserId={readerId}
        title="Club archive"
        showSearch
        virtualized
        getNow={getLabNow}
        placeholder="Message the club"
      />
    </div>
  );
}

export function ChatGroupCases() {
  return (
    <>
      <LabSection
        title="Group conversation"
        description="Messages group by author within five minutes and a date separator leads each day; mentions show as pills. The avatars under a message are the people who read up to it (press them for the list). The New messages divider marks the first unread message, the bar above says how many are unread with a Jump button, and scrolling up loads older history while keeping your place. Press the quote in Ana's 8:30 message to jump to the message it answers, highlighted."
      >
        <TeamDemo />
      </LabSection>
      <LabSection
        title="Very long history"
        description="Five thousand messages, virtualized: only the messages near the view are mounted. The search in the header searches the conversation's data, so “lighthouse” finds message 41 although it is not mounted, scrolls to it and highlights it; Enter and Shift+Enter step through matches and Escape returns to the found message."
      >
        <LongHistoryDemo />
      </LabSection>
    </>
  );
}
