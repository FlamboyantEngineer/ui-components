import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ChatTranscript } from '../../src/components/chat-transcript/index.js';
import { MessageComposer } from '../../src/components/message-composer/message-composer.js';
import {
  sampleMessages,
  SampleMessageView,
  useSimulatedChat,
} from './chat-transcript-behaviour-samples.js';
import { LabSection } from './chrome/index.js';

/**
 * A following transcript and a composer sharing one fixed-height column: the transcript takes the
 * room the composer leaves, so every keystroke the composer measures happens beside it.
 */
function ComposerColumnCase() {
  const chat = useSimulatedChat('column', () => sampleMessages('column', 0, 30));
  const [draft, setDraft] = useState('');
  return (
    <>
      <div
        data-lab-column=""
        style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 500, width: 320 }}
      >
        <div style={{ flex: '1 0 160px', height: 160, minHeight: 120 }}>
          <ChatTranscript
            scrollMode="follow"
            aria-label="Conversation beside the composer"
            data-lab-transcript="column"
          >
            {chat.messages.map((message) => (
              <SampleMessageView key={message.id} message={message} />
            ))}
          </ChatTranscript>
        </div>
        <div style={{ flex: 'none' }}>
          <MessageComposer
            aria-label="Message beside the conversation"
            value={draft}
            onChange={setDraft}
            shortcuts={{ send: 'Ctrl+Enter' }}
            onSubmit={(text) => {
              chat.send(text);
              setDraft('');
            }}
          />
        </div>
      </div>
      <Button
        size="sm"
        onPress={() =>
          chat.receive('The harbour café opens at eight and has a table by the water.')
        }
      >
        Receive a reply
      </Button>
    </>
  );
}

/** The composer-beside-the-transcript case of the Chat Transcript lab. */
export function ChatTranscriptComposerCase() {
  return (
    <LabSection
      title="Composer beside the transcript"
      description="The transcript and the composer share a fixed-height column, so the transcript takes the room the composer leaves. At the bottom, type (Shift+Enter breaks the line, Ctrl+Enter sends) and receive replies: measuring the growing composer never gives the transcript its room for a moment, so it keeps following."
    >
      <ComposerColumnCase />
    </LabSection>
  );
}
