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

function DelayedPending() {
  const release = useRef<(() => void) | null>(null);
  return (
    <div>
      <ActionButton
        pendingDelay={1000}
        data-lab-action="delayed"
        onPress={() =>
          new Promise<void>((resolve) => {
            release.current = resolve;
          })
        }
      >
        Publish
      </ActionButton>{' '}
      <Button data-lab-action="release" onPress={() => release.current?.()}>
        Finish publishing
      </Button>
    </div>
  );
}

function SubmitForm() {
  const [submits, setSubmits] = useState(0);
  const release = useRef<(() => void) | null>(null);
  return (
    <form
      aria-label="Message"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits((value) => value + 1);
      }}
    >
      <ActionButton
        type="submit"
        data-lab-action="submit"
        onPress={() =>
          new Promise<void>((resolve) => {
            release.current = resolve;
          })
        }
      >
        Send
      </ActionButton>{' '}
      <Button data-lab-action="finish-send" onPress={() => release.current?.()}>
        Finish sending
      </Button>
      <p>
        Submissions: <output data-lab-output="submits">{submits}</output>
      </p>
    </form>
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
    <LabSection
      title="Pending delay"
      description="With pendingDelay={1000} the spinner appears only once the action has run for a second, so a quick action never flashes it."
    >
      <DelayedPending />
    </LabSection>
    <LabSection
      title="Form submission"
      description="A submit action button submits its form with the press that starts the action and refuses repeat submissions until you finish it."
    >
      <SubmitForm />
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
    <LabSection
      title="Hint and shortcut"
      description="Button's tooltip and shortcut pass through and stay while the action runs."
    >
      <StateMatrix
        axes={{ state: ['idle', 'pending'], size: ['sm', 'md', 'lg'] }}
        render={({ state, size }) => (
          <ActionButton
            size={size}
            isPending={state === 'pending'}
            tooltip="Publish the draft"
            shortcut="Ctrl+Enter"
          >
            Publish
          </ActionButton>
        )}
      />
    </LabSection>
  </>,
);
