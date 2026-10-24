import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CodeEditor, type CodeDiagnostic, type CodeEditorProps } from './code-editor.js';

const CHARACTER = { width: 10, height: 20 };

/**
 * Lays the highlighted copy out on a grid of 10 by 20 pixel characters, the layout a browser
 * gives a monospace font, so the editor can find the character under the pointer.
 */
function layOutCopy(this: Range): DOMRect {
  const highlight = (this.startContainer.parentElement ?? null)?.closest(
    '.ui-code-editor__highlight',
  );
  if (!highlight) return new DOMRect();
  const walker = document.createTreeWalker(highlight, NodeFilter.SHOW_TEXT);
  let offset = 0;
  for (
    let node = walker.nextNode();
    node && node !== this.startContainer;
    node = walker.nextNode()
  ) {
    offset += (node as Text).data.length;
  }
  const before = (highlight.textContent ?? '').slice(0, offset + this.startOffset).split('\n');
  const left = (before.at(-1)?.length ?? 0) * CHARACTER.width;
  const top = (before.length - 1) * CHARACTER.height;
  return new DOMRect(left, top, CHARACTER.width, CHARACTER.height);
}

function Editor({
  initialValue = 'let total = basket\nreturn totl',
  ...props
}: Omit<CodeEditorProps, 'value'> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return <CodeEditor aria-label="Source" {...props} value={value} onChange={setValue} />;
}

const problems: CodeDiagnostic[] = [
  { message: 'Unknown name "totl".', line: 2, column: 8 },
  { message: 'Shadowed name.', line: 1, column: 5, endColumn: 10, severity: 'warning' },
];

function input() {
  return screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Source' });
}

function tooltip() {
  return document.querySelector<HTMLElement>('.ui-code-editor__tooltip');
}

describe('CodeEditor problems and hover tips', () => {
  beforeEach(() => {
    Range.prototype.getBoundingClientRect = layOutCopy;
  });
  afterEach(() => {
    delete (Range.prototype as Partial<Range>).getBoundingClientRect;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('UIC-CODE-EDITOR-3.4 underlines the source each diagnostic points at', () => {
    const { container } = render(<Editor diagnostics={problems} />);
    const marks = [...container.querySelectorAll('.ui-code-editor__mark')];
    expect(marks.map((mark) => [mark.textContent, mark.getAttribute('data-severity')])).toEqual([
      ['total', 'warning'],
      ['totl', 'error'],
    ]);
    expect(container.querySelector('.ui-code-editor__highlight')?.textContent).toBe(
      'let total = basket\nreturn totl\n',
    );
    expectHooksMatchSpec(container, 'CODE-EDITOR', { slots: ['mark', 'announcement'] });
  });

  it('UIC-CODE-EDITOR-3.5 moves to the next and previous problem with F8 and reads it out', async () => {
    const user = userEvent.setup();
    const { container } = render(<Editor diagnostics={problems} />);
    await user.click(input());
    act(() => input().setSelectionRange(0, 0));
    const announcement = container.querySelector('.ui-code-editor__announcement');
    expect(announcement).toHaveAttribute('role', 'status');
    await user.keyboard('{F8}');
    expect([input().selectionStart, input().selectionEnd]).toEqual([4, 9]);
    expect(announcement).toHaveTextContent('Shadowed name.');
    expect(tooltip()).toHaveTextContent('Shadowed name.');
    await user.keyboard('{F8}');
    expect([input().selectionStart, input().selectionEnd]).toEqual([26, 30]);
    expect(announcement).toHaveTextContent('Unknown name "totl".');
    await user.keyboard('{F8}');
    expect(input().selectionStart).toBe(4);
    await user.keyboard('{Shift>}{F8}{/Shift}');
    expect(input().selectionStart).toBe(26);
    await user.keyboard('{Escape}');
    expect(tooltip()).toBeNull();
  });

  it('UIC-CODE-EDITOR-3.5 does nothing on F8 without a marked problem', async () => {
    const user = userEvent.setup();
    const { container } = render(<Editor diagnostics={[{ message: 'Odd.' }]} />);
    await user.click(input());
    act(() => input().setSelectionRange(2, 2));
    await user.keyboard('{F8}');
    expect(input().selectionStart).toBe(2);
    expect(container.querySelector('.ui-code-editor__announcement')).toBeEmptyDOMElement();
  });

  it('UIC-CODE-EDITOR-3.6 shows the problems and the hover information under the pointer', async () => {
    // The leave delay is checked to the millisecond, so the clock moves only when the test moves
    // it; Testing Library settles each user-event call on a zero timer it advances through `jest`.
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const renderHover = (offset: number) => (offset === 12 ? 'basket: the chosen basket' : null);
    const { baseElement } = render(<Editor diagnostics={problems} renderHover={renderHover} />);
    await user.pointer({ target: input(), coords: { clientX: 75, clientY: 25 } });
    const tip = tooltip();
    expect(tip).not.toBeNull();
    expect(tip?.style.zIndex).toBe('150');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Unknown name "totl".');
    expect(tip?.querySelector('.ui-code-editor__diagnostic')).toHaveAttribute(
      'data-severity',
      'error',
    );
    expectHooksMatchSpec(baseElement, 'CODE-EDITOR', { slots: ['tooltip', 'diagnostic'] });
    await user.pointer({ target: input(), coords: { clientX: 125, clientY: 5 } });
    expect(screen.getByRole('tooltip')).toHaveTextContent('basket: the chosen basket');
    await user.pointer({ target: input(), coords: { clientX: 25, clientY: 5 } });
    act(() => vi.advanceTimersByTime(100));
    expect(tooltip()).not.toBeNull();
    await user.hover(tooltip() as HTMLElement);
    act(() => vi.advanceTimersByTime(300));
    expect(tooltip()).not.toBeNull();
    await user.unhover(tooltip() as HTMLElement);
    act(() => vi.advanceTimersByTime(300));
    expect(tooltip()).toBeNull();
  });

  it('UIC-CODE-EDITOR-3.6 reads the copy once while the pointer moves over an unchanged source', async () => {
    const user = userEvent.setup();
    const source = Array.from({ length: 40 }, (_, line) => `let row${line} = ${line}`).join('\n');
    const tokenize = (text: string) =>
      text.split(/(\s+)/).map((part) => ({ text: part, type: /\w/.test(part) ? 'name' : null }));
    const { container } = render(<Editor initialValue={source} tokenize={tokenize} />);
    const highlight = container.querySelector('.ui-code-editor__highlight') as HTMLElement;
    // Lay the copy out from offsets read before the pointer moves, so only the editor walks it.
    const starts = new Map<Node, number>();
    const walker = document.createTreeWalker(highlight, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(), at = 0; node; node = walker.nextNode()) {
      starts.set(node, at);
      at += (node as Text).data.length;
    }
    const text = highlight.textContent ?? '';
    Range.prototype.getBoundingClientRect = function (this: Range) {
      const before = text.slice(0, (starts.get(this.startContainer) ?? 0) + this.startOffset);
      const lines = before.split('\n');
      const left = (lines.at(-1)?.length ?? 0) * CHARACTER.width;
      return new DOMRect(left, (lines.length - 1) * CHARACTER.height, CHARACTER.width, 20);
    };
    const walks = vi.spyOn(document, 'createTreeWalker');
    for (let step = 0; step < 8; step += 1) {
      await user.pointer({ target: input(), coords: { clientX: 5 + step * 10, clientY: 205 } });
    }
    expect(walks.mock.calls.filter(([root]) => root === highlight)).toHaveLength(1);
  });

  it('UIC-CODE-EDITOR-3.6 closes the tip on an edit', async () => {
    const user = userEvent.setup();
    render(<Editor diagnostics={problems} />);
    await user.click(input());
    await user.pointer({ target: input(), coords: { clientX: 75, clientY: 25 } });
    expect(tooltip()).not.toBeNull();
    await user.keyboard('x');
    expect(tooltip()).toBeNull();
  });
});
