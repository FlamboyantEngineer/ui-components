// The native presentation of the select field lab: the platform's own select inside the field.

import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import type { FieldLabelLayout } from '../../src/components/field/field.js';
import {
  SelectField,
  type SelectFieldItem,
  type SelectFieldOption,
} from '../../src/components/select-field/select-field.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import {
  fieldLayouts,
  type FieldStateName,
  fieldStates,
  useLabFieldState,
} from './field-states.js';
import { LabOutput } from './lab-output.js';

const rates: SelectFieldOption[] = [
  { id: 'slow', label: 'Slow, 1 per second' },
  { id: 'medium', label: 'Medium, 10 per second' },
  { id: 'fast', label: 'Fast, 100 per second' },
  { id: 'burst', label: 'Burst, 1,000 per second', isDisabled: true },
];

const grouped: SelectFieldItem[] = [
  { id: 'auto', label: 'Automatic' },
  {
    id: 'timed',
    label: 'Timed',
    options: [
      { id: 'second', label: 'Every second' },
      { id: 'minute', label: 'Every minute' },
    ],
  },
  { id: 'manual-group', options: [{ id: 'manual', label: 'Manual' }] },
];

function MatrixField({ state, layout }: { state: FieldStateName; layout: FieldLabelLayout }) {
  const stateProps = useLabFieldState<Key | null>(state, {
    value: 'slow',
    edited: 'medium',
    invalid: 'fast',
    warning: 'medium',
    empty: null,
  });
  return (
    <SelectField mode="native" label="Rate" labelLayout={layout} options={rates} {...stateProps} />
  );
}

const sources = ['A', 'B', 'C', 'D', 'E'].map((letter) => ({
  id: `source-${letter.toLowerCase()}`,
  label: `Source ${letter}`,
}));

/**
 * Sources come and go as the host finds them; the chosen one stays selected while it is listed, and
 * the required empty option shows while it is not.
 */
function ChangingOptions() {
  const [count, setCount] = useState(3);
  const [value, setValue] = useState<Key | null>('source-b');
  const listed = sources.slice(0, count);
  return (
    <div data-lab-demo="changing-options">
      <SelectField
        mode="native"
        label="Source"
        options={listed}
        value={value}
        onChange={setValue}
        isRequired
        placeholder="No source available"
        data-lab-field="source"
      />
      <Button size="sm" isDisabled={count >= sources.length} onPress={() => setCount(count + 1)}>
        Add a source
      </Button>
      <Button size="sm" isDisabled={count === 0} onPress={() => setCount(count - 1)}>
        Remove the last source
      </Button>
      <Button size="sm" isDisabled={count === 0} onPress={() => setCount(0)}>
        Remove every source
      </Button>
      <LabOutput name="Listed">
        {listed.map((source) => source.label).join(', ') || 'none'}
      </LabOutput>
      <LabOutput name="Source">{value ?? 'none'}</LabOutput>
    </div>
  );
}

/** A form whose fieldset the page disables; the browser then leaves the select out of the data. */
function NativeForm() {
  const [isLocked, setLocked] = useState(false);
  const [entries, setEntries] = useState('none');
  return (
    <form
      data-lab-demo="native-form"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setEntries(
          [...data.entries()].map(([name, entry]) => `${name}=${String(entry)}`).join(' ') ||
            'empty',
        );
      }}
    >
      <fieldset disabled={isLocked}>
        <legend>Acquisition</legend>
        <SelectField
          mode="native"
          label="Rate"
          name="rate"
          options={rates}
          isRequired
          validationBehavior="native"
          data-lab-field="form-rate"
        />
        <SelectField
          mode="native"
          label="Trigger"
          name="trigger"
          options={grouped}
          emptyLabel="None"
          defaultValue="minute"
        />
      </fieldset>
      <Button size="sm" onPress={() => setLocked(!isLocked)}>
        {isLocked ? 'Enable the fieldset' : 'Disable the fieldset'}
      </Button>
      <Button size="sm" type="submit">
        Submit
      </Button>
      <LabOutput name="Form">{entries}</LabOutput>
    </form>
  );
}

/** A command elsewhere on the page that reads and focuses the native select through its ref. */
function SelectRefField() {
  const selectRef = useRef<HTMLSelectElement>(null);
  const [read, setRead] = useState('nothing yet');
  return (
    <div data-lab-demo="select-ref">
      <SelectField
        mode="native"
        label="Channel"
        options={sources}
        defaultValue="source-a"
        selectRef={selectRef}
      />
      <Button
        size="sm"
        onPress={() => {
          setRead(selectRef.current?.value ?? 'no select');
          selectRef.current?.focus();
        }}
      >
        Read and focus the channel
      </Button>
      <LabOutput name="Read">{read}</LabOutput>
    </div>
  );
}

export const nativeChoices = (
  <div data-lab-family="native">
    <LabSection
      title="Native: Layouts and states"
      description="mode native draws the platform's own select and picker, in every label layout and state. The dirty cell shows the previous value; the read-only cell keeps its choice."
    >
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <MatrixField state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Native: Changing options"
      description="Add and remove sources: Source B stays chosen while it is listed. With no source left the required select shows its empty option and reports the missing value, and Source B is chosen again once it comes back."
    >
      <ChangingOptions />
    </LabSection>
    <LabSection
      title="Native: Forms and fieldsets"
      description="Submit without a rate: the browser stops the form and the field shows its message. Disable the fieldset: both selects lock, keep their values, and leave the submitted data. Timed is an option group; None chooses no trigger."
    >
      <NativeForm />
    </LabSection>
    <LabSection
      title="Native: Select ref"
      description="The button reads the native select's value and focuses it through its ref."
    >
      <SelectRefField />
    </LabSection>
  </div>
);
