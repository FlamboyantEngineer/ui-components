// Message Composer cases for row bounds, the plain composer's length limit, and the rich
// composer's handle read from outside while an edit replaces the draft.

import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { MessageComposer } from '../../src/components/message-composer/message-composer.js';
import {
  type MessageComposerHandle,
  type MessageComposerMessage,
  RichMessageComposer,
} from '../../src/components/message-composer/rich/index.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { LabSection } from './chrome/index.js';

const longDraft = Array.from(
  { length: 9 },
  (_, index) => `Line ${String(index + 1)} of notes`,
).join('\n');

/** Plain and rich composers whose rows the reader bounds, both holding more lines than fit. */
function RowBounds() {
  const [minRows, setMinRows] = useState(2);
  const [maxRows, setMaxRows] = useState(4);
  return (
    <div data-lab-demo="rows">
      <NumberField
        label="Minimum rows"
        value={minRows}
        minValue={1}
        maxValue={8}
        onChange={(value) => setMinRows(value ?? 1)}
      />
      <NumberField
        label="Maximum rows"
        value={maxRows}
        minValue={1}
        maxValue={12}
        onChange={(value) => setMaxRows(value ?? 1)}
      />
      <p data-lab-output="rows">
        minRows {minRows}, maxRows {maxRows}
      </p>
      <MessageComposer
        aria-label="Plain message with row bounds"
        data-lab-composer="rows-plain"
        defaultValue={longDraft}
        minRows={minRows}
        maxRows={maxRows}
        onSubmit={() => undefined}
      />
      <RichMessageComposer
        aria-label="Rich message with row bounds"
        data-lab-composer="rows-rich"
        defaultValue={{ text: longDraft, tokens: [] }}
        minRows={minRows}
        maxRows={maxRows}
        onSubmit={() => undefined}
      />
    </div>
  );
}

/** A plain composer that accepts at most 40 characters, typed or pasted. */
function LengthLimit() {
  const [value, setValue] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div data-lab-demo="max-length">
      <MessageComposer
        aria-label="Short message"
        maxLength={40}
        value={value}
        onChange={setValue}
        onSubmit={(text) => {
          setSent(text);
          setValue('');
        }}
      />
      <p data-lab-output="length">{value.length} of 40 characters</p>
      <p data-lab-output="sent">Sent: {sent ?? 'nothing yet'}</p>
    </div>
  );
}

const draftStart: MessageComposerMessage = { text: 'Ask about the plum order', tokens: [] };
const earlierMessage: MessageComposerMessage = { text: 'The pears arrive on Monday', tokens: [] };

/** Reads the handle from outside while an edit of an earlier message replaces the draft. */
function HandleInspector() {
  const handle = useRef<MessageComposerHandle>(null);
  const [isEditing, setEditing] = useState(false);
  const [readout, setReadout] = useState('');
  const read = () => {
    const composer = handle.current;
    if (!composer) return setReadout('unavailable');
    const selection = composer.getSelection();
    setReadout(
      [
        `draft: ${composer.getDraft().text}`,
        `value: ${composer.getValue().text}`,
        `selection: ${selection ? `${String(selection.start)}–${String(selection.end)}` : 'none'}`,
      ].join(' | '),
    );
  };
  return (
    <div data-lab-demo="handle">
      <RichMessageComposer
        aria-label="Message with a handle"
        handleRef={handle}
        defaultValue={draftStart}
        editValue={isEditing ? earlierMessage : undefined}
        onCancel={() => setEditing(false)}
        onSubmit={() => setEditing(false)}
        mentions={[{ id: 'ana', label: 'Ana Lopez' }]}
      />
      <div role="group" aria-label="Handle controls">
        <Button
          size="sm"
          variant="secondary"
          isSelected={isEditing}
          onPress={() => setEditing((editing) => !editing)}
        >
          Edit the earlier message
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={read}>
          Read the handle
        </Button>{' '}
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            const result = handle.current?.insertToken({
              kind: 'mention',
              id: 'ana',
              label: 'Ana Lopez',
            });
            setReadout(`insertToken: ${result ?? 'unavailable'}`);
          }}
        >
          Mention Ana
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={() => handle.current?.focus()}>
          Focus the composer
        </Button>
      </div>
      <p data-lab-output="handle">{readout}</p>
    </div>
  );
}

export function ComposerHandleSections() {
  return (
    <>
      <LabSection
        title="Row bounds"
        description="minRows sets the starting height and maxRows the height the text grows to before it scrolls, for the plain and the rich composer alike. Both hold nine lines, so lowering the maximum makes them scroll."
      >
        <RowBounds />
      </LabSection>
      <LabSection
        title="Length limit"
        description="maxLength 40 on the plain composer: typing or pasting stops at 40 characters, and Enter sends what was accepted."
      >
        <LengthLimit />
      </LabSection>
      <LabSection
        title="Handle readout"
        description="Read the handle reports getDraft, getValue and getSelection. While the earlier message is being edited, getValue reads the edit and getDraft the draft kept behind it, and Mention Ana answers editing. Focus the composer returns focus with the caret where it was; Mention Ana inserts at the caret and focuses after the pill."
      >
        <HandleInspector />
      </LabSection>
    </>
  );
}
