import { useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  CheckboxGroup,
  type CheckboxGroupOption,
} from '../../src/components/checkbox-group/checkbox-group.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

const fruit: CheckboxGroupOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear', label: 'Pear' },
  { value: 'plum', label: 'Plum' },
];

const toppings: CheckboxGroupOption[] = [
  { value: 'basil', label: 'Basil' },
  { value: 'olives', label: 'Olives' },
  { value: 'peppers', label: 'Peppers' },
  { value: 'truffle', label: 'Truffle (sold out)', isDisabled: true },
];

function Output({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}

function Sample({
  state,
  layout,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
}) {
  const props = useLabFieldState<string[]>(state, {
    value: ['apple'],
    edited: ['apple', 'pear'],
    invalid: ['plum'],
    warning: ['pear'],
    empty: [],
  });
  return <CheckboxGroup label="Fruit" labelLayout={layout} options={fruit} {...props} />;
}

/** A parent box ticks or clears every enabled topping; the sold-out one keeps its state. */
function SelectAll() {
  const [value, setValue] = useState<string[]>(['olives']);
  return (
    <>
      <CheckboxGroup
        label="Toppings"
        options={toppings}
        selectAllLabel="All toppings"
        value={value}
        onChange={setValue}
        data-lab-field="select-all"
      />
      <Output name="Toppings">{value.join(', ') || 'none'}</Output>
    </>
  );
}

/** The committed value is the caller's: the field stays dirty until Save. */
function SavedGroup() {
  const [saved, setSaved] = useState<string[]>(['pear']);
  const [value, setValue] = useState<string[]>(['pear']);
  const [submitted, setSubmitted] = useState('none');
  return (
    <form
      aria-label="Basket"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(new FormData(event.currentTarget).getAll('fruit').join(', ') || 'none');
      }}
    >
      <CheckboxGroup
        label="Basket"
        name="fruit"
        options={fruit}
        value={value}
        onChange={setValue}
        committedValue={saved}
        menu={['clear']}
        description="Each ticked fruit submits under the name fruit."
        data-lab-field="saved"
      />
      <Button onPress={() => setSaved(value)}>Save</Button>
      <Button type="submit">Submit</Button>
      <Output name="Submitted">{submitted}</Output>
    </form>
  );
}

mountLab(
  <>
    <LabSection title="Layouts and states" description="Every label layout against every state.">
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <Sample state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Select all"
      description="The parent box is mixed while some toppings are ticked. Selecting or clearing all preserves disabled and unlisted values and the value order."
    >
      <SelectAll />
    </LabSection>
    <LabSection
      title="Form value, dirty state and the field menu"
      description="Each ticked value submits under the group's name."
    >
      <SavedGroup />
    </LabSection>
  </>,
);
