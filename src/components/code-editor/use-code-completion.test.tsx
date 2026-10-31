import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Completion, CompletionSource } from '../completion-list/completion-list.js';
import { CodeEditor, type CodeEditorSurfaceProps } from './code-editor.js';

function Editor({
  initialValue = '',
  ...props
}: Omit<CodeEditorSurfaceProps, 'value' | 'variant'> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <CodeEditor
      variant="surface"
      aria-label="Source"
      {...props}
      value={value}
      onChange={setValue}
    />
  );
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

const fruit: Completion[] = [
  { label: 'apple', kind: 'variable', documentation: 'A crisp fruit that keeps for months.' },
  { label: 'pick', kind: 'function', insertText: 'pick(${fruit}, ${count})' },
  { label: 'basket', kind: 'keyword', insertText: 'basket {\n  ${}\n}' },
];

describe('CodeEditor completion sources', () => {
  it('UIC-CODE-EDITOR-4.4 inserts a label containing snippet syntax literally', async () => {
    const user = userEvent.setup();
    render(<Editor completions={[{ label: '${literal}' }]} />);
    await user.click(input());
    await user.keyboard('{Control>} {/Control}{Enter}');
    expect(marked()).toBe('${literal}|');
  });

  it('UIC-CODE-EDITOR-4.2 opens every completion on Ctrl+Space, even without a word', async () => {
    const user = userEvent.setup();
    render(<Editor completions={fruit} />);
    await user.click(input());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('{Control>} {/Control}');
    await waitFor(() => expect(optionTexts()).toEqual(['apple', 'pick', 'basket']));
    expect(input()).toHaveValue('');
  });

  it('UIC-CODE-EDITOR-4.6 asks a source on each edit and shows its answer for the typed text', async () => {
    const user = userEvent.setup();
    const source = vi.fn<CompletionSource>(({ value, caret }) => {
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
    await waitFor(() => expect(optionTexts()).toEqual(['apple', 'pick', 'basket']));
    await user.keyboard('a');
    expect(optionTexts()).toEqual(['apple']);
    await user.keyboard('{ArrowLeft}');
    expect(optionTexts()).toEqual([]);
    await user.keyboard('{Control>} {/Control}');
    expect(source).toHaveBeenLastCalledWith(expect.objectContaining({ isExplicit: true }));
    await waitFor(() => expect(optionTexts()).toEqual(['apple', 'pick', 'basket']));
  });

  it('UIC-CODE-EDITOR-4.6 replaces the range a source names and filters by the text typed in it', async () => {
    const user = userEvent.setup();
    const source: CompletionSource = ({ value, caret }) => {
      const from = value.lastIndexOf('"', caret - 1);
      return from === -1
        ? []
        : { from, to: caret + 1, options: [{ label: '"apple"' }, { label: '"pear"' }] };
    };
    render(<Editor completions={source} initialValue={'""'} />);
    await user.click(input());
    await user.keyboard('{Home}{ArrowRight}p');
    await waitFor(() => expect(optionTexts()).toEqual(['"pear"', '"apple"']));
    await user.keyboard('{Enter}');
    expect(marked()).toBe('"pear"|');
  });

  it('UIC-CODE-EDITOR-4.6 shows only the latest answer of a source that answers later', async () => {
    const user = userEvent.setup();
    const answers: Array<(options: Completion[]) => void> = [];
    const source: CompletionSource = () =>
      new Promise<Completion[]>((resolve) => answers.push(resolve));
    render(<Editor completions={source} />);
    await user.click(input());
    // The click, then each typed character, asks the source.
    await user.keyboard('ap');
    expect(answers).toHaveLength(3);
    await act(async () => answers[2]?.([{ label: 'apricot' }]));
    await waitFor(() => expect(optionTexts()).toEqual(['apricot']));
    await act(async () => answers[1]?.([{ label: 'apple' }]));
    await waitFor(() => expect(optionTexts()).toEqual(['apricot']));
    await user.keyboard('{Escape}');
    await user.keyboard('{Control>} {/Control}');
    await user.keyboard('{Escape}');
    await act(async () => answers[3]?.([{ label: 'apple' }]));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('UIC-CODE-EDITOR-4.7 publishes the kind and shows the documentation of the active option', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<Editor completions={fruit} />);
    await user.click(input());
    await user.keyboard('{Control>} {/Control}');
    const [apple, pick] = await screen.findAllByRole('option');
    expect(apple).toHaveAttribute('data-kind', 'variable');
    const documentation = baseElement.querySelector('.ui-completion-list__documentation');
    expect(documentation).toHaveTextContent('A crisp fruit that keeps for months.');
    expect(apple).toHaveAccessibleDescription('A crisp fruit that keeps for months.');
    expectHooksMatchSpec(baseElement, 'COMPLETION-LIST', { slots: ['documentation'] });
    await user.keyboard('{ArrowDown}');
    expect(pick).toHaveAttribute('data-kind', 'function');
    expect(pick).not.toHaveAttribute('aria-describedby');
    expect(baseElement.querySelector('.ui-completion-list__documentation')).toBeNull();
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

  it('UIC-CODE-EDITOR-4.8 UIC-CODE-EDITOR-6.2 leaves keys an input method owns to it', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<Editor completions={fruit} initialValue="let a = " onKeyDown={onKeyDown} />);
    await user.click(input());
    await user.keyboard('{End}pi');
    await screen.findByRole('option', { name: /pick/ });
    const composing = [
      { key: 'Enter', keyCode: 229 },
      { key: 'Tab', isComposing: true },
      { key: 'Escape', isComposing: true },
    ];
    for (const key of composing) {
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing or keyCode 229 on a keydown
      expect(fireEvent.keyDown(input(), key)).toBe(true);
    }
    expect(input()).toHaveValue('let a = pi');
    expect(screen.getByRole('option', { name: /pick/ })).toBeVisible();
    await user.keyboard('{Enter}');
    expect(marked()).toBe('let a = pick([fruit], count)');
    for (const key of composing.slice(0, 2)) {
      // eslint-disable-next-line testing-library/prefer-user-event -- as above
      expect(fireEvent.keyDown(input(), key)).toBe(true);
    }
    expect(marked()).toBe('let a = pick([fruit], count)');
    // The caller still sees the keys.
    expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }));
    await user.keyboard('{Tab}');
    expect(marked()).toBe('let a = pick(fruit, [count])');
    await user.keyboard('{End}');
    // eslint-disable-next-line testing-library/prefer-user-event -- as above
    expect(fireEvent.keyDown(input(), { key: 'Enter', keyCode: 229 })).toBe(true);
    expect(input()).toHaveValue('let a = pick(fruit, count)');
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

  it('UIC-CODE-EDITOR-4.8 ends stepping when the text is replaced, even by text of the same length', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const editor = (value: string) => (
      <CodeEditor
        variant="surface"
        aria-label="Source"
        completions={fruit}
        value={value}
        onChange={onChange}
      />
    );
    const { rerender } = render(editor(''));
    await user.click(input());
    rerender(editor('pi'));
    await user.keyboard('{End}{Control>} {/Control}');
    await waitFor(() => expect(screen.getByRole('option', { name: /pick/ })).toBeVisible());
    await user.keyboard('{Enter}');
    const inserted = onChange.mock.lastCall?.[0] as string;
    expect(inserted).toBe('pick(fruit, count)');
    rerender(editor(inserted));
    rerender(editor('a'.repeat(inserted.length)));
    act(() => input().setSelectionRange(6, 6));
    await user.keyboard('{Tab}');
    expect(input()).not.toHaveFocus();
  });

  it('UIC-CODE-EDITOR-4.8 ends stepping after an edit outside the field', async () => {
    const user = userEvent.setup();
    render(<Editor completions={fruit} />);
    await user.click(input());
    await user.keyboard('pi{Enter}');
    act(() => input().setSelectionRange(0, 0));
    await user.keyboard('x');
    act(() => input().setSelectionRange(7, 7));
    await user.keyboard('{Tab}');
    expect(input()).not.toHaveFocus();
  });

  it('UIC-CODE-EDITOR-4.8 ends stepping when the editor locks or after Escape', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Editor completions={fruit} />);
    await user.click(input());
    await user.keyboard('pi{Enter}');
    rerender(<Editor completions={fruit} isReadOnly />);
    await user.keyboard('{Tab}');
    expect(input()).not.toHaveFocus();
    rerender(<Editor completions={fruit} />);
    await user.click(input());
    await user.keyboard('{Control>}a{/Control}{Backspace}pi{Enter}{Escape}{Tab}');
    expect(input()).not.toHaveFocus();
  });

  it('UIC-CODE-EDITOR-4.8 ends stepping when the host rejects the insertion', async () => {
    const user = userEvent.setup();
    render(
      <CodeEditor
        variant="surface"
        aria-label="Source"
        completions={fruit}
        value="pi"
        onChange={() => undefined}
      />,
    );
    await user.click(input());
    await user.keyboard('{End}');
    await user.keyboard('{Control>} {/Control}');
    await waitFor(() => expect(screen.getByRole('option', { name: /pick/ })).toBeVisible());
    await user.keyboard('{Enter}');
    expect(input()).toHaveValue('pi');
    act(() => input().setSelectionRange(1, 1));
    await user.keyboard('{Tab}');
    expect(input()).not.toHaveFocus();
  });
});
