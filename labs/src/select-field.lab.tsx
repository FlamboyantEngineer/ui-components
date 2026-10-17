import { useState, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import type { FieldLabelLayout, FieldMenuEntry } from '../../src/components/field/field.js';
import {
  SelectField,
  type SelectFieldOption,
  type SelectFieldProps,
  type SelectFieldSelectionMode,
} from '../../src/components/select-field/select-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const layouts = ['label-control', 'control-label', 'label-colon-control', 'control-only'] as const;
const states = [
  'resting',
  'required',
  'dirty',
  'invalid',
  'warning',
  'pending',
  'read-only',
  'disabled',
] as const;
type State = (typeof states)[number];

const fruit: SelectFieldOption[] = [
  { id: 'apple', label: 'Apple', description: 'Crisp and sweet', icon: 'plus' },
  { id: 'pear', label: 'Pear', icon: 'minus' },
  { id: 'plum', label: 'Plum', description: 'Out of season', isDisabled: true },
  { id: 'fig', label: 'Fig' },
  { id: 'quince', label: 'Quince' },
];

const orchard: SelectFieldOption[] = [
  'Apricot',
  'Banana',
  'Cherry',
  'Damson',
  'Elderberry',
  'Feijoa',
  'Guava',
  'Huckleberry',
  'Jujube',
  'Kiwi',
  'Lime',
  'Mango',
  'Nectarine',
  'Olive',
].map((label) => ({ id: label.toLowerCase(), label }));

const cities: SelectFieldOption[] = [
  'Paris',
  'Lima',
  'Oslo',
  'Cairo',
  'Quito',
  'Hanoi',
  'Dakar',
  'Perth',
  'Turin',
  'Lisbon',
  'Ottawa',
  'Nairobi',
].map((name) => ({ id: name.toLowerCase(), label: name, description: 'City' }));

function Output({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}

function stateProps(
  state: State,
  multiple: boolean,
): Partial<SelectFieldProps<SelectFieldSelectionMode>> {
  const value = multiple ? ['apple', 'fig'] : 'apple';
  const props: Record<State, Partial<SelectFieldProps<SelectFieldSelectionMode>>> = {
    resting: { defaultValue: value },
    required: { isRequired: true },
    dirty: { committedValue: multiple ? ['apple', 'pear'] : 'pear', defaultValue: value },
    invalid: {
      defaultValue: value,
      validate: () => ({ severity: 'error', message: 'Choose a fruit in season.' }),
    },
    warning: {
      defaultValue: value,
      validate: () => ({ severity: 'warning', message: 'Apples are bruised.' }),
    },
    pending: { defaultValue: value, isPending: true },
    'read-only': { defaultValue: value, isReadOnly: true },
    disabled: { defaultValue: value, isDisabled: true },
  };
  return props[state];
}

/** A select whose dirty state starts from a controlled value that differs from the committed one. */
function MatrixField({
  state,
  mode,
  layout,
}: {
  state: State;
  mode: SelectFieldSelectionMode;
  layout: FieldLabelLayout;
}) {
  const multiple = mode === 'multiple';
  const { defaultValue, ...props } = stateProps(state, multiple);
  const [value, setValue] = useState(defaultValue);
  const controlled = state === 'dirty' ? { value, onChange: setValue } : { defaultValue };
  return (
    <SelectField
      label="Fruit"
      labelLayout={layout}
      selectionMode={mode}
      options={fruit}
      {...props}
      {...(controlled as object)}
    />
  );
}

function Picking() {
  const [committed, setCommitted] = useState<Key | null>(null);
  return (
    <>
      <SelectField
        label="Fruit"
        options={fruit}
        description="Icons, descriptions and a disabled option."
        onCommit={setCommitted}
        data-lab-field="single"
      />
      <Output name="Committed">{committed === null ? 'none' : String(committed)}</Output>
    </>
  );
}

/** The committed value is the saved one: the edit stays dirty until Save commits it. */
function Chips() {
  const [committed, setCommitted] = useState<Key[]>(['apple', 'pear']);
  const [value, setValue] = useState<Key[]>(['pear', 'fig']);
  return (
    <>
      <SelectField
        label="Basket"
        selectionMode="multiple"
        options={fruit}
        value={value}
        onChange={setValue}
        committedValue={committed}
        description="Fig was added and Apple removed since the last save."
        data-lab-field="multiple"
      />
      <button type="button" onClick={() => setCommitted(value)}>
        Save
      </button>
      <Output name="Value">{value.join(', ') || 'none'}</Output>
    </>
  );
}

function Search() {
  const [calls, setCalls] = useState(0);
  const loadOptions = async (query: string) => {
    setCalls((count) => count + 1);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return cities.filter((city) => city.label.toLowerCase().includes(query.toLowerCase()));
  };
  return (
    <>
      <SelectField
        label="Cities"
        selectionMode="multiple"
        options={[]}
        loadOptions={loadOptions}
        minSearchLength={2}
        placeholder="Search cities"
        data-lab-field="search"
      />
      <Output name="Searches">{calls}</Output>
    </>
  );
}

const menu: FieldMenuEntry[] = ['clear', 'set-default', 'help'];

function Form() {
  const [entries, setEntries] = useState('none');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setEntries(
          [...data.entries()].map(([name, entry]) => `${name}=${String(entry)}`).join(' '),
        );
      }}
    >
      <SelectField label="Fruit" name="fruit" options={fruit} defaultValue="pear" />
      <SelectField
        label="Basket"
        name="basket"
        selectionMode="multiple"
        options={fruit}
        defaultValue={['apple', 'fig']}
      />
      <button type="submit">Submit</button>
      <Output name="Form">{entries}</Output>
    </form>
  );
}

mountLab(
  <>
    <LabSection
      title="Layouts and states"
      description="A single select in every label layout and state. The dirty cell shows the previous value."
    >
      <StateMatrix
        axes={{ state: states, layout: layouts }}
        render={({ state, layout }) => <MatrixField state={state} mode="single" layout={layout} />}
      />
    </LabSection>
    <LabSection title="Selection modes" description="Single and multiple selects in every state.">
      <StateMatrix
        axes={{ state: states, mode: ['single', 'multiple'] }}
        render={({ state, mode }) => (
          <MatrixField
            state={state}
            mode={mode as SelectFieldSelectionMode}
            layout="label-control"
          />
        )}
      />
    </LabSection>
    <LabSection title="Picking" description="Press the trigger or use the arrow keys; Enter picks.">
      <Picking />
    </LabSection>
    <LabSection
      title="Chips"
      description="A multiple select keeps its list open while toggling and shows its values as chips."
    >
      <Chips />
    </LabSection>
    <LabSection
      title="Filtering"
      description="More than 10 options filter inside the open list; typing on the closed trigger starts the filter."
    >
      <SelectField label="Orchard" options={orchard} defaultValue="kiwi" data-lab-field="filter" />
    </LabSection>
    <LabSection title="Search" description="Options load as you type at least 2 characters.">
      <Search />
    </LabSection>
    <LabSection
      title="Width"
      description="The trigger fits its widest option, capped at the column width."
    >
      <div data-lab-column="320" style={{ width: 320 }}>
        <SelectField label="Short" options={fruit.slice(0, 2)} data-lab-field="short" />
        <SelectField
          label="Long"
          options={[
            ...fruit,
            { id: 'long', label: 'A considerably longer option label than the column' },
          ]}
          data-lab-field="long"
        />
      </div>
    </LabSection>
    <LabSection title="Empty choice" description="A first option that chooses no value.">
      <SelectField label="Fruit" options={fruit} emptyLabel="None" defaultValue="fig" />
    </LabSection>
    <LabSection
      title="Field menu"
      description="Clear, Set to default and Help from the field base."
    >
      <SelectField
        label="Fruit"
        options={fruit}
        defaultValue="pear"
        committedValue="apple"
        menu={menu}
        help="Right-click the field or use its menu button."
      />
    </LabSection>
    <LabSection title="Forms" description="A named select publishes its values to its form.">
      <Form />
    </LabSection>
  </>,
);
