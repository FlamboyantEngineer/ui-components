import {
  CalendarGlyph,
  EditGlyph,
  FileGlyph,
  FolderGlyph,
  LinkGlyph,
  PlusGlyph,
} from '../../src/core/glyphs.js';
import { useCallback, useRef, useState } from 'react';
import type { Key } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import {
  Combobox,
  type ComboboxItem,
  type ComboboxLoader,
  type ComboboxOption,
} from '../../src/components/combobox/combobox.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { NarrowRows } from './combobox-narrow-cases.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const states = ['resting', 'with value', 'disabled', 'read-only', 'invalid', 'pending'] as const;

const fruit: ComboboxItem[] = [
  { id: 'apple', label: 'Apple', description: 'Crisp and sweet', icon: PlusGlyph },
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

/** The cities as a single-use generator, which the combobox reads once. */
function* listCities(): Generator<ComboboxOption> {
  yield* cities;
}

function Multiple() {
  const [chosen, setChosen] = useState<Key[]>(['lima', 'oslo']);
  const [source] = useState(listCities);
  return (
    <>
      <Combobox
        label="Cities"
        size="xs"
        selectionMode="multiple"
        defaultItems={source}
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

const regions: Record<string, string> = {
  paris: 'europe',
  lima: 'americas',
  oslo: 'europe',
  cairo: 'africa',
  quito: 'americas',
  hanoi: 'asia',
  dakar: 'africa',
  perth: 'oceania',
  turin: 'europe',
  lisbon: 'europe',
  ottawa: 'americas',
  nairobi: 'africa',
};

const regionChoices = [
  { value: 'europe', label: 'Europe' },
  { value: 'americas', label: 'Americas' },
  { value: 'africa', label: 'Africa' },
];

/** Resolves after `milliseconds` unless `signal` aborts first. */
function delay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

/**
 * Searches cities as a server would, after 400 milliseconds, within the chosen regions; "offline"
 * fails. Recently used cities show before typing, and the region filters sit in the list header.
 */
function RemoteSearch() {
  const [filters, setFilters] = useState<string[]>([]);
  const [chosen, setChosen] = useState<Key | null>(null);
  const [searches, setSearches] = useState<string[]>([]);
  const loadItems = useCallback<ComboboxLoader>(
    async (query, signal) => {
      setSearches((previous) => [...previous, query]);
      await delay(400, signal);
      if (query === 'offline') throw new Error('The server is unreachable.');
      return findCities(query).filter(
        (city) => filters.length === 0 || filters.includes(regions[String(city.id)] ?? ''),
      );
    },
    [filters],
  );
  return (
    <>
      <Combobox
        label="Search city"
        variant="search"
        description="Type at least 2 letters; filter by region in the list."
        minSearchLength={2}
        searchDelay={300}
        loadItems={loadItems}
        items={[{ id: 'recent', title: 'Recently used', options: cities.slice(0, 2) }]}
        renderEmptyState={() => 'No city matches; try another region.'}
        listHeader={
          <SegmentedChoice
            aria-label="Regions"
            selectionMode="multiple"
            size="sm"
            sizing="content"
            options={regionChoices}
            value={filters}
            onChange={setFilters}
          />
        }
        onChange={setChosen}
      />
      <p>
        Chosen:{' '}
        <output data-lab-output="remote">{chosen === null ? 'none' : String(chosen)}</output>{' '}
        Searches: <output data-lab-output="searches">{searches.join(', ') || 'none'}</output>
      </p>
    </>
  );
}

/** A text filter in the list header narrows the suggestions by their first letter. */
function HeaderFilter() {
  const [prefix, setPrefix] = useState('');
  const shown = cities.filter((city) => city.label.toLowerCase().startsWith(prefix.toLowerCase()));
  return (
    <Combobox
      label="City by first letters"
      items={shown}
      listHeader={
        <TextField
          label="Starts with"
          size="sm"
          value={prefix}
          onChange={setPrefix}
          data-lab-field="header-filter"
        />
      }
    />
  );
}

/** The caller holds the open state; buttons outside open and close the list. */
function ControlledOpen() {
  const [isOpen, setIsOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [showFocused, setShowFocused] = useState(false);
  return (
    <>
      <Combobox
        label="Controlled fruit"
        defaultItems={fruit}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        inputRef={input}
      />
      <p>
        <Button size="sm" data-lab-action="toggle-open" onPress={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Close the list' : 'Open the list'}
        </Button>{' '}
        <Button size="sm" data-lab-action="focus-input" onPress={() => input.current?.focus()}>
          Focus the input
        </Button>{' '}
        <Button size="sm" data-lab-action="mount-focused" onPress={() => setShowFocused(true)}>
          Add a field that focuses itself
        </Button>{' '}
        Open: <output data-lab-output="open">{String(isOpen)}</output>
      </p>
      {showFocused ? <Combobox label="Focused on mount" defaultItems={fruit} autoFocus /> : null}
    </>
  );
}

const fileTypes: ComboboxOption[] = [
  { id: 'notes', label: 'Notes', icon: EditGlyph },
  { id: 'links', label: 'Links', icon: LinkGlyph },
  { id: 'events', label: 'Events', icon: CalendarGlyph },
  { id: 'folders', label: 'Folders', icon: FolderGlyph },
];

const countries: Record<string, string> = {
  paris: 'France',
  lima: 'Peru',
  oslo: 'Norway',
  cairo: 'Egypt',
  quito: 'Ecuador',
};

function RememberedChips() {
  const [icon, setIcon] = useState<'file' | 'folder'>('file');
  const [isListed, setListed] = useState(true);
  return (
    <div data-lab-demo="remembered-chips">
      <Combobox
        label="Saved types"
        selectionMode="multiple"
        items={
          isListed
            ? [{ id: 'notes', label: 'Notes', icon: icon === 'file' ? FileGlyph : FolderGlyph }]
            : []
        }
        defaultValue={['notes']}
      />
      <Button size="sm" onPress={() => setIcon(icon === 'file' ? 'folder' : 'file')}>
        Change icon
      </Button>{' '}
      <Button size="sm" onPress={() => setListed(!isListed)}>
        {isListed ? 'Hide suggestions' : 'Show suggestions'}
      </Button>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Primitive keys"
      description="Numeric and text ids that read alike remain distinct choices."
    >
      <Combobox
        label="Primitive keys"
        defaultItems={[
          { id: 1, label: 'Numeric' },
          { id: '1', label: 'Textual' },
        ]}
        selectionMode="multiple"
        defaultValue={[1, '1']}
        name="typed-keys"
      />
    </LabSection>
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
      title="Narrow rows"
      description="Comboboxes in flex and grid rows 300 pixels wide, beside a text field, empty and with a chosen value and its clear button: each field stays inside the width it is given."
    >
      <NarrowRows />
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
      description="Typed search text stays until a choice is made. Picking keeps the list open and adds a chip; the chips are a tag group. The suggestions come from a generator, read once."
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
    <LabSection
      title="Open on focus"
      description="Tab from Capital above: the list opens after the page scrolls the focused field into view and keeps keyboard navigation in the input."
    >
      <Combobox label="Fruit on focus" defaultItems={fruit} menuTrigger="focus" />
    </LabSection>
    <LabSection
      title="Remote search"
      description="Recently used cities before typing; searches after a pause, with region filters in the list header. Type offline to see a failed search."
    >
      <RemoteSearch />
    </LabSection>
    <LabSection
      title="Filter in the list header"
      description="Click the text field above the list and type: it keeps focus and narrows the cities. Escape closes the list and returns to the combobox."
    >
      <HeaderFilter />
    </LabSection>
    <LabSection
      title="Open state"
      description="The list opens and closes from outside; the input can be focused through its ref."
    >
      <ControlledOpen />
    </LabSection>
    <LabSection title="Chips with icons" description="Each chip leads with its option's icon.">
      <Combobox
        label="Types"
        selectionMode="multiple"
        defaultItems={fileTypes}
        defaultValue={['notes', 'events']}
      />
    </LabSection>
    <LabSection
      title="Remembered chips"
      description="Change the selected option’s icon, then hide its suggestions: the chip retains its latest label and icon until removed."
    >
      <RememberedChips />
    </LabSection>
    <LabSection
      title="Numeric labels"
      description="A label, description or option description of zero is drawn and read like any other content."
    >
      <div data-lab-demo="zero">
        <Combobox
          label={0}
          description={0}
          defaultItems={[
            { id: 'pears', label: 'Pears', description: 0 },
            { id: 'figs', label: 'Figs' },
          ]}
        />
      </div>
    </LabSection>
  </>,
);
