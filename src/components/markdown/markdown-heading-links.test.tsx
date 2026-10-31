import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './markdown.js';

/** The href of each link, by its name. */
function hrefs(source: string): Record<string, string | null> {
  render(<Markdown source={source} headingIdPrefix="doc-" />);
  return Object.fromEntries(
    screen.getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')]),
  );
}

describe('Markdown heading links', () => {
  it('UIC-MARKDOWN-2.2 points a percent-encoded link at the prefixed id of a non-Latin heading', () => {
    expect(
      hrefs('# 東京\n\n# 東京\n\n[one](#%E6%9D%B1%E4%BA%AC) [two](#%E6%9D%B1%E4%BA%AC-2)'),
    ).toEqual({ one: '#doc-東京', two: '#doc-東京-2' });
    expect(screen.getAllByRole('heading').map((heading) => heading.id)).toEqual([
      'doc-東京',
      'doc-東京-2',
    ]);
  });

  it('UIC-MARKDOWN-2.2 folds accents and normal forms the way heading ids fold them', () => {
    expect(
      hrefs(
        '## Café crème\n\n## 한국\n\n' +
          '[slug](#cafe-creme) [encoded](#caf%C3%A9-cr%C3%A8me) [written](#café-crème) [hangul](#%ED%95%9C%EA%B5%AD)',
      ),
    ).toEqual({
      slug: '#doc-cafe-creme',
      encoded: '#doc-cafe-creme',
      written: '#doc-cafe-creme',
      hangul: `#${screen.getByRole('heading', { name: '한국' }).id}`,
    });
  });

  it('UIC-MARKDOWN-2.2 decodes encoded ASCII once and keeps links to other fragments', () => {
    expect(
      hrefs(
        '## Getting started\n\n## a\n\n' +
          '[ascii](#getting%2Dstarted) [twice](#%2561) [other](#elsewhere) [foreign](#%E5%A4%96) [broken](#%E6%9D) [percent](#100%)',
      ),
    ).toEqual({
      ascii: '#doc-getting-started',
      twice: '#%2561',
      other: '#elsewhere',
      foreign: '#%E5%A4%96',
      broken: '#%E6%9D',
      percent: '#100%',
    });
  });
});
