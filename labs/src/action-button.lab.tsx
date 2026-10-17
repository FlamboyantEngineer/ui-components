import { useRef, useState } from 'react';
import { ActionButton } from '../../src/components/action-button/action-button.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

function Counter() {
  const [runs, setRuns] = useState(0);
  const [error, setError] = useState('');
  const release = useRef<(() => void) | null>(null);
  const fail = useRef<((reason: Error) => void) | null>(null);
  return (
    <div>
      <ActionButton
        data-lab-action="save"
        onPress={() =>
          new Promise<void>((resolve) => {
            release.current = resolve;
          }).then(() => setRuns((value) => value + 1))
        }
      >
        Save
      </ActionButton>{' '}
      <ActionButton
        variant="secondary"
        data-lab-action="fail"
        onPress={() =>
          new Promise<void>((_resolve, reject) => {
            fail.current = reject;
          })
        }
        onError={(reason) => setError(String(reason))}
      >
        Upload
      </ActionButton>{' '}
      <Button data-lab-action="finish" onPress={() => release.current?.()}>
        Finish save
      </Button>{' '}
      <Button
        data-lab-action="reject"
        onPress={() => fail.current?.(new Error('The request failed'))}
      >
        Fail upload
      </Button>
      <p>
        Completed saves: <output data-lab-output="runs">{runs}</output>
      </p>
      <p>
        Last error: <output data-lab-output="error">{error || 'none'}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Lifecycle"
      description="Each action stays pending until you finish or fail it; repeated presses are refused."
    >
      <Counter />
    </LabSection>
    <LabSection title="States">
      <StateMatrix
        axes={{ state: ['idle', 'pending', 'disabled'], size: ['sm', 'md', 'lg'] }}
        render={({ state, size }) => (
          <ActionButton
            size={size}
            isPending={state === 'pending'}
            isDisabled={state === 'disabled'}
            pendingLabel="Saving"
          >
            Save
          </ActionButton>
        )}
      />
    </LabSection>
  </>,
);
