import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { linearBudget, measure } from '../../../test/scaling.js';
import { Markdown } from './markdown.js';
import { closeStreamingInlines } from './markdown-streaming-inlines.js';
import { parseMarkdown } from './parse-markdown.js';
import { parseStreamingMarkdown } from './parse-streaming-markdown.js';

const sources: Readonly<Record<string, string>> = {
  'matched emphasis': 'a *b* '.repeat(16_000),
  'unmatched closers': 'a* '.repeat(32_000),
  'mixed unmatched runs': '_a* '.repeat(24_000),
  'strong runs': 'a***b '.repeat(16_000),
  strikethrough: '~a~~ '.repeat(20_000),
  'nested brackets': '['.repeat(40_000) + ']'.repeat(40_000),
  'links after open brackets': '['.repeat(20_000) + '[a](b)'.repeat(20_000),
  'unclosed destinations': '[a]('.repeat(24_000),
  'many lines': 'a\n'.repeat(100_000),
};

describe('Markdown parsing time', () => {
  for (const [name, source] of Object.entries(sources)) {
    it(`UIC-MARKDOWN-1.13 parses ${name} in linear time`, () => {
      expect(measure(() => parseMarkdown(source))).toBeLessThan(linearBudget);
      expect(measure(() => parseStreamingMarkdown(source, null))).toBeLessThan(linearBudget);
      expect(measure(() => closeStreamingInlines(source))).toBeLessThan(linearBudget);
    });
  }

  it('UIC-MARKDOWN-1.13 keeps pairing emphasis and links as CommonMark does', () => {
    expect(parseMarkdown('*a **b** c* ~~d~~ [e](/f) [[g]]').children).toEqual([
      {
        type: 'paragraph',
        children: [
          {
            type: 'emphasis',
            children: [
              { type: 'text', text: 'a ' },
              { type: 'strong', children: [{ type: 'text', text: 'b' }] },
              { type: 'text', text: ' c' },
            ],
          },
          { type: 'text', text: ' ' },
          { type: 'strikethrough', children: [{ type: 'text', text: 'd' }] },
          { type: 'text', text: ' ' },
          { type: 'link', href: '/f', title: null, children: [{ type: 'text', text: 'e' }] },
          { type: 'text', text: ' [[g]]' },
        ],
      },
    ]);
  });

  it('UIC-MARKDOWN-1.13 applies the destination nesting and label length limits', () => {
    const nested = '('.repeat(32) + ')'.repeat(32);
    expect(parseMarkdown(`[a](${nested})`).children[0]).toMatchObject({
      children: [{ type: 'link', href: nested }],
    });
    expect(parseMarkdown(`[a](${'('.repeat(33)}${')'.repeat(33)})`).children[0]).toMatchObject({
      children: [{ type: 'text' }],
    });
    const label = 'x'.repeat(999);
    const defined = (text: string) => parseMarkdown(`[${text}]\n\n[${text}]: /u`).children[0];
    expect(defined(label)).toMatchObject({ children: [{ type: 'link', href: '/u' }] });
    expect(defined(`${label}x`)).toMatchObject({ children: [{ type: 'text' }] });
  });

  it('UIC-MARKDOWN-1.13 prepares streaming text with long escape runs and code in a destination', () => {
    expect(measure(() => closeStreamingInlines('\\'.repeat(64_000)))).toBeLessThan(linearBudget);
    expect(measure(() => closeStreamingInlines(' *a'.repeat(20_000)))).toBeLessThan(linearBudget);
    expect(measure(() => closeStreamingInlines('[1'.repeat(30_000)))).toBeLessThan(linearBudget);
    expect(closeStreamingInlines('See [a](`)`')).toBe('See a');
  });

  it('UIC-MARKDOWN-1.13 renders adversarial sources on the server and the client in linear time', () => {
    const source = 'Start ' + sources['unmatched closers'];
    expect(measure(() => renderToStaticMarkup(<Markdown source={source} />))).toBeLessThan(
      linearBudget,
    );
    expect(measure(() => render(<Markdown source={source} isStreaming />))).toBeLessThan(
      linearBudget,
    );
    expect(screen.getByText(/^Start a\* a\*/)).toBeInTheDocument();
  });
});
