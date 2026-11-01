import { MinusGlyph, PlusGlyph } from '../../src/core/glyphs.js';
import { treeChoices } from './select-tree.js';
import { iconsChoices } from './select-icons.js';
import { useCallback, useState } from 'react';
import type { Key } from '../../src/core/props.js';
import type { FieldLabelLayout, FieldMenuEntry } from '../../src/components/field/field.js';
import {
  SelectField,
  type SelectFieldItem,
  type SelectFieldOption,
  type SelectFieldProps,
  type SelectFieldSelectionMode,
} from '../../src/components/select-field/select-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { Paged } from './select-field-paged.js';
import { TriggerRefField } from './select-field-trigger-cases.js';
import { fieldLayouts, fieldStates, type FieldStateName } from './field-states.js';

const fruit: SelectFieldOption[] = [
  { id: 'apple', label: 'Apple', description: 'Crisp and sweet', icon: PlusGlyph },
  { id: 'pear', label: 'Pear', icon: MinusGlyph },
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

const produce: SelectFieldItem[] = [
  { id: 'any', label: 'Anything in season' },
  {
    id: 'fruit',
    label: 'Fruit',
    options: [
      { id: 'apple', label: 'Apple', icon: PlusGlyph },
      { id: 'pear', label: 'Pear', icon: MinusGlyph },
      { id: 'plum', label: 'Plum', isDisabled: true },
    ],
  },
  {
    id: 'vegetables',
    label: 'Vegetables',
    options: [
      { id: 'kale', label: 'Kale', description: 'Leafy' },
      { id: 'leek', label: 'Leek' },
      { id: 'beet', label: 'Beet' },
    ],
  },
  { id: 'pantry', options: [{ id: 'salt', label: 'Salt' }] },
];

const people: SelectFieldOption[] = [
  { id: 'maria', label: 'Maria Santos', description: 'Design' },
  { id: 'jon', label: 'Jon Berg', description: 'Research' },
  { id: 'lena', label: 'Lena Ortiz', description: 'Support' },
  { id: 'sam', label: 'Sam Okafor', description: 'Finance' },
];

const numbered: SelectFieldOption[] = Array.from({ length: 5000 }, (_, index) => ({
  id: `item-${index + 1}`,
  label: `Item ${index + 1}`,
}));

function stateProps(
  state: FieldStateName,
  multiple: boolean,
): Partial<Extract<SelectFieldProps<SelectFieldSelectionMode>, { mode?: 'list' }>> {
  const value = multiple ? ['apple', 'fig'] : 'apple';
  const props: Record<
    FieldStateName,
    Partial<Extract<SelectFieldProps<SelectFieldSelectionMode>, { mode?: 'list' }>>
  > = {
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
  state: FieldStateName;
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
      {...controlled}
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
      <LabOutput name="Committed">{committed === null ? 'none' : String(committed)}</LabOutput>
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
      <LabOutput name="Value">{value.join(', ') || 'none'}</LabOutput>
    </>
  );
}

function Search() {
  const [calls, setCalls] = useState(0);
  // A stable loader: a new one would be a new search source, which searches the query again, and
  // its own counter update would then create another, searching forever.
  const loadOptions = useCallback(async (query: string) => {
    setCalls((count) => count + 1);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return cities.filter((city) => city.label.toLowerCase().includes(query.toLowerCase()));
  }, []);
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
      <LabOutput name="Searches">{calls}</LabOutput>
    </>
  );
}

function Groups() {
  const [committed, setCommitted] = useState('none');
  return (
    <>
      <SelectField
        label="Produce"
        options={produce}
        defaultValue="kale"
        description="Options under headings; the last group has no heading."
        onCommit={(value) => setCommitted(value === null ? 'none' : String(value))}
        data-lab-field="groups"
      />
      <SelectField
        label="Pantry"
        selectionMode="multiple"
        options={produce}
        filterable
        description="Filtering hides the groups that no longer match."
        data-lab-field="groups-filter"
      />
      <LabOutput name="Group committed">{committed}</LabOutput>
    </>
  );
}

function Custom() {
  return (
    <SelectField
      label="Owner"
      options={people}
      defaultValue="jon"
      description="Each option draws initials and two lines of text."
      renderOption={(option, { isSelected }) => (
        <span data-lab-option={String(option.id)}>
          <strong aria-hidden="true">
            {option.label
              .split(' ')
              .map((part) => part[0])
              .join('')}
          </strong>{' '}
          {option.label} — {option.description}
          {isSelected ? ' ✓' : ''}
        </span>
      )}
      data-lab-field="custom"
    />
  );
}

function Limits() {
  const [basket, setBasket] = useState<Key[]>(['apple']);
  const [kept, setKept] = useState<Key[]>(['apple']);
  return (
    <>
      <SelectField
        label="Snack"
        options={fruit}
        defaultValue="pear"
        isClearable
        description="The cross clears the value in one press."
        data-lab-field="clearable"
      />
      <SelectField
        label="Two fruits"
        selectionMode="multiple"
        options={fruit}
        value={basket}
        onChange={setBasket}
        maxValues={2}
        isClearable
        description="At most two; the other options disable once two are chosen."
        data-lab-field="limited"
      />
      <LabOutput name="Basket">{basket.join(', ') || 'none'}</LabOutput>
      <SelectField
        label="One kept fruit"
        selectionMode="multiple"
        options={fruit}
        value={kept}
        onChange={setKept}
        committedValue={['retired']}
        maxValues={1}
        description="The committed value is no longer listed; it cannot be restored while one fruit is chosen."
        data-lab-field="limited-missing"
      />
    </>
  );
}

/** Locking an open select closes it for good, so unlocking does not reopen it. */
function Locking() {
  const [isLocked, setLocked] = useState(false);
  const [openChanges, setOpenChanges] = useState<string[]>([]);
  return (
    <>
      <SelectField
        label="Lockable"
        options={fruit}
        isDisabled={isLocked}
        onOpenChange={(open) => setOpenChanges((changes) => [...changes, String(open)])}
        data-lab-field="lockable"
      />
      <button
        type="button"
        onClick={() => {
          // The delay leaves time to open the select, which a press outside would close.
          if (isLocked) setLocked(false);
          else window.setTimeout(() => setLocked(true), 1000);
        }}
      >
        {isLocked ? 'Unlock' : 'Lock in 1 s'}
      </button>
      <LabOutput name="Open changes">{openChanges.join(', ') || 'none'}</LabOutput>
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
      <LabOutput name="Form">{entries}</LabOutput>
    </form>
  );
}

mountLab(
  <>
    {treeChoices}
    {iconsChoices}
    <div data-lab-family="list">
      <LabSection
        title="Primitive keys"
        description="Numeric and text ids that read alike remain distinct choices."
      >
        <SelectField
          label="Primitive keys"
          options={[
            { id: 1, label: 'Numeric' },
            { id: '1', label: 'Textual' },
          ]}
          selectionMode="multiple"
          defaultValue={[1, '1']}
          name="typed-keys"
        />
      </LabSection>
      <LabSection
        title="Layouts and states"
        description="A single select in every label layout and state. The dirty cell shows the previous value."
      >
        <StateMatrix
          axes={{ state: fieldStates, layout: fieldLayouts }}
          render={({ state, layout }) => (
            <MatrixField state={state} mode="single" layout={layout} />
          )}
        />
      </LabSection>
      <LabSection title="Selection modes" description="Single and multiple selects in every state.">
        <StateMatrix
          axes={{ state: fieldStates, mode: ['single', 'multiple'] }}
          render={({ state, mode }) => (
            <MatrixField
              state={state}
              mode={mode as SelectFieldSelectionMode}
              layout="label-control"
            />
          )}
        />
      </LabSection>
      <LabSection
        title="Picking"
        description="Press the trigger or use the arrow keys; Enter picks."
      >
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
        <SelectField
          label="Orchard"
          options={orchard}
          defaultValue="kiwi"
          data-lab-field="filter"
        />
      </LabSection>
      <LabSection title="Search" description="Options load as you type at least 2 characters.">
        <Search />
      </LabSection>
      <LabSection
        title="Width"
        description="The trigger fits its widest complete option label, capped at the column width."
      >
        <div data-lab-column="320" style={{ width: 320 }}>
          <SelectField
            label="Short"
            options={fruit.slice(0, 2)}
            data-lab-field="short"
            popoverProps={{ 'data-popup-density': 'compact' }}
          />
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
      <LabSection title="Groups" description="Headed sections of options.">
        <Groups />
      </LabSection>
      <LabSection title="Custom options" description="renderOption draws each option's content.">
        <Custom />
      </LabSection>
      <LabSection title="Clearing and limits" description="A clear button and a maximum of values.">
        <Limits />
      </LabSection>
      <LabSection
        title="Locking while open"
        description="A select that turns disabled while open closes and reports it; unlocking leaves it closed."
      >
        <Locking />
      </LabSection>
      <LabSection
        title="Virtualized"
        description="5,000 options; only those in view render, and the arrow keys, Home and End reach any."
      >
        <SelectField
          label="Number"
          options={numbered}
          virtualized
          filterable={false}
          defaultValue="item-1"
          data-lab-field="virtualized"
        />
      </LabSection>
      <LabSection
        title="Paged search"
        description="Results load a page at a time as the list scrolls."
      >
        <Paged />
      </LabSection>
      <LabSection title="Forms" description="A named select publishes its values to its form.">
        <Form />
      </LabSection>
      <LabSection
        title="Trigger ref"
        description="The button returns focus to the select's trigger through its ref."
      >
        <TriggerRefField />
      </LabSection>
    </div>
  </>,
);
