import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HtmlMarkup } from '../components/html-markup/html-markup.js';
import { Markdown } from '../components/markdown/markdown.js';
import { SvgMarkup } from '../components/svg-markup/svg-markup.js';
import { maxMarkupDepth } from './markup.js';

/** The number of elements on the longest path below `root`. */
function depthBelow(root: Element): number {
  let deepest = 0;
  const pending: Array<[Element, number]> = [[root, 0]];
  for (let next = pending.pop(); next; next = pending.pop()) {
    const [element, depth] = next;
    deepest = Math.max(deepest, depth);
    for (const child of element.children) pending.push([child, depth + 1]);
  }
  return deepest;
}

const deepHtml =
  '<div><b>'.repeat(2_500) + 'Deepest<br>text' + '</b></div>'.repeat(2_500) + ' After';
const deepSvg = '<svg>' + '<g>'.repeat(5_000) + '<circle r="1"/><text>Deepest</text>';
const deepQuotes = '>'.repeat(2_000) + ' Deepest quote';
const deepEmphasis = '*a '.repeat(2_000) + 'b*'.repeat(2_000);

describe('Markup nesting depth', () => {
  it('UIC-MARKUP-1.6 draws deeply nested HTML on the server and the client, keeping its content', () => {
    expect(renderToString(<HtmlMarkup markup={deepHtml} />)).toContain('Deepest<br/>text');
    const { container } = render(<HtmlMarkup markup={deepHtml} />);
    expect(container).toHaveTextContent('Deepesttext After');
    expect(container.querySelector('br')).toBeInTheDocument();
    expect(depthBelow(container)).toBeLessThanOrEqual(maxMarkupDepth + 2);
    expect(depthBelow(container)).toBeGreaterThanOrEqual(maxMarkupDepth);
  });

  it('UIC-MARKUP-1.6 draws deeply nested SVG, keeping its shapes and text', () => {
    expect(() => renderToString(<SvgMarkup markup={deepSvg} label="Deep" />)).not.toThrow();
    const { container } = render(<SvgMarkup markup={deepSvg} label="Deep" />);
    expect(screen.getByRole('img', { name: 'Deep' })).toHaveTextContent('Deepest');
    expect(container.querySelector('circle')).toBeInTheDocument();
    expect(depthBelow(container)).toBeLessThanOrEqual(maxMarkupDepth + 3);
  });

  it('UIC-MARKUP-1.6 draws deeply nested quotes and emphasis, keeping their text', () => {
    expect(() => renderToString(<Markdown source={deepQuotes} />)).not.toThrow();
    const view = render(<Markdown source={deepQuotes} />);
    expect(view.container).toHaveTextContent('Deepest quote');
    expect(depthBelow(view.container)).toBeLessThanOrEqual(maxMarkupDepth + 3);
    view.unmount();
    const { container } = render(<Markdown source={deepEmphasis} />);
    expect(container.textContent?.replace(/\s+/g, '')).toBe('a'.repeat(2_000) + 'b'.repeat(2_000));
    expect(depthBelow(container)).toBeLessThanOrEqual(maxMarkupDepth + 3);
  });
});
