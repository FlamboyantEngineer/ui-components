import { useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ChatMessage,
  ChatTranscript,
  type ChatMessageOrigin,
  type ChatMessageStatus,
} from '../../src/components/chat-transcript/chat-transcript.js';
import { CopyButton } from '../../src/components/copy-button/copy-button.js';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import { MessageComposer } from '../../src/components/message-composer/message-composer.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

/** A fixed clock, so every time in the matrices reads the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

const origins = ['sent', 'received', 'system'] as const satisfies readonly ChatMessageOrigin[];
const statuses = ['complete', 'streaming', 'error'] as const satisfies readonly ChatMessageStatus[];

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const helper = { name: 'Helper', src: samplePicture, colorKey: 'helper' };

const texts: Record<ChatMessageStatus, string> = {
  complete: 'The samples from the north field arrived this morning.',
  streaming: 'Checking the delivery notes for the north',
  error: 'The reply could not be finished.',
  cancelled: 'Checking the delivery notes for the north',
};

function MatrixMessage({
  origin,
  status,
}: {
  origin: ChatMessageOrigin;
  status: ChatMessageStatus;
}) {
  const author = origin === 'system' ? undefined : origin === 'sent' ? maria : helper;
  return (
    <ChatMessage
      origin={origin}
      status={status}
      author={author}
      time={origin === 'system' ? undefined : new Date(2026, 3, 20, 10, 12).toISOString()}
      getNow={getNow}
      actions={
        status === 'error' ? (
          <Button size="sm" startIcon="refresh">
            Retry
          </Button>
        ) : status === 'complete' && origin !== 'system' ? (
          <CopyButton value={texts.complete} label="Copy message" size="sm" />
        ) : undefined
      }
    >
      {origin === 'system' ? 'Lena Ortiz joined the conversation.' : texts[status]}
    </ChatMessage>
  );
}

interface LiveMessage {
  id: number;
  origin: ChatMessageOrigin;
  text: string;
  status: ChatMessageStatus;
}

const replyWords =
  'The north field samples arrived at eight. Two crates were cold and one was warm, so the warm crate goes back for a second reading before noon. Everything else is logged and ready for the afternoon review.'.split(
    ' ',
  );

const history: LiveMessage[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  origin: index % 2 === 0 ? 'sent' : 'received',
  text: index % 2 === 0 ? `Question ${index / 2 + 1}: how are the samples?` : 'All logged.',
  status: 'complete',
}));

/** A conversation whose replies stream in word by word; Stop ends the reply early. */
function LiveConversation() {
  const [messages, setMessages] = useState<LiveMessage[]>(history);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const timer = useRef<number | null>(null);
  const stop = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
    setMessages((list) =>
      list.map((message) =>
        message.id === streamingId ? { ...message, status: 'complete' } : message,
      ),
    );
    setStreamingId(null);
  };
  useEffect(
    () => () => (timer.current === null ? undefined : window.clearInterval(timer.current)),
    [],
  );
  const ask = (text: string) => {
    const id = messages.length + 2;
    setMessages((list) => [
      ...list,
      { id: id - 1, origin: 'sent', text, status: 'complete' },
      { id, origin: 'received', text: '', status: 'streaming' },
    ]);
    setStreamingId(id);
    let count = 0;
    timer.current = window.setInterval(() => {
      count += 1;
      const done = count >= replyWords.length;
      setMessages((list) =>
        list.map((message) =>
          message.id === id
            ? {
                ...message,
                text: replyWords.slice(0, count).join(' '),
                status: done ? 'complete' : 'streaming',
              }
            : message,
        ),
      );
      if (done && timer.current !== null) {
        window.clearInterval(timer.current);
        timer.current = null;
        setStreamingId(null);
      }
    }, 200);
  };
  return (
    <>
      <div style={{ height: 280 }}>
        <ChatTranscript aria-label="Live conversation" data-lab-transcript="live">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              origin={message.origin}
              status={message.status}
              author={message.origin === 'sent' ? maria : helper}
              data-lab-message={message.id}
            >
              {message.text}
            </ChatMessage>
          ))}
        </ChatTranscript>
      </div>
      <MessageComposer
        aria-label="Ask"
        isPending={streamingId !== null}
        onStop={stop}
        onSubmit={ask}
        data-lab-composer="live"
      />
    </>
  );
}

const suggestions = ['Summarise the field notes', 'List the open questions'];

/** An empty conversation offers first questions; picking one starts it. */
function EmptyConversation() {
  const [asked, setAsked] = useState<string[]>([]);
  return (
    <div style={{ height: 180 }}>
      <ChatTranscript
        aria-label="New conversation"
        data-lab-transcript="empty"
        emptyState={
          <>
            <p>Ask about the field notes.</p>
            {suggestions.map((text) => (
              <Button key={text} size="sm" onPress={() => setAsked((list) => [...list, text])}>
                {text}
              </Button>
            ))}
          </>
        }
      >
        {asked.map((text, index) => (
          <ChatMessage key={index} origin="sent" author={maria}>
            {text}
          </ChatMessage>
        ))}
      </ChatTranscript>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Messages"
      description="Sent, received and system messages, complete, streaming and failed, with their authors, times (the clock is fixed at 20 April 2026, 10:30) and actions."
    >
      <StateMatrix
        axes={{ origin: origins, status: statuses }}
        render={({ origin, status }) => <MatrixMessage origin={origin} status={status} />}
      />
    </LabSection>
    <LabSection
      title="Live conversation"
      description="Send a question: the reply streams in and the log follows it. Scroll up to stop following; Jump to latest returns to the end. Stop ends a reply early."
    >
      <LiveConversation />
    </LabSection>
    <LabSection
      title="Empty conversation"
      description="With no messages the log shows suggested first questions."
    >
      <EmptyConversation />
    </LabSection>
    <LabSection
      title="Grouped messages"
      description="Consecutive messages from one author leave the author out after the first."
    >
      <div style={{ height: 160 }}>
        <ChatTranscript aria-label="Grouped messages">
          <ChatMessage origin="received" author={helper} time="2026-04-20T10:20:00" getNow={getNow}>
            Two crates were cold.
          </ChatMessage>
          <ChatMessage origin="received">One was warm.</ChatMessage>
          <ChatMessage
            origin="received"
            actions={<IconButton icon="copy" label="Copy" size="sm" />}
          >
            The warm crate goes back for a second reading.
          </ChatMessage>
        </ChatTranscript>
      </div>
    </LabSection>
  </>,
);
