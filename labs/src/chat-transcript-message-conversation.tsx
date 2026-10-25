import {
  ChatDateSeparator,
  ChatMessage,
  ChatReadReceipts,
  ChatTranscript,
  ChatTypingIndicator,
  ChatUnreadDivider,
  groupChatMessages,
  type ChatGroupableMessage,
  type ChatSequenceItem,
} from '../../src/components/chat-transcript/index.js';
import type { ReactionEntry } from '../../src/components/reaction-bar/reaction-bar.js';
import {
  CopyAction,
  LabReactions,
  RetryingMessage,
  at,
  getNow,
  team,
  type TeamMemberId,
} from './chat-transcript-message-samples.js';

interface TeamMessage extends ChatGroupableMessage {
  authorId?: TeamMemberId | undefined;
  text: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  /** The id of the message this one quotes. */
  quotes?: string;
  reactions?: readonly ReactionEntry[];
}

const messages: readonly TeamMessage[] = [
  { id: 'm1', authorId: 'ana', createdAt: at(19, 16, 2), text: 'Who is in for the ridge hike?' },
  { id: 'm2', authorId: 'ana', createdAt: at(19, 16, 3), text: 'Clear skies until three.' },
  {
    id: 'm3',
    authorId: 'ben',
    createdAt: at(19, 16, 20),
    text: 'Count me in. I can drive four people.',
    reactions: [{ emoji: '👍', count: 2, people: ['Ana Lopez', 'Cy Park'] }],
  },
  { id: 'm4', isSystem: true, createdAt: at(19, 16, 21), text: 'Cy Park joined the conversation.' },
  { id: 'm5', authorId: 'cy', createdAt: at(19, 16, 40), text: 'Is there parking up there?' },
  {
    id: 'm6',
    authorId: 'maria',
    createdAt: at(20, 8, 10),
    delivery: 'read',
    text: 'A lot by the ranger station; it fills by nine.',
  },
  {
    id: 'm7',
    authorId: 'maria',
    createdAt: at(20, 8, 11),
    delivery: 'read',
    isEdited: true,
    text: 'So let us meet at eight.',
  },
  { id: 'm8', authorId: 'ana', createdAt: at(20, 9, 30), text: 'Eight works.', quotes: 'm7' },
  { id: 'm9', authorId: 'ana', createdAt: at(20, 9, 31), isDeleted: true, text: '' },
  { id: 'm10', authorId: 'ana', createdAt: at(20, 9, 32), text: 'Ben, can you take the cooler?' },
  {
    id: 'm11',
    authorId: 'ben',
    createdAt: at(20, 10, 5),
    text: 'Sure, and snacks.',
    reactions: [{ emoji: '🎉', count: 1, people: ['Ana Lopez'] }],
  },
  {
    id: 'm12',
    authorId: 'maria',
    createdAt: at(20, 10, 20),
    delivery: 'failed',
    text: 'I will book the cabin for the night.',
  },
];

/** The last message each of the others has read; their avatars sit under it. */
const readUpTo: Partial<Record<TeamMemberId, string>> = {
  ana: 'm11',
  cy: 'm7',
  dee: 'm11',
  eli: 'm11',
};

const domId = (id: string) => `lab-team-${id}`;

function readersOf(message: TeamMessage) {
  return (Object.entries(readUpTo) as Array<[TeamMemberId, string]>)
    .filter(([reader, id]) => id === message.id && reader !== message.authorId)
    .map(([reader]) => team[reader]);
}

function jumpTo(id: string) {
  document.getElementById(domId(id))?.scrollIntoView({ block: 'nearest' });
}

function TeamMessageView({
  item,
}: {
  item: Extract<ChatSequenceItem<TeamMessage>, { kind: 'message' }>;
}) {
  const { message, groupPosition } = item;
  const author = message.authorId ? team[message.authorId] : undefined;
  const quoted = messages.find((candidate) => candidate.id === message.quotes);
  const quotedAuthor = quoted?.authorId ? team[quoted.authorId].name : '';
  const readers = readersOf(message);
  const props = {
    id: domId(message.id),
    origin: message.isSystem ? 'system' : message.authorId === 'maria' ? 'sent' : 'received',
    author,
    time: message.isSystem ? undefined : message.createdAt,
    getNow,
    groupPosition,
    isEdited: message.isEdited,
    isDeleted: message.isDeleted,
    quote: quoted
      ? { authorName: quotedAuthor, excerpt: quoted.text, messageId: quoted.id }
      : undefined,
    onQuotePress: jumpTo,
    reactions: message.reactions ? <LabReactions initial={message.reactions} /> : undefined,
    readers: readers.length > 0 ? <ChatReadReceipts readers={readers} /> : undefined,
    actions: message.isSystem ? undefined : <CopyAction text={message.text} />,
    children: message.text,
    'data-lab-message': message.id,
  } as const;
  if (message.delivery === 'failed') return <RetryingMessage {...props} />;
  return <ChatMessage {...props} delivery={message.delivery} />;
}

function SequenceView({ item }: { item: ChatSequenceItem<TeamMessage> }) {
  if (item.kind === 'date') return <ChatDateSeparator date={item.date} getNow={getNow} />;
  if (item.kind === 'unread') return <ChatUnreadDivider />;
  return <TeamMessageView item={item} />;
}

/** A realistic group conversation, laid out by `groupChatMessages`. */
export function GroupConversation() {
  const items = groupChatMessages(messages, { firstUnreadId: 'm8' });
  return (
    <>
      <div style={{ height: 420 }}>
        <ChatTranscript aria-label="Team conversation" data-lab-transcript="team">
          {items.map((item) => (
            <SequenceView key={item.key} item={item} />
          ))}
        </ChatTranscript>
      </div>
      <ChatTypingIndicator names={[team.cy.name]} data-lab-typing="team" />
    </>
  );
}

const lateMessages: readonly TeamMessage[] = [
  { id: 'z1', authorId: 'ana', createdAt: '2026-04-10T06:58:00Z', text: 'Still up?' },
  { id: 'z2', authorId: 'ana', createdAt: '2026-04-10T07:01:00Z', text: 'The bus leaves at six.' },
  { id: 'z3', authorId: 'ben', createdAt: '2026-04-10T07:02:00Z', text: 'Set an alarm.' },
];

function ZonedConversation({ timeZone, label }: { timeZone: string; label: string }) {
  const items = groupChatMessages(lateMessages, { timeZone });
  return (
    <>
      <p>{label}</p>
      <div style={{ height: 280 }}>
        <ChatTranscript aria-label={label} data-lab-transcript={timeZone}>
          {items.map((item) =>
            item.kind === 'message' ? (
              <ChatMessage
                key={item.key}
                author={item.message.authorId ? team[item.message.authorId] : undefined}
                groupPosition={item.groupPosition}
              >
                {item.message.text}
              </ChatMessage>
            ) : (
              <SequenceView key={item.key} item={item} />
            ),
          )}
        </ChatTranscript>
      </div>
    </>
  );
}

/** The same messages grouped in two time zones. */
export function TimeZoneConversations() {
  return (
    <>
      <ZonedConversation timeZone="America/Los_Angeles" label="Read in Los Angeles" />
      <ZonedConversation timeZone="Asia/Tokyo" label="Read in Tokyo" />
    </>
  );
}
