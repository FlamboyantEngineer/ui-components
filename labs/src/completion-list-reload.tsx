import { useState } from 'react';
import type { CompletionSource } from '../../src/components/completion-list/completion-list.js';
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
