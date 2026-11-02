// Wizard case: a step check and a finish that reject on request, then succeed on retry.

import { useState } from 'react';
import { Switch } from '../../src/components/switch/switch.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { Wizard, type WizardStep } from '../../src/components/wizard/wizard.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** Settles after 400 milliseconds: rejects with `message` when `fails`, else resolves. */
function settleLater(fails: boolean, message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (fails ? reject(new Error(message)) : resolve()), 400);
  });
}

function FailingDelivery() {
  const [street, setStreet] = useState('');
  const [failsCheck, setFailsCheck] = useState(true);
  const [failsFinish, setFailsFinish] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const note = (line: string) => setLog((previous) => [...previous, line]);
  const steps: WizardStep[] = [
    {
      id: 'address',
      label: 'Address',
      content: (
        <TextField label="Street" name="street" isRequired value={street} onChange={setStreet} />
      ),
      validate: () =>
        settleLater(failsCheck, 'The address service is unreachable.').then(
          () => {
            note('check passed');
            return true;
          },
          (error: unknown) => {
            note('check failed');
            throw error;
          },
        ),
    },
    {
      id: 'confirm',
      label: 'Confirm',
      content: <p>Deliver to {street || '—'}.</p>,
    },
  ];
  return (
    <div data-lab-demo="failing-wizard">
      <Switch isSelected={failsCheck} onChange={setFailsCheck}>
        Fail the address check
      </Switch>{' '}
      <Switch isSelected={failsFinish} onChange={setFailsFinish}>
        Fail the finish
      </Switch>
      <Wizard
        aria-label="Delivery"
        steps={steps}
        finishLabel="Place order"
        headingLevel={3}
        onFinish={() =>
          settleLater(failsFinish, 'The order could not be placed.').then(
            () => note('finished'),
            (error: unknown) => {
              note('finish failed');
              throw error;
            },
          )
        }
      />
      <LabOutput name="attempts">{log.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

export function WizardFailureCases() {
  return (
    <div data-lab-family="wizard-failure-cases">
      <LabSection
        title="Failed check and finish"
        description="Both switches start on. Next runs the address check, which rejects after 400 milliseconds: the step stays, shows the error's message and keeps the street. Turn the check's switch off and press Next again to move on. Place order then rejects the same way; turn its switch off and retry to finish. The attempts list each outcome."
      >
        <FailingDelivery />
      </LabSection>
    </div>
  );
}
