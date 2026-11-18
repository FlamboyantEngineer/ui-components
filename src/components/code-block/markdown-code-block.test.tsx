import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import type { CodeToken } from '../code-editor/code-editor.js';
import { Markdown } from '../markdown/markdown.js';
import { createCodeBlockOverride } from './markdown-code-block.js';

const answer = [
  'Install it:',
  '',
  '```console',
  '$ npm install trail-kit',
  'added 1 package',
  '```',
  '',
  '```ts',
  'const trail = plan("coast");',
  '```',
  '',
  '    indented()',
].join('\n');

const tokenizeScript = (source: string): CodeToken[] =>
  (source.match(/const|\s+|[^\s]+/g) ?? []).map((text) => ({
    text,
    type: text === 'const' ? 'keyword' : null,
  }));

describe('createCodeBlockOverride', () => {
  it('UIC-CODE-BLOCK-4.1 draws fenced and indented code as code blocks headed by their language', () => {
    const { container } = render(
      <Markdown source={answer} renderNode={createCodeBlockOverride()} />,
    );
    const terminal = screen.getByRole('group', { name: 'console' });
    expect(terminal).toHaveAttribute('data-variant', 'terminal');
    expect(terminal.querySelectorAll('.ui-code-block__line[data-kind="command"]')).toHaveLength(1);
    expect(screen.getByRole('group', { name: 'ts' })).toHaveAttribute('data-variant', 'code');
    expect(screen.getByRole('group', { name: 'Code' })).toHaveTextContent('indented()');
    expect(container.querySelector('.ui-markdown__code-block')).toBeNull();
    expect(screen.getByText('Install it:').tagName).toBe('P');
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
  });

  it('UIC-CODE-BLOCK-4.1 wraps a plain-text fence and keeps code on one row', () => {
    const source = ['```text', 'prose', '```', '', '```TXT', 'more prose', '```', '', answer].join(
      '\n',
    );
    render(<Markdown source={source} renderNode={createCodeBlockOverride()} />);
    const wrapOf = (name: string) =>
      screen.getByRole('group', { name }).querySelector('pre')?.getAttribute('data-wrap');
    expect(wrapOf('text')).toBe('soft');
    expect(wrapOf('TXT')).toBe('soft');
    expect(wrapOf('ts')).toBe('off');
    expect(wrapOf('Code')).toBe('off');
  });

  it('UIC-CODE-BLOCK-4.1 keeps the built-in highlighting of a language the map does not register', () => {
    const source = ['```py', 'def plan(): pass', '```', '', answer].join('\n');
    render(
      <Markdown
        source={source}
        renderNode={createCodeBlockOverride({ tokenizers: { ts: tokenizeScript } })}
      />,
    );
    const python = screen.getByRole('group', { name: 'py' });
    expect(python.querySelector('[data-token="keyword"]')).toHaveTextContent('def');
    const script = screen.getByRole('group', { name: 'ts' });
    expect(script.querySelectorAll('.ui-code-block__token')).toHaveLength(1);
  });

  it('UIC-CODE-BLOCK-4.1 highlights by fence language and applies with the language', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const codeOverride = createCodeBlockOverride({
      onApply,
      applyLabel: 'Insert',
      tokenizers: { ts: tokenizeScript },
    });
    const { container } = render(<Markdown source={answer} renderNode={codeOverride} />);
    expect(container.querySelectorAll('.ui-code-block__token')).toHaveLength(1);
    const [, script, indented] = screen.getAllByRole('button', { name: 'Insert' });
    await user.click(requireDefined(script));
    expect(onApply).toHaveBeenCalledWith('const trail = plan("coast");', 'ts');
    await user.click(requireDefined(indented));
    expect(onApply).toHaveBeenLastCalledWith('indented()', null);
  });

  it('UIC-CODE-BLOCK-4.1 shows an unclosed fence of a streaming answer as a growing block', () => {
    const codeOverride = createCodeBlockOverride();
    const { rerender } = render(
      <Markdown source={'Run:\n\n```sh\nnpm'} isStreaming renderNode={codeOverride} />,
    );
    expect(screen.getByRole('group', { name: 'sh' })).toHaveTextContent('npm');
    rerender(
      <Markdown source={'Run:\n\n```sh\nnpm test\n``'} isStreaming renderNode={codeOverride} />,
    );
    const block = screen.getByRole('group', { name: 'sh' });
    expect(block.querySelector('code')?.textContent).toBe('npm test');
  });
});
