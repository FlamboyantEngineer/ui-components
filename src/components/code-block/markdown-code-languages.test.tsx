import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CodeToken, CodeTokenizer } from '../code-editor/code-editor.js';
import { Markdown } from '../markdown/markdown.js';
import { createCodeBlockOverride } from './markdown-code-block.js';

const inheritedNames = ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf'];

const keywords: CodeTokenizer = (source): CodeToken[] => [{ text: source, type: 'keyword' }];

const fence = (language: string) => ['```' + language, 'hello', '```'].join('\n');

function renderFence(language: string, tokenizers?: Record<string, CodeTokenizer>) {
  const onApply = vi.fn();
  const view = render(
    <Markdown
      source={fence(language)}
      renderNode={createCodeBlockOverride({ tokenizers, onApply })}
    />,
  );
  return { ...view, onApply };
}

const nullPrototype = Object.assign(Object.create(null) as Record<string, CodeTokenizer>, {
  javascript: keywords,
});

describe('createCodeBlockOverride tokenizer lookup', () => {
  for (const [kind, tokenizers] of [
    ['an ordinary map', { javascript: keywords }],
    ['a null-prototype map', nullPrototype],
    ['no map', undefined],
  ] as const) {
    it(`UIC-CODE-BLOCK-4.1 draws plain code for unregistered and inherited languages with ${kind}`, () => {
      for (const language of ['ruby', ...inheritedNames]) {
        const { container, unmount } = renderFence(language, tokenizers);
        const block = screen.getByRole('group', { name: language });
        expect(block).toHaveTextContent('hello');
        expect(container.querySelector('.ui-code-block__token')).toBeNull();
        unmount();
      }
    });
  }

  it('UIC-CODE-BLOCK-4.1 highlights an entry registered under an inherited name', () => {
    const tokenizers = Object.defineProperty({}, 'constructor', {
      value: keywords,
      enumerable: true,
    }) as Record<string, CodeTokenizer>;
    const { container } = renderFence('constructor', tokenizers);
    expect(container.querySelector('.ui-code-block__token')).toHaveTextContent('hello');
  });

  it('UIC-CODE-BLOCK-4.1 keeps Copy and Apply for a block without a tokenizer', async () => {
    const user = userEvent.setup();
    const { onApply } = renderFence('__proto__', { javascript: keywords });
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith('hello', '__proto__');
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument();
  });

  it('UIC-CODE-BLOCK-4.1 follows a streaming fence language through inherited names', () => {
    const renderNode = createCodeBlockOverride({ tokenizers: { javascript: keywords } });
    const stream = (source: string) => (
      <Markdown source={source} renderNode={renderNode} isStreaming />
    );
    const { rerender, container } = render(stream('```con\nhello'));
    for (const source of ['```constructor\nhello', '```javascript\nhello', '```toString\nhello']) {
      rerender(stream(source));
      expect(container).toHaveTextContent('hello');
    }
    expect(container.querySelector('.ui-code-block__token')).toBeNull();
    rerender(stream('```javascript\nhello\n```'));
    expect(container.querySelector('.ui-code-block__token')).toHaveTextContent('hello');
  });
});
