import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CodeEditor, type CodeEditorSurfaceProps } from './code-editor.js';

function Editor({
  initialValue = '',
  ...props
}: Omit<CodeEditorSurfaceProps, 'value' | 'variant'> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <CodeEditor
        variant="surface"
        aria-label="Source"
        {...props}
        value={value}
        onChange={(next) => {
          setValue(next);
          props.onChange?.(next);
        }}
      />
      <button type="button">After</button>
    </>
  );
}

function input() {
  return screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Source' });
}

/** The text area's text with `|` at the caret, or `[` and `]` around the selection. */
function marked() {
  const { value, selectionStart: start, selectionEnd: end } = input();
  if (start === end) return `${value.slice(0, start)}|${value.slice(start)}`;
  return `${value.slice(0, start)}[${value.slice(start, end)}]${value.slice(end)}`;
}

describe('CodeEditor editing keys', () => {
  it('UIC-CODE-EDITOR-6.1 reports its own edits through onChange and restores their selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Editor initialValue="let a" onChange={onChange} autoCloseBrackets />);
    await user.click(input());
    await user.keyboard('{End}(');
    expect(onChange).toHaveBeenLastCalledWith('let a()');
    expect(marked()).toBe('let a(|)');
  });

  it('UIC-CODE-EDITOR-6.2 keeps the indentation on Enter and opens a block between brackets', async () => {
    const user = userEvent.setup();
    render(<Editor initialValue={'  if (x) {}'} />);
    await user.click(input());
    await user.keyboard('{End}{ArrowLeft}{Enter}');
    expect(marked()).toBe('  if (x) {\n    |\n  }');
    await user.keyboard('a{Enter}');
    expect(marked()).toBe('  if (x) {\n    a\n    |\n  }');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(input().value).toBe('  if (x) {\n    a\n    \n  }');
  });

  it('UIC-CODE-EDITOR-6.3 indents with Tab, outdents with Shift+Tab and leaves after Escape', async () => {
    const user = userEvent.setup();
    render(<Editor initialValue={'one\ntwo'} indentWithTab indent={4} />);
    await user.click(input());
    await user.keyboard('{Control>}a{/Control}{Tab}');
    expect(marked()).toBe('[    one\n    two]');
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(marked()).toBe('[one\ntwo]');
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(input()).toHaveFocus();
    await user.keyboard('{ArrowRight}{Tab}');
    expect(marked()).toBe('one\ntwo |');
    await user.keyboard('{Escape}{Tab}');
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('UIC-CODE-EDITOR-6.3 leaves backwards with Shift+Tab right after Escape', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Editor initialValue="  one" indentWithTab />
      </>,
    );
    await user.click(input());
    await user.keyboard('{Escape}{Shift>}{Tab}{/Shift}');
    expect(input().value).toBe('  one');
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
  });

  it('UIC-CODE-EDITOR-6.3 leaves Tab to the browser without indentWithTab', async () => {
    const user = userEvent.setup();
    render(<Editor initialValue="one" />);
    await user.click(input());
    await user.keyboard('{Tab}');
    expect(input().value).toBe('one');
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('UIC-CODE-EDITOR-6.4 pairs brackets and quotes, steps over inserted closers and deletes empty pairs', async () => {
    const user = userEvent.setup();
    render(<Editor autoCloseBrackets />);
    await user.click(input());
    await user.keyboard('call(');
    expect(marked()).toBe('call(|)');
    await user.keyboard('"');
    expect(marked()).toBe('call("|")');
    await user.keyboard('a"');
    expect(marked()).toBe('call("a"|)');
    await user.keyboard(')');
    expect(marked()).toBe('call("a")|');
    await user.keyboard(')');
    expect(marked()).toBe('call("a"))|');
    await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}[[');
    expect(marked()).toBe('call([|]');
    await user.keyboard('{Backspace}');
    expect(marked()).toBe('call(|');
  });

  it('UIC-CODE-EDITOR-6.4 wraps a selection and types plainly without autoCloseBrackets', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Editor initialValue="pear" autoCloseBrackets />);
    await user.click(input());
    await user.keyboard('{Control>}a{/Control}[[');
    expect(marked()).toBe('[[pear]]');
    unmount();
    render(<Editor />);
    await user.click(input());
    await user.keyboard('(');
    expect(marked()).toBe('(|');
  });

  it('UIC-CODE-EDITOR-6.1 makes no edits in a read-only editor', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Editor initialValue="a" isReadOnly indentWithTab autoCloseBrackets onChange={onChange} />,
    );
    await user.click(input());
    await user.keyboard('{End}({Enter}');
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Tab}');
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('UIC-CODE-EDITOR-6.5 marks the bracket at the caret and its partner while focused', async () => {
    const user = userEvent.setup();
    const { container } = render(<Editor initialValue="f(a, [b])" />);
    const brackets = () =>
      [...container.querySelectorAll('.ui-code-editor__bracket')].map((element) => [
        element.textContent,
        element.getAttribute('data-unmatched'),
      ]);
    await user.click(input());
    await user.keyboard('{Home}{ArrowRight}{ArrowRight}');
    expect(brackets()).toEqual([
      ['(', null],
      [')', null],
    ]);
    expectHooksMatchSpec(container, 'CODE-EDITOR', { slots: ['bracket'] });
    await user.keyboard('{ArrowRight}');
    expect(brackets()).toEqual([]);
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(brackets()).toEqual([
      ['[', null],
      [']', null],
    ]);
    await user.tab();
    expect(brackets()).toEqual([]);
  });

  it('UIC-CODE-EDITOR-6.5 marks a bracket without a partner as unmatched', async () => {
    const user = userEvent.setup();
    const { container } = render(<Editor initialValue="(fig" />);
    await user.click(input());
    await user.keyboard('{Home}{ArrowRight}');
    const bracket = container.querySelector('.ui-code-editor__bracket');
    expect(bracket).toHaveTextContent('(');
    expect(bracket).toHaveAttribute('data-unmatched', 'true');
    expectHooksMatchSpec(container, 'CODE-EDITOR');
  });
});
