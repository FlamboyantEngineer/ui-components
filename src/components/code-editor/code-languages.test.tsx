import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { CodeEditor, type CodeLanguage } from './code-editor.js';
import { createCodeTokenizer, resolveCodeTokenizer } from './code-languages.js';

describe('CodeEditor languages', () => {
  it('UIC-CODE-EDITOR-12.1 highlights every preset without losing any source text', () => {
    const samples = {
      json: '{"name":true}',
      javascript: 'const name = "Pear"; // fruit',
      typescript: 'interface Fruit { count: number }',
      html: '<p>Pear</p>',
      css: '.fruit { color: #123abc; }',
      sql: 'SELECT name FROM fruit;',
      python: 'def name():\n  return "Pear" # fruit',
      markdown: '# Fruit\n**Pear** and `plum`',
      c: '#include <stdio.h>\nint count = 12; /* pears */',
      cpp: 'namespace fruit { class Pear {}; }',
      yaml: 'fruit: Pear # ripe\ncount: 12',
      xml: '<?xml version="1.0"?>\n<fruit name="Pear"><!-- ripe --></fruit>',
      shell: 'export FRUIT="Pear" && echo $FRUIT # ripe',
    } as const;
    for (const [language, source] of Object.entries(samples)) {
      const tokenize = requireDefined(
        resolveCodeTokenizer({ language: language as keyof typeof samples }),
      );
      const tokens = tokenize(source);
      expect(tokens.map((token) => token.text).join('')).toBe(source);
      expect(tokens.some((token) => token.type)).toBe(true);
    }
    expect(resolveCodeTokenizer({ language: 'text' })).toBeUndefined();
  });
  it('UIC-CODE-EDITOR-12.1 marks the kinds of the C, C++, YAML, XML and shell presets', () => {
    const kinds = (language: CodeLanguage, source: string) =>
      requireDefined(resolveCodeTokenizer({ language }))(source)
        .filter((token) => token.type)
        .map((token) => `${token.type}:${token.text}`);
    expect(kinds('c', '#include <stdio.h>\nreturn 0; // done')).toEqual([
      'keyword:#include',
      'keyword:return',
      'number:0',
      'comment:// done',
    ]);
    expect(kinds('cpp', 'template <typename T> int pick();')).toEqual([
      'keyword:template',
      'keyword:typename',
      'keyword:int',
    ]);
    expect(kinds('yaml', 'fruit: Pear # ripe\nfresh: true')).toEqual([
      'key:fruit',
      'comment:# ripe',
      'key:fresh',
      'keyword:true',
    ]);
    expect(kinds('xml', '<fruit name="Pear"/>')).toEqual([
      'keyword:<fruit',
      'key:name',
      'string:"Pear"',
      'keyword:/>',
    ]);
    expect(kinds('shell', 'echo "$FRUIT" | wc -l # count')).toEqual([
      'keyword:echo',
      'string:"$FRUIT"',
      'punctuation:|',
      'comment:# count',
    ]);
  });
  it('UIC-CODE-EDITOR-12.1 highlights hostile lines in linear time, keeping every character', () => {
    const tokenize = (language: CodeLanguage, source: string) => {
      const tokens = requireDefined(resolveCodeTokenizer({ language }))(source);
      expect(tokens.map((token) => token.text).join('')).toBe(source);
      return tokens.filter((token) => token.type).map((token) => `${token.type}:${token.text}`);
    };
    // Each of these took seconds when every rule rescanned the rest of the line at every offset.
    expect(tokenize('html', `<a${' '.repeat(4000)}`)).toEqual([]);
    expect(tokenize('html', '<a href="x">Pear</a><br/><br />')).toEqual([
      'keyword:<a href="x">',
      'keyword:</a>',
      'keyword:<br/>',
      'keyword:<br />',
    ]);
    const word = 'a'.repeat(2400);
    expect(tokenize('xml', `<fruit ${word}="1"/> ${word}`)).toEqual([
      'keyword:<fruit',
      `key:${word}`,
      'string:"1"',
      'keyword:/>',
    ]);
    expect(tokenize('css', `${word}: red; ${word}`)).toEqual([`keyword:${word}`]);
    expect(tokenize('yaml', `${word} ${word}`)).toEqual([]);
    expect(tokenize('markdown', `${'['.repeat(4000)}[Pear](https://example.com)`)).toEqual([
      'link:[Pear](https://example.com)',
    ]);
    // A line past five thousand characters stays plain; the next line is highlighted again.
    const long = `const ${'x'.repeat(5000)}`;
    expect(tokenize('javascript', `${long}\nconst pear = 1;`)).toEqual([
      'keyword:const',
      'number:1',
    ]);
  });
  it('UIC-CODE-EDITOR-12.1 accepts custom syntax rules, preserves flags and ignores empty matches', () => {
    const tokenize = createCodeTokenizer([
      { type: 'empty', pattern: /(?:)/g },
      { type: 'keyword', pattern: /^todo\b/im },
      { type: 'number', pattern: /\d+/g },
    ]);
    expect(tokenize('TODO 12\nnote\ntodo')).toEqual([
      { type: 'keyword', text: 'TODO' },
      { text: ' ' },
      { type: 'number', text: '12' },
      { text: '\nnote\n' },
      { type: 'keyword', text: 'todo' },
    ]);
    const { container } = render(
      <CodeEditor
        label="Notes"
        defaultValue="TODO slice pears"
        syntax={[{ type: 'keyword', pattern: /TODO/ }]}
      />,
    );
    expect(container.querySelector('[data-token=keyword]')).toHaveTextContent('TODO');
    expect(container.querySelector('.ui-code-editor')).toHaveAttribute('data-variant', 'field');
    expect(screen.queryByRole('button', { name: 'Format' })).not.toBeInTheDocument();
  });
  it('UIC-CODE-EDITOR-12.2 accepts non-JSON text as a field and commits it while reporting supplied errors', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { rerender } = render(
      <CodeEditor label="Source" language="python" defaultValue="pass" onCommit={onCommit} />,
    );
    const input = screen.getByRole('textbox', { name: 'Source' });
    await user.type(input, ' # note');
    await user.tab();
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith('pass # note');
    rerender(
      <CodeEditor
        label="Source"
        language="python"
        value="bad()"
        diagnostics={[{ line: 1, message: 'Unknown function.' }]}
      />,
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Unknown function.', { selector: '.ui-field__message' })).toBeVisible();
  });
});

it('UIC-CODE-EDITOR-12.2 composes a caller toolbar with JSON formatting tools', () => {
  render(
    <CodeEditor
      label="Settings"
      language="json"
      defaultValue='{"fruit":"Pear"}'
      toolbar={<span>JSON settings</span>}
    />,
  );
  expect(screen.getByText('JSON settings')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Format' })).toBeEnabled();
});
