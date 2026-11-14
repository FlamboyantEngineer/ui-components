import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import type {
  Completion,
  CompletionSource,
} from '../../src/components/completion-list/completion-list.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';

const reloaded = 'Reloaded from the server';

/**
 * A controlled field whose host reloads its text half a second into every lookup, while the source
 * answers after a second and a half.
 */
function ReloadedField() {
  const [value, setValue] = useState('Draft');
  const source: CompletionSource = () => {
    setTimeout(() => setValue(reloaded), 500);
    return new Promise((resolve) => {
      setTimeout(
        () => resolve({ options: [{ label: 'alpha' }, { label: 'blue' }], filter: false }),
        1500,
      );
    });
  };
  return (
    <div data-lab-demo="reloaded">
      <TextField label="Document" value={value} onChange={setValue} completions={source} />
    </div>
  );
}

const colors: Completion[] = [{ label: 'blue' }, { label: 'brown' }];

/** Planets, from a source that answers after a second and a half. */
const planets: CompletionSource = () =>
  new Promise((resolve) => {
    setTimeout(() => resolve([{ label: 'Bellatrix' }, { label: 'Betelgeuse' }]), 1500);
  });

/** A field whose host switches its completions between planets and colors. */
function SwitchedField() {
  const [isColors, setColors] = useState(false);
  return (
    <div data-lab-demo="switched">
      <TextField
        label="Name"
        defaultValue="b"
        completions={isColors ? colors : planets}
        description={isColors ? 'Completing colors.' : 'Completing planets.'}
      />
      <Button onPress={() => setColors((value) => !value)}>
        {isColors ? 'Complete planets' : 'Complete colors'}
      </Button>
    </div>
  );
}

const nuts: Completion[] = [{ label: 'almond' }, { label: 'alpha nut' }, { label: 'brazil' }];

/**
 * A source that answers a one-letter word after half a second and fails for longer ones, as a
 * service with a hiccup would.
 */
const flakySource: CompletionSource = ({ query }) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (query.length > 1) reject(new Error('The lookup failed.'));
      else resolve(nuts);
    }, 500);
  });

export function FailedLookupSection() {
  return (
    <LabSection
      title="A lookup that fails"
      description="Type a: almond and alpha nut show. Type l: they stay while the next lookup is on its way, then that lookup fails and the list closes, rather than offering the earlier answer. The field keeps working: clear it and type a again."
    >
      <div data-lab-demo="failed-lookup">
        <TextField label="Nut" completions={flakySource} />
      </div>
    </LabSection>
  );
}

export function ReloadedTextSection() {
  return (
    <LabSection
      title="Reloaded text"
      description="Press Ctrl+Space in the field: the host reloads its text half a second later, before the answer comes, so the answer is dropped and no list opens. Ask again: the reload now brings the same text, so the list opens, and Enter inserts at the caret."
    >
      <ReloadedField />
    </LabSection>
  );
}

export function SwitchedSourceSection() {
  return (
    <LabSection
      title="Switched completions"
      description="Press Ctrl+Space at the end of the field, then switch to colors before the planets answer: the colors answer at once and the late planets never show. Switching back while the colors are open hides them until the planets answer."
    >
      <SwitchedField />
    </LabSection>
  );
}
