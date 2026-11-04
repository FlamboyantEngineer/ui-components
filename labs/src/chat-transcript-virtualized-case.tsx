import { useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ChatTranscript } from '../../src/components/chat-transcript/index.js';
import { MessageComposer } from '../../src/components/message-composer/message-composer.js';
import {
  SampleMessageView,
  sampleMessages,
  useSimulatedChat,
} from './chat-transcript-behaviour-samples.js';

/** Five thousand messages, of which only those near the view are mounted. */
export function ChatTranscriptVirtualizedCase() {
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
      <Button
        size="sm"
        onPress={() =>
          chat.setMessages((list) => [
            ...list,
            ...sampleMessages('long-batch', list.length, list.length + 100).map((message) => ({
              ...message,
              origin: 'received' as const,
            })),
          ])
        }
      >
        Receive 100 messages
      </Button>
      <p data-lab-mounted="virtualized">
        {mounted} of {chat.messages.length} messages mounted
      </p>
    </>
  );
}
