import { useRef, useState } from 'react';
import { BooleanField } from '../../src/components/boolean-field/boolean-field.js';
import { Button } from '../../src/components/button/button.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabForm, MountOnDemand } from './lab-form.js';
import { LabOutput } from './lab-output.js';

const values = ['off', 'on'] as const;
const states = ['resting', 'required', 'invalid', 'read-only', 'disabled'] as const;
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

/** A required switch under each validation behaviour, and a controlled one that resets with its form. */
function RequiredSwitches() {
  const [backups, setBackups] = useState(true);
  return (
    <>
      <LabForm label="Native consent">
        <Switch name="consent" value="given" isRequired data-lab-field="required-native">
          Share usage data (native)
        </Switch>
        <Switch name="backups" value="on" isSelected={backups} onChange={setBackups}>
          Nightly backups
        </Switch>
        <LabOutput name="Backups">{backups ? 'on' : 'off'}</LabOutput>
      </LabForm>
      <LabForm label="Aria consent" noValidate>
        <Switch
          name="consent"
          value="given"
          isRequired
          validationBehavior="aria"
          data-lab-field="required-aria"
        >
          Share usage data (aria)
        </Switch>
      </LabForm>
    </>
  );
}

/** `inputRef` reaches the native input; a disabled switch refuses the focus. */
function FocusedInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const disabledRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState('nothing yet');
  const focus = (input: HTMLInputElement | null) => {
    input?.focus();
    setFocused(
      document.activeElement === input ? 'the input' : 'nothing (the switch refused focus)',
    );
  };
  return (
    <>
      <Switch inputRef={inputRef} data-lab-field="input-ref">
        Dark mode
      </Switch>
      <Switch inputRef={disabledRef} isDisabled data-lab-field="input-ref-disabled">
        Sync (disabled)
      </Switch>
      <Button onPress={() => focus(inputRef.current)}>Focus the input</Button>
      <Button onPress={() => focus(disabledRef.current)}>Focus the disabled input</Button>
      <LabOutput name="Focused">{focused}</LabOutput>
      <MountOnDemand label="an autofocused switch">
        <Switch autoFocus data-lab-field="autofocus">
          Reduce motion
        </Switch>
      </MountOnDemand>
    </>
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
            isRequired={state === 'required' || state === 'invalid'}
            isInvalid={state === 'invalid'}
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
      title="Required, validation and reset"
      description="Submit with the switch off: native validation stops the submit, aria validation lets it through and marks the switch invalid. Reset puts the controlled backups switch back on."
    >
      <RequiredSwitches />
    </LabSection>
    <LabSection
      title="Focusing the input"
      description="inputRef reaches the native input, which a caller can focus; a disabled switch refuses it. A switch mounted with autoFocus takes focus as it appears."
    >
      <FocusedInput />
    </LabSection>
    <LabSection
      title="Numeric labels"
      description="A count of zero is label content like any other: it is drawn and names the switch."
    >
      <Switch data-lab-field="zero">{0}</Switch>
    </LabSection>
  </>,
);
