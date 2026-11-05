import type { CSSProperties } from 'react';
import {
  SnippetField,
  type SnippetFieldValue,
  type SnippetLoader,
} from '../../src/components/snippet-field/index.js';
import type { ControlSize } from '../../src/core/index.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const satisfies readonly ControlSize[];
const column: CSSProperties = { width: 460 };
const narrow: CSSProperties = { width: 260 };

const short: SnippetFieldValue = {
  source: 'samples/greet.ts',
  lines: { start: 2, end: 3 },
  code: '  const message = `Hello, ${name}!`;\n  return message;',
  language: 'ts',
};

const wideLine = `const values = [${Array.from({ length: 40 }, (_, index) => index * 7).join(', ')}];`;

const longCode = Array.from(
  { length: 60 },
  (_, index) => `line ${String(index + 1).padStart(2, '0')}: total += values[${index}];`,
).join('\n');

/** A loader that answers at once with the requested lines of a sample, or refuses a source. */
const loadSample: SnippetLoader = (request) =>
  Promise.resolve(
    request.source.startsWith('private/')
      ? { ok: false, message: 'You cannot read this source.' }
      : { ok: true, code: 'export const answer = 42;', language: 'ts' },
  );

/** Each size, empty and with a saved snippet; the inputs and buttons take the size's height. */
export function SnippetFieldSizes() {
  return (
    <LabSection
      title="Sizes"
      description="The source and line inputs and the Preview, Apply and Cancel buttons take the control height of the field's size."
    >
      <StateMatrix
        axes={{ content: ['empty', 'saved'], size: sizes }}
        render={({ content, size }) => (
          <div style={column}>
            <SnippetField
              label={`Snippet, ${content}, ${size}`}
              size={size}
              defaultValue={content === 'saved' ? short : null}
              placeholder="samples/greet.ts"
              loadSnippet={loadSample}
            />
          </div>
        )}
      />
    </LabSection>
  );
}

const corners = {
  'narrow column': {
    width: narrow,
    value: { ...short, source: 'samples/deeply/nested/folder/with/a/long/path/greet.ts' },
  },
  'wide line': {
    width: column,
    value: {
      source: 'samples/values.ts',
      lines: { start: 1, end: 1 },
      code: wideLine,
      language: 'ts',
    },
  },
  'long snippet': {
    width: column,
    value: {
      source: 'samples/totals.ts',
      lines: { start: 1, end: 60 },
      code: longCode,
      language: 'ts',
    },
  },
  'whole source': {
    width: column,
    value: {
      source: 'https://example.com/samples/answer.ts',
      lines: null,
      code: 'export const answer = 42;',
    },
  },
  'single line': {
    width: column,
    value: { ...short, lines: { start: 3, end: 3 }, code: '  return message;' },
  },
  'no language': {
    width: column,
    value: {
      source: 'notes/readme',
      lines: null,
      code: 'Plain text, kept as written.\nSecond line.',
    },
  },
  'empty code': {
    width: column,
    value: { source: 'samples/empty.ts', lines: null, code: '' },
  },
  'required and empty': { width: column, value: null },
  'label beside': { width: column, value: short },
} satisfies Record<string, { width: CSSProperties; value: SnippetFieldValue | null }>;

type Corner = keyof typeof corners;

/** Corner cases: long paths and lines, long and empty snippets, whole sources and label layouts. */
export function SnippetFieldCorners() {
  return (
    <LabSection
      title="Corner cases"
      description="A long source in a narrow column, a line wider than the field, a 60-line snippet, a whole source without lines, one line, no language, empty code, a required empty field and the label beside the inputs. Try private/keys.ts to see a refused preview."
    >
      <StateMatrix
        axes={{ corner: Object.keys(corners) as Corner[] }}
        render={({ corner }) => {
          const sample = corners[corner];
          return (
            <div style={sample.width}>
              <SnippetField
                label={`Snippet, ${corner}`}
                defaultValue={sample.value}
                labelLayout={corner === 'label beside' ? 'label-colon-control' : undefined}
                isRequired={corner === 'required and empty'}
                validationMode={corner === 'required and empty' ? 'immediate' : undefined}
                placeholder="samples/greet.ts"
                loadSnippet={loadSample}
              />
            </div>
          );
        }}
      />
    </LabSection>
  );
}
