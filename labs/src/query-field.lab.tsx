import { useState, type CSSProperties } from 'react';
import type { CodeDiagnostic, CodeToken } from '../../src/components/code-editor/code-editor.js';
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from '../../src/components/completion-list/completion-list.js';
import { QueryField, type QueryGrammar } from '../../src/components/query-field/query-field.js';
import { UiProvider } from '../../src/core/provider.js';
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

const fieldDescriptions: Readonly<Record<string, string>> = {
  genre: 'Shelf section',
  reader: 'Who borrowed it',
  pages: 'A number',
  title: 'Quoted text',
};

const keywordDescriptions: Readonly<Record<string, string>> = {
  AND: 'Both terms',
  OR: 'Either term',
  NOT: 'Leaves out the term',
};

const fieldCompletions: Completion[] = [
  ...Object.keys(fieldValues).map((name) => ({
    label: name,
    insertText: `${name}:`,
    kind: 'field',
    description: fieldDescriptions[name],
  })),
  ...keywords.map((keyword) => ({
    label: keyword,
    kind: 'keyword',
    description: keywordDescriptions[keyword],
  })),
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

/** Long field names with long descriptions, to show how the list wraps and truncates. */
const longCompletions: Completion[] = [
  {
    label: 'first-publication-date-of-the-original-edition',
    insertText: 'published:',
    kind: 'field',
    description: 'The year the first edition of the book reached the shelves',
  },
  { label: 'translated-from', insertText: 'translated:', kind: 'field' },
  { label: 'NOT', kind: 'keyword', description: 'Leaves out the term' },
];

/** Every combination of kind, description and label length, to line up in one list. */
const mixedCompletions: Completion[] = [
  { label: 'genre', insertText: 'genre:', kind: 'field', description: 'Shelf section' },
  { label: 'NOT', kind: 'keyword' },
  { label: 'history' },
  { label: 'reader', insertText: 'reader:', description: 'No kind tag' },
  {
    label: 'first-publication-date-of-the-original-edition',
    insertText: 'published:',
    kind: 'field',
    description: 'The year the first edition of the book reached the shelves',
  },
  { label: 'maria', kind: 'value', description: 'Reader' },
];

const shapes = ['short', 'long', 'mixed', 'slow', 'no matches'] as const;

const wait = (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const shapeGrammars: Readonly<Record<(typeof shapes)[number], QueryGrammar>> = {
  short: grammar,
  long: { ...grammar, complete: () => longCompletions },
  mixed: { ...grammar, complete: () => ({ options: mixedCompletions, filter: false }) },
  slow: {
    ...grammar,
    complete: async (context) => {
      await wait(1200);
      return completeQuery(context);
    },
  },
  'no matches': { ...grammar, complete: () => [] },
};

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
      title="Suggestion shapes"
      description="Type in each query: short names with a kind tag and a description, long names that wrap while long descriptions truncate, a mix of options with and without kinds and descriptions whose tag, label and description line up on the first line's baseline, a source that answers after a second (the list keeps its narrowed options until the answer comes, and a Tab pressed meanwhile waits for it instead of leaving), and a source with no matches, which opens no list and leaves Tab to move on."
    >
      <StateMatrix
        axes={{ suggestions: shapes }}
        render={({ suggestions }) => (
          <div style={column}>
            <QueryField
              label={`Query, ${suggestions} suggestions`}
              grammar={shapeGrammars[suggestions]}
              placeholder="genre:history"
              onSubmit={() => undefined}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Right to left"
      description="Type any letter for the mixed suggestions in an Arabic locale: the kind tag, the label and the description line up from the right, on the first line's baseline."
    >
      <UiProvider locale="ar-EG">
        <div dir="rtl" data-lab-demo="rtl" style={column}>
          <QueryField
            label="Query, right to left"
            grammar={shapeGrammars.mixed}
            placeholder="genre:history"
          />
        </div>
      </UiProvider>
    </LabSection>
    <LabSection
      title="Completing and submitting"
      description="Type a field name for its completions, then a colon for its values. Suggestions are inserted only from a list on screen: after Escape, or before a list has shown, the first Tab shows it and the next Tab inserts the active suggestion; Tab with nothing to suggest moves on. Enter, when no completion is open, or the run button submits a query without errors."
    >
      <SubmitDemo />
    </LabSection>
  </>,
);
