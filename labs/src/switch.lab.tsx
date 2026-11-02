import { useState } from 'react';
import { BooleanField } from '../../src/components/boolean-field/boolean-field.js';
import { Button } from '../../src/components/button/button.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const values = ['off', 'on'] as const;
const states = ['resting', 'read-only', 'disabled'] as const;
const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const sizedValues = ['off', 'on', 'unset'] as const;

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
      <LabOutput name="Settings">{`Wi-Fi ${wifi ? 'on' : 'off'}, Bluetooth ${bluetooth ? 'on' : 'off'}`}</LabOutput>
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
      <LabOutput name="Submitted">{submitted}</LabOutput>
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
    <LabSection
      title="Sizes"
      description="A switch and a Boolean Field switch share one size scale: the same track and thumb at each size, off, on and unset."
    >
      <StateMatrix
        axes={{ size: sizes, value: sizedValues }}
        render={({ size, value }) => (
          <>
            <Switch
              size={size}
              isSelected={value === 'on'}
              isIndeterminate={value === 'unset'}
              aria-label={`Bare switch, ${size}, ${value}`}
            />
            <BooleanField
              label={`Field switch, ${size}, ${value}`}
              variant="switch"
              size={size}
              allowsUnset
              value={value === 'unset' ? null : value === 'on'}
            />
          </>
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
    <LabSection
      title="Numeric labels"
      description="A count of zero is label content like any other: it is drawn and names the switch."
    >
      <Switch data-lab-field="zero">{0}</Switch>
    </LabSection>
  </>,
);
