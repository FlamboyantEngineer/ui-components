// The rich composer's record references: chips the "+" menu inserts, drawn from the host's lookup,
// kept in the stored draft and through a rejected send, and sent as reference tokens.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ChatParts } from '../../src/components/chat-parts/index.js';
import {
  ChatMessage,
  ChatTranscript,
} from '../../src/components/chat-transcript/chat-transcript.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { MessageComposerMenuButton } from '../../src/components/message-composer/index.js';
import {
  type MessageComposerMessage,
  RichMessageComposer,
} from '../../src/components/message-composer/rich/index.js';
import { LabSection } from './chrome/index.js';
import { SentMessage } from './message-composer-rich-cases.js';
import { getLabReference, labRecords, referenceMenuItems } from './reference-samples.js';
import { requireDefined } from './require-defined.js';

const [trip, note] = labRecords;

const draftText = 'Please review TRIP-4 and NOTE-12 first';

/** A draft with two references among the words, as the host might store or restore it. */
const referenceDraft: MessageComposerMessage = {
  text: draftText,
  tokens: [requireDefined(trip), requireDefined(note)].map((record) => {
    const start = draftText.indexOf(record.label);
    return {
      start,
      end: start + record.label.length,
      kind: 'reference',
      id: record.id,
      label: record.label,
      recordType: record.recordType,
    };
  }),
};

const referenceMenu = (
  <MessageComposerMenuButton
    sections={[{ id: 'references', title: 'References', items: referenceMenuItems }]}
  />
);

/**
 * References in the rich composer: the draft starts with two chips, the "+" menu inserts more
 * (one missing, one restricted), sent messages show them as chips again, a rejected send keeps
 * them, and remounting reads them back from the stored draft.
 */
function ReferenceComposer() {
  const [sent, setSent] = useState<MessageComposerMessage[]>([]);
  const [rejects, setRejects] = useState(false);
  const [mount, setMount] = useState(0);
  const [error, setError] = useState('');
  const submit = (message: MessageComposerMessage) => {
    if (rejects) return Promise.reject(new Error('The host refused the message.'));
    setError('');
    setSent((list) => [...list, message]);
    return undefined;
  };
  return (
    <>
      <div style={{ height: 220 }}>
        <ChatTranscript aria-label="Messages with references" emptyState="Nothing sent yet.">
          {sent.map((message, index) => (
            <ChatMessage key={index} origin="sent" data-lab-sent={index + 1}>
              <ChatParts
                parts={[{ type: 'text', text: message.text, tokens: message.tokens }]}
                getReference={getLabReference}
              />
              <SentMessage message={{ text: '', tokens: message.tokens }} />
            </ChatMessage>
          ))}
        </ChatTranscript>
      </div>
      <RichMessageComposer
        key={mount}
        aria-label="Message with references"
        placeholder="Add references from the + menu"
        defaultValue={referenceDraft}
        persistKey="message-composer-lab:references"
        startControls={referenceMenu}
        getReference={getLabReference}
        onSubmit={submit}
        onSubmitError={(reason) => setError(String(reason))}
        data-lab-composer="references"
      />
      <Checkbox isSelected={rejects} onChange={setRejects}>
        Reject sends
      </Checkbox>{' '}
      <Button size="sm" variant="secondary" onPress={() => setMount((value) => value + 1)}>
        Remount the composer
      </Button>
      <p role="status">{error}</p>
    </>
  );
}

export function ReferenceComposerSection() {
  return (
    <LabSection
      title="Record references"
      description="References to records as chips: the draft starts with two, the + menu inserts more (a missing and a restricted record among them), and Backspace or the chip's remove button takes one out. The chips' names, links and previews come from the host's getReference lookup by id. Sent messages show the chips again, Reject sends keeps the draft and its chips after Send, and Remount reads them back from the stored draft."
    >
      <ReferenceComposer />
    </LabSection>
  );
}
