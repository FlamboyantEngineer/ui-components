import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import type { CodeToken } from '../code-editor/code-editor.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { CodeBlock } from './code-block.js';

const snippet = 'const total = items\n  .map((item) => item.price)\n  .reduce(add, 0);';

const tokenize = (source: string): CodeToken[] =>
  (source.match(/const|\d+|\s+|[A-Za-z]+|./g) ?? []).map((text) => ({
    text,
    type: text === 'const' ? 'keyword' : /^\d/.test(text) ? 'number' : null,
  }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CodeBlock', () => {
  it('UIC-CODE-BLOCK-1.1 UIC-CODE-BLOCK-1.2 heads the code with its language in a named group', () => {
    const { container } = render(<CodeBlock code={snippet} language="ts" />);
    const group = screen.getByRole('group', { name: 'ts' });
    expect(group).toHaveClass('ui-code-block');
    expect(group).toHaveAttribute('data-variant', 'code');
    expect(group).toHaveAttribute('data-language', 'ts');
    const pre = group.querySelector('pre.ui-code-block__code');
    expect(pre?.querySelector('code')?.textContent).toBe(snippet);
    expect(group.querySelector('.ui-code-block__header .ui-code-block__title')).toHaveTextContent(
      'ts',
    );
    expectHooksMatchSpec(container, 'CODE-BLOCK', {
      slots: ['header', 'title', 'actions', 'copy', 'code'],
    });
  });

  it('UIC-CODE-BLOCK-1.1 prefers the title and falls back on the variant name', () => {
    const { rerender } = render(<CodeBlock code="x" language="ts" title="totals.ts" />);
    expect(screen.getByRole('group', { name: 'totals.ts' })).toBeInTheDocument();
    rerender(<CodeBlock code="x" />);
    expect(screen.getByRole('group', { name: 'Code' })).not.toHaveAttribute('data-language');
    rerender(<CodeBlock code="x" variant="terminal" />);
    expect(screen.getByRole('group', { name: 'Terminal' })).toHaveAttribute(
      'data-variant',
      'terminal',
    );
  });

  it('UIC-CODE-BLOCK-1.2 renders its text through TextMatch', () => {
    const { container } = render(
      <TextMatchProvider query="price">
        <CodeBlock code={snippet} tokenize={tokenize} />
      </TextMatchProvider>,
    );
    expect(container.querySelector('mark.ui-text-match')).toHaveTextContent('price');
  });

  it('UIC-CODE-BLOCK-1.3 joins the tab order only while the code overflows', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<CodeBlock code="short" language="sh" />);
    const pre = container.querySelector('pre') as HTMLElement;
    expect(pre).not.toHaveAttribute('tabindex');
    expect(pre).not.toHaveAttribute('role');
    vi.spyOn(pre, 'scrollWidth', 'get').mockReturnValue(900);
    vi.spyOn(pre, 'clientWidth', 'get').mockReturnValue(300);
    rerender(<CodeBlock code={'x'.repeat(400)} language="sh" />);
    expect(pre).toHaveAttribute('data-overflowing', 'true');
    expect(pre).toHaveAttribute('tabindex', '0');
    expect(pre).not.toHaveAttribute('role');
    await user.tab();
    await user.tab();
    expect(pre).toHaveFocus();
    expectHooksMatchSpec(container, 'CODE-BLOCK');
  });

  it('UIC-CODE-BLOCK-1.3 joins the tab order while the code is taller than its box', () => {
    const { container, rerender } = render(<CodeBlock code="a" />);
    const pre = container.querySelector('pre') as HTMLElement;
    vi.spyOn(pre, 'scrollHeight', 'get').mockReturnValue(2000);
    vi.spyOn(pre, 'clientHeight', 'get').mockReturnValue(300);
    rerender(<CodeBlock code={'a\n'.repeat(200)} />);
    expect(pre).toHaveAttribute('data-overflowing', 'true');
    expect(pre).toHaveAttribute('tabindex', '0');
  });

  it('UIC-CODE-BLOCK-1.4 highlights typed tokens with the caller tokenizer', () => {
    const { container } = render(<CodeBlock code="const a = 12;" tokenize={tokenize} />);
    const tokens = [...container.querySelectorAll('.ui-code-block__token')];
    expect(tokens.map((token) => [token.textContent, token.getAttribute('data-token')])).toEqual([
      ['const', 'keyword'],
      ['12', 'number'],
    ]);
    expect(container.querySelector('code')).toHaveTextContent('const a = 12;');
    expectHooksMatchSpec(container, 'CODE-BLOCK', { slots: ['token'] });
  });

  it('UIC-CODE-BLOCK-2.1 copies the code exactly as given', async () => {
    const user = userEvent.setup();
    render(<CodeBlock code={`  ${snippet}\n`} language="ts" />);
    await user.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(await navigator.clipboard.readText()).toBe(`  ${snippet}\n`);
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
  });

  it('UIC-CODE-BLOCK-2.1 UIC-CODE-BLOCK-3.1 copies a terminal block’s commands without prompts', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CodeBlock variant="terminal" code={'$ npm install\nadded 12 packages\n$ npm test'} />,
    );
    await user.click(screen.getByRole('button', { name: 'Copy commands' }));
    expect(await navigator.clipboard.readText()).toBe('npm install\nnpm test');
    rerender(<CodeBlock variant="terminal" code={'> run\nok'} prompt=">" />);
    expect(screen.getByRole('button', { name: 'Copy command' })).toBeInTheDocument();
    rerender(<CodeBlock variant="terminal" code={'ok\ndone'} />);
    await user.click(screen.getByRole('button', { name: 'Copy output' }));
    expect(await navigator.clipboard.readText()).toBe('ok\ndone');
  });

  it('UIC-CODE-BLOCK-2.2 offers Apply only with onApply and hands over the value', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const { rerender, container } = render(<CodeBlock code="let a = 1;" />);
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    rerender(<CodeBlock code="let a = 1;" onApply={onApply} />);
    const apply = screen.getByRole('button', { name: 'Apply' });
    expect(apply).toHaveClass('ui-code-block__apply', 'ui-button');
    await user.click(apply);
    expect(onApply).toHaveBeenCalledWith('let a = 1;');
    expectHooksMatchSpec(container, 'CODE-BLOCK', { slots: ['apply'] });
    rerender(<CodeBlock code="$ make" variant="terminal" onApply={onApply} applyLabel="Run" />);
    await user.click(screen.getByRole('button', { name: 'Run' }));
    expect(onApply).toHaveBeenLastCalledWith('make');
  });

  it('UIC-CODE-BLOCK-2.1 UIC-CODE-BLOCK-2.2 takes its names from the provider strings', () => {
    render(
      <UiProvider
        messages={{
          codeBlockCopy: 'Copier le code',
          codeBlockApply: 'Appliquer',
          codeBlockTitle: 'Extrait',
        }}
      >
        <CodeBlock code="x" onApply={() => undefined} />
      </UiProvider>,
    );
    const group = screen.getByRole('group', { name: 'Extrait' });
    expect(within(group).getByRole('button', { name: 'Copier le code' })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: 'Appliquer' })).toBeInTheDocument();
  });

  it('UIC-CODE-BLOCK-3.1 marks command lines with a hidden prompt and output lines', () => {
    const { container } = render(
      <CodeBlock variant="terminal" code={'$ ls\nnotes.md\n$\n$x'} tokenize={tokenize} />,
    );
    const lines = [...container.querySelectorAll('.ui-code-block__line')];
    expect(lines.map((line) => line.getAttribute('data-kind'))).toEqual([
      'command',
      'output',
      'command',
      'output',
    ]);
    const prompt = lines[0]?.querySelector('.ui-code-block__prompt');
    expect(prompt).toHaveTextContent('$');
    expect(prompt).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('code')?.textContent).toBe('$ ls\nnotes.md\n$ \n$x');
    expect(container.querySelector('.ui-code-block__token')).toBeNull();
    expectHooksMatchSpec(container, 'CODE-BLOCK', { slots: ['line', 'prompt'] });
  });

  it('UIC-CODE-BLOCK-5.1 carries its hooks, the caller class, id and data attributes', () => {
    const { container } = render(
      <CodeBlock code="x" className="caller" id="snippet" data-variant="other" data-probe="code" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-code-block', 'caller');
    expect(root).toHaveAttribute('id', 'snippet');
    expect(root).toHaveAttribute('data-probe', 'code');
    expect(root).toHaveAttribute('data-variant', 'code');
    expectHooksMatchSpec(container, 'CODE-BLOCK', { callerAttributes: ['data-probe'] });
  });

  it('UIC-CODE-BLOCK-1.3 measures again when the code block resizes', () => {
    let resize: ResizeObserverCallback = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const { container } = render(<CodeBlock code="a long line" />);
    const pre = container.querySelector('pre') as HTMLElement;
    vi.spyOn(pre, 'scrollWidth', 'get').mockReturnValue(500);
    act(() => resize([], {} as ResizeObserver));
    expect(pre).toHaveAttribute('data-overflowing', 'true');
  });

  it('UIC-CODE-BLOCK-1.3 measures again when highlighting changes the same code', () => {
    const { container, rerender } = render(<CodeBlock code="x" />);
    const pre = container.querySelector('pre') as HTMLElement;
    const scrollWidth = vi.spyOn(pre, 'scrollWidth', 'get').mockReturnValue(500);
    vi.spyOn(pre, 'clientWidth', 'get').mockReturnValue(200);
    rerender(<CodeBlock code="x" tokenize={tokenize} />);
    expect(pre).toHaveAttribute('data-overflowing', 'true');
    expect(pre).toHaveAttribute('tabindex', '0');
    scrollWidth.mockReturnValue(200);
    rerender(<CodeBlock code="x" />);
    expect(pre).not.toHaveAttribute('data-overflowing');
    expect(pre).not.toHaveAttribute('tabindex');
  });

  it('UIC-CODE-BLOCK-1.3 measures again when its content changes outside React', async () => {
    const { container } = render(<CodeBlock code="x" />);
    const pre = container.querySelector('pre') as HTMLElement;
    vi.spyOn(pre, 'scrollWidth', 'get').mockReturnValue(500);
    vi.spyOn(pre, 'clientWidth', 'get').mockReturnValue(200);
    const token = document.createElement('span');
    token.className = 'wide';
    await act(async () => {
      pre.querySelector('code')?.append(token);
    });
    expect(pre).toHaveAttribute('data-overflowing', 'true');
  });

  it('UIC-CODE-BLOCK-1.3 measures again when fonts finish loading', () => {
    const fonts = new EventTarget();
    Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });
    try {
      const { container } = render(<CodeBlock code="x" />);
      const pre = container.querySelector('pre') as HTMLElement;
      vi.spyOn(pre, 'scrollWidth', 'get').mockReturnValue(500);
      vi.spyOn(pre, 'clientWidth', 'get').mockReturnValue(200);
      act(() => {
        fonts.dispatchEvent(new Event('loadingdone'));
      });
      expect(pre).toHaveAttribute('data-overflowing', 'true');
    } finally {
      Reflect.deleteProperty(document, 'fonts');
    }
  });

  it('UIC-CODE-BLOCK-1.5 numbers each line outside the text and copies only the code', async () => {
    const user = userEvent.setup();
    const code = '/* one\n   two */\n\n  const a = 12;\n';
    const commentTokens = (source: string): CodeToken[] => [
      { text: source.slice(0, 17), type: 'comment' },
      ...tokenize(source.slice(17)),
    ];
    const { container } = render(
      <CodeBlock code={code} tokenize={commentTokens} lineNumbers onApply={() => undefined} />,
    );
    const pre = container.querySelector('pre') as HTMLElement;
    expect(pre).toHaveAttribute('data-line-numbers', 'true');
    expect(pre.style.getPropertyValue('--ui-code-block-line-number-digits')).toBe('1');
    expect(pre.querySelector('code')?.textContent).toBe(code);
    const lines = [...pre.querySelectorAll('.ui-code-block__line')];
    expect(lines.map((line) => line.textContent)).toEqual([
      '/* one\n',
      '   two */\n',
      '\n',
      '  const a = 12;\n',
      '',
    ]);
    const numbers = [...pre.querySelectorAll('.ui-code-block__line-number')];
    expect(numbers.map((number) => number.getAttribute('data-line-number'))).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);
    for (const number of numbers) {
      expect(number).toHaveAttribute('aria-hidden', 'true');
      expect(number).toBeEmptyDOMElement();
    }
    const comments = [...pre.querySelectorAll('[data-token="comment"]')];
    expect(comments.map((token) => token.textContent)).toEqual(['/* one', '   two */']);
    await user.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(await navigator.clipboard.readText()).toBe(code);
    expectHooksMatchSpec(container, 'CODE-BLOCK', { slots: ['line', 'line-number', 'token'] });
  });

  it('UIC-CODE-BLOCK-1.5 numbers terminal lines and sizes the gutter by the highest number', () => {
    const { container, rerender } = render(
      <CodeBlock variant="terminal" code={'$ ls\nnotes.md'} lineNumbers />,
    );
    const lines = [...container.querySelectorAll('.ui-code-block__line')];
    expect(lines.map((line) => line.getAttribute('data-kind'))).toEqual(['command', 'output']);
    expect(lines[0]?.firstElementChild).toHaveClass('ui-code-block__line-number');
    expect(container.querySelector('code')?.textContent).toBe('$ ls\nnotes.md');
    rerender(
      <CodeBlock code={Array.from({ length: 120 }, (_, i) => `${i}`).join('\n')} lineNumbers />,
    );
    const pre = container.querySelector('pre') as HTMLElement;
    expect(pre.style.getPropertyValue('--ui-code-block-line-number-digits')).toBe('3');
    expect(container.querySelectorAll('.ui-code-block__line-number')).toHaveLength(120);
    rerender(<CodeBlock code={'a\nb'} />);
    expect(pre).not.toHaveAttribute('data-line-numbers');
    expect(pre.style.getPropertyValue('--ui-code-block-line-number-digits')).toBe('');
    expect(container.querySelector('.ui-code-block__line')).toBeNull();
  });

  it('UIC-CODE-BLOCK-1.6 publishes whether long lines scroll or wrap', () => {
    const { container, rerender } = render(<CodeBlock code="a long line" />);
    const pre = container.querySelector('pre') as HTMLElement;
    expect(pre).toHaveAttribute('data-wrap', 'off');
    rerender(<CodeBlock code="a long line" wrap="soft" lineNumbers />);
    expect(pre).toHaveAttribute('data-wrap', 'soft');
    expectHooksMatchSpec(container, 'CODE-BLOCK', { slots: ['line', 'line-number'] });
  });
});
