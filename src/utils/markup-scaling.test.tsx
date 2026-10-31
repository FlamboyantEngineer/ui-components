import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { linearBudget, measure } from '../../test/scaling.js';
import { HtmlMarkup } from '../components/html-markup/html-markup.js';
import { sanitizeHtml } from '../components/html-markup/sanitize-html.js';
import { parseSvgMarkup } from '../components/svg-markup/parse-svg-markup.js';
import { SvgMarkup } from '../components/svg-markup/svg-markup.js';
import { tokenizeMarkup } from './markup.js';

const unterminated = '<' + 'a'.repeat(96_000);

describe('Markup reading time', () => {
  it('UIC-MARKUP-1.5 reads a tag that never ends once, as text', () => {
    let tokens: ReturnType<typeof tokenizeMarkup> = [];
    expect(measure(() => (tokens = tokenizeMarkup(unterminated)))).toBeLessThan(linearBudget);
    expect(tokens.map((token) => (token.type === 'text' ? token.text : '')).join('')).toBe(
      unterminated,
    );
    const quoted = '<a title="x' + ' y'.repeat(48_000);
    expect(measure(() => tokenizeMarkup(quoted))).toBeLessThan(linearBudget);
    expect(tokenizeMarkup('<a title="x>y" <b>z</b>').map((token) => token.type)).toEqual([
      'text',
      'text',
      'open',
      'text',
      'close',
    ]);
  });

  it('UIC-MARKUP-1.5 sanitizes unterminated tags, deep nesting and stray closing tags in linear time', () => {
    expect(measure(() => sanitizeHtml(unterminated))).toBeLessThan(linearBudget);
    expect(sanitizeHtml(unterminated)).toEqual([{ type: 'text', text: unterminated }]);
    const deep = '<p>Start<table>' + '<div>'.repeat(40_000) + '</span>'.repeat(40_000) + 'End';
    expect(measure(() => sanitizeHtml(deep))).toBeLessThan(linearBudget);
    const lists = '<ul>' + '<li>Item'.repeat(30_000);
    expect(measure(() => sanitizeHtml(lists))).toBeLessThan(linearBudget);
  });

  it('UIC-MARKUP-1.5 parses SVG with unterminated tags and stray closing tags in linear time', () => {
    const markup = '<svg>' + '<g>'.repeat(30_000) + '</x>'.repeat(30_000) + unterminated + '</svg>';
    expect(measure(() => parseSvgMarkup(markup))).toBeLessThan(linearBudget);
    expect(parseSvgMarkup(markup).tag).toBe('svg');
  });

  it('UIC-MARKUP-1.5 renders adversarial markup on the server and the client in linear time', () => {
    const markup = 'Before ' + unterminated;
    expect(measure(() => renderToStaticMarkup(<HtmlMarkup markup={markup} />))).toBeLessThan(
      linearBudget,
    );
    expect(measure(() => render(<HtmlMarkup markup={markup} />))).toBeLessThan(linearBudget);
    expect(screen.getByText(/^Before <aaa/)).toBeInTheDocument();
    const svg = '<svg>' + '</x>'.repeat(30_000) + unterminated + '</svg>';
    expect(
      measure(() => renderToStaticMarkup(<SvgMarkup markup={svg} label="Shape" />)),
    ).toBeLessThan(linearBudget);
  });
});
