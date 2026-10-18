import { useState, type CSSProperties } from 'react';
import type { CodeDiagnostic, CodeToken } from '../../src/components/code-editor/code-editor.js';
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from '../../src/components/completion-list/completion-list.js';
import { QueryField, type QueryGrammar } from '../../src/components/query-field/query-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const column: CSSProperties = { width: 460 };

/** A small sample language: `field:value` terms joined by AND, OR and NOT. */
const fieldValues: Readonly<Record<string, readonly string[]>> = {
  genre: ['fiction', 'history', 'science', 'travel', 'cooking'],
  reader: ['maria', 'jon', 'lena', 'sam'],
  pages: [],
  title: [],
};

const keywords = ['AND', 'OR', 'NOT'];

const tokenPatterns: ReadonlyArray<[RegExp, string | null]> = [
  [/"[^"]*"?/y, 'string'],
  [/\b(?:AND|OR|NOT)\b/y, 'keyword'],
  [/[A-Za-z]+(?=:)/y, 'key'],
  [/:/y, 'punctuation'],
  [/\d+/y, 'number'],
  [/[A-Za-z-]+/y, null],
  [/\s+/y, null],
  [/./y, 'invalid'],
];

function tokenizeQuery(source: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let at = 0;
  while (at < source.length) {
    for (const [pattern, type] of tokenPatterns) {
      pattern.lastIndex = at;
      const match = pattern.exec(source);
      if (!match) continue;
      tokens.push({ text: match[0], type });
      at += match[0].length;
      break;
    }
  }
  return tokens;
}

const fieldCompletions: Completion[] = [
  ...Object.keys(fieldValues).map((name) => ({
    label: name,
    insertText: `${name}:`,
    kind: 'field',
    description: 'Field',
  })),
  ...keywords.map((keyword) => ({ label: keyword, kind: 'keyword', description: 'Operator' })),
];

function completeQuery({ value, caret }: CompletionContext): CompletionResult {
  const match = /([A-Za-z]+)(?::([\w-]*))?$/.exec(value.slice(0, caret));
  if (!match) return { options: [] };
  const [term, name = '', typed] = match;
  if (typed === undefined) return { options: fieldCompletions, from: caret - term.length };
  const values = fieldValues[name.toLowerCase()] ?? [];
  return {
    options: values.map((label) => ({ label, kind: 'value' })),
    from: caret - typed.length,
  };
}

function diagnoseQuery(query: string): CodeDiagnostic[] {
  return [...query.matchAll(/([A-Za-z]+):(\S*)/g)].flatMap((match) => {
    const [, name = '', value = ''] = match;
    const column = (match.index ?? 0) + 1;
    if (!(name.toLowerCase() in fieldValues)) {
      const endColumn = column + name.length;
      return [{ message: `Unknown field "${name}".`, line: 1, column, endColumn }];
    }
    if (value) return [];
    const at = column + name.length;
    return [{ message: `${name} needs a value.`, line: 1, column: at, endColumn: at + 1 }];
  });
}

const grammar: QueryGrammar = {
  tokenize: tokenizeQuery,
  complete: completeQuery,
  diagnose: diagnoseQuery,
};

const samples = {
  empty: '',
  valid: 'genre:history AND NOT reader:jon',
  invalid: 'colour:red OR pages:',
  'read-only': 'genre:travel OR genre:cooking',
  disabled: 'title:"salt road"',
} as const;

function SubmitDemo() {
  const [submitted, setSubmitted] = useState<string[]>([]);
  return (
    <div data-lab-demo="submit" style={column}>
      <QueryField
        label="Search books"
        grammar={grammar}
        defaultValue="genre:"
        placeholder="genre:history AND pages:300"
        onSubmit={(query) => setSubmitted([...submitted, query])}
      />
      <ol data-lab-submitted>
        {submitted.map((query, index) => (
          <li key={index}>{query}</li>
        ))}
      </ol>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="An empty query with a placeholder, a valid query, a query with an unknown field and a missing value, and read-only and disabled queries."
    >
      <StateMatrix
        axes={{ state: Object.keys(samples) as Array<keyof typeof samples> }}
        render={({ state }) => (
          <div style={column}>
            <QueryField
              label={`Query, ${state}`}
              grammar={grammar}
              defaultValue={samples[state]}
              placeholder="genre:history AND pages:300"
              isReadOnly={state === 'read-only'}
              isDisabled={state === 'disabled'}
              onSubmit={() => undefined}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Completing and submitting"
      description="Type a field name for its completions, then a colon for its values. Enter, when no completion is open, or the run button submits a query without errors."
    >
      <SubmitDemo />
    </LabSection>
  </>,
);
