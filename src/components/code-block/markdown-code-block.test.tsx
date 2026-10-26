import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
    await user.click(script!);
    expect(onApply).toHaveBeenCalledWith('const trail = plan("coast");', 'ts');
    await user.click(indented!);
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
