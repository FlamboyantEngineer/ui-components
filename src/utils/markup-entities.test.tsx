import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HtmlMarkup } from '../components/html-markup/html-markup.js';
import { sanitizeHtml } from '../components/html-markup/sanitize-html.js';
import { parseMarkdown } from '../components/markdown/parse-markdown.js';
import { parseSvgMarkup } from '../components/svg-markup/parse-svg-markup.js';
import { decodeEntities } from './markup.js';

const sample = 'Caf&eacute; &ouml; &alpha; &le; &NotNestedGreaterGreater; &fjlig; &constructor;';
const decoded = 'Café ö α ≤ ⪢̸ fj &constructor;';

/** The text of a node list, depth first. */
function textOf(nodes: readonly unknown[]): string {
  return nodes
    .map((node) => {
      const value = node as { text?: string; children?: readonly unknown[] };
      return value.text ?? textOf(value.children ?? []);
    })
    .join('');
}

describe('Named character references', () => {
  it('UIC-MARKUP-1.3 decodes every HTML name with its case, and leaves unknown and inherited names', () => {
    expect(decodeEntities(sample)).toBe(decoded);
    expect(decodeEntities('&Eacute; &eacute; &EACUTE; &Amp; &AMP;')).toBe('É é &EACUTE; &Amp; &');
    for (const name of ['constructor', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf']) {
      expect(decodeEntities(`&${name};`)).toBe(`&${name};`);
    }
    expect(decodeEntities('&copy &#0; &#x110000; &amp;lt;')).toBe('&copy � � &lt;');
  });

  it('UIC-MARKUP-1.3 decodes HTML text and attributes as an HTML parser does', () => {
    expect(textOf(sanitizeHtml(`<p>${sample}</p>`))).toBe(decoded);
    expect(textOf(sanitizeHtml('<p>&copy 2026 &not;it AT&T &#128;</p>'))).toBe('© 2026 ¬it AT&T €');
    const [link] = sanitizeHtml(
      '<a href="/search?a=1&copy=2&amp;b=&eacute;" title="&alpha;&copy">x</a>',
    );
    expect(link).toMatchObject({
      attributes: { href: '/search?a=1&copy=2&b=é', title: 'α©' },
    });
    expect(sanitizeHtml('<a href="jav&#x61;script&colon;alert(1)">x</a>')).toMatchObject([
      { tag: 'a', attributes: {} },
    ]);
  });

  it('UIC-MARKUP-1.3 decodes Markdown text and link destinations with CommonMark semantics', () => {
    expect(textOf(parseMarkdown(sample).children)).toBe(decoded);
    expect(textOf(parseMarkdown('&copy 2026').children)).toBe('&copy 2026');
    expect(parseMarkdown('[x](/caf&eacute;?a&amp;b "&alpha;")').children[0]).toMatchObject({
      children: [{ type: 'link', href: '/café?a&b', title: 'α' }],
    });
    expect(parseMarkdown('[x](jav&#x61;script&colon;alert)').children[0]).toMatchObject({
      children: [{ type: 'text', text: 'x' }],
    });
    expect(textOf(parseMarkdown('`&eacute;`').children)).toBe('&eacute;');
  });

  it('UIC-MARKUP-1.3 decodes SVG strictly, every name ended by its semicolon', () => {
    const svg = parseSvgMarkup(
      '<svg><text aria-label="&alpha;&copy">&eacute;&copy &constructor;</text></svg>',
    );
    expect(svg.children[0]).toMatchObject({
      attributes: { 'aria-label': 'α&copy' },
      children: [{ type: 'text', text: 'é&copy &constructor;' }],
    });
  });

  it('UIC-MARKUP-1.3 renders decoded names in HtmlMarkup', () => {
    render(<HtmlMarkup markup={`<p>${sample}</p>`} />);
    expect(screen.getByText(decoded)).toBeInTheDocument();
  });
});
