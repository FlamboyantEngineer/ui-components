import { useRef, useState } from 'react';
import type { Key } from 'react-aria-components';
import {
  Combobox,
  type ComboboxItem,
  type ComboboxOption,
} from '../../src/components/combobox/combobox.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;
const states = ['resting', 'with value', 'disabled', 'read-only', 'invalid', 'pending'] as const;

const fruit: ComboboxItem[] = [
  { id: 'apple', label: 'Apple', description: 'Crisp and sweet', icon: 'plus' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
  {
    id: 'citrus',
    title: 'Citrus',
    options: [
      { id: 'lemon', label: 'Lemon' },
      { id: 'lime', label: 'Lime', isDisabled: true },
      { id: 'orange', label: 'Orange' },
    ],
  },
];

const cities: ComboboxOption[] = [
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
].map((name) => ({ id: name.toLowerCase(), label: name }));

function Picking() {
  const [chosen, setChosen] = useState<Key | null>(null);
  return (
    <>
      <Combobox
        label="Fruit"
        description="Type to filter, or open the list with Arrow Down."
        defaultItems={fruit}
        onSelectionChange={setChosen}
      />
      <p>
        Chosen:{' '}
        <output data-lab-output="chosen">{chosen === null ? 'none' : String(chosen)}</output>
      </p>
    </>
  );
}

function Remote() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ComboboxOption[]>(cities);
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return (
    <Combobox
      label="City"
      variant="search"
      placeholder="Search cities"
      description="Suggestions arrive after a short delay."
      items={items}
      inputValue={query}
      isPending={pending}
      allowsCustomValue
      onInputChange={(value) => {
        setQuery(value);
        setPending(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          const needle = value.toLowerCase();
          setItems(cities.filter((city) => city.label.toLowerCase().includes(needle)));
          setPending(false);
        }, 300);
      }}
    />
  );
}

mountLab(
  <>
    <LabSection title="Variants, sizes and states" description="Each cell is a live combobox.">
      <StateMatrix
        axes={{ variant: ['default', 'search'], state: states, size: sizes }}
        render={({ variant, state, size }) => (
          <Combobox
            aria-label={`${variant} ${state} ${size}`}
            variant={variant}
            size={size}
            defaultItems={fruit}
            placeholder="Pick a fruit"
            {...(state === 'resting' ? {} : { defaultInputValue: 'Apple' })}
            isDisabled={state === 'disabled'}
            isReadOnly={state === 'read-only'}
            isInvalid={state === 'invalid'}
            errorMessage={state === 'invalid' ? 'Not in season' : undefined}
            isPending={state === 'pending'}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Picking"
      description="Options with an icon and a description, a section and a disabled option. Enter picks the highlighted option."
    >
      <Picking />
    </LabSection>
    <LabSection
      title="Asynchronous suggestions"
      description="The lab filters the cities itself after a delay, marking the field busy meanwhile; any typed city is kept."
    >
      <Remote />
    </LabSection>
    <LabSection title="Open on focus" description="The list opens when the input takes focus.">
      <Combobox label="Fruit on focus" defaultItems={fruit} menuTrigger="focus" />
    </LabSection>
  </>,
);
