import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Chat } from '../../src/components/chat/index.js';
import type { ChatQueuedMessage } from '../../src/components/chat-controller/index.js';
import { ChatModelPicker } from '../../src/components/chat-model-picker/index.js';
import type { ChatMessageData, ChatTextToken } from '../../src/components/chat-parts/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { LoadingRegion } from '../../src/components/loading-overlay/loading-overlay.js';
import { nativeMessages, retainChatSnapshot } from './chat-native-samples.js';
import { assistantPeople, readerId } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

function NativeDemo() {
  const [messages, setMessages] = useState(nativeMessages);
  const [queue, setQueue] = useState<readonly ChatQueuedMessage[]>([
    {
      id: 'queued-a',
      text: 'Check the remaining entries and keep all of their literal detail, even when this instruction is too long for the row.',
    },
    { id: 'queued-b', text: 'Then summarize the count.' },
  ]);
  const [isLoading, setLoading] = useState(false);
  const [isOther, setOther] = useState(false);
  const sendNow = (text: string, tokens?: readonly ChatTextToken[], replyTo?: string) => {
    const message: ChatMessageData = {
      id: `sent-${messages.length}`,
      authorId: readerId,
      createdAt: '2026-05-01T12:02:00Z',
      delivery: 'sending',
      replyTo,
      parts: [{ type: 'text', text, tokens }],
    };
    setMessages((current) => [...current, message]);
  };
  return (
    <div data-lab-demo="native-chat">
      <Checkbox isSelected={isLoading} onChange={setLoading}>
        Block while loading
      </Checkbox>
      <Checkbox isSelected={isOther} onChange={setOther}>
        Another conversation with reused IDs
      </Checkbox>
      <Button
        size="sm"
        onPress={() =>
          setMessages((current) =>
            retainChatSnapshot(current, JSON.parse(JSON.stringify(current)) as ChatMessageData[]),
          )
        }
      >
        Receive unchanged snapshot
      </Button>
      <Button
        size="sm"
        onPress={() =>
          setMessages((current) => [
            ...current,
            ...[0, 1].map((index): ChatMessageData => ({
              id: `later-${current.length}-${index}`,
              authorId: readerId,
              createdAt: '2026-05-01T12:03:00Z',
              parts: [{ type: 'text', text: `A later message ${index + 1}` }],
            })),
          ])
        }
      >
        Add later messages
      </Button>
      <Button
        size="sm"
        onPress={() =>
          setMessages((current) =>
            current.map((message) =>
              message.delivery === 'sending' ? { ...message, delivery: 'sent' } : message,
            ),
          )
        }
      >
        Settle delivery
      </Button>
      <div style={{ height: 620, display: 'flex', flexDirection: 'column', maxWidth: 720 }}>
        <LoadingRegion isLoading={isLoading} label="Loading conversation">
          <Chat
            messages={messages}
            participants={assistantPeople}
            currentUserId={readerId}
            conversationId={isOther ? 'native-other' : 'native-main'}
            title="A conversation with a very long title that stays constrained while search and header actions remain available in a narrow panel"
            showHeaderIdentity={false}
            showAvatars={false}
            showAuthorNames={false}
            thinkingUntil="content"
            thinkingIcon={null}
            showSearch
            receivedVariant="plain"
            activityTimePlacement="none"
            timePlacement="tooltip"
            presentation="embedded"
            scrollMode="follow"
            deliveryPresentation="fade"
            isPending
            queue={queue}
            onQueueChange={setQueue}
            onSend={(text, tokens) =>
              setQueue((current) => [
                ...current,
                { id: `queued-${messages.length}-${current.length}`, text, tokens },
              ])
            }
            onSendNow={sendNow}
            onSteer={(id) => {
              const entry = queue.find((item) => item.id === id);
              if (entry) sendNow(entry.text, entry.tokens, entry.replyTo);
              setQueue((current) => current.filter((item) => item.id !== id));
            }}
            onReply={(_id, text, tokens) =>
              setQueue((current) => [
                ...current,
                { id: `quote-${current.length}`, text, tokens, replyTo: _id },
              ])
            }
            onAnswerQuestion={() => undefined}
            onDeny={() => undefined}
            placeholder={(hint) => `Write a follow-up · ${hint.text}`}
            showSendOptions
            composerStartControls={null}
            composerEndControls={
              <ChatModelPicker models={[{ id: 'balanced', label: 'Balanced' }]} />
            }
          />
        </LoadingRegion>
      </div>
    </div>
  );
}

export function ChatNativeCases() {
  return (
    <LabSection
      title="Native embedded conversation"
      description="A flex-filling LoadingRegion around 1,002 mixed messages: text-only status, no header identity, standalone result rows, retained question drafts, trailing controls, quoted immediate sends, a reorderable queue attached to the composer, and faded sending messages. Long and short queued messages keep their handles and text aligned with a compact leading inset. The host supplies the bounded panel height and transports immutable JSON snapshots; the reference stylesheet handles the content wrapper."
    >
      <NativeDemo />
    </LabSection>
  );
}
