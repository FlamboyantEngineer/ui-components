import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '../../src/components/button/button.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabOutput } from './lab-output.js';

const towns = ['Bergen', 'Bern', 'Berlin', 'Bordeaux', 'Bologna'];

/**
 * An editor that owns its suggestion list: it reads the input through `controlProps`, marks the
 * input as the list's combobox, and focuses or selects the text through `inputRef`.
 */
export function EditorDrivenField() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [caret, setCaret] = useState(0);
  const matches = query === '' ? [] : towns.filter((town) => town.startsWith(query));
  const isOpen = matches.length > 0;
  const pick = (town: string) => {
    setValue(town);
    setQuery('');
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) return;
    if (event.key === 'ArrowDown') setActive((index) => (index + 1) % matches.length);
    if (event.key === 'Enter') pick(matches[active] ?? query);
    if (event.key === 'ArrowDown' || event.key === 'Enter') event.preventDefault();
  };
  return (
    <div data-lab-demo="editor">
      <TextField
        label="Town"
        value={value}
        onChange={setValue}
        inputRef={inputRef}
        onKeyDown={onKeyDown}
        controlProps={{
          role: 'combobox',
          'aria-controls': 'lab-town-suggestions',
          'aria-expanded': isOpen,
          'aria-autocomplete': 'list',
          'aria-activedescendant': isOpen ? `lab-town-${active}` : undefined,
          onInput: (event) => {
            setQuery(event.currentTarget.value);
            setActive(0);
          },
          onSelect: (event) => setCaret(event.currentTarget.selectionStart ?? 0),
        }}
      />
      <ul id="lab-town-suggestions" role="listbox" aria-label="Town suggestions" hidden={!isOpen}>
        {matches.map((town, index) => (
          <li
            key={town}
            id={`lab-town-${index}`}
            role="option"
            aria-selected={index === active}
            onPointerDown={(event) => {
              event.preventDefault();
              pick(town);
            }}
          >
            {town}
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        onPress={() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }}
      >
        Select the town
      </Button>
      <LabOutput name="Caret">{caret}</LabOutput>
    </div>
  );
}

const people = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson'];

/**
 * An editor whose suggestions open in a dialog and load after a pause: the input declares the
 * dialog popup (`aria-haspopup`) and is busy (`aria-busy`) while the people load.
 */
export function DialogSuggestingField() {
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState('');
  const isBusy = query !== loaded;
  const matches = loaded === '' ? [] : people.filter((person) => person.includes(loaded));
  const isOpen = !isBusy && matches.length > 0;
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(query), 400);
    return () => clearTimeout(timer);
  }, [query]);
  return (
    <div data-lab-demo="dialog-suggestions">
      <TextField
        label="Person"
        controlProps={{
          role: 'combobox',
          'aria-haspopup': 'dialog',
          'aria-controls': 'lab-people',
          'aria-expanded': isOpen,
          'aria-busy': isBusy,
          onInput: (event) => setQuery(event.currentTarget.value),
        }}
      />
      <div id="lab-people" role="dialog" aria-label="People" hidden={!isOpen}>
        <ul>
          {matches.map((person) => (
            <li key={person}>{person}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
