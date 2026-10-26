import {
  ChatDateSeparator,
  ChatMessage,
  ChatQuote,
  ChatReadReceipts,
  ChatTranscript,
  ChatTypingIndicator,
  ChatUnreadDivider,
  type ChatMessageDelivery,
  type ChatMessageGroupPosition,
  type ChatMessageOrigin,
  type ChatMessageStatus,
} from '../../src/components/chat-transcript/index.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import {
  GroupConversation,
  TimeZoneConversations,
} from './chat-transcript-message-conversation.js';
import {
  CopyAction,
  LabReactions,
  RetryingMessage,
  at,
  getNow,
  helper,
  maria,
  team,
} from './chat-transcript-message-samples.js';

const origins = ['sent', 'received', 'system'] as const satisfies readonly ChatMessageOrigin[];
const states = [
  'complete',
  'streaming',
  'error',
  'cancelled',
] as const satisfies readonly ChatMessageStatus[];
const deliveries = [
  'sending',
  'sent',
  'delivered',
  'read',
  'failed',
] as const satisfies readonly ChatMessageDelivery[];
const variants = [
  'edited',
  'deleted',
  'quote',
  'error',
  'reactions',
  'readers',
  'presence',
] as const;

const stateTexts: Record<ChatMessageStatus, string> = {
  complete: 'The ridge trail reopened this morning.',
  streaming: 'Checking the trail notes for the',
  error: 'The trail notes',
  cancelled: 'Checking the trail notes for the',
};

const readers = Object.values(team).filter((person) => person.id !== 'maria');

function StateMessage({ from, state }: { from: ChatMessageOrigin; state: ChatMessageStatus }) {
  if (from === 'system') {
    return (
      <ChatMessage origin="system" status={state}>
        Cy Park joined the conversation.
      </ChatMessage>
    );
  }
  return (
    <ChatMessage
      origin={from}
      status={state}
      author={from === 'sent' ? maria : helper}
      time={at(20, 10, 12)}
      getNow={getNow}
      error={state === 'error' ? 'The reply could not be finished.' : undefined}
      onRetry={state === 'error' ? () => undefined : undefined}
      actions={state === 'complete' ? <CopyAction text={stateTexts.complete} /> : undefined}
    >
      {stateTexts[state]}
    </ChatMessage>
  );
}

function DeliveryMessage({ delivery }: { delivery: ChatMessageDelivery }) {
  const shared = { author: maria, time: at(20, 10, 20), getNow, children: 'On my way.' };
  if (delivery === 'failed') return <RetryingMessage {...shared} />;
  return <ChatMessage {...shared} origin="sent" delivery={delivery} />;
}

const variantAuthors = {
  received: { plain: team.dee, presence: team.ben },
  sent: { plain: maria, presence: { ...maria, status: 'active', statusLabel: 'Active' } },
} as const;

function VariantMessage({
  variant,
  from,
}: {
  variant: (typeof variants)[number];
  from: 'received' | 'sent';
}) {
  return (
    <ChatMessage
      origin={from}
      author={variantAuthors[from][variant === 'presence' ? 'presence' : 'plain']}
      time={at(20, 9, 45)}
      getNow={getNow}
      isEdited={variant === 'edited'}
      isDeleted={variant === 'deleted'}
      quote={
        variant === 'quote'
          ? { authorName: 'Ben Okoro', excerpt: 'Count me in. I can drive four people.' }
          : undefined
      }
      error={variant === 'error' ? 'The photo could not be uploaded.' : undefined}
      onRetry={variant === 'error' ? () => undefined : undefined}
      reactions={
        variant === 'reactions' ? (
          <LabReactions initial={[{ emoji: '👍', count: 2, people: ['Ben Okoro', 'Cy Park'] }]} />
        ) : undefined
      }
      readers={variant === 'readers' ? <ChatReadReceipts readers={readers} /> : undefined}
    >
      Bring layers, it gets cold at the top.
    </ChatMessage>
  );
}

const positions: ReadonlyArray<[ChatMessageGroupPosition, string]> = [
  ['first', 'Who is in for the ridge hike on Saturday?'],
  ['middle', 'The forecast says clear skies until three.'],
  ['last', 'Meet at the trailhead at eight?'],
];

/** Grouped runs: the avatar and name lead each run; later messages show their time on hover and focus. */
function GroupedPositions() {
  return (
    <div style={{ height: 380 }}>
      <ChatTranscript aria-label="Grouped positions" data-lab-demo="grouped">
        {positions.map(([position, text]) => (
          <ChatMessage
            key={position}
            author={team.ana}
            time={at(20, 9, 0)}
            getNow={getNow}
            groupPosition={position}
            actions={<CopyAction text={text} />}
            data-lab-position={`received-${position}`}
          >
            {text}
          </ChatMessage>
        ))}
        <ChatMessage
          origin="sent"
          author={maria}
          time={at(20, 9, 5)}
          getNow={getNow}
          groupPosition="first"
          actions={<CopyAction text="I am in." />}
        >
          I am in.
        </ChatMessage>
        <ChatMessage
          origin="sent"
          author={maria}
          time={at(20, 9, 6)}
          getNow={getNow}
          groupPosition="last"
          actions={<CopyAction text="Eight works." />}
          data-lab-position="sent-last"
        >
          Eight works.
        </ChatMessage>
        <ChatMessage author={team.cy} time={at(20, 9, 20)} getNow={getNow}>
          Same here.
        </ChatMessage>
      </ChatTranscript>
    </div>
  );
}

const typingCases = {
  one: { names: ['Ana Lopez'] },
  two: { names: ['Ana Lopez', 'Ben Okoro'] },
  'three or more': { names: ['Ana Lopez', 'Ben Okoro', 'Cy Park'] },
  nobody: { names: [] },
} as const;

const receiptCases = { one: 1, three: 3, five: 5 } as const;

/** Every part around the messages, each in its states. */
function ConversationParts() {
  return (
    <>
      <StateMatrix
        axes={{ day: ['today', 'yesterday', 'earlier'] }}
        render={({ day }) => (
          <ChatDateSeparator
            date={{ today: '2026-04-20', yesterday: '2026-04-19', earlier: '2026-04-14' }[day]}
            getNow={getNow}
          />
        )}
      />
      <StateMatrix axes={{ divider: ['unread'] }} render={() => <ChatUnreadDivider />} />
      <StateMatrix
        axes={{ typing: Object.keys(typingCases) as Array<keyof typeof typingCases> }}
        render={({ typing }) => <ChatTypingIndicator {...typingCases[typing]} />}
      />
      <StateMatrix
        axes={{ readers: Object.keys(receiptCases) as Array<keyof typeof receiptCases> }}
        render={({ readers: count }) => (
          <ChatReadReceipts readers={readers.slice(0, receiptCases[count])} />
        )}
      />
      <StateMatrix
        axes={{ quote: ['static', 'pressable'] }}
        render={({ quote }) => (
          <ChatQuote
            authorName="Ben Okoro"
            excerpt="Count me in. I can drive four people."
            onPress={quote === 'pressable' ? () => undefined : undefined}
          />
        )}
      />
    </>
  );
}

/** The message and conversation-part cases of the Chat Transcript lab. */
export function ChatTranscriptMessageCases() {
  return (
    <>
      <LabSection
        title="Message states"
        description="Sent, received and system messages, complete, streaming, failed with an error and Retry, and stopped with their partial text."
      >
        <StateMatrix
          axes={{ from: origins, state: states }}
          render={({ from, state }) => <StateMessage from={from} state={state} />}
        />
      </LabSection>
      <LabSection
        title="Delivery"
        description="A sent message on its way, sent, delivered, read and failed; Retry sends the failed one again."
      >
        <StateMatrix
          axes={{ delivery: deliveries }}
          render={({ delivery }) => <DeliveryMessage delivery={delivery} />}
        />
      </LabSection>
      <LabSection
        title="Markers, quotes and slots"
        description="Edited, deleted, a quoted reply, an error with Retry, reactions, read receipts and the author's presence."
      >
        <StateMatrix
          axes={{ variant: variants, from: ['received', 'sent'] }}
          render={({ variant, from }) => <VariantMessage variant={variant} from={from} />}
        />
      </LabSection>
      <LabSection
        title="Grouped positions"
        description="Runs by one author: first, middle and last. Hover or focus a later message to see its time and actions."
      >
        <GroupedPositions />
      </LabSection>
      <LabSection
        title="Conversation parts"
        description="Date separators, the unread divider, typing indicators (one, two, three or more people, an assistant thinking, nobody), read receipts and quotes."
      >
        <ConversationParts />
      </LabSection>
      <LabSection
        title="Group conversation"
        description="A small team's conversation laid out by groupChatMessages: days, the unread divider, grouped runs, a quoted reply that jumps to its message, edits, a deletion, reactions, read receipts, a failed send and who is typing."
      >
        <GroupConversation />
      </LabSection>
      <LabSection
        title="Days in a time zone"
        description="The same messages grouped by the days of Los Angeles and of Tokyo: around midnight in one zone they split, in the other they group."
      >
        <TimeZoneConversations />
      </LabSection>
    </>
  );
}
