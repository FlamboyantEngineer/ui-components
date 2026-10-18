import { useState } from 'react';
import type { Key } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
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
        onChange={setChosen}
      />
      <p>
        Chosen:{' '}
        <output data-lab-output="chosen">{chosen === null ? 'none' : String(chosen)}</output>
      </p>
    </>
  );
}

/** Suggestions for `query`, as a server would return them. */
function findCities(query: string): ComboboxOption[] {
  const needle = query.toLowerCase();
  return cities.filter((city) => city.label.toLowerCase().includes(needle));
}

/** Each keystroke asks for suggestions; they arrive only when the reader delivers them. */
function Remote() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ComboboxOption[]>(cities);
  const [request, setRequest] = useState<string | null>(null);
  return (
    <div>
      <Combobox
        label="City"
        variant="search"
        placeholder="Search cities"
        description="Suggestions wait for Deliver suggestions."
        items={items}
        inputValue={query}
        isPending={request !== null}
        allowsCustomValue
        onInputChange={(value) => {
          setQuery(value);
          setRequest(value);
        }}
      />
      <p>
        <Button
          size="sm"
          data-lab-action="deliver"
          isDisabled={request === null}
          onPress={() => {
            setItems(findCities(request ?? ''));
            setRequest(null);
          }}
        >
          Deliver suggestions
        </Button>{' '}
        Waiting for: <output data-lab-output="request">{request ?? 'nothing'}</output>
      </p>
    </div>
  );
}

function Multiple() {
  const [chosen, setChosen] = useState<Key[]>(['lima', 'oslo']);
  return (
    <>
      <Combobox
        label="Cities"
        selectionMode="multiple"
        defaultItems={cities}
        value={chosen}
        onChange={setChosen}
        description="Pick several; remove a chip with its button or Backspace."
      />
      <p>
        Chosen: <output data-lab-output="cities">{chosen.map(String).join(', ') || 'none'}</output>
      </p>
    </>
  );
}

function Creatable() {
  const [options, setOptions] = useState<ComboboxOption[]>(cities.slice(0, 5));
  const [chosen, setChosen] = useState<Key | null>(null);
  return (
    <>
      <Combobox
        label="Destination"
        items={options}
        value={chosen}
        onChange={setChosen}
        onCreateOption={(text) => {
          const id = text.toLowerCase();
          setOptions((current) => [...current, { id, label: text }]);
          setChosen(id);
        }}
        description="Type a city that is not listed, then choose Add."
      />
      <p>
        Destination:{' '}
        <output data-lab-output="destination">{chosen === null ? 'none' : String(chosen)}</output>
      </p>
    </>
  );
}

const aids = ['highlight matches', 'auto highlight', 'inline completion'] as const;

const manyCities: ComboboxOption[] = Array.from({ length: 5000 }, (_, index) => ({
  id: `city-${index + 1}`,
  label: `${cities[index % cities.length]?.label ?? 'City'} ${index + 1}`,
}));

/** Suggestions that load 20 more, after a short wait, each time the end of the list comes into view. */
function Paged() {
  const [count, setCount] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  return (
    <>
      <Combobox
        label="Paged city"
        items={manyCities.slice(0, count)}
        isLoading={isLoading}
        onLoadMore={() => {
          if (isLoading || count >= 100) return;
          setIsLoading(true);
          setTimeout(() => {
            setCount((current) => current + 20);
            setIsLoading(false);
          }, 500);
        }}
      />
      <p>
        Loaded: <output data-lab-output="loaded">{count}</output>
      </p>
    </>
  );
}

const countries: Record<string, string> = {
  paris: 'France',
  lima: 'Peru',
  oslo: 'Norway',
  cairo: 'Egypt',
  quito: 'Ecuador',
};

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
      description="Typing asks for cities and marks the field busy until you deliver the suggestions; any typed city is kept."
    >
      <Remote />
    </LabSection>
    <LabSection
      title="Chips by size"
      description="A multiple combobox shows its chosen options as chips at every size."
    >
      <StateMatrix
        axes={{ size: sizes }}
        render={({ size }) => (
          <Combobox
            aria-label={`Cities ${size}`}
            size={size}
            selectionMode="multiple"
            defaultItems={cities}
            defaultValue={['paris', 'lima']}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Multiple selection"
      description="Picking keeps the list open and adds a chip; the chips are a tag group."
    >
      <Multiple />
    </LabSection>
    <LabSection
      title="Adding an option"
      description="Text that no option has as label offers an Add row, which adds the city and selects it."
    >
      <Creatable />
    </LabSection>
    <LabSection
      title="Typing aids"
      description="Marked matches, the first match highlighted so Enter picks it, and inline completion of the typed text."
    >
      <StateMatrix
        axes={{ aid: aids }}
        render={({ aid }) => (
          <Combobox
            aria-label={`Fruit with ${aid}`}
            defaultItems={fruit}
            highlightMatches={aid === 'highlight matches'}
            autoHighlight={aid === 'auto highlight'}
            completesInline={aid === 'inline completion'}
          />
        )}
      />
    </LabSection>
    <LabSection title="Virtualized list" description="5000 cities render only the options in view.">
      <Combobox label="Any city" defaultItems={manyCities} virtualized />
    </LabSection>
    <LabSection
      title="Loading more"
      description="Scrolling to the end of the list shows a loading row, then 20 more cities, up to 100."
    >
      <Paged />
    </LabSection>
    <LabSection
      title="Custom options"
      description="Each option draws its city with its country, and marks the focused one."
    >
      <Combobox
        label="Capital"
        defaultItems={cities.slice(0, 5)}
        renderOption={(option, { isFocused }) => (
          <span data-lab-option="">
            <strong>{option.label}</strong> · {countries[String(option.id)]}
            {isFocused ? ' ←' : ''}
          </span>
        )}
      />
    </LabSection>
    <LabSection title="Open on focus" description="The list opens when the input takes focus.">
      <Combobox label="Fruit on focus" defaultItems={fruit} menuTrigger="focus" />
    </LabSection>
  </>,
);
