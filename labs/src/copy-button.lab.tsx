import { useRef, useState } from 'react';
import { Button, type ButtonVariant } from '../../src/components/button/button.js';
import { CopyButton } from '../../src/components/copy-button/copy-button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { copyRichText, type RichCopyResult } from '../../src/utils/index.js';
import { useClipboard } from '../../src/utils/use-clipboard.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const states = ['rest', 'disabled'] as const;
const variants = [
  'primary',
  'secondary',
  'tertiary',
  'danger',
  'ghost',
  'accent',
  'chip',
  'link',
  'bare',
] as const satisfies readonly ButtonVariant[];
const timeouts = { short: 600, long: 5000 } as const;

/** A copy button whose feedback lasts a short or a long time. */
function TimeoutDemo() {
  const [length, setLength] = useState<keyof typeof timeouts>('short');
  const [copies, setCopies] = useState(0);
  return (
    <div data-lab-demo="timeout">
      <SegmentedChoice
        aria-label="Feedback lasts"
        sizing="content"
        options={[
          { value: 'short', label: 'Short (600 ms)' },
          { value: 'long', label: 'Long (5 s)' },
        ]}
        value={length}
        onChange={(value) => setLength(value === 'long' ? 'long' : 'short')}
      />
      <p>
        <code>INV-0042</code>{' '}
        <CopyButton
          value="INV-0042"
          label="Copy the invoice number"
          timeout={timeouts[length]}
          onCopy={() => setCopies((value) => value + 1)}
        />
      </p>
      <p>
        Timeout: <output data-lab-output="timeout">{timeouts[length]} ms</output>, copies:{' '}
        <output data-lab-output="copies">{copies}</output>
      </p>
    </div>
  );
}

/** Copies a formatted note: rich editors paste the HTML, plain fields the text. */
function RichCopyDemo() {
  const [result, setResult] = useState<RichCopyResult | 'not copied'>('not copied');
  const copy = async () => {
    setResult(
      await copyRichText(
        {
          text: 'Lemon tart: zest, juice, butter',
          html: '<p><strong>Lemon tart</strong>: zest, juice, butter</p>',
        },
        { fallbackOnRichFailure: true },
      ),
    );
  };
  return (
    <div>
      <Button size="sm" onPress={() => void copy()}>
        Copy the note as rich text
      </Button>
      <LabOutput name="rich-copy">{result}</LabOutput>
    </div>
  );
}

function CopyDemo() {
  const [outcome, setOutcome] = useState('none');
  return (
    <div data-lab-demo="copy">
      <p>
        <code data-lab-value="">ORD-2026-0417</code>{' '}
        <CopyButton
          value="ORD-2026-0417"
          label="Copy the order number"
          onCopy={(copied) => setOutcome(copied ? 'copied' : 'refused')}
        />
      </p>
      <p data-lab-output="outcome">Last copy: {outcome}</p>
      <p>
        <label>
          Paste here <input data-lab-paste="" />
        </label>
      </p>
    </div>
  );
}

function CopyFeedbackDemo() {
  const finishEarlier = useRef<(() => void) | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const { copy, status, reset } = useClipboard({
    clipboard: {
      writeText: (text) =>
        text === 'Earlier'
          ? new Promise<void>((_resolve, reject) => {
              finishEarlier.current = () => reject(new Error('Refused'));
            })
          : Promise.resolve(),
    },
  });
  return (
    <div data-lab-demo="feedback">
      <Button
        isDisabled={isWaiting}
        onPress={() => {
          setIsWaiting(true);
          void copy('Earlier');
        }}
      >
        Start earlier copy
      </Button>{' '}
      <Button onPress={() => void copy('Latest')}>Copy latest</Button>{' '}
      <Button
        isDisabled={!isWaiting}
        onPress={() => {
          finishEarlier.current?.();
          setIsWaiting(false);
        }}
      >
        Refuse earlier copy
      </Button>{' '}
      <Button onPress={reset}>Reset feedback</Button>
      <p role="status">Feedback: {status}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants, sizes and states"
      description="Every Icon Button variant and size; a disabled button never copies."
    >
      <StateMatrix
        axes={{ state: states, variant: variants, size: ['xs', 'sm', 'md', 'lg'] }}
        render={({ state, variant, size }) => (
          <CopyButton
            value="Lisbon"
            variant={variant}
            size={size}
            isDisabled={state === 'disabled'}
            label={`Copy Lisbon (${variant}, ${size}, ${state})`}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Copying"
      description="Press the button: it copies the order number, shows a check mark and announces Copied for two seconds."
    >
      <CopyDemo />
    </LabSection>
    <LabSection
      title="Feedback duration"
      description="timeout sets how long the check mark lasts: copy with Short and it returns to the copy glyph after 600 ms; with Long it stays for five seconds."
    >
      <TimeoutDemo />
    </LabSection>
    <LabSection
      title="Overlapping copy feedback"
      description="This simulated clipboard lets writes finish out of order. Start the earlier copy, copy the latest, then refuse the earlier: feedback still follows the latest request, and the refused copy does not fall back to a selection copy over the latest text. Reset also ignores a pending write."
    >
      <CopyFeedbackDemo />
    </LabSection>
    <LabSection
      title="Rich text from the host"
      description="copyRichText writes HTML with a plain-text version, falling back to the text alone where the browser refuses rich writes."
    >
      <RichCopyDemo />
    </LabSection>
  </>,
);
