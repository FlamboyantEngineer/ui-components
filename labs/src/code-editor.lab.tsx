import { jsonExamples } from './code-json.js';
import { languageExamples } from './code-languages.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  CodeEditor,
  type CodeDiagnostic,
  type CodeEditorSurfaceProps,
  type CodeEditorSize,
  type CodeEditorWrap,
  type CodeToken,
} from '../../src/components/code-editor/code-editor.js';
import type {
  Completion,
  CompletionSource,
} from '../../src/components/completion-list/completion-list.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const keywords = new Set(['let', 'if', 'else', 'return', 'pick', 'and', 'or', 'not']);
const parts = /(\/\/[^\n]*|"(?:\\.|[^"\\])*"?|\d+(?:\.\d+)?|[A-Za-z_][\w.]*|\s+|.)/g;

/** A small sample language: comments, strings, numbers, keywords and names. */
function tokenize(source: string): CodeToken[] {
  return (source.match(parts) ?? []).map((text) => {
    if (text.startsWith('//')) return { text, type: 'comment' };
    if (text.startsWith('"')) return { text, type: 'string' };
    if (/^\d/.test(text)) return { text, type: 'number' };
    if (keywords.has(text)) return { text, type: 'keyword' };
    return { text, type: /^[A-Za-z_]/.test(text) ? 'name' : null };
  });
}

/** Reports brackets that do not pair up, with their line and column. */
function checkBrackets(source: string): CodeDiagnostic[] {
  const open: Array<{ line: number; column: number }> = [];
  const problems: CodeDiagnostic[] = [];
  source.split('\n').forEach((text, index) => {
    [...text].forEach((character, offset) => {
      const place = { line: index + 1, column: offset + 1 };
      if (character === '(') open.push(place);
      if (character === ')' && !open.pop()) problems.push({ ...place, message: 'Unmatched ")".' });
    });
  });
  return [...problems, ...open.map((place) => ({ ...place, message: 'Unclosed "(".' }))];
}

const sample = [
  '// Pick a basket for the market',
  'let basket = "apples"',
  'if (fruit.count > 12) return basket',
  'else return pick(fruit.ripe and not fruit.bruised, "pears", "plums from the orchard by the river")',
].join('\n');

const vocabulary: Completion[] = [
  { label: 'fruit.count', description: 'How many fruit are in the basket' },
  { label: 'fruit.ripe', description: 'Whether the fruit is ripe' },
  { label: 'fruit.bruised', description: 'Whether any fruit is bruised' },
  { label: 'basket', description: 'The chosen basket' },
  { label: 'market.city', description: 'Where the market is held' },
];

const fruitFields: Completion[] = [
  {
    label: 'count',
    kind: 'property',
    description: 'number',
    documentation: 'How many fruit are in the basket, counted when the basket is packed.',
  },
  {
    label: 'ripe',
    kind: 'property',
    description: 'boolean',
    documentation: 'Whether the fruit is ripe.',
  },
  { label: 'bruised', kind: 'property', description: 'boolean' },
  { label: 'weigh', kind: 'function', description: 'weigh(unit)', insertText: 'weigh(${unit})' },
];

const statements: Completion[] = [
  {
    label: 'if',
    kind: 'snippet',
    description: 'if … return',
    documentation: 'A condition and the value returned when it holds.',
    insertText: 'if (${condition}) return ${value}',
  },
  {
    label: 'pick',
    kind: 'function',
    description: 'pick(test, yes, no)',
    insertText: 'pick(${test}, ${yes}, ${no})',
  },
  { label: 'let', kind: 'keyword', insertText: 'let ${name} = ${value}' },
  { label: 'basket', kind: 'variable', description: 'The chosen basket' },
];

/** Fields after `fruit.`, statements elsewhere: the source reads the text before the caret. */
const completeSample: CompletionSource = ({ value, caret, query, isExplicit }) => {
  const field = /fruit\.(\w*)$/.exec(value.slice(0, caret));
  if (field) return { from: caret - (field[1]?.length ?? 0), options: fruitFields };
  return (query || isExplicit) && !query.includes('.') ? statements : [];
};

const hoverNotes: Record<string, string> = {
  basket: 'basket: the chosen basket, a text.',
  pick: 'pick(test, yes, no): yes when the test holds, else no.',
};

/** The note on the word under an offset, for the hover tip. */
function describeWordAt(source: string, offset: number) {
  const start = source.slice(0, offset + 1).search(/\w+$/);
  const word = start === -1 ? '' : (/^\w+/.exec(source.slice(start))?.[0] ?? '');
  return hoverNotes[word] ?? null;
}

/** An unknown name on the second line, and a warning on the first line's text. */
function checkProblems(source: string): CodeDiagnostic[] {
  const column = (source.split('\n')[1] ?? '').indexOf('baskit') + 1;
  if (column === 0) return [];
  return [
    { message: 'Unknown name "baskit". Did you mean "basket"?', line: 2, column },
    { message: 'A text is always true.', line: 1, column: 14, endColumn: 22, severity: 'warning' },
  ];
}

const sizes = ['sm', 'md', 'lg'] as const;
const states = ['resting', 'numbered', 'invalid', 'warning', 'read-only', 'disabled'] as const;
const wraps = ['soft', 'off'] as const;

const stateProps: Record<(typeof states)[number], Partial<CodeEditorSurfaceProps>> = {
  resting: {},
  numbered: { lineNumbers: true },
  invalid: { lineNumbers: true, diagnostics: [{ message: 'Unknown name "baskets".', line: 2 }] },
  warning: {
    lineNumbers: true,
    diagnostics: [{ message: 'This line is long.', line: 4, column: 1, severity: 'warning' }],
  },
  'read-only': { isReadOnly: true },
  disabled: { isDisabled: true },
};

function Editor({
  initialValue = sample,
  ...props
}: Omit<CodeEditorSurfaceProps, 'value' | 'variant'> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <CodeEditor
      variant="surface"
      aria-label="Source"
      tokenize={tokenize}
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

function ToolbarEditor() {
  const [value, setValue] = useState(sample);
  const [wrap, setWrap] = useState<CodeEditorWrap>('soft');
  const lines = value.split('\n').length;
  return (
    <CodeEditor
      variant="surface"
      aria-label="Sample source"
      data-lab-editor="toolbar"
      tokenize={tokenize}
      lineNumbers
      wrap={wrap}
      value={value}
      onChange={setValue}
      toolbar={
        <>
          <strong>Sample source</strong>
          <output data-lab-output="lines">{lines === 1 ? '1 line' : `${lines} lines`}</output>
          <Button
            size="xs"
            variant="ghost"
            isSelected={wrap === 'soft'}
            onPress={() => setWrap(wrap === 'soft' ? 'off' : 'soft')}
          >
            Wrap
          </Button>
        </>
      }
    />
  );
}

function CheckedEditor() {
  const [value, setValue] = useState('let total = (12 + (4 * 3)\nreturn total');
  return (
    <CodeEditor
      variant="surface"
      aria-label="Checked source"
      data-lab-editor="diagnostics"
      tokenize={tokenize}
      lineNumbers
      value={value}
      onChange={setValue}
      diagnostics={checkBrackets(value)}
    />
  );
}

function CompletingEditor() {
  const [value, setValue] = useState('let total = ');
  return (
    <>
      <CodeEditor
        variant="surface"
        aria-label="Source with completions"
        data-lab-editor="completions"
        tokenize={tokenize}
        size="sm"
        value={value}
        onChange={setValue}
        completions={vocabulary}
      />
      <p>
        Value: <output data-lab-output="completions">{value}</output>
      </p>
    </>
  );
}

function EditingEditor() {
  const [value, setValue] = useState(
    'let basket = pick(fruit.ripe, "pears", "plums")\nif (fruit.count > 12) {\n  return basket\n}',
  );
  return (
    <>
      <CodeEditor
        variant="surface"
        aria-label="Editable source"
        data-lab-editor="editing"
        tokenize={tokenize}
        lineNumbers
        wrap="off"
        indentWithTab
        indent={4}
        autoCloseBrackets
        allowsSearch
        completions={completeSample}
        value={value}
        onChange={setValue}
      />
      <p>
        Value: <output data-lab-output="editing">{value}</output>
      </p>
      <button type="button" data-lab-after="editing">
        After the editor
      </button>
    </>
  );
}

function BoundaryEditor() {
  const [value, setValue] = useState('İ apple APPLE\n([})');
  return (
    <CodeEditor
      variant="surface"
      aria-label="Boundary source"
      data-lab-editor="boundaries"
      value={value}
      onChange={setValue}
      tokenize={tokenize}
      allowsSearch
      completions={[
        { label: '${literal}' },
        { label: 'escaped', insertText: '\\${literal} ${value\\}text}' },
      ]}
      diagnostics={[
        { message: 'First range.', line: 1, column: 3, endColumn: 8, severity: 'warning' },
        { message: 'Overlapping range.', line: 1, column: 5, endColumn: 14 },
      ]}
    />
  );
}

function ProblemsEditor() {
  const [value, setValue] = useState(
    'let basket = "apples"\nreturn pick(fruit.ripe, baskit, "pears")',
  );
  return (
    <CodeEditor
      variant="surface"
      aria-label="Source with problems"
      data-lab-editor="problems"
      tokenize={tokenize}
      lineNumbers
      wrap="off"
      value={value}
      onChange={setValue}
      diagnostics={checkProblems(value)}
      renderHover={(offset) => describeWordAt(value, offset)}
    />
  );
}

function FormEditor() {
  const [value, setValue] = useState('let basket = pick(fruit.ripe)');
  const [submitted, setSubmitted] = useState('Nothing submitted yet');
  return (
    <form
      aria-label="Saved query"
      data-lab-demo="form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(`Submitted: ${String(new FormData(event.currentTarget).get('source'))}`);
      }}
    >
      <CodeEditor
        variant="surface"
        aria-label="Query source"
        name="source"
        tokenize={tokenize}
        size="sm"
        value={value}
        onChange={setValue}
      />
      <Button type="submit">Submit</Button>
      <output data-lab-output="form">{submitted}</output>
    </form>
  );
}

const longSource = Array.from(
  { length: 60 },
  (_, index) =>
    `let row${index + 1} = "orchard row ${index + 1}, past the mill and the old stone bridge" // ${index % 3 ? 'pears' : 'apples'}`,
).join('\n');

const excerpt = [
  'let basket = "apples"',
  'if (fruit.count > 12) {',
  '  return pick(fruit.ripe, baskit, "pears")',
  '}',
  'return basket',
].join('\n');

/** Lines 41 to 45 of a longer text, with a problem the checker reports at the text's line 43. */
function ExcerptEditor() {
  return (
    <CodeEditor
      variant="surface"
      aria-label="Excerpt"
      data-lab-editor="excerpt"
      tokenize={tokenize}
      size="sm"
      lineNumbers
      firstLineNumber={41}
      isReadOnly
      value={excerpt}
      diagnostics={[
        { message: 'Unknown name "baskit".', line: 43, column: 27, severity: 'warning' },
      ]}
    />
  );
}

mountLab(
  <>
    {jsonExamples}
    {languageExamples}
    <div data-lab-family="surface">
      <LabSection
        title="Sizes, wrapping and states"
        description="Each size against wrapping and the states: line numbers, an error, a warning, read-only and disabled."
      >
        <StateMatrix
          axes={{ wrap: wraps, state: states, size: sizes }}
          render={({ wrap, state, size }) => (
            <Editor
              size={size as CodeEditorSize}
              wrap={wrap as CodeEditorWrap}
              {...stateProps[state]}
            />
          )}
        />
      </LabSection>
      <LabSection
        title="Toolbar"
        description="A caller toolbar with a label, a line count and a Wrap toggle that switches wrapping."
      >
        <ToolbarEditor />
      </LabSection>
      <LabSection
        title="Live diagnostics"
        description="The caller checks the brackets on every change; the list and the gutter follow."
      >
        <CheckedEditor />
      </LabSection>
      <LabSection
        title="Completions"
        description="Type fruit. or b: the list opens at the caret. Arrow keys move, Enter or Tab inserts, Escape closes."
      >
        <CompletingEditor />
      </LabSection>
      <LabSection
        title="Editing keys, search and completion sources"
        description="Tab and Shift+Tab indent by four spaces, Escape then Tab leaves; brackets and quotes pair up; Enter keeps the indentation; the bracket at the caret and its partner are marked. Ctrl+F finds and replaces. Typing or Ctrl+Space asks the source: statements with snippets (Tab moves between fields), or fields after fruit."
      >
        <EditingEditor />
      </LabSection>
      <LabSection
        title="Source boundaries"
        description="Find apple after İ and replace it without shifting the source. The second line has a mismatched nested bracket. Ctrl+Space offers a literal label and an escaped snippet; overlapping diagnostics retain the worst severity."
      >
        <BoundaryEditor />
      </LabSection>
      <LabSection
        title="Problems and hover tips"
        description="Problems are underlined; rest the pointer on one, or on basket or pick, for a tip. F8 and Shift+F8 move between problems."
      >
        <ProblemsEditor />
      </LabSection>
      <LabSection
        title="Excerpt"
        description="Lines 41 to 45 of a longer text, read-only: the gutter starts at 41 and the warning the caller reports at line 43 marks that line. F8 shows its tip."
      >
        <ExcerptEditor />
      </LabSection>
      <LabSection
        title="In a form"
        description="With a name, the form submits the source under it like any text field."
      >
        <FormEditor />
      </LabSection>
      <LabSection
        title="Long source"
        description="Scroll the text: the gutter and the highlighting follow."
      >
        <Editor
          aria-label="Long source"
          data-lab-editor="long"
          initialValue={longSource}
          size="sm"
          wrap="off"
          lineNumbers
        />
      </LabSection>
    </div>
  </>,
);
