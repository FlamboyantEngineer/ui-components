import { useState } from 'react';
import type {
  Completion,
  CompletionSource,
} from '../../src/components/completion-list/completion-list.js';
import { Button } from '../../src/components/button/button.js';
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

const colours: Completion[] = [{ label: 'blue' }, { label: 'brown' }];

/** Planets, from a source that answers after a second and a half. */
const planets: CompletionSource = () =>
  new Promise((resolve) => {
    setTimeout(() => resolve([{ label: 'Bellatrix' }, { label: 'Betelgeuse' }]), 1500);
  });

/** A field whose host switches its completions between planets and colours. */
function SwitchedField() {
  const [isColours, setColours] = useState(false);
  return (
    <div data-lab-demo="switched">
      <TextField
        label="Name"
        defaultValue="b"
        completions={isColours ? colours : planets}
        description={isColours ? 'Completing colours.' : 'Completing planets.'}
      />
      <Button onPress={() => setColours((value) => !value)}>
        {isColours ? 'Complete planets' : 'Complete colours'}
      </Button>
    </div>
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
      description="Press Ctrl+Space at the end of the field, then switch to colours before the planets answer: the colours answer at once and the late planets never show. Switching back while the colours are open hides them until the planets answer."
    >
      <SwitchedField />
    </LabSection>
  );
}
