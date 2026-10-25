import { Fragment, useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ChatMessage,
  ChatTranscript,
  ChatUnreadDivider,
  type ChatTranscriptScrollMode,
} from '../../src/components/chat-transcript/index.js';
import { CopyButton } from '../../src/components/copy-button/copy-button.js';
import { MessageComposer } from '../../src/components/message-composer/message-composer.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import {
  AnnouncementEcho,
  SampleMessageView,
  planner,
  reader,
  sampleMessages,
  useSimulatedChat,
} from './chat-transcript-behaviour-samples.js';

const modes = ['follow', 'anchor'] as const satisfies readonly ChatTranscriptScrollMode[];

const keys: ReadonlyArray<[string, string]> = [
  ['Tab', 'enters the conversation at the newest message (one tab stop) and leaves it again.'],
  ['Up, Down', 'move to the previous or next message; Home and End go to the first and last.'],
  ['Page Up, Page Down', 'scroll natively; focus then moves to the message at the top.'],
  ['Enter', 'moves into the message’s controls; Tab and Shift+Tab cycle through them.'],
  ['Escape', 'returns to the message; a second Escape moves to the composer.'],
];

/** The keyboard model on a conversation whose messages hold links and buttons. */
function KeyboardCase() {
  const composer = useRef<HTMLDivElement>(null);
  return (
    <>
      <dl>
        {keys.map(([key, effect]) => (
          <Fragment key={key}>
            <dt>{key}</dt>
            <dd>{effect}</dd>
          </Fragment>
        ))}
      </dl>
      <div style={{ height: 240 }}>
        <ChatTranscript
          aria-label="Keyboard conversation"
          data-lab-transcript="keyboard"
          onEscape={() => composer.current?.querySelector('textarea')?.focus()}
        >
          <ChatMessage id="k1" origin="sent" author={reader}>
            Can you plan a day on the island?
          </ChatMessage>
          <ChatMessage
            id="k2"
            author={planner}
            actions={<CopyButton value="Take the 9:40 ferry." label="Copy message" size="sm" />}
          >
            Take the <a href="#ferry-times">9:40 ferry</a>, then walk to the bakery on the quay.
          </ChatMessage>
          <ChatMessage id="k3" origin="sent" author={reader}>
            And the afternoon?
          </ChatMessage>
          <ChatMessage id="k4" author={planner}>
            {Array.from(
              { length: 6 },
              () =>
                'The north beach is quiet after lunch; the path from the harbour climbs past the lighthouse and takes about forty minutes.',
            ).join(' ')}
          </ChatMessage>
          <ChatMessage id="k5" origin="sent" author={reader}>
            Perfect, thanks.
          </ChatMessage>
        </ChatTranscript>
      </div>
      <div ref={composer}>
        <MessageComposer aria-label="Message the planner" />
      </div>
    </>
  );
}

/** A conversation in one scroll mode, with a reply that streams in. */
function ModeCase({ mode }: { mode: ChatTranscriptScrollMode }) {
  const chat = useSimulatedChat(mode, () => sampleMessages(mode, 0, 10));
  return (
    <AnnouncementEcho name={mode}>
      <div style={{ height: 260, width: 340 }}>
        <ChatTranscript
          scrollMode={mode}
          aria-label={`Conversation in ${mode} mode`}
          data-lab-transcript={mode}
        >
          {chat.messages.map((message) => (
            <SampleMessageView key={message.id} message={message} />
          ))}
        </ChatTranscript>
      </div>
      <MessageComposer
        aria-label={`Ask in ${mode} mode`}
        isPending={chat.isStreaming}
        onStop={chat.stop}
        onSubmit={chat.send}
      />
    </AnnouncementEcho>
  );
}

const suggestions = ['Plan a day on the island', 'Find a bakery near the harbour'];

/** An empty conversation offers first questions; picking one starts it. */
function EmptyCase() {
  const [asked, setAsked] = useState<string[]>([]);
  return (
    <div style={{ height: 180 }}>
      <ChatTranscript
        aria-label="New conversation"
        data-lab-transcript="empty"
        emptyState={
          <>
            <p>Ask the planner about your trip.</p>
            {suggestions.map((text) => (
              <Button key={text} size="sm" onPress={() => setAsked((list) => [...list, text])}>
                {text}
              </Button>
            ))}
          </>
        }
      >
        {asked.map((text, index) => (
          <ChatMessage key={index} id={`asked-${index}`} origin="sent" author={reader}>
            {text}
          </ChatMessage>
        ))}
      </ChatTranscript>
    </div>
  );
}

/** Twenty messages, with older pages of twenty that load near the top. */
function HistoryCase() {
  const [first, setFirst] = useState(60);
  const [isLoading, setLoading] = useState(false);
  const loadOlder = () => {
    setLoading(true);
    window.setTimeout(() => {
      setFirst((current) => Math.max(0, current - 20));
      setLoading(false);
    }, 800);
  };
  return (
    <AnnouncementEcho name="history">
      <div style={{ height: 260 }}>
        <ChatTranscript
          aria-label="Trip history"
          data-lab-transcript="history"
          hasOlder={first > 0}
          isLoadingOlder={isLoading}
          onLoadOlder={loadOlder}
        >
          {sampleMessages('history', first, 80).map((message) => (
            <SampleMessageView key={message.id} message={message} />
          ))}
        </ChatTranscript>
      </div>
    </AnnouncementEcho>
  );
}

/** Search results that scroll to a message, mark it and focus it. */
function HighlightCase() {
  const [highlighted, setHighlighted] = useState<string>();
  return (
    <>
      <div>
        <Button size="sm" onPress={() => setHighlighted('highlight-m3')}>
          Show message 3
        </Button>
        <Button size="sm" onPress={() => setHighlighted('highlight-m25')}>
          Show message 25
        </Button>
        <Button size="sm" onPress={() => setHighlighted(undefined)}>
          Clear highlight
        </Button>
      </div>
      <div style={{ height: 260 }}>
        <ChatTranscript
          aria-label="Search results"
          data-lab-transcript="highlight"
          highlightedMessageId={highlighted}
        >
          {sampleMessages('highlight', 0, 40).map((message) => (
            <SampleMessageView key={message.id} message={message} />
          ))}
        </ChatTranscript>
      </div>
    </>
  );
}

/** Twelve unread messages below a divider, messages that arrive, and the read position. */
function UnreadCase() {
  const chat = useSimulatedChat('unread', () => sampleMessages('unread', 0, 40));
  const [readUpTo, setReadUpTo] = useState('');
  return (
    <AnnouncementEcho name="unread">
      <div style={{ height: 260 }}>
        <ChatTranscript
          aria-label="Unread conversation"
          data-lab-transcript="unread"
          firstUnreadId="unread-m29"
          onRead={setReadUpTo}
        >
          {chat.messages.map((message) => (
            <Fragment key={message.id}>
              {message.id === 'unread-m29' ? <ChatUnreadDivider /> : null}
              <SampleMessageView message={message} />
            </Fragment>
          ))}
        </ChatTranscript>
      </div>
      <Button size="sm" onPress={() => chat.receive('Ferry tickets are cheaper online.')}>
        Receive a message
      </Button>
      <p data-lab-read="unread">Read up to: {readUpTo || 'nothing yet'}</p>
    </AnnouncementEcho>
  );
}

/** Five thousand messages, of which only those near the view are mounted. */
function VirtualizedCase() {
  const chat = useSimulatedChat('long', () => sampleMessages('long', 0, 5000));
  const frame = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(0);
  useEffect(() => {
    const element = frame.current;
    if (!element) return undefined;
    const count = () => setMounted(element.querySelectorAll('article').length);
    const observer = new MutationObserver(count);
    observer.observe(element, { childList: true, subtree: true });
    count();
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <div ref={frame} style={{ height: 300 }}>
        <ChatTranscript virtualized aria-label="Long history" data-lab-transcript="virtualized">
          {chat.messages.map((message) => (
            <SampleMessageView key={message.id} message={message} />
          ))}
        </ChatTranscript>
      </div>
      <MessageComposer
        aria-label="Ask in the long history"
        isPending={chat.isStreaming}
        onStop={chat.stop}
        onSubmit={chat.send}
      />
      <Button size="sm" onPress={() => chat.receive('The harbour café is open late tonight.')}>
        Receive a message
      </Button>
      <p data-lab-mounted="virtualized">
        {mounted} of {chat.messages.length} messages mounted
      </p>
    </>
  );
}

/** The transcript's behaviour cases of the Chat Transcript lab. */
export function ChatTranscriptBehaviourCases() {
  return (
    <>
      <LabSection
        title="Keyboard model"
        description="The conversation is one tab stop: a feed of messages moved through with the keys below. Controls inside a message stay out of the tab order until Enter."
      >
        <KeyboardCase />
      </LabSection>
      <LabSection
        title="Follow and anchor"
        description="Send a question: in follow mode the view keeps the bottom as the reply streams in; in anchor mode your message moves to the top and the reply fills in below it. Scrolling away stops either; the jump button returns. Each shows its last announcement."
      >
        <StateMatrix
          axes={{ scrollMode: modes }}
          render={({ scrollMode }) => <ModeCase mode={scrollMode} />}
        />
      </LabSection>
      <LabSection
        title="Empty conversation"
        description="With no messages the transcript shows suggested first questions."
      >
        <EmptyCase />
      </LabSection>
      <LabSection
        title="Older history"
        description="Scroll towards the top: older messages load (after a short delay, with an indicator) and the messages in view stay where they are."
      >
        <HistoryCase />
      </LabSection>
      <LabSection
        title="Highlighted message"
        description="A search result scrolls its message to the middle, marks it and focuses it."
      >
        <HighlightCase />
      </LabSection>
      <LabSection
        title="Unread messages"
        description="Twelve messages are unread: the bar above jumps to the first. Scroll up and receive messages to see them counted on the jump button. The transcript reports the newest message read."
      >
        <UnreadCase />
      </LabSection>
      <LabSection
        title="Virtualized history"
        description="Five thousand messages, with only those near the view mounted. Following, sending, the keyboard model and jumps work as in a short conversation."
      >
        <VirtualizedCase />
      </LabSection>
    </>
  );
}
