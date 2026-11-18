import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Markdown } from './markdown.js';
import { parseMarkdown } from './parse-markdown.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Markdown wide tables', () => {
  for (const input of ['text', 'document']) {
    it(`UIC-MARKDOWN-1.13 UIC-MARKDOWN-2.5 renders a wide ${input} table on server and client`, () => {
      const width = 128;
      const header = Array.from({ length: width }, (_, column) => `Column ${column + 1}`);
      const row = Array.from({ length: width }, (_, column) => `Value ${column + 1}`);
      row[0] = 'A\\|B';
      row[width - 1] = '`c\\|d`';
      const text = [
        `|${header.join('|')}|`,
        '|' + ':---|'.repeat(width - 1) + '---:|',
        `|${row.join('|')}|`,
        '| Short |',
      ].join('\n');
      const source = input === 'text' ? text : parseMarkdown(text);
      const view = renderToStaticMarkup(<Markdown source={source} />);
      expect(view.match(/<th\b/g)).toHaveLength(width);
      expect(view.match(/<td\b/g)).toHaveLength(width * 2);
      expect(view).toContain('Column 128');
      expect(view).toContain('<code class="ui-markdown__code">c|d</code>');
      render(<Markdown source={source} />);
      const table = screen.getByRole('table');
      const headers = within(table).getAllByRole('columnheader');
      const cells = within(table).getAllByRole('cell');
      expect(within(table).getAllByRole('row')).toHaveLength(3);
      expect(headers).toHaveLength(width);
      expect(headers[0]).toHaveTextContent('Column 1');
      expect(headers.at(-1)).toHaveTextContent('Column 128');
      expect(headers.at(-1)).toHaveAttribute('data-align', 'end');
      expect(cells).toHaveLength(width * 2);
      expect(cells[0]).toHaveTextContent('A|B');
      expect(cells[0]).toHaveAttribute('data-align', 'start');
      expect(cells[width - 1]).toHaveTextContent('c|d');
      expect(cells[width - 1]).toHaveAttribute('data-align', 'end');
      expect(cells[width]).toHaveTextContent('Short');
      expect(cells.at(-1)).toBeEmptyDOMElement();
    });
  }

  it('UIC-MARKDOWN-2.5 frames a table, which joins the tab order only while it overflows', async () => {
    const user = userEvent.setup();
    const source = '| Day | Place |\n| --- | --- |\n| Friday | Harbour |';
    const { container, rerender } = render(<Markdown source={source} />);
    const frame = container.querySelector('.ui-markdown__table') as HTMLElement;
    expect(frame).toContainElement(screen.getByRole('table'));
    expect(frame).not.toHaveAttribute('tabindex');
    expect(frame).not.toHaveAttribute('data-overflowing');
    vi.spyOn(frame, 'scrollWidth', 'get').mockReturnValue(900);
    vi.spyOn(frame, 'clientWidth', 'get').mockReturnValue(300);
    rerender(<Markdown source={`${source} with a long view |`} />);
    expect(frame).toHaveAttribute('data-overflowing', 'true');
    expect(frame).toHaveAttribute('tabindex', '0');
    expect(frame).not.toHaveAttribute('role');
    await user.tab();
    expect(frame).toHaveFocus();
    expectHooksMatchSpec(container, 'MARKDOWN', { slots: ['table'] });
  });
});
