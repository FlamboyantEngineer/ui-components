import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createCodeBlockOverride } from '../code-block/markdown-code-block.js';
import { Markdown } from './markdown.js';
import type { MarkdownBlock } from './markdown-nodes.js';
import { parseMarkdown } from './parse-markdown.js';
import { prepareStreamingMarkdown } from './markdown-streaming.js';
import { parseStreamingMarkdown, type StreamingMarkdownParse } from './parse-streaming-markdown.js';

/** The text of every code block, depth first. */
function codeTexts(source: string): string[] {
  const texts: string[] = [];
  const pending: MarkdownBlock[] = [...parseMarkdown(source).children];
  for (let block = pending.shift(); block; block = pending.shift()) {
    if (block.type === 'codeBlock') texts.push(block.text);
    else if (block.type === 'blockquote') pending.unshift(...block.children);
    else if (block.type === 'list')
      pending.unshift(...block.children.flatMap((item) => item.children));
  }
  return texts;
}

const recipe = '```make\nall:\n\techo ready\n```';

describe('Markdown tabs', () => {
  it('UIC-MARKDOWN-1.4 keeps the tabs of fenced code verbatim', () => {
    expect(codeTexts(recipe)).toEqual(['all:\n\techo ready']);
    expect(codeTexts('```\n\t\tdeep\tinner\n```')).toEqual(['\t\tdeep\tinner']);
    // A fence's indentation is removed in columns; a tab only partly removed leaves spaces.
    expect(codeTexts('  ```\n\tx\n  \ty\n   z\n  ```')).toEqual(['  x\n\ty\n z']);
  });

  it('UIC-MARKDOWN-1.4 UIC-MARKDOWN-1.5 UIC-MARKDOWN-1.6 keeps tabs in fences inside quotes and lists', () => {
    expect(codeTexts('> ```\n> \tx\n> ```')).toEqual(['\tx']);
    expect(codeTexts('>\t```\n>\t\tx\n>\t```')).toEqual(['\tx']);
    expect(codeTexts('- ```\n  \tx\n  ```')).toEqual(['\tx']);
    expect(codeTexts('1. ```\n   \tx\n   ```')).toEqual(['\tx']);
    expect(codeTexts('> - ```\n>   \tx\n>   ```')).toEqual(['\tx']);
  });

  it('UIC-MARKDOWN-1.4 removes four columns from indented code and keeps the rest', () => {
    expect(codeTexts('\tfoo\tbaz\t\tbim')).toEqual(['foo\tbaz\t\tbim']);
    expect(codeTexts('  \tfoo\tbaz\t\tbim')).toEqual(['foo\tbaz\t\tbim']);
    expect(codeTexts('\t\tnested\n\n\t\t\n\tend')).toEqual(['\tnested\n\n\t\nend']);
    expect(codeTexts('- foo\n\n\t\tbar')).toEqual(['  bar']);
    expect(codeTexts('>\t\tfoo')).toEqual(['  foo']);
    expect(codeTexts('-\t\tfoo')).toEqual(['  foo']);
  });

  it('UIC-MARKDOWN-1.3 UIC-MARKDOWN-1.5 UIC-MARKDOWN-1.6 reads tabs as columns to the next multiple of four', () => {
    expect(parseMarkdown('#\tFoo').children).toMatchObject([{ type: 'heading', level: 1 }]);
    expect(parseMarkdown('*\t*\t*\t').children).toEqual([{ type: 'thematicBreak' }]);
    expect(parseMarkdown('> \tquoted').children).toMatchObject([
      { type: 'blockquote', children: [{ type: 'paragraph' }] },
    ]);
    const [list] = parseMarkdown('- a\n\t- b\n\t\t- c').children;
    expect(list).toMatchObject({
      type: 'list',
      children: [{ children: [{ type: 'paragraph' }, { type: 'list' }] }],
    });
    expect(parseMarkdown('-\tfoo\n\tbar').children).toMatchObject([
      { type: 'list', children: [{ children: [{ children: [{ text: 'foo\nbar' }] }] }] },
    ]);
  });

  it('UIC-MARKDOWN-2.4 shows, copies and applies a tab-indented recipe as written', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<Markdown source={recipe} renderNode={createCodeBlockOverride({ onApply })} />);
    const block = screen.getByRole('group', { name: 'make' });
    expect(block.querySelector('code')?.textContent).toBe('all:\n\techo ready');
    await user.click(within(block).getByRole('button', { name: 'Copy code' }));
    expect(await navigator.clipboard.readText()).toBe('all:\n\techo ready');
    await user.click(within(block).getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith('all:\n\techo ready', 'make');
  });

  it('UIC-MARKDOWN-2.13 streams tabbed code the way a whole parse reads it', () => {
    const source = '> ```make\n> all:\n> \techo ready\n> ```\n\n- item\n\n\t\tcode\n';
    let previous: StreamingMarkdownParse | null = null;
    for (let end = 1; end <= source.length; end += 1) {
      const prefix = prepareStreamingMarkdown(source.slice(0, end));
      previous = parseStreamingMarkdown(prefix, previous);
      expect(previous.document).toEqual(parseMarkdown(prefix));
    }
  });
});
