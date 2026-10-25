import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CodeEditor, type CodeEditorSurfaceProps } from './code-editor.js';

function Editor({
  initialValue = 'pear apple Pear\npear',
  ...props
}: Omit<CodeEditorSurfaceProps, 'value' | 'variant'> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <CodeEditor
      variant="surface"
      aria-label="Source"
      allowsSearch
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}

function input() {
  return screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Source' });
}

function matches(container: HTMLElement) {
  return [...container.querySelectorAll('.ui-code-editor__match')].map((element) =>
    element.hasAttribute('data-current') ? `[${element.textContent}]` : element.textContent,
  );
}

describe('CodeEditor find and replace', () => {
  it('UIC-CODE-EDITOR-7.3 replaces original source ranges after a character whose lowercase expands', async () => {
    const user = userEvent.setup();
    render(<Editor initialValue="İ apple APPLE" />);
    await user.click(input());
    await user.keyboard('{Control>}f{/Control}apple');
    await user.type(screen.getByRole('textbox', { name: 'Replace with' }), 'pear');
    await user.click(screen.getByRole('button', { name: 'Replace all' }));
    expect(input()).toHaveValue('İ pear pear');
  });

  it('UIC-CODE-EDITOR-7.1 opens the find row on Ctrl+F with the selected text and focus in the find box', async () => {
    const user = userEvent.setup();
    const { container } = render(<Editor />);
    await user.click(input());
    act(() => input().setSelectionRange(5, 10));
    await user.keyboard('{Control>}f{/Control}');
    const row = container.querySelector('.ui-code-editor__search');
    expect(row?.nextElementSibling).toHaveClass('ui-code-editor__surface');
    expect(row).toHaveClass('ui-find-bar');
    const find = screen.getByRole('searchbox', { name: 'Find' });
    expect(find.closest('.ui-find-bar__query')).not.toBeNull();
    expect(find).toHaveFocus();
    expect(find).toHaveValue('apple');
    expect(screen.getByRole('status')).toHaveTextContent('1 of 1');
    expect(screen.getByRole('button', { name: 'Previous match' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next match' })).toBeEnabled();
    expectHooksMatchSpec(container, 'CODE-EDITOR', {
      slots: ['search', 'match'],
    });
    expectHooksMatchSpec(container, 'FIND-BAR', {
      slots: ['query', 'status', 'previous', 'next', 'replacement', 'replace', 'replace-all'],
    });
    await user.clear(find);
    await user.type(find, 'plum');
    expect(screen.getByRole('status')).toHaveTextContent('No results');
    expect(screen.getByRole('button', { name: 'Next match' })).toBeDisabled();
  });

  it('UIC-CODE-EDITOR-7.1 leaves Ctrl+F to the browser without allowsSearch', async () => {
    const user = userEvent.setup();
    const { container } = render(<Editor allowsSearch={false} />);
    await user.click(input());
    await user.keyboard('{Control>}f{/Control}');
    expect(container.querySelector('.ui-code-editor__search')).toBeNull();
  });

  it('UIC-CODE-EDITOR-7.2 marks every match ignoring case and steps through them, wrapping', async () => {
    const user = userEvent.setup();
    const { container } = render(<Editor />);
    await user.click(input());
    act(() => input().setSelectionRange(6, 6));
    await user.keyboard('{Control>}f{/Control}');
    await user.keyboard('pear');
    expect(matches(container)).toEqual(['pear', '[Pear]', 'pear']);
    await user.keyboard('{Enter}');
    expect(matches(container)).toEqual(['pear', 'Pear', '[pear]']);
    await user.keyboard('{Enter}');
    expect(matches(container)).toEqual(['[pear]', 'Pear', 'pear']);
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(matches(container)).toEqual(['pear', 'Pear', '[pear]']);
    await user.click(screen.getByRole('button', { name: 'Previous match' }));
    expect(matches(container)).toEqual(['pear', '[Pear]', 'pear']);
    expect(screen.getByRole('status')).toHaveTextContent('2 of 3');
  });

  it('UIC-CODE-EDITOR-7.3 replaces the current match, then every match in one edit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Editor onChange={onChange} />);
    await user.click(input());
    await user.keyboard('{Control>}f{/Control}pear');
    await user.type(screen.getByRole('textbox', { name: 'Replace with' }), 'fig');
    await user.click(screen.getByRole('button', { name: 'Replace' }));
    expect(input()).toHaveValue('fig apple Pear\npear');
    expect(matches(container)).toEqual(['[Pear]', 'pear']);
    await user.keyboard('{Enter}');
    expect(input()).toHaveValue('fig apple fig\npear');
    onChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Replace all' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input()).toHaveValue('fig apple fig\nfig');
    expect(screen.getByRole('status')).toHaveTextContent('No results');
  });

  it('UIC-CODE-EDITOR-7.3 finds without replacing in a read-only editor', async () => {
    const user = userEvent.setup();
    render(<Editor isReadOnly />);
    await user.click(input());
    await user.keyboard('{Control>}f{/Control}');
    expect(screen.getByRole('searchbox', { name: 'Find' })).toHaveFocus();
    expect(screen.queryByRole('textbox', { name: 'Replace with' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Replace all' })).not.toBeInTheDocument();
  });

  it('UIC-CODE-EDITOR-7.4 closes on Escape or Close and selects the current match in the text area', async () => {
    const user = userEvent.setup();
    const { container } = render(<Editor />);
    await user.click(input());
    await user.keyboard('{Control>}f{/Control}apple{Escape}');
    expect(container.querySelector('.ui-code-editor__search')).toBeNull();
    expect(input()).toHaveFocus();
    expect([input().selectionStart, input().selectionEnd]).toEqual([5, 10]);
    expect(container.querySelector('.ui-code-editor__match')).toBeNull();
    await user.keyboard('{Control>}f{/Control}');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(container.querySelector('.ui-code-editor__search')).toBeNull();
    expect(input()).toHaveFocus();
  });
});
