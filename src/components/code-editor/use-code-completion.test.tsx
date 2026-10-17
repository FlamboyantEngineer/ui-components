import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  CodeEditor,
  type CodeCompletion,
  type CodeCompletionSource,
  type CodeEditorProps,
} from './code-editor.js';

function Editor({
  initialValue = '',
  ...props
}: Omit<CodeEditorProps, 'value'> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return <CodeEditor aria-label="Source" {...props} value={value} onChange={setValue} />;
}

function input() {
  return screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Source' });
}

function optionTexts() {
  return screen.queryAllByRole('option').map((option) => option.textContent);
}

function marked() {
  const { value, selectionStart: start, selectionEnd: end } = input();
  if (start === end) return `${value.slice(0, start)}|${value.slice(start)}`;
  return `${value.slice(0, start)}[${value.slice(start, end)}]${value.slice(end)}`;
}

const fruit: CodeCompletion[] = [
  { label: 'apple', kind: 'variable', documentation: 'A crisp fruit that keeps for months.' },
  { label: 'pick', kind: 'function', insertText: 'pick(${fruit}, ${count})' },
  { label: 'basket', kind: 'keyword', insertText: 'basket {\n  ${}\n}' },
];

describe('CodeEditor completion sources', () => {
  it('UIC-CODE-EDITOR-4.2 opens every completion on Ctrl+Space, even without a word', async () => {
    const user = userEvent.setup();
    render(<Editor completions={fruit} />);
    await user.click(input());
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.keyboard('{Control>} {/Control}');
    expect(optionTexts()).toEqual(['apple', 'pick', 'basket']);
    expect(input()).toHaveValue('');
  });

  it('UIC-CODE-EDITOR-4.6 asks a source on each edit and shows its answer for the typed text', async () => {
    const user = userEvent.setup();
    const source = vi.fn<CodeCompletionSource>(({ value, caret }) => {
      const dot = value.lastIndexOf('.', caret - 1);
      const typed = value.slice(dot + 1, caret);
      return dot === -1 || !/^\w*$/.test(typed) ? [] : { from: dot + 1, options: fruit };
    });
    render(<Editor completions={source} />);
    await user.click(input());
    await user.keyboard('fruit.');
    expect(source).toHaveBeenLastCalledWith({
      value: 'fruit.',
      caret: 6,
      query: 'fruit.',
      isExplicit: false,
    });
    expect(optionTexts()).toEqual(['apple', 'pick', 'basket']);
    await user.keyboard('a');
    expect(optionTexts()).toEqual(['apple']);
    await user.keyboard('{ArrowLeft}');
    expect(optionTexts()).toEqual([]);
    await user.keyboard('{Control>} {/Control}');
    expect(source).toHaveBeenLastCalledWith(expect.objectContaining({ isExplicit: true }));
    expect(optionTexts()).toEqual(['apple', 'pick', 'basket']);
  });

  it('UIC-CODE-EDITOR-4.6 replaces the range a source names and filters by the text typed in it', async () => {
    const user = userEvent.setup();
    const source: CodeCompletionSource = ({ value, caret }) => {
      const from = value.lastIndexOf('"', caret - 1);
      return from === -1
        ? []
        : { from, to: caret + 1, options: [{ label: '"apple"' }, { label: '"pear"' }] };
    };
    render(<Editor completions={source} initialValue={'""'} />);
    await user.click(input());
    await user.keyboard('{Home}{ArrowRight}p');
    expect(optionTexts()).toEqual(['"pear"', '"apple"']);
    await user.keyboard('{Enter}');
    expect(marked()).toBe('"pear"|');
  });

  it('UIC-CODE-EDITOR-4.6 shows only the latest answer of a source that answers later', async () => {
    const user = userEvent.setup();
    const answers: Array<(options: CodeCompletion[]) => void> = [];
    const source: CodeCompletionSource = () =>
      new Promise<CodeCompletion[]>((resolve) => answers.push(resolve));
    render(<Editor completions={source} />);
    await user.click(input());
    // The click, then each typed character, asks the source.
    await user.keyboard('ap');
    expect(answers).toHaveLength(3);
    await act(async () => answers[2]?.([{ label: 'apricot' }]));
    expect(optionTexts()).toEqual(['apricot']);
    await act(async () => answers[1]?.([{ label: 'apple' }]));
    expect(optionTexts()).toEqual(['apricot']);
    await user.keyboard('{Escape}');
    await user.keyboard('{Control>} {/Control}');
    await user.keyboard('{Escape}');
    await act(async () => answers[3]?.([{ label: 'apple' }]));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('UIC-CODE-EDITOR-4.7 publishes the kind and shows the documentation of the active option', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<Editor completions={fruit} />);
    await user.click(input());
    await user.keyboard('{Control>} {/Control}');
    const [apple, pick] = screen.getAllByRole('option');
    expect(apple).toHaveAttribute('data-kind', 'variable');
    const documentation = baseElement.querySelector('.ui-code-editor__completion-documentation');
    expect(documentation).toHaveTextContent('A crisp fruit that keeps for months.');
    expect(apple).toHaveAccessibleDescription('A crisp fruit that keeps for months.');
    expectHooksMatchSpec(baseElement, 'CODE-EDITOR', { slots: ['completion-documentation'] });
    await user.keyboard('{ArrowDown}');
    expect(pick).toHaveAttribute('data-kind', 'function');
    expect(pick).not.toHaveAttribute('aria-describedby');
    expect(baseElement.querySelector('.ui-code-editor__completion-documentation')).toBeNull();
  });

  it('UIC-CODE-EDITOR-4.8 inserts a snippet, selects its first field and steps through the fields', async () => {
    const user = userEvent.setup();
    render(<Editor completions={fruit} initialValue="let a = " />);
    await user.click(input());
    await user.keyboard('{End}pi{Enter}');
    expect(marked()).toBe('let a = pick([fruit], count)');
    await user.keyboard('pear');
    await user.keyboard('{Tab}');
    expect(marked()).toBe('let a = pick(pear, [count])');
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(marked()).toBe('let a = pick([pear], count)');
    await user.keyboard('{Tab}2{Tab}');
    expect(marked()).toBe('let a = pick(pear, 2)|');
  });

  it('UIC-CODE-EDITOR-4.8 indents a multiline snippet like its line and ends stepping outside it', async () => {
    const user = userEvent.setup();
    render(<Editor completions={fruit} initialValue="  " />);
    await user.click(input());
    await user.keyboard('{End}bas{Enter}');
    expect(marked()).toBe('  basket {\n    |\n  }');
    act(() => input().setSelectionRange(0, 0));
    await user.keyboard('{Tab}');
    expect(input()).not.toHaveFocus();
  });
});
