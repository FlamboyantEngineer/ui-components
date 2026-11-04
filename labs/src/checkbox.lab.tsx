import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Checkbox, cycleCheckState } from '../../src/components/checkbox/checkbox.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabForm, MountOnDemand } from './lab-form.js';
import { LabOutput } from './lab-output.js';

const values = ['empty', 'ticked', 'mixed'] as const;
const states = ['resting', 'required', 'invalid', 'read-only', 'disabled'] as const;
const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const sizedStates = ['resting', 'invalid', 'disabled'] as const;

/**
 * Named boxes in a form: an uncontrolled box starting ticked, a controlled one, and a mixed one
 * that still submits its value while ticked. Reset puts each back as it started.
 */
function NamedBoxes() {
  const [updates, setUpdates] = useState(false);
  const [mixed, setMixed] = useState<boolean | null>(null);
  return (
    <LabForm label="Preferences">
      <Checkbox name="terms" value="accepted" defaultSelected data-lab-field="uncontrolled">
        Keep me signed in
      </Checkbox>
      <Checkbox name="updates" value="weekly" isSelected={updates} onChange={setUpdates}>
        Weekly updates
      </Checkbox>
      <Checkbox
        name="columns"
        value="all"
        isSelected={mixed === true}
        isIndeterminate={mixed === null}
        onChange={() => setMixed(cycleCheckState(mixed))}
      >
        All columns
      </Checkbox>
      <LabOutput name="Controlled">{`updates ${String(updates)}, columns ${mixed === null ? 'mixed' : String(mixed)}`}</LabOutput>
    </LabForm>
  );
}

/** A required box under each validation behaviour: native blocks the submit, aria reports only. */
function RequiredBoxes() {
  return (
    <>
      <LabForm label="Native terms">
        <Checkbox name="agree" value="yes" isRequired data-lab-field="required-native">
          I agree to the terms (native)
        </Checkbox>
      </LabForm>
      <LabForm label="Aria terms" noValidate>
        <Checkbox
          name="agree"
          value="yes"
          isRequired
          validationBehavior="aria"
          data-lab-field="required-aria"
        >
          I agree to the terms (aria)
        </Checkbox>
      </LabForm>
    </>
  );
}

/** A caller focuses the native input through `inputRef`, not the label wrapper. */
function FocusedInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState('nothing yet');
  return (
    <>
      <Checkbox inputRef={inputRef} data-lab-field="input-ref">
        Archive when done
      </Checkbox>
      <Button
        onPress={() => {
          inputRef.current?.focus();
          setFocused(inputRef.current?.tagName.toLowerCase() ?? 'nothing');
        }}
      >
        Focus the input
      </Button>
      <LabOutput name="Focused element">{focused}</LabOutput>
      <MountOnDemand label="an autofocused box">
        <Checkbox autoFocus data-lab-field="autofocus">
          Notify me
        </Checkbox>
      </MountOnDemand>
    </>
  );
}

function ThreeState() {
  const [value, setValue] = useState<boolean | null>(null);
  return (
    <>
      <Checkbox
        isSelected={value === true}
        isIndeterminate={value === null}
        onChange={() => setValue(cycleCheckState(value))}
        data-lab-field="three-state"
      >
        Repeat header row
      </Checkbox>
      <LabOutput name="Value">{value === null ? 'inherited' : String(value)}</LabOutput>
    </>
  );
}

function Options() {
  const [ticked, setTicked] = useState<string[]>([]);
  const toggle = (name: string) => (isSelected: boolean) =>
    setTicked((current) =>
      isSelected ? [...current, name] : current.filter((entry) => entry !== name),
    );
  return (
    <>
      <Checkbox onChange={toggle('case')} data-lab-field="case">
        Match case
      </Checkbox>
      <Checkbox onChange={toggle('word')}>Whole word</Checkbox>
      <LabOutput name="Options">{ticked.join(', ') || 'none'}</LabOutput>
    </>
  );
}

mountLab(
  <>
    <LabSection title="Values and states" description="Every value against every state.">
      <StateMatrix
        axes={{ state: states, value: values }}
        render={({ state, value }) => (
          <Checkbox
            isSelected={value === 'ticked'}
            isIndeterminate={value === 'mixed'}
            isRequired={state === 'required' || state === 'invalid'}
            isInvalid={state === 'invalid'}
            isReadOnly={state === 'read-only'}
            isDisabled={state === 'disabled'}
          >
            {`Option, ${state}, ${value}`}
          </Checkbox>
        )}
      />
    </LabSection>
    <LabSection
      title="Sizes"
      description="Each size of the shared control scale against each value, resting, invalid and disabled."
    >
      <StateMatrix
        axes={{ size: sizes, value: values, state: sizedStates }}
        render={({ size, value, state }) => (
          <Checkbox
            size={size}
            isSelected={value === 'ticked'}
            isIndeterminate={value === 'mixed'}
            isInvalid={state === 'invalid'}
            isDisabled={state === 'disabled'}
          >
            {`Option, ${size}, ${value}, ${state}`}
          </Checkbox>
        )}
      />
    </LabSection>
    <LabSection
      title="Form values and reset"
      description="Each ticked box submits its name and value; a mixed box submits while ticked. Reset puts every box back as it started."
    >
      <NamedBoxes />
    </LabSection>
    <LabSection
      title="Required, native or aria"
      description="Submit each unticked: native validation stops the submit, aria validation lets it through and marks the box invalid."
    >
      <RequiredBoxes />
    </LabSection>
    <LabSection
      title="Focusing the input"
      description="inputRef reaches the native input, which a caller can focus; a box mounted with autoFocus takes focus as it appears."
    >
      <FocusedInput />
    </LabSection>
    <LabSection title="Without visible text" description="Named by aria-label, as in a table row.">
      <Checkbox aria-label="Select the Apple row" defaultSelected />
    </LabSection>
    <LabSection title="Options" description="Independent options that report their state.">
      <Options />
    </LabSection>
    <LabSection
      title="Three states"
      description="A press cycles inherited (mixed), ticked and empty with cycleCheckState."
    >
      <ThreeState />
    </LabSection>
    <LabSection
      title="Numeric labels"
      description="A count of zero is label content like any other: it is drawn and names the box."
    >
      <Checkbox data-lab-field="zero">{0}</Checkbox>
    </LabSection>
  </>,
);
