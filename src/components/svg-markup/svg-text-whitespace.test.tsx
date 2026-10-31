import { render } from '@testing-library/react';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { parseSvgMarkup, type SvgNode } from './parse-svg-markup.js';
import { SvgMarkup } from './svg-markup.js';

/** The text nodes of a parsed drawing, in order. */
function texts(markup: string): string[] {
  const found: string[] = [];
  const pending: SvgNode[] = [...(parseSvgMarkup(markup)?.children ?? [])];
  for (let node = pending.shift(); node; node = pending.shift()) {
    if (node.type === 'text') found.push(node.text);
    else pending.unshift(...node.children);
  }
  return found;
}

const multiline = [
  '<svg>',
  '  <text x="0" y="10">',
  '    <tspan x="0" dy="1em">Orchard</tspan>',
  '    <tspan x="0" dy="1em">north field</tspan>',
  '  </text>',
  '</svg>',
].join('\n');

describe('SVG text whitespace', () => {
  it('UIC-SVG-MARKUP-1.1 keeps whitespace inside text and drops indentation elsewhere', () => {
    expect(texts('<svg><text><tspan>First</tspan> <tspan>Last</tspan></text></svg>')).toEqual([
      'First',
      ' ',
      'Last',
    ]);
    expect(texts('<svg><text> Lead <tspan>in</tspan> </text></svg>')).toEqual([
      ' Lead ',
      'in',
      ' ',
    ]);
    expect(texts(multiline)).toEqual(['\n    ', 'Orchard', '\n    ', 'north field', '\n  ']);
    expect(texts('<svg>\n  <g>\n    <rect width="2" height="2"/>\n  </g>\n</svg>')).toEqual([]);
    expect(
      texts('<svg><text><a href="#t"><tspan>a</tspan> <tspan>b</tspan></a></text></svg>'),
    ).toEqual(['a', ' ', 'b']);
  });

  it('UIC-SVG-MARKUP-2.1 renders separated spans and preserved spacing as written', () => {
    const { container } = render(
      <>
        <SvgMarkup markup="<svg><text><tspan>First</tspan> <tspan>Last</tspan></text></svg>" />
        <SvgMarkup markup='<svg><text xml:space="preserve">Two  spaces <tspan>kept</tspan></text></svg>' />
      </>,
    );
    const [separated, preserved] = [...container.querySelectorAll('text')];
    expect(separated?.textContent).toBe('First Last');
    expect(preserved).toHaveAttribute('xml:space', 'preserve');
    expect(preserved?.textContent).toBe('Two  spaces kept');
  });

  it('UIC-SVG-MARKUP-2.1 hydrates whitespace inside text without a mismatch', async () => {
    const app = <SvgMarkup markup={multiline} />;
    const host = document.createElement('div');
    host.innerHTML = renderToString(app);
    document.body.append(host);
    const served = host.innerHTML;
    const errors = vi.spyOn(console, 'error');
    const root = await act(async () => hydrateRoot(host, app));
    expect(host.innerHTML).toBe(served);
    expect(errors).not.toHaveBeenCalled();
    expect(host.querySelector('text')?.textContent).toBe('\n    Orchard\n    north field\n  ');
    act(() => root.unmount());
    host.remove();
  });
});
