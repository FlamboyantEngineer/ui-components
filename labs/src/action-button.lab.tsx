import { useState } from 'react';
import { ActionButton } from '../../src/components/action-button/action-button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Counter() {
  const [runs, setRuns] = useState(0);
  const [error, setError] = useState('');
  return (
    <div>
      <ActionButton
        data-lab-action="save"
        onPress={async () => {
          await wait(800);
          setRuns((value) => value + 1);
        }}
      >
        Save (800 ms)
      </ActionButton>{' '}
      <ActionButton
        variant="secondary"
        data-lab-action="fail"
        onPress={async () => {
          await wait(400);
          throw new Error('The request failed');
        }}
        onError={(reason) => setError(String(reason))}
      >
        Fail (400 ms)
      </ActionButton>
      <p>
        Completed runs: <output data-lab-output="runs">{runs}</output>
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
      description="Press repeatedly: each action runs once until it settles."
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
