import {
  ChatMessage,
  ChatReadReceipts,
  groupChatMessages,
  type ChatGroupableMessage,
} from '../../src/components/chat-transcript/index.js';
import { useTimeZone } from '../../src/core/clock.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { at, getNow, helper, team } from './chat-transcript-message-samples.js';

/** A received message with its time in a footer that keeps its line or collapses it until shown. */
function FooterTimeMessage({ line }: { line: 'reserved' | 'collapsing' }) {
  return (
    <ChatMessage
      origin="received"
      author={helper}
      time={at(20, 9, 50)}
      getNow={getNow}
      timePlacement="footer"
      collapseFooterTime={line === 'collapsing'}
    >
      The ridge trail reopened this morning.
    </ChatMessage>
  );
}

/** A received reply, streaming or complete, with or without the caret after its text. */
function CaretMessage({
  caret,
  status,
}: {
  caret: 'on' | 'off';
  status: 'streaming' | 'complete';
}) {
  return (
    <ChatMessage origin="received" author={helper} status={status} streamingCaret={caret === 'on'}>
      {status === 'streaming'
        ? 'The ridge trail reopened'
        : 'The ridge trail reopened this morning.'}
    </ChatMessage>
  );
}

const readers = Object.values(team).filter((person) => person.id !== 'maria');

const limits = { '2': 2, 'default (3)': undefined, '5': 5 } as const;

interface NoteMessage extends ChatGroupableMessage {
  text: string;
}

/** Ana writes four times: four, eight and eighteen minutes apart. */
const notes: readonly NoteMessage[] = [
  { id: 'n1', authorId: 'ana', createdAt: at(20, 10, 0), text: 'Leaving the house now.' },
  { id: 'n2', authorId: 'ana', createdAt: at(20, 10, 4), text: 'Picking up Ben on the way.' },
  { id: 'n3', authorId: 'ana', createdAt: at(20, 10, 12), text: 'Stuck behind a tractor.' },
  { id: 'n4', authorId: 'ana', createdAt: at(20, 10, 30), text: 'At the trailhead.' },
];

const gaps = { 'default (5 min)': undefined, '15 min': 15 * 60_000 } as const;

/** Ana's messages grouped with the default pause between grouped messages, or a longer one. */
function GappedConversation({ maxGap }: { maxGap: number | undefined }) {
  const items = groupChatMessages(notes, { maxGap, timeZone: useTimeZone() });
  return (
    <div style={{ width: 320 }}>
      {items.map((item) =>
        item.kind === 'message' ? (
          <ChatMessage
            key={item.key}
            id={`gap-${maxGap ?? 'default'}-${item.key}`}
            author={team.ana}
            time={item.message.createdAt}
            getNow={getNow}
            groupPosition={item.groupPosition}
          >
            {item.message.text}
          </ChatMessage>
        ) : null,
      )}
    </div>
  );
}

/** The options of the Chat Transcript lab: footer time line, caret, receipts limit, grouping gap. */
export function ChatTranscriptOptionCases() {
  return (
    <>
      <LabSection
        title="Footer time line"
        description="A time in the footer keeps its line by default (reserved), shown only while the message is hovered or holds focus. With collapseFooterTime the line takes no room until then, and opens when it shows (collapsing)."
      >
        <StateMatrix
          axes={{ line: ['reserved', 'collapsing'] }}
          render={({ line }) => <FooterTimeMessage line={line} />}
        />
      </LabSection>
      <LabSection
        title="Streaming caret"
        description="With streamingCaret, a received message draws a caret after its text while it streams, and drops it once complete; without it the streaming message is busy all the same."
      >
        <StateMatrix
          axes={{ caret: ['on', 'off'], status: ['streaming', 'complete'] }}
          render={(cell) => <CaretMessage {...cell} />}
        />
      </LabSection>
      <LabSection
        title="Read receipts limit"
        description="maxVisible caps the avatars of five readers; the rest join the +N count, and none shows once all fit."
      >
        <StateMatrix
          axes={{ 'max visible': Object.keys(limits) as Array<keyof typeof limits> }}
          render={({ 'max visible': limit }) => (
            <ChatReadReceipts readers={readers} maxVisible={limits[limit]} />
          )}
        />
      </LabSection>
      <LabSection
        title="Grouping gap"
        description="groupChatMessages groups one author's messages while each follows the last within maxGap. Ana writes at 10:00, 10:04, 10:12 and 10:30: by default (5 minutes) only the first two group; with 15 minutes the first three do."
      >
        <StateMatrix
          axes={{ 'max gap': Object.keys(gaps) as Array<keyof typeof gaps> }}
          render={({ 'max gap': gap }) => <GappedConversation maxGap={gaps[gap]} />}
        />
      </LabSection>
    </>
  );
}
