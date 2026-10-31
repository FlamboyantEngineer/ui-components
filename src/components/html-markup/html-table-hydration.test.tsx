import { act } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HtmlMarkup } from './html-markup.js';
import { sanitizeHtml, type HtmlNode } from './sanitize-html.js';

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
