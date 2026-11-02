// A form lab case: the form tells the page each time what blocks it, and each blocker can take the
// reader to its field.

import { useCallback, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Form, type FormBlocker } from '../../src/components/form/form.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

function describeBlockers(blockers: readonly FormBlocker[]): string {
  return blockers.length === 0
    ? 'clear'
    : blockers.map((blocker) => `${blocker.label} ${blocker.status}`).join(', ');
}

/** A form whose blockers the page lists as they change, with a button to focus each one. */
function BlockerLog() {
  const [blockers, setBlockers] = useState<readonly FormBlocker[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [hasPhone, setPhone] = useState(false);
  const [isNameDisabled, setNameDisabled] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const [isChecking, setChecking] = useState(false);
  // The handle's check waits until the reader finishes it, so the pending state can be read.
  const checkHandle = useCallback(
    (_value: string, signal: AbortSignal) =>
      new Promise<[]>((resolve, reject) => {
        setChecking(true);
        pending.current = () => {
          setChecking(false);
          resolve([]);
        };
        signal.addEventListener('abort', () => {
          setChecking(false);
          reject(signal.reason);
        });
      }),
    [],
  );
  return (
    <div data-lab-demo="blocker-log">
      <Checkbox isSelected={hasPhone} onChange={setPhone}>
        Ask for a phone number
      </Checkbox>{' '}
      <Checkbox isSelected={isNameDisabled} onChange={setNameDisabled}>
        Disable the name
      </Checkbox>
      <Form
        aria-label="Profile"
        validationMode="submit"
        onSubmit={(event) => event.preventDefault()}
        onValidityChange={(next) => {
          setBlockers(next);
          setLog((list) => [...list, describeBlockers(next)]);
        }}
      >
        <TextField label="Name" isRequired isDisabled={isNameDisabled} />
        <TextField label="Handle" defaultValue="cook" validateAsync={checkHandle} />
        {hasPhone ? <TextField label="Phone" type="tel" isRequired /> : null}
      </Form>
      <Button
        size="sm"
        variant="secondary"
        isDisabled={!isChecking}
        onPress={() => pending.current?.()}
      >
        Finish the handle check
      </Button>
      <p data-lab-blocker-buttons="">
        {blockers.map((blocker) => (
          <Button
            key={blocker.label}
            size="sm"
            variant="secondary"
            onPress={() => blocker.focus()}
          >{`Go to ${blocker.label}`}</Button>
        ))}
      </p>
      <LabOutput name="blockers">{describeBlockers(blockers)}</LabOutput>
      <ol data-lab-output="validity-log">
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}

export function FormBlockerCases() {
  return (
    <LabSection
      title="Validity changes and blockers"
      description="onValidityChange tells the page what blocks the form each time that changes, in document order, without revealing any field's error: the log grows as you type a name, ask for a phone number, disable the name, or finish the handle's pending check. Each Go to button calls its blocker's focus()."
    >
      <BlockerLog />
    </LabSection>
  );
}
