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
import { CompletingCell } from './table-control-cases.js';

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

/** Market stalls a pretend server knows, looked up after a short wait. */
const stalls: Completion[] = [
  {
    label: 'plums',
    kind: 'variable',
    description: 'Stall 4',
    documentation: 'Dark plums, sold by the crate.',
  },
  { label: 'pears', kind: 'variable', description: 'Stall 2' },
  { label: 'peaches', kind: 'variable', description: 'Stall 7' },
  {
    label: 'order',
    kind: 'snippet',
    description: 'order(stall, crates)',
    documentation: 'Orders crates from a stall. Tab moves between the two fields.',
    insertText: 'order(${stall}, ${crates})',
  },
  { label: 'apricots', kind: 'variable', description: 'Stall 1' },
];

/** An asynchronous source: the matching stalls arrive after 300 milliseconds. */
const askMarket: CompletionSource = ({ query, isExplicit }) =>
  query || isExplicit ? new Promise((resolve) => setTimeout(() => resolve(stalls), 300)) : [];

/**
 * Autocomplete, as a reader first meets it: a word list, a source that answers later with a
 * snippet, and the same list at every size in a scrolled, resizable editor.
 */
function AutocompleteDemo() {
  const [words, setWords] = useState('let total = ');
  const [market, setMarket] = useState('// Ask the market\n');
  return (
    <div data-lab-demo="autocomplete" style={{ display: 'grid', gap: 12 }}>
      <CodeEditor
        variant="surface"
        aria-label="Autocomplete from a word list"
        data-lab-editor="autocomplete-words"
        tokenize={tokenize}
        toolbar={<span>Type ba, or press Ctrl+Space</span>}
        value={words}
        onChange={setWords}
        completions={vocabulary}
      />
      <p>
        Inserted: <output data-lab-output="autocomplete-words">{words}</output>
      </p>
      <CodeEditor
        variant="surface"
        aria-label="Autocomplete from an asynchronous source"
        data-lab-editor="autocomplete-market"
        tokenize={tokenize}
        toolbar={<span>Type p or or, wait for the market</span>}
        lineNumbers
        value={market}
        onChange={setMarket}
        completions={askMarket}
      />
      <p>
        Inserted: <output data-lab-output="autocomplete-market">{market}</output>
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'start' }}>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <Editor
            key={size}
            aria-label={`Autocomplete at size ${size}`}
            data-lab-editor={`autocomplete-${size}`}
            size={size}
            resize="both"
            lineNumbers
            initialValue={longSource}
            completions={vocabulary}
          />
        ))}
      </div>
    </div>
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
        title="Autocomplete"
        description="Pass completions: a list of words ({ label, description }) or a source function that answers at once or with a promise. Suggestions open as you type a word and on Ctrl+Space with nothing typed. Arrow keys move, Enter or Tab inserts, a click inserts, Escape closes. In the first editor type ba and pick basket. In the second, type p and wait for the market's stalls, or type or and insert the order snippet: Tab moves from stall to crates. The three editors below scroll and resize: open the list near the bottom of each and it stays at the caret."
      >
        <AutocompleteDemo />
      </LabSection>
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
        title="Completions in a table cell"
        description="Type fru in the cell and accept fruit.count with Tab; the caller owns the expression outside the table."
      >
        <CompletingCell />
      </LabSection>
      <LabSection
        title="Completions"
        description="A small word list (see Autocomplete above for the full tour). Type fruit. or b: the list opens at the caret. Arrow keys move, Enter or Tab inserts, Escape closes. Input-method composition hides suggestions until its final text commits."
      >
        <CompletingEditor />
      </LabSection>
      <LabSection
        title="Editing keys, search and completion sources"
        description="Tab and Shift+Tab indent by four spaces, Escape then Tab leaves; brackets and quotes pair up; Enter keeps the indentation; the bracket at the caret and its partner are marked. Ctrl+F finds and replaces; Ctrl+Z in the source undoes each Replace or Replace all as one step. Typing or Ctrl+Space asks the source: statements with snippets (Tab moves between fields until Escape, an undo or an edit outside the field ends it), or fields after fruit. Keys an input method uses to pick or confirm a candidate stay with it."
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
        description="Problems are underlined; rest the pointer on one, or on basket or pick, for a tip. F8 and Shift+F8 move between problems. The tip follows the pointer without rendering the highlighted copy again."
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
      <LabSection
        title="Resizing sideways"
        description="With resize set to both, drag the grip at the surface's bottom corner sideways as well as down: the frame, toolbar and problem list follow the surface, which grows only into the dashed box's width and shrinks to 200 pixels. The text, caret and selection stay put and soft-wrapped lines rewrap. The default resizes the height only; a single-line editor never resizes."
      >
        <div
          data-lab-demo="resize"
          style={{
            display: 'grid',
            gap: 12,
            width: 640,
            maxWidth: '100%',
            padding: 4,
            border: '1px dashed currentColor',
          }}
        >
          <Editor
            aria-label="Resizable source"
            data-lab-editor="resize-both"
            resize="both"
            lineNumbers
            toolbar={<span>Drag the corner sideways</span>}
            diagnostics={[{ message: 'Unknown name "baskets".', line: 2 }]}
          />
          <CodeEditor
            label="Resizable field"
            data-lab-editor="resize-field"
            resize="both"
            defaultValue={sample}
            tokenize={tokenize}
          />
          <Editor aria-label="Height only" data-lab-editor="resize-vertical" size="sm" />
          <Editor
            aria-label="Single line"
            data-lab-editor="resize-single"
            multiline={false}
            resize="both"
            initialValue="pick(fruit.ripe)"
          />
        </div>
      </LabSection>
      <LabSection
        title="Blank first line"
        description="The text starts with a line break. With the caret at the very start, Tab indents the blank first line to the next stop."
      >
        <Editor
          aria-label="Blank first line"
          data-lab-editor="blank-first"
          initialValue={'\nreturn basket'}
          size="sm"
          indentWithTab
          lineNumbers
        />
      </LabSection>
    </div>
  </>,
);
