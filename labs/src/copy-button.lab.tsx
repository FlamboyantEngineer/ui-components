import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { CopyButton } from '../../src/components/copy-button/copy-button.js';
import { useClipboard } from '../../src/utils/use-clipboard.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const states = ['rest', 'disabled'] as const;

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
    fallback: false,
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
      description="Any Icon Button variant and size; a disabled button never copies."
    >
      <StateMatrix
        axes={{ state: states, variant: ['ghost', 'secondary'], size: ['xs', 'sm', 'md', 'lg'] }}
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
      title="Overlapping copy feedback"
      description="This simulated clipboard lets writes finish out of order. Start the earlier copy, copy the latest, then refuse the earlier: feedback still follows the latest request. Reset also ignores a pending write."
    >
      <CopyFeedbackDemo />
    </LabSection>
  </>,
);
