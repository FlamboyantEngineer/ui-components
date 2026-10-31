import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HtmlMarkup } from './html-markup.js';
import { sanitizeHtml } from './sanitize-html.js';

/** Tag names an ordinary object inherits, which must read as any unknown name does. */
const inheritedNames = [
  'constructor',
  '__proto__',
  'toString',
  'hasOwnProperty',
  'valueOf',
  'isPrototypeOf',
];

const contexts = {
  root: (inner: string) => inner,
  paragraph: (inner: string) => `<p>Lead ${inner} tail</p>`,
  div: (inner: string) => `<div>${inner}</div>`,
  'table cell': (inner: string) => `<table><tr><td>${inner}</td></tr></table>`,
  'list item': (inner: string) => `<ul><li>${inner}<li>Next</ul>`,
  'description term': (inner: string) => `<dl><dt>${inner}<dd>Detail</dl>`,
};

const wrap = (name: string) => `<${name}>retained</${name}>`;

describe('HtmlMarkup tag names an object inherits', () => {
  for (const [context, place] of Object.entries(contexts)) {
    it(`UIC-HTML-MARKUP-1.3 unwraps inherited names like any unknown name in a ${context}`, () => {
      const unknown = sanitizeHtml(place(wrap('custom')));
      for (const name of inheritedNames) {
        expect(sanitizeHtml(place(wrap(name)))).toEqual(unknown);
      }
    });
  }

  it('UIC-HTML-MARKUP-1.3 renders inherited names on the server and the client, keeping their content', () => {
    const markup = contexts.div(inheritedNames.map(wrap).join(' '));
    expect(renderToStaticMarkup(<HtmlMarkup markup={markup} />)).toContain(
      'retained retained retained',
    );
    render(<HtmlMarkup markup={markup} />);
    expect(screen.getByText(/^retained( retained){5}$/)).toBeInTheDocument();
  });
});
