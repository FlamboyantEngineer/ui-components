import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Choice, ChoiceGroup } from '../../src/components/choice-group/choice-group.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import {
  fieldLayouts,
  type FieldStateName,
  fieldStates,
  useLabFieldState,
} from './field-states.js';
import { LabOutput } from './lab-output.js';

const fruit: Array<{ value: string; label: string; isDisabled?: boolean }> = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear', label: 'Pear' },
  { value: 'plum', label: 'Plum' },
];

const toppings: Array<{ value: string; label: string; isDisabled?: boolean }> = [
  { value: 'basil', label: 'Basil' },
  { value: 'olives', label: 'Olives' },
  { value: 'peppers', label: 'Peppers' },
  { value: 'truffle', label: 'Truffle (sold out)', isDisabled: true },
];

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
  return (
    <ChoiceGroup selectionMode="multiple" label="Fruit" labelLayout={layout} {...props}>
      {fruit.map(({ label, ...option }) => (
        <Choice key={option.value} {...option}>
          {label}
        </Choice>
      ))}
    </ChoiceGroup>
  );
}

/** A parent box ticks or clears every enabled topping; the sold-out one keeps its state. */
function SelectAll() {
  const [value, setValue] = useState<string[]>(['olives']);
  return (
    <>
      <ChoiceGroup
        selectionMode="multiple"
        label="Toppings"
        selectAllLabel="All toppings"
        value={value}
        onChange={setValue}
        data-lab-field="select-all"
      >
        {toppings.map(({ label, ...option }) => (
          <Choice key={option.value} {...option}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>
      <LabOutput name="Toppings">{value.join(', ') || 'none'}</LabOutput>
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
      <ChoiceGroup
        selectionMode="multiple"
        label="Basket"
        name="fruit"
        value={value}
        onChange={setValue}
        committedValue={saved}
        description="Each ticked fruit submits under the name fruit."
        showRestoreButton
        data-lab-field="saved"
      >
        {fruit.map(({ label, ...option }) => (
          <Choice key={option.value} {...option}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>
      <Button onPress={() => setSaved(value)}>Save</Button>
      <Button type="submit">Submit</Button>
      <LabOutput name="Submitted">{submitted}</LabOutput>
    </form>
  );
}

/**
 * Hiding a ticked choice keeps it in the value, but it no longer counts or submits; a ticked disabled
 * choice still submits.
 */
function ChangingChoices() {
  const [isPlumListed, setPlumListed] = useState(true);
  const [submitted, setSubmitted] = useState('none');
  const listed = fruit.filter((option) => isPlumListed || option.value !== 'plum');
  return (
    <form
      aria-label="Changing basket"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(new FormData(event.currentTarget).getAll('fruit').join(', ') || 'none');
      }}
    >
      <ChoiceGroup
        selectionMode="multiple"
        label="Picked fruit"
        name="fruit"
        defaultValue={['pear', 'plum']}
        isRequired
        data-lab-field="changing"
      >
        {listed.map(({ label, ...option }) => (
          <Choice key={option.value} {...option} isDisabled={option.value === 'pear'}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>
      <Button onPress={() => setPlumListed((listed) => !listed)}>
        {isPlumListed ? 'Remove Plum' : 'Restore Plum'}
      </Button>
      <Button type="submit">Send picked fruit</Button>
      <LabOutput name="Picked fruit sent">{submitted}</LabOutput>
    </form>
  );
}

export const multipleChoices = (
  <div data-lab-family="multiple">
    <LabSection
      title="Multiple choices: sizes and orientations"
      description="Independent checkbox choices with descriptions at every size, in a row or column."
    >
      <StateMatrix
        axes={{
          size: ['xs', 'sm', 'md', 'lg'] as const,
          orientation: ['vertical', 'horizontal'] as const,
        }}
        render={({ size, orientation }) => (
          <ChoiceGroup
            selectionMode="multiple"
            label="Fruit"
            size={size}
            orientation={orientation}
            defaultValue={['pear']}
            selectAllLabel="All fruit"
          >
            <Choice value="pear" description="Ripe today.">
              Pear
            </Choice>
            <Choice value="plum">Plum</Choice>
            <Choice value="fig" isDisabled>
              Fig
            </Choice>
          </ChoiceGroup>
        )}
      />
    </LabSection>
    <LabSection
      title="Multiple choices: Layouts and states"
      description="Every label layout against every state."
    >
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <Sample state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Multiple choices: Select all"
      description="The parent box is mixed while some toppings are ticked. Selecting or clearing all preserves disabled and unlisted values and the value order."
    >
      <SelectAll />
    </LabSection>
    <LabSection
      title="Multiple choices: Form value, dirty state and the field menu"
      description="Each ticked value submits under the group's name."
    >
      <SavedGroup />
    </LabSection>
    <LabSection
      title="Multiple choices: Changing choices"
      description="Pear is ticked but disabled and still submits. Removing Plum keeps it in the value without submitting it; restoring Plum shows it ticked again."
    >
      <ChangingChoices />
    </LabSection>
  </div>
);
