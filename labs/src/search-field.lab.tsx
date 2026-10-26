import { useState } from 'react';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const sizes = ['sm', 'md'] as const;
const states = ['empty', 'filled', 'read-only', 'disabled'] as const;
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
      validationBehavior="aria"
      validate={(value) => (value.length > 0 && value.length < 3 ? 'Too short.' : null)}
      data-lab-field="labelled"
    />
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
            defaultValue={state === 'empty' ? '' : 'Apple'}
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
  </>,
);
