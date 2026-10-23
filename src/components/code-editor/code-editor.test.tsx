import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { matchCompletions, type Completion } from '../completion-list/completion-list.js';
import { findCompletionQuery } from './completion-match.js';
import { CodeEditor, type CodeEditorProps, type CodeToken } from './code-editor.js';

const words = /(\s+|[a-z]+|\d+|.)/g;

/** A small sample language: words are keywords, digits are numbers, the rest is plain. */
function tokenize(source: string): CodeToken[] {
  return (source.match(words) ?? []).map((text) => ({
    text,
    type: /^[a-z]+$/.test(text) ? 'keyword' : /^\d+$/.test(text) ? 'number' : null,
  }));
}

const vocabulary: Completion[] = [
  { label: 'fruit.apple', description: 'A crisp fruit' },
  { label: 'fruit.apricot' },
  { label: 'fruit.banana' },
  { label: 'city' },
];

function Editor({
  initialValue = '',
  ...props
}: Omit<CodeEditorProps, 'value'> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <CodeEditor
      aria-label="Source"
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-code-editor');
}

function highlight(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-code-editor__highlight');
}

describe('CodeEditor', () => {
  it('UIC-CODE-EDITOR-1.1 edits the source in a text area over a hidden highlighted copy', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Editor initialValue="let" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Source' });
    expect(input.tagName).toBe('TEXTAREA');
    expect(input).toHaveClass('ui-code-editor__input');
    expect(input).toHaveAttribute('spellcheck', 'false');
    await user.type(input, ' x');
    expect(input).toHaveValue('let x');
    expect(onChange).toHaveBeenLastCalledWith('let x');
    expect(highlight(container)).toHaveAttribute('aria-hidden', 'true');
    expect(highlight(container)?.textContent).toBe('let x\n');
    expectHooksMatchSpec(container, 'CODE-EDITOR', {
      slots: ['surface', 'code', 'highlight', 'input'],
    });
  });

  it('UIC-CODE-EDITOR-1.2 draws each typed token in a token slot and plain runs as text', () => {
    const { container, rerender } = render(
      <CodeEditor aria-label="Source" value={'let a = 12\n'} tokenize={tokenize} />,
    );
    const tokens = [...container.querySelectorAll('.ui-code-editor__token')];
    expect(tokens.map((token) => [token.textContent, token.getAttribute('data-token')])).toEqual([
      ['let', 'keyword'],
      ['a', 'keyword'],
      ['12', 'number'],
    ]);
    expect(highlight(container)?.textContent).toBe('let a = 12\n\n');
    expectHooksMatchSpec(container, 'CODE-EDITOR', { slots: ['token'] });
    rerender(<CodeEditor aria-label="Source" value="let a" />);
    expect(container.querySelector('.ui-code-editor__token')).toBeNull();
    expect(highlight(container)?.textContent).toBe('let a\n');
  });

  it('UIC-CODE-EDITOR-1.3 keeps the highlighted copy and the gutter at the input scroll offset', () => {
    const { container } = render(<CodeEditor aria-label="Source" value={'a\nb\nc'} lineNumbers />);
    const input = screen.getByRole('textbox');
    input.scrollTop = 40;
    input.scrollLeft = 12;
    fireEvent.scroll(input);
    expect(highlight(container)?.scrollTop).toBe(40);
    expect(highlight(container)?.scrollLeft).toBe(12);
    expect(container.querySelector('.ui-code-editor__gutter')?.scrollTop).toBe(40);
  });

  it('UIC-CODE-EDITOR-1.4 publishes the size and wraps long lines unless wrapping is off', () => {
    const { container, rerender } = render(<CodeEditor aria-label="Source" value="" />);
    expect(root(container)).toHaveAttribute('data-size', 'md');
    expect(root(container)).toHaveAttribute('data-wrap', 'soft');
    expect(screen.getByRole('textbox')).toHaveAttribute('wrap', 'soft');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<CodeEditor aria-label="Source" value="" size={size} wrap="off" />);
      expect(root(container)).toHaveAttribute('data-size', size);
      expect(root(container)).toHaveAttribute('data-wrap', 'off');
      expect(screen.getByRole('textbox')).toHaveAttribute('wrap', 'off');
      expectHooksMatchSpec(container, 'CODE-EDITOR');
    }
  });

  it('UIC-CODE-EDITOR-1.5 shows the toolbar row above the source', () => {
    const { container } = render(
      <CodeEditor aria-label="Source" value="" toolbar={<button type="button">Run</button>} />,
    );
    const toolbar = container.querySelector('.ui-code-editor__toolbar');
    expect(toolbar).toContainElement(screen.getByRole('button', { name: 'Run' }));
    expect(toolbar?.nextElementSibling).toHaveClass('ui-code-editor__surface');
    expectHooksMatchSpec(container, 'CODE-EDITOR', { slots: ['toolbar'] });
  });

  it('UIC-CODE-EDITOR-1.1 hands its text area props and handlers to the text area', async () => {
    const user = userEvent.setup();
    const events: string[] = [];
    render(
      <>
        <p id="source-error">Fix the source.</p>
        <Editor
          placeholder="Write a query"
          aria-errormessage="source-error"
          isRequired
          onFocus={() => events.push('focus')}
          onBlur={() => events.push('blur')}
          onKeyDown={(event) => events.push(`down:${event.key}`)}
          onKeyUp={(event) => events.push(`up:${event.key}`)}
        />
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Source' });
    expect(input).toHaveAttribute('placeholder', 'Write a query');
    expect(input).toHaveAttribute('aria-errormessage', 'source-error');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('spellcheck', 'false');
    await user.click(input);
    await user.keyboard('x');
    await user.tab();
    expect(events).toEqual(['focus', 'down:x', 'up:x', 'down:Tab', 'blur']);
  });

  it('UIC-CODE-EDITOR-1.1 submits the source with its form under its name', async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="Query">
        <Editor name="source" initialValue="select 1" />
      </form>,
    );
    await user.type(screen.getByRole('textbox', { name: 'Source' }), ' + 2');
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Query' });
    expect(new FormData(form).get('source')).toBe('select 1 + 2');
  });

  it('UIC-CODE-EDITOR-1.6 locks a read-only or disabled editor and offers no completions', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <Editor initialValue="fruit." completions={vocabulary} isReadOnly />,
    );
    expect(root(container)).toHaveAttribute('data-readonly', 'true');
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
    await user.click(input);
    await user.keyboard('{End}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    rerender(<Editor initialValue="fruit." completions={vocabulary} isDisabled />);
    expect(root(container)).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('textbox')).toBeDisabled();
    expectHooksMatchSpec(container, 'CODE-EDITOR');
  });

  it('UIC-CODE-EDITOR-2.1 numbers each source line in a hidden gutter', () => {
    const { container } = render(
      <CodeEditor aria-label="Source" value={'one\n\nthree'} lineNumbers />,
    );
    expect(root(container)).toHaveAttribute('data-numbered', 'true');
    const gutter = container.querySelector('.ui-code-editor__gutter');
    expect(gutter).toHaveAttribute('aria-hidden', 'true');
    const lines = [...container.querySelectorAll('.ui-code-editor__line')];
    expect(
      lines.map((line) => line.querySelector('.ui-code-editor__line-number')?.textContent),
    ).toEqual(['1', '2', '3']);
    expect(
      lines.map((line) => line.querySelector('.ui-code-editor__line-text')?.textContent),
    ).toEqual(['one', '​', 'three']);
    expectHooksMatchSpec(container, 'CODE-EDITOR', {
      slots: ['gutter', 'line', 'line-number', 'line-text'],
    });
  });

  it('UIC-CODE-EDITOR-2.3 numbers an excerpt from its first line, and diagnostics follow it', () => {
    const { container } = render(
      <CodeEditor
        aria-label="Source"
        value={'one\ntwo\nthree'}
        lineNumbers
        firstLineNumber={120}
        diagnostics={[
          { message: 'Odd.', line: 121, column: 1, severity: 'warning' },
          { message: 'Bad.', line: 122, column: 1, endLine: 122, endColumn: 3 },
          { message: 'Elsewhere.', line: 4 },
        ]}
      />,
    );
    const lines = [...container.querySelectorAll('.ui-code-editor__line')];
    expect(
      lines.map((line) => line.querySelector('.ui-code-editor__line-number')?.textContent),
    ).toEqual(['120', '121', '122']);
    expect(lines.map((line) => line.getAttribute('data-severity'))).toEqual([
      null,
      'warning',
      'error',
    ]);
    const marks = [...container.querySelectorAll('.ui-code-editor__mark')];
    expect(marks.map((mark) => mark.textContent)).toEqual(['two', 'th']);
    const listed = [...container.querySelectorAll('.ui-code-editor__diagnostics li')];
    expect(listed.map((item) => item.textContent)).toEqual([
      '121:1 Odd.',
      '122:1 Bad.',
      '4 Elsewhere.',
    ]);
    expectHooksMatchSpec(container, 'CODE-EDITOR', { slots: ['line-number', 'mark'] });
  });

  it("UIC-CODE-EDITOR-2.2 gives the gutter the input's text width so wrapped lines keep one number", () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(320);
    class ReportingObserver {
      constructor(readonly callback: ResizeObserverCallback) {}
      observe(element: Element) {
        const entry = { target: element, contentRect: { width: 320, height: 80 } };
        this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
      }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ReportingObserver);
    const { container } = render(<CodeEditor aria-label="Source" value="a" lineNumbers />);
    const gutter = container.querySelector<HTMLElement>('.ui-code-editor__gutter');
    expect(gutter?.style.getPropertyValue('--ui-code-editor-text-width')).toBe('320px');
    expectHooksMatchSpec(container, 'CODE-EDITOR');
    vi.unstubAllGlobals();
  });

  it('UIC-CODE-EDITOR-3.1 lists diagnostics with their place and describes the input with them', () => {
    const { container } = render(
      <CodeEditor
        aria-label="Source"
        aria-describedby="hint"
        value="x"
        diagnostics={[
          { message: 'Unknown name.', line: 2, column: 5 },
          { message: 'Unused value.', line: 3, severity: 'warning' },
          { message: 'Something is off.' },
        ]}
      />,
    );
    const list = container.querySelector('.ui-code-editor__diagnostics');
    expect(list).toHaveAttribute('aria-live', 'polite');
    const items = [...container.querySelectorAll('.ui-code-editor__diagnostic')];
    expect(items.map((item) => item.textContent)).toEqual([
      '2:5 Unknown name.',
      '3 Unused value.',
      'Something is off.',
    ]);
    expect(items.map((item) => item.getAttribute('data-severity'))).toEqual([
      'error',
      'warning',
      'error',
    ]);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', `hint ${list?.id}`);
    expectHooksMatchSpec(container, 'CODE-EDITOR', { slots: ['diagnostics', 'diagnostic'] });
  });

  it('UIC-CODE-EDITOR-3.1 keeps an empty diagnostics list out of the description', () => {
    const { container } = render(<CodeEditor aria-label="Source" value="x" diagnostics={[]} />);
    expect(container.querySelector('.ui-code-editor__diagnostics')).toBeEmptyDOMElement();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });

  it('UIC-CODE-EDITOR-3.1 leaves the list out with listDiagnostics false and keeps the marks', () => {
    const { container } = render(
      <CodeEditor
        aria-label="Source"
        value="x = y"
        lineNumbers
        listDiagnostics={false}
        diagnostics={[{ message: 'Unknown name.', line: 1, column: 5 }]}
      />,
    );
    expect(container.querySelector('.ui-code-editor__diagnostics')).toBeNull();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    expect(container.querySelector('.ui-code-editor__mark')).toHaveTextContent('y');
    expect(container.querySelector('.ui-code-editor__line')).toHaveAttribute(
      'data-severity',
      'error',
    );
    expect(container.querySelector('.ui-code-editor__announcement')).not.toBeNull();
  });

  it('UIC-CODE-EDITOR-3.2 is invalid while an error is reported, by a diagnostic or the caller', () => {
    const { container, rerender } = render(
      <CodeEditor aria-label="Source" value="x" diagnostics={[{ message: 'Bad.' }]} />,
    );
    expect(root(container)).toHaveAttribute('data-invalid', 'true');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    rerender(
      <CodeEditor
        aria-label="Source"
        value="x"
        diagnostics={[{ message: 'Odd.', severity: 'warning' }]}
      />,
    );
    expect(root(container)).not.toHaveAttribute('data-invalid');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    rerender(<CodeEditor aria-label="Source" value="x" isInvalid />);
    expect(root(container)).toHaveAttribute('data-invalid', 'true');
    expectHooksMatchSpec(container, 'CODE-EDITOR');
  });

  it('UIC-CODE-EDITOR-3.3 marks the worst severity of each line in the gutter', () => {
    const { container } = render(
      <CodeEditor
        aria-label="Source"
        value={'a\nb\nc'}
        lineNumbers
        diagnostics={[
          { message: 'Odd.', line: 1, severity: 'warning' },
          { message: 'Bad.', line: 1 },
          { message: 'Odd.', line: 2, severity: 'warning' },
          { message: 'Bad.', line: 3 },
          { message: 'Odd.', line: 3, severity: 'warning' },
        ]}
      />,
    );
    const lines = [...container.querySelectorAll('.ui-code-editor__line')];
    expect(lines.map((line) => line.getAttribute('data-severity'))).toEqual([
      'error',
      'warning',
      'error',
    ]);
    expectHooksMatchSpec(container, 'CODE-EDITOR');
  });

  it('UIC-CODE-EDITOR-4.1 completes the word before the caret with the labels that extend it', () => {
    expect(findCompletionQuery('let x = fruit.ap', 16)).toBe('fruit.ap');
    expect(findCompletionQuery('let x = fruit.ap', 9)).toBe('f');
    expect(findCompletionQuery('call(', 5)).toBe('');
    expect(findCompletionQuery('$el', 3)).toBe('$el');
    expect(matchCompletions(vocabulary, 'FRUIT.AP').map(({ label }) => label)).toEqual([
      'fruit.apple',
      'fruit.apricot',
    ]);
    expect(matchCompletions(vocabulary, 'city')).toEqual([]);
    expect(matchCompletions(vocabulary, 'frba').map(({ label }) => label)).toEqual([
      'fruit.banana',
    ]);
  });

  it('UIC-CODE-EDITOR-4.2 opens the completion list as the reader types and ties it to the input', async () => {
    const user = userEvent.setup();
    render(<Editor completions={vocabulary} />);
    const input = screen.getByRole('textbox', { name: 'Source' });
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    expect(input).not.toHaveAttribute('role');
    expect(input).not.toHaveAttribute('aria-controls');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    await user.type(input, 'fruit.a');
    const list = await screen.findByRole('listbox', { name: 'Suggestions' });
    expect(input).toHaveAttribute('aria-controls', list.id);
    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'fruit.appleA crisp fruit',
      'fruit.apricot',
      'fruit.banana',
    ]);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[0]).toHaveAttribute('data-focused', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]?.id);
    expect(input).toHaveFocus();
    expectHooksMatchSpec(document.body, 'CODE-EDITOR', {
      slots: ['caret', 'popover'],
    });
    expectHooksMatchSpec(document.body, 'COMPLETION-LIST', {
      slots: ['listbox', 'option', 'label', 'description'],
    });
  });

  it('UIC-CODE-EDITOR-4.3 moves through the list with the arrow keys and closes it with Escape', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<Editor completions={vocabulary} onKeyDown={onKeyDown} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'fruit.');
    await screen.findByRole('listbox');
    onKeyDown.mockClear();
    const active = () => screen.getByRole('option', { selected: true }).textContent;
    expect(active()).toContain('fruit.apple');
    await user.keyboard('{ArrowDown}');
    expect(active()).toBe('fruit.apricot');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(active()).toContain('fruit.apple');
    await user.keyboard('{ArrowUp}');
    expect(active()).toBe('fruit.banana');
    expect(onKeyDown).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('fruit.');
    await user.keyboard('b');
    expect((await screen.findAllByRole('option')).map((option) => option.textContent)).toEqual([
      'fruit.banana',
    ]);
  });

  it('UIC-CODE-EDITOR-4.3 activates an option under the pointer and inserts it on press without moving focus', async () => {
    const user = userEvent.setup();
    render(<Editor completions={vocabulary} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'fruit.');
    const banana = await screen.findByRole('option', { name: 'fruit.banana' });
    await user.hover(banana);
    expect(banana).toHaveAttribute('aria-selected', 'true');
    await user.click(banana);
    expect(input).toHaveValue('fruit.banana');
    expect(input).toHaveFocus();
  });

  it('UIC-CODE-EDITOR-4.4 replaces the word with the completion and leaves the caret after it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Editor initialValue=" + 1" completions={vocabulary} onChange={onChange} />);
    const input = screen.getByRole<HTMLTextAreaElement>('textbox');
    await user.click(input);
    await user.keyboard('{Home}fruit.apr');
    await user.keyboard('{Enter}');
    expect(input).toHaveValue('fruit.apricot + 1');
    expect(onChange).toHaveBeenLastCalledWith('fruit.apricot + 1');
    expect(input.selectionStart).toBe('fruit.apricot'.length);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('{End}{Enter}');
    expect(input).toHaveValue('fruit.apricot + 1\n');
    await user.type(input, 'ci');
    await user.keyboard('{Tab}');
    expect(input).toHaveValue('fruit.apricot + 1\ncity');
  });

  it('UIC-CODE-EDITOR-4.5 shows the list in a non-modal popover on the dropdown layer at the caret', async () => {
    const user = userEvent.setup();
    const { container } = render(<Editor completions={vocabulary} />);
    await user.type(screen.getByRole('textbox'), 'fruit.');
    await screen.findByRole('listbox');
    const popover = document.querySelector<HTMLElement>('.ui-code-editor__popover');
    expect(popover?.style.zIndex).toBe('130');
    expect(popover).not.toHaveAttribute('role', 'dialog');
    const caret = container.querySelector('.ui-code-editor__highlight .ui-code-editor__caret');
    expect(caret?.previousSibling?.textContent).toBe('fruit.');
    await user.tab();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(container.querySelector('.ui-code-editor__caret')).toBeNull();
  });

  it('UIC-CODE-EDITOR-5.1 puts the id and ref on the input and the class and data attributes on the root', () => {
    const ref = createRef<HTMLTextAreaElement>();
    const { container } = render(
      <CodeEditor
        aria-label="Source"
        value=""
        id="source"
        ref={ref}
        className="caller"
        data-testid="probe"
        data-size="xl"
      />,
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'source');
    expect(ref.current).toBe(input);
    expect(root(container)).toHaveClass('ui-code-editor', 'caller');
    expect(root(container)).toHaveAttribute('data-testid', 'probe');
    expect(root(container)).toHaveAttribute('data-size', 'md');
    expect(input).not.toHaveAttribute('data-testid');
    act(() => input.focus());
    expect(input).toHaveAttribute('data-focused', 'true');
    expectHooksMatchSpec(container, 'CODE-EDITOR', { callerAttributes: ['data-testid'] });
  });
});

describe('CodeEditor on one line', () => {
  it('UIC-CODE-EDITOR-1.7 leaves Enter to the caller and turns line breaks into spaces', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <Editor
        multiline={false}
        wrap="soft"
        initialValue="fruit"
        onChange={onChange}
        onKeyDown={onKeyDown}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Source' });
    expect(input).toHaveAttribute('aria-multiline', 'false');
    expect(input).toHaveAttribute('rows', '1');
    expect(input).toHaveAttribute('wrap', 'off');
    const root = input.closest('.ui-code-editor');
    expect(root).toHaveAttribute('data-single-line', 'true');
    expect(root).toHaveAttribute('data-wrap', 'off');
    await user.click(input);
    await user.keyboard('{End}{Enter}');
    expect(input).toHaveValue('fruit');
    expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }));
    await user.paste('\napple\r\npear');
    expect(onChange).toHaveBeenLastCalledWith('fruit apple pear');
    expectHooksMatchSpec(document.body, 'CODE-EDITOR');
  });

  it('UIC-CODE-EDITOR-1.7 breaks lines on Enter by default', async () => {
    const user = userEvent.setup();
    render(<Editor initialValue="fruit" />);
    const input = screen.getByRole('textbox', { name: 'Source' });
    expect(input).not.toHaveAttribute('aria-multiline');
    expect(input.closest('.ui-code-editor')).not.toHaveAttribute('data-single-line');
    await user.click(input);
    await user.keyboard('{End}{Enter}');
    expect(input).toHaveValue('fruit\n');
  });
});
