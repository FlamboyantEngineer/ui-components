// Code Editor cases for the problem list switch, an invalid source described from outside, a
// surface that never resizes, and the exported tokenizer helper a host can call itself.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  CodeEditor,
  type CodeDiagnostic,
  type CodeLanguage,
  type CodeSyntax,
} from '../../src/components/code-editor/code-editor.js';
import { resolveCodeTokenizer } from '../../src/components/code-editor/index.js';
import { LabSection } from './chrome/index.js';

const problemSource = 'let basket = "apples"\nreturn pick(fruit.ripe, baskit)';
const problems: CodeDiagnostic[] = [
  { message: 'Unknown name "baskit". Did you mean "basket"?', line: 2, column: 25, endColumn: 31 },
  { message: 'Prefer const for values never reassigned.', line: 1, severity: 'warning' },
];

/** The same problems with and without the list: marks, tips and F8 stay either way. */
function ListedProblems() {
  const [isListed, setListed] = useState(false);
  const [value, setValue] = useState(problemSource);
  return (
    <div data-lab-demo="list-diagnostics">
      <Button size="sm" isSelected={isListed} onPress={() => setListed((listed) => !listed)}>
        List the problems
      </Button>
      <p data-lab-output="list-diagnostics">listDiagnostics: {String(isListed)}</p>
      <CodeEditor
        variant="surface"
        aria-label="Source without a problem list"
        data-lab-editor="unlisted"
        language="javascript"
        lineNumbers
        size="sm"
        value={value}
        onChange={setValue}
        diagnostics={problems}
        listDiagnostics={isListed}
      />
    </div>
  );
}

/** A source the host judges invalid, its error told outside the editor rather than located. */
function InvalidSource() {
  const [value, setValue] = useState('{ "fruit": "pear" }');
  const isInvalid = !value.includes('"count"');
  return (
    <div data-lab-demo="invalid">
      <CodeEditor
        variant="surface"
        aria-label="Order settings"
        aria-describedby="lab-code-invalid-error"
        data-lab-editor="invalid"
        language="json"
        size="sm"
        value={value}
        onChange={setValue}
        isInvalid={isInvalid}
      />
      <p id="lab-code-invalid-error" data-lab-output="invalid">
        {isInvalid ? 'Add a "count" to the order settings.' : 'The order settings are complete.'}
      </p>
    </div>
  );
}

const fruitSyntax: CodeSyntax = [
  { type: 'keyword', pattern: /\b(?:pick|basket)\b/ },
  { type: 'number', pattern: /\b\d+\b/ },
];

const helperSource = 'pick 3 from basket // "ripe"';

/** Calls `resolveCodeTokenizer` as a host would, and lists the tokens it returns. */
function TokenizerHelper() {
  const [choice, setChoice] = useState<CodeLanguage | 'syntax'>('javascript');
  const tokenize =
    choice === 'syntax'
      ? resolveCodeTokenizer({ syntax: fruitSyntax })
      : resolveCodeTokenizer({ language: choice });
  const tokens = tokenize?.(helperSource) ?? [{ text: helperSource, type: null }];
  return (
    <div data-lab-demo="tokenizer">
      <div role="group" aria-label="Tokenizer">
        {(['javascript', 'text', 'syntax'] as const).map((option) => (
          <Button
            key={option}
            size="sm"
            variant="secondary"
            isSelected={choice === option}
            onPress={() => setChoice(option)}
          >
            {option === 'syntax' ? 'Custom syntax' : option}
          </Button>
        ))}
      </div>
      <p data-lab-output="tokens">
        {tokens
          .filter((token) => token.text.trim() !== '')
          .map((token) => `${token.text.trim()}:${token.type ?? 'plain'}`)
          .join(' ')}
      </p>
    </div>
  );
}

function FixedSource() {
  const [value, setValue] = useState('const basket = ["pear", "plum"];\nexport default basket;');
  return (
    <CodeEditor
      variant="surface"
      aria-label="Fixed size source"
      data-lab-editor="resize-none"
      language="javascript"
      resize="none"
      size="sm"
      value={value}
      onChange={setValue}
    />
  );
}

export function CodeEditorCoverageSections() {
  return (
    <>
      <LabSection
        title="Problems without a list"
        description="listDiagnostics false drops the list below the source; the marks in the source and gutter, the hover tip on the underlined name and F8 (Shift+F8 back) still find each problem. Turn the list on to compare."
      >
        <ListedProblems />
      </LabSection>
      <LabSection
        title="Invalid from outside"
        description="isInvalid marks the source invalid without a located diagnostic; the host's error below is the editor's description (aria-describedby). Add a count to make it valid."
      >
        <InvalidSource />
      </LabSection>
      <LabSection
        title="No resizing"
        description="resize none: a multiline surface with no grip, at its starting height."
      >
        <FixedSource />
      </LabSection>
      <LabSection
        title="Tokenizer helper"
        description="resolveCodeTokenizer returns the tokenizer the editor would use: a language preset, none for plain text, or one built from a custom syntax, which wins over the language. A tokenize prop wins over both, as the custom tokenizer examples show."
      >
        <TokenizerHelper />
      </LabSection>
    </>
  );
}
