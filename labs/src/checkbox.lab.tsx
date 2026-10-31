import { useState } from 'react';
import { Checkbox, cycleCheckState } from '../../src/components/checkbox/checkbox.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const values = ['empty', 'ticked', 'mixed'] as const;
const states = ['resting', 'required', 'invalid', 'read-only', 'disabled'] as const;

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
