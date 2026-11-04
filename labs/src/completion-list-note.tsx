import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  type Completion,
  createTriggerCompletions,
} from '../../src/components/completion-list/completion-list.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { UserIdentity } from '../../src/components/user-identity/user-identity.js';

const people: Completion[] = [
  { label: 'Maria Santos', description: 'Design', insertText: '@maria ', kind: 'person' },
  { label: 'Jon Berg', description: 'Field research', insertText: '@jon ', kind: 'person' },
  { label: 'Lena Ortiz', description: 'Quality', insertText: '@lena ', kind: 'person' },
  { label: 'Sam Okafor', description: 'Testing', insertText: '@sam ', kind: 'person' },
];

const references: Completion[] = [12, 14, 27, 35].map((number) => ({
  label: `Requirement ${number}`,
  insertText: `#${number} `,
  kind: 'reference',
}));

const byQuery = (options: readonly Completion[], query: string) =>
  options.filter(({ label }) => label.toLowerCase().includes(query.toLowerCase()));

/** `@` searches people (answering later, as a directory would) and `#` numbered references. */
const noteCompletions = createTriggerCompletions([
  {
    character: '@',
    allowsSpaces: true,
    getCompletions: (query) => Promise.resolve(byQuery(people, query)),
  },
  { character: '#', getCompletions: (query) => byQuery(references, query.replace(/^\D*/, '')) },
]);

export function TriggeredNote() {
  const [value, setValue] = useState('');
  const [isReadOnly, setReadOnly] = useState(false);
  const [hasCompletions, setHasCompletions] = useState(true);
  return (
    <>
      <Button onPress={() => setReadOnly(!isReadOnly)}>
        {isReadOnly ? 'Enable note editing' : 'Make note read-only'}
      </Button>
      <Button onPress={() => setHasCompletions(!hasCompletions)}>
        {hasCompletions ? 'Disable note suggestions' : 'Enable note suggestions'}
      </Button>
      <TextField
        label="Note"
        multiline
        minRows={3}
        value={value}
        onChange={setValue}
        completions={hasCompletions ? noteCompletions : undefined}
        isReadOnly={isReadOnly}
        renderCompletion={(completion) =>
          completion.kind === 'person' ? (
            <UserIdentity name={completion.label} description={completion.description} size="sm" />
          ) : (
            completion.label
          )
        }
        data-lab-field="trigger"
      />
      <p>
        Value: <output data-lab-output="trigger">{value}</output>
      </p>
    </>
  );
}
