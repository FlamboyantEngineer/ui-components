import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from './index.js';

const source = 'const nights = 3;\nconst total = nights * 90;';

it('UIC-CODE-BLOCK-6.1 composes a block named by its title, with Copy and a footer', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <CodeBlock data-testid="block" id="sample">
      <CodeBlockHeader>
        <CodeBlockTitle>stay.ts</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={source} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent>{source}</CodeBlockContent>
      <CodeBlockFooter>Edited just now</CodeBlockFooter>
    </CodeBlock>,
  );
  const block = screen.getByRole('group', { name: 'stay.ts' });
  expect(block).toHaveAttribute('data-variant', 'code');
  expect(block).toHaveAttribute('id', 'sample');
  expect(block).toHaveAttribute('data-testid', 'block');
  expect(block.querySelector('pre > code')).toHaveTextContent('const nights = 3;');
  expect(within(block).getByText('Edited just now')).toHaveClass('ui-code-block__footer');
  await user.click(within(block).getByRole('button', { name: 'Copy code' }));
  expect(await navigator.clipboard.readText()).toBe(source);
  expectHooksMatchSpec(container, 'CODE-BLOCK', {
    slots: ['header', 'title', 'actions', 'copy', 'code', 'footer'],
    callerAttributes: ['data-testid'],
  });
});

it('UIC-CODE-BLOCK-6.1 takes the caller’s name, label and variant', () => {
  render(
    <CodeBlock variant="terminal" aria-label="Install">
      <CodeBlockHeader>
        <CodeBlockActions>
          <CodeBlockCopyButton value="npm install" label="Copy command" />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent>npm install</CodeBlockContent>
    </CodeBlock>,
  );
  const block = screen.getByRole('group', { name: 'Install' });
  expect(block).toHaveAttribute('data-variant', 'terminal');
  expect(block).toHaveAttribute('data-size', 'default');
  expect(block).not.toHaveAttribute('aria-labelledby');
  expect(within(block).getByRole('button', { name: 'Copy command' })).toBeInTheDocument();
});

it('UIC-CODE-BLOCK-1.7 publishes the size of a composed block', () => {
  render(
    <CodeBlock size="sm" aria-label="Snippet">
      <CodeBlockContent>x</CodeBlockContent>
    </CodeBlock>,
  );
  expect(screen.getByRole('group', { name: 'Snippet' })).toHaveAttribute('data-size', 'sm');
});

it('UIC-CODE-BLOCK-6.2 marks added, removed and highlighted lines and numbers them', () => {
  const { container } = render(
    <CodeBlock aria-label="Diff">
      <CodeBlockContent lineNumbers firstLineNumber={9} wrap="soft">
        <CodeBlockLine>const nights = 3;</CodeBlockLine>
        <CodeBlockLine variant="removed">const rate = 80;</CodeBlockLine>
        <CodeBlockLine variant="added">const rate = 90;</CodeBlockLine>
        <CodeBlockLine variant="highlighted">const total = nights * rate;</CodeBlockLine>
      </CodeBlockContent>
    </CodeBlock>,
  );
  const pre = container.querySelector('pre');
  expect(pre).toHaveAttribute('data-line-numbers', 'true');
  expect(pre).toHaveAttribute('data-wrap', 'soft');
  expect(pre?.getAttribute('style')).toBe('--ui-code-block-line-number-digits: 2;');
  const lines = [...container.querySelectorAll('.ui-code-block__line')];
  expect(screen.getByRole('deletion')).toHaveTextContent('const rate = 80;');
  expect(screen.getByRole('insertion')).toHaveTextContent('const rate = 90;');
  expect(lines.map((line) => line.getAttribute('data-variant'))).toEqual([
    'default',
    'removed',
    'added',
    'highlighted',
  ]);
  const numbers = [...container.querySelectorAll('.ui-code-block__line-number')];
  expect(numbers.map((number) => number.getAttribute('data-line-number'))).toEqual([
    '9',
    '10',
    '11',
    '12',
  ]);
  expect(numbers[0]).toHaveAttribute('aria-hidden', 'true');
  expect(pre?.textContent).toBe(
    'const nights = 3;\nconst rate = 80;\nconst rate = 90;\nconst total = nights * rate;',
  );
  expectHooksMatchSpec(container, 'CODE-BLOCK', { slots: ['code', 'line', 'line-number'] });
});

it('UIC-CODE-BLOCK-6.2 joins the tab order only while composed code overflows', () => {
  const { container, rerender } = render(
    <CodeBlock aria-label="Wide">
      <CodeBlockContent>
        <CodeBlockLine>short</CodeBlockLine>
      </CodeBlockContent>
    </CodeBlock>,
  );
  const pre = container.querySelector('pre') as HTMLElement;
  expect(pre).not.toHaveAttribute('tabindex');
  expect(pre).not.toHaveAttribute('data-line-numbers');
  expect(container.querySelector('.ui-code-block__line-number')).toBeNull();
  vi.spyOn(pre, 'scrollWidth', 'get').mockReturnValue(900);
  vi.spyOn(pre, 'clientWidth', 'get').mockReturnValue(300);
  rerender(
    <CodeBlock aria-label="Wide">
      <CodeBlockContent>
        <CodeBlockLine>{'x'.repeat(400)}</CodeBlockLine>
      </CodeBlockContent>
    </CodeBlock>,
  );
  expect(pre).toHaveAttribute('data-overflowing', 'true');
  expect(pre).toHaveAttribute('tabindex', '0');
});
