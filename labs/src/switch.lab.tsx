import { useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const values = ['off', 'on'] as const;
const states = ['resting', 'read-only', 'disabled'] as const;

function Output({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}

/** A settings list: each switch applies at once and reports its state. */
function Settings() {
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  return (
    <>
      <Switch isSelected={wifi} onChange={setWifi} data-lab-field="wifi">
        Wi-Fi
      </Switch>
      <Switch isSelected={bluetooth} onChange={setBluetooth} data-lab-field="bluetooth">
        Bluetooth
      </Switch>
      <Output name="Settings">{`Wi-Fi ${wifi ? 'on' : 'off'}, Bluetooth ${bluetooth ? 'on' : 'off'}`}</Output>
    </>
  );
}

function FormValue() {
  const [submitted, setSubmitted] = useState('none');
  return (
    <form
      aria-label="Notifications"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(data.getAll('channel').join(', ') || 'none');
      }}
    >
      <Switch name="channel" value="email" defaultSelected>
        Email
      </Switch>
      <Switch name="channel" value="push">
        Push
      </Switch>
      <Button type="submit">Save</Button>
      <Output name="Submitted">{submitted}</Output>
    </form>
  );
}

mountLab(
  <>
    <LabSection title="Values and states" description="Every value against every state.">
      <StateMatrix
        axes={{ state: states, value: values }}
        render={({ state, value }) => (
          <Switch
            isSelected={value === 'on'}
            isReadOnly={state === 'read-only'}
            isDisabled={state === 'disabled'}
          >
            {`Option, ${state}, ${value}`}
          </Switch>
        )}
      />
    </LabSection>
    <LabSection title="Without visible text" description="Named by aria-label, as in a toolbar.">
      <Switch aria-label="Show the grid" defaultSelected data-lab-field="unlabelled" />
    </LabSection>
    <LabSection title="Settings" description="Each switch applies at once.">
      <Settings />
    </LabSection>
    <LabSection
      title="Form value"
      description="A form submits the value of each switch that is on."
    >
      <FormValue />
    </LabSection>
  </>,
);
