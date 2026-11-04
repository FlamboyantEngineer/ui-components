import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabForm, MountOnDemand } from './lab-form.js';
import { LabOutput } from './lab-output.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const states = ['empty', 'filled', 'invalid', 'pending', 'read-only', 'disabled'] as const;

const tooShort = (value: string) =>
  value.length > 0 && value.length < 3
    ? { severity: 'error' as const, message: 'Too short.' }
    : null;
const fruit = ['Apple', 'Apricot', 'Banana', 'Cherry', 'Fig', 'Grape', 'Lemon', 'Mango', 'Pear'];

function FilterList() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('none');
  const shown = fruit.filter((name) => name.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <SearchField
        label="Filter fruit"
        placeholder="Filter fruit"
        value={query}
        onChange={setQuery}
        onSubmit={setSubmitted}
        data-lab-field="filter"
      />
      <ul data-lab-list>
        {shown.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <LabOutput name="Submitted">{submitted}</LabOutput>
    </>
  );
}

/** A labelled search with a description and a rule: three letters or more. */
function LabelledSearch() {
  return (
    <SearchField
      label="Find a city"
      labelLayout="label-control"
      placeholder="City"
      description="Type at least three letters."
      validate={(value) =>
        value.length > 0 && value.length < 3 ? { severity: 'error', message: 'Too short.' } : null
      }
      data-lab-field="labelled"
    />
  );
}

/** The switch moves the label in and out, as a responsive layout would: the input keeps its text and focus. */
function ChangingLayout() {
  const [hasLabel, setHasLabel] = useState(false);
  return (
    <>
      <SearchField
        label="Search notes"
        labelLayout={hasLabel ? 'label-control' : 'control-only'}
        description={hasLabel ? 'Matches titles and text.' : undefined}
        defaultValue="draft"
        data-lab-field="changing"
      />
      <Switch isSelected={hasLabel} onChange={setHasLabel}>
        Visible label
      </Switch>
    </>
  );
}

/** Results load while the switch is on. */
function Loading() {
  const [isPending, setIsPending] = useState(true);
  return (
    <>
      <SearchField
        label="Search recipes"
        defaultValue="soup"
        isPending={isPending}
        data-lab-field="loading"
      />
      <Switch isSelected={isPending} onChange={setIsPending}>
        Loading
      </Switch>
    </>
  );
}

/**
 * A named search in a form: it submits its query and a native reset puts back the initial one.
 * Every change, clear and Enter shows in the event list.
 */
function FormSearch() {
  const [events, setEvents] = useState<string[]>([]);
  const log = (event: string) => setEvents((list) => [...list.slice(-5), event]);
  return (
    <LabForm label="Recipe search">
      <SearchField
        label="Recipes"
        name="q"
        defaultValue="soup"
        onChange={(value) => log(`change "${value}"`)}
        onClear={() => log('clear')}
        onSubmit={(value) => log(`enter "${value}"`)}
        data-lab-field="form"
      />
      <LabOutput name="Search events">{events.join(' · ') || 'none'}</LabOutput>
    </LabForm>
  );
}

/** A rule under each validation behaviour: native blocks the form's submit, aria only marks the box. */
function ValidationBehaviours() {
  return (
    <>
      <LabForm label="Native city search">
        <SearchField
          label="City (native)"
          labelLayout="label-control"
          name="city"
          defaultValue="Ro"
          validate={tooShort}
          validationBehavior="native"
          data-lab-field="native"
        />
      </LabForm>
      <LabForm label="Aria city search">
        <SearchField
          label="City (aria)"
          labelLayout="label-control"
          name="city"
          defaultValue="Ro"
          validate={tooShort}
          data-lab-field="aria"
        />
      </LabForm>
    </>
  );
}

/** A caller focuses the input through `inputRef`; a box mounted with `autoFocus` takes focus. */
function FocusedSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <SearchField label="Search the archive" inputRef={inputRef} data-lab-field="input-ref" />
      <Button onPress={() => inputRef.current?.focus()}>Focus the search</Button>
      <MountOnDemand label="an autofocused search">
        <SearchField label="Quick find" autoFocus data-lab-field="autofocus" />
      </MountOnDemand>
    </>
  );
}

/** Input hints a phone keyboard and the browser read: autofill, spelling, keyboard and Enter key. */
function InputHints() {
  return (
    <>
      <SearchField
        label="Order number"
        inputMode="numeric"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        data-lab-field="hints-number"
      />
      <SearchField
        label="Search messages"
        inputMode="search"
        enterKeyHint="go"
        autoComplete="on"
        spellCheck
        data-lab-field="hints-text"
      />
    </>
  );
}

mountLab(
  <>
    <LabSection title="Sizes and states" description="Each size against each state.">
      <StateMatrix
        axes={{ state: states, size: sizes }}
        render={({ state, size }) => (
          <SearchField
            label={`Search, ${state}, ${size}`}
            placeholder="Search"
            size={size}
            defaultValue={state === 'empty' ? '' : state === 'invalid' ? 'Ap' : 'Apple'}
            validate={state === 'invalid' ? tooShort : undefined}
            isPending={state === 'pending'}
            isReadOnly={state === 'read-only'}
            isDisabled={state === 'disabled'}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Filter a list"
      description="Type to filter, Escape or the clear button to clear, Enter to submit."
    >
      <FilterList />
    </LabSection>
    <LabSection
      title="Label, description and error"
      description="The label-control layout draws the label above the box and the messages below it."
    >
      <LabelledSearch />
    </LabSection>
    <LabSection
      title="Label layout change"
      description="The switch adds or removes the visible label. The input stays the same element, so its text, selection and focus survive."
    >
      <ChangingLayout />
    </LabSection>
    <LabSection title="Loading" description="A spinner shows while results load.">
      <Loading />
    </LabSection>
    <LabSection title="Worded clear button" description="Visible text with its own name.">
      <SearchField
        label="Filter the glossary"
        size="sm"
        defaultValue="pear"
        clearText="Clear"
        clearLabel="Clear the glossary filter"
        data-lab-field="worded"
      />
    </LabSection>
    <LabSection
      title="Form, reset and events"
      description="Submit sends the query under its name; Reset puts back soup. Each change, clear (Escape or the button) and Enter shows in the events."
    >
      <FormSearch />
    </LabSection>
    <LabSection
      title="Validation behaviour"
      description="Both cities are too short: native validation stops the form's submit, aria validation marks the box and lets it through."
    >
      <ValidationBehaviours />
    </LabSection>
    <LabSection
      title="Focusing the input"
      description="A caller focuses the input through inputRef; a search mounted with autoFocus takes focus as it appears."
    >
      <FocusedSearch />
    </LabSection>
    <LabSection
      title="Input hints"
      description="On a phone, the order number opens a number pad with a Search key and no spelling marks; the message search opens a search keyboard with a Go key."
    >
      <InputHints />
    </LabSection>
  </>,
);
