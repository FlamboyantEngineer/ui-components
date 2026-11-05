import { type CSSProperties, useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import {
  SnippetField,
  type SnippetFieldValue,
  type SnippetLoader,
} from '../../src/components/snippet-field/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const column: CSSProperties = { width: 460 };

const greeting = [
  'export function greet(name: string) {',
  '  const message = `Hello, ${name}!`;',
  '  return message;',
  '}',
].join('\n');

const saved: SnippetFieldValue = {
  source: 'samples/greet.ts',
  lines: { start: 2, end: 3 },
  code: '  const message = `Hello, ${name}!`;\n  return message;',
  language: 'ts',
};

/** An in-memory source store: the lab's stand-in for a host's files, with a refused one. */
function useSourceStore() {
  const [files, setFiles] = useState<Record<string, string>>({
    'samples/greet.ts': greeting,
    'samples/total.py': 'def total(values):\n    return sum(values)\n',
  });
  const loadSnippet: SnippetLoader = (request, { signal }) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (request.source.startsWith('private/')) {
          resolve({ ok: false, message: 'You cannot read this source.' });
          return;
        }
        const text = files[request.source];
        if (text === undefined) {
          resolve({ ok: false, message: `No source named ${request.source}.` });
          return;
        }
        const lines = text.split('\n');
        const { start = 1, end = lines.length } = request.lines ?? {};
        if (end > lines.length) {
          resolve({ ok: false, message: `The source has only ${lines.length} lines.` });
          return;
        }
        const language = request.source.split('.').at(-1);
        resolve({ ok: true, code: lines.slice(start - 1, end).join('\n'), language });
      }, 500);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Aborted'));
      });
    });
  const editGreeting = () =>
    setFiles((previous) => ({
      ...previous,
      'samples/greet.ts': greeting.replace('Hello', 'Welcome'),
    }));
  return { loadSnippet, editGreeting };
}

function LinkedDemo() {
  const { loadSnippet, editGreeting } = useSourceStore();
  const [value, setValue] = useState<SnippetFieldValue | null>(saved);
  const [commits, setCommits] = useState(0);
  return (
    <div data-lab-demo="linked" style={column}>
      <SnippetField
        label="Example source"
        description="Try samples/total.py, private/keys.ts, or a range past the end."
        value={value}
        onChange={setValue}
        onCommit={() => setCommits((count) => count + 1)}
        loadSnippet={loadSnippet}
        placeholder="samples/greet.ts"
      />
      <Button onPress={editGreeting}>Edit samples/greet.ts</Button>
      <LabOutput name="Saved code">{JSON.stringify(value?.code ?? null)}</LabOutput>
      <LabOutput name="Commits">{commits}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection title="States" description="Saved, empty, read-only and disabled fields.">
      <StateMatrix
        axes={{ state: ['empty', 'saved', 'read-only', 'disabled'] }}
        render={({ state }) => (
          <div style={column}>
            <SnippetField
              label={`Snippet, ${state}`}
              defaultValue={state === 'empty' ? null : saved}
              loadSnippet={() => Promise.resolve({ ok: false, message: 'Not in this demo.' })}
              isReadOnly={state === 'read-only'}
              isDisabled={state === 'disabled'}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Preview, apply and update"
      description="An in-memory provider answers after 500 ms. Preview the saved range to check it; after editing the source, the preview is marked stale and Update saves it."
    >
      <LinkedDemo />
    </LabSection>
  </>,
);
