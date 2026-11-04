import { act } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HtmlMarkup } from './html-markup.js';
import { type HtmlNode, sanitizeHtml } from './sanitize-html.js';

/** The tree as compact markup, to compare structure at a glance. */
function serialize(nodes: readonly HtmlNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') return node.text;
      const attributes = Object.entries(node.attributes)
        .map(([name, value]) => ` ${name}="${value}"`)
        .join('');
      return `<${node.tag}${attributes}>${serialize(node.children)}</${node.tag}>`;
    })
    .join('');
}

const clean = (markup: string) => serialize(sanitizeHtml(markup));

/** Server-renders the markup, lets the browser parser read that HTML, then hydrates it. */
async function hydrate(markup: string) {
  const host = document.createElement('div');
  document.body.append(host);
  host.innerHTML = renderToString(<HtmlMarkup markup={markup} />);
  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(async () => {
    root = hydrateRoot(host, <HtmlMarkup markup={markup} />, {
      onRecoverableError: (error) => errors.push(error),
    });
  });
  const html = host.innerHTML;
  act(() => root?.unmount());
  host.remove();
  return { errors, html };
}

afterEach(() => {
  vi.restoreAllMocks();
});

const shorthands = {
  'omitted colgroup': '<table><col span="2"><col class="wide"><tr><td>A</td></tr></table>',
  'explicit colgroup':
    '<table><colgroup><col></colgroup><tbody><tr><td>A</td></tr></tbody></table>',
  'caption and columns':
    '<table><caption>Crates</caption><col><thead><tr><th>Fruit</th></tr></thead><tr><td>Apple</td></tr></table>',
  'cell without a row': '<table><td>A</td><td>B</td></table>',
  'row in a section without cells': '<table><tbody><td>A</td></tbody></table>',
  'element in a table': '<table><tr><td>A</td></tr><div>Note</div><tr><td>B</td></tr></table>',
  'element in a column group': '<table><colgroup><col><p>Note</p><tr><td>A</td></tr></table>',
  'table in a table': '<table><tr><td>A</td></tr><table><tr><td>B</td></tr></table>',
  'parts outside a table': '<div><td>A</td><tr>B</tr><col><caption>C</caption></div>',
};

describe('HtmlMarkup table structure', () => {
  it('UIC-HTML-MARKUP-1.2 places table shorthand where an HTML parser puts it', () => {
    expect(clean(shorthands['omitted colgroup'])).toBe(
      '<table><colgroup><col span="2"></col><col class="wide"></col></colgroup>' +
        '<tbody><tr><td>A</td></tr></tbody></table>',
    );
    expect(clean(shorthands['caption and columns'])).toBe(
      '<table><caption>Crates</caption><colgroup><col></col></colgroup>' +
        '<thead><tr><th>Fruit</th></tr></thead><tbody><tr><td>Apple</td></tr></tbody></table>',
    );
    expect(clean(shorthands['cell without a row'])).toBe(
      '<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>',
    );
    expect(clean(shorthands['element in a table'])).toBe(
      '<div>Note</div><table><tbody><tr><td>A</td></tr><tr><td>B</td></tr></tbody></table>',
    );
    expect(clean(shorthands['element in a column group'])).toBe(
      '<p>Note</p><table><colgroup><col></col></colgroup><tbody><tr><td>A</td></tr></tbody></table>',
    );
    expect(clean(shorthands['table in a table'])).toBe(
      '<table><tbody><tr><td>A</td></tr></tbody></table>' +
        '<table><tbody><tr><td>B</td></tr></tbody></table>',
    );
    expect(clean(shorthands['parts outside a table'])).toBe('<div>ABC</div>');
    expect(clean('<table><tr><td>A<table><td>B</table>C</td></tr></table>')).toBe(
      '<table><tbody><tr><td>A<table><tbody><tr><td>B</td></tr></tbody></table>C</td></tr></tbody></table>',
    );
  });

  for (const [name, markup] of Object.entries(shorthands)) {
    it(`UIC-HTML-MARKUP-1.2 hydrates the server HTML of ${name} without recovery`, async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { errors } = await hydrate(markup);
      expect(errors).toEqual([]);
      expect(consoleError).not.toHaveBeenCalled();
    });
  }
});

/** Shapes whose server HTML a browser could rebuild differently, without care. */
const reparsed = {
  'link in a link': '<a href="/">x<b><a href="/">y</a></b></a>',
  'heading reopened inside a heading': '<h1><p><h1>',
  'list item fostered into a list item': '<li>A<table><li>B</li></table>C',
  'term fostered into a term': '<dl><dt>A<table><dt>B</table></dl>',
  'link fostered into a link': '<a href="/">A<table><a href="/x">B</a></table></a>',
  'heading fostered into a heading': '<h1>A<table><h2>B</h2></table></h1>',
  'heading fostered into a span': '<h1><span>A<table><h2>B</h2></table></span></h1>',
  'description in a paragraph': '<p>A<dd>B<dt>C',
};

describe('HtmlMarkup structure through server HTML', () => {
  it('UIC-HTML-MARKUP-1.2 keeps a fostered element that would close its new parent as content', () => {
    expect(clean(reparsed['list item fostered into a list item'])).toBe(
      '<li>AB<table></table>C</li>',
    );
    expect(clean(reparsed['term fostered into a term'])).toBe(
      '<dl><dt>AB<table></table></dt></dl>',
    );
    expect(clean(reparsed['link fostered into a link'])).toBe('<a href="/">AB<table></table></a>');
    expect(clean(reparsed['heading fostered into a heading'])).toBe('<h1>AB<table></table></h1>');
    expect(clean(reparsed['heading fostered into a span'])).toBe(
      '<h1><span>A<h2>B</h2><table></table></span></h1>',
    );
    expect(clean(reparsed['description in a paragraph'])).toBe('<p>A</p><dd>B</dd><dt>C</dt>');
    expect(clean('<ul><li>A<table><td><li>B</li></td></table></li></ul>')).toBe(
      '<ul><li>A<table><tbody><tr><td><li>B</li></td></tr></tbody></table></li></ul>',
    );
  });

  for (const [name, markup] of Object.entries(reparsed)) {
    it(`UIC-HTML-MARKUP-1.2 parses the server HTML of a ${name} back to the same tree`, async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const view = renderToString(<HtmlMarkup markup={markup} />);
      const host = document.createElement('div');
      host.innerHTML = view;
      expect(host.innerHTML).toBe(view);
      const { errors } = await hydrate(markup);
      expect(errors).toEqual([]);
      expect(consoleError).not.toHaveBeenCalled();
    });
  }
});
