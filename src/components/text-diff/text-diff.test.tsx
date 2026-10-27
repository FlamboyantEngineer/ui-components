import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { TextDiff, type TextDiffLine } from './text-diff.js';

const oldText = ['Preheat the oven.', 'Mix flour and sugar.', 'Add two eggs.', 'Bake.'].join('\n');
const newText = ['Preheat the oven.', 'Mix flour and brown sugar.', 'Bake.', 'Cool.'].join('\n');

const numbered = (count: number, from = 1) =>
  Array.from({ length: count }, (_, index) => `Step ${from + index}`);
const longOld = [...numbered(10), 'Rest the dough.', ...numbered(10, 11)].join('\n');
const longNew = [...numbered(10), 'Chill the dough.', ...numbered(10, 11)].join('\n');

const lineRows = (scope: Element) => [
  ...scope.querySelectorAll<HTMLElement>('.ui-text-diff__line'),
];
const pane = (container: HTMLElement, side: string) =>
  requireDefined(container.querySelector<HTMLElement>(`.ui-text-diff__pane[data-side="${side}"]`));
const viewport = (container: HTMLElement, side: string) =>
  requireDefined(pane(container, side).querySelector<HTMLElement>('.ui-scroll-region__viewport'));
const texts = (rows: HTMLElement[]) =>
  rows.map((row) => row.querySelector('.ui-text-diff__text')?.textContent);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TextDiff', () => {
  it('UIC-TEXT-DIFF-1.1 UIC-TEXT-DIFF-1.3 draws a unified table of lines with both numbers', () => {
    const { container } = render(<TextDiff oldText={oldText} newText={newText} />);
    expect(container.firstElementChild).toHaveAttribute('data-layout', 'unified');
    const rows = lineRows(container);
    expect(rows.map((row) => row.getAttribute('data-change'))).toEqual([
      'unchanged',
      'removed',
      'removed',
      'added',
      'unchanged',
      'added',
    ]);
    expect(texts(rows)).toEqual([
      'Preheat the oven.',
      'Mix flour and sugar.',
      'Add two eggs.',
      'Mix flour and brown sugar.',
      'Bake.',
      'Cool.',
    ]);
    const numbers = rows.map((row) =>
      [...row.querySelectorAll('.ui-text-diff__number')].map(
        (cell) => `${cell.getAttribute('data-side')}:${cell.textContent}`,
      ),
    );
    expect(numbers[1]).toEqual(['old:2', 'new:']);
    expect(numbers[3]).toEqual(['old:', 'new:2']);
    expect(numbers[4]).toEqual(['old:4', 'new:3']);
    expect(
      requireDefined(requireDefined(rows[1]).querySelector('.ui-text-diff__text')).tagName,
    ).toBe('DEL');
    expect(
      requireDefined(requireDefined(rows[3]).querySelector('.ui-text-diff__text')).tagName,
    ).toBe('INS');
    expect(
      requireDefined(requireDefined(rows[0]).querySelector('.ui-text-diff__text')).tagName,
    ).toBe('SPAN');
    expect(pane(container, 'both').querySelectorAll('table.ui-text-diff__table')).toHaveLength(1);
    expectHooksMatchSpec(container, 'TEXT-DIFF', {
      slots: ['header', 'pane', 'table', 'line', 'number', 'marker', 'content', 'text'],
    });
  });

  it('UIC-TEXT-DIFF-1.2 marks the changed words of paired lines', () => {
    const { container } = render(<TextDiff oldText={oldText} newText={newText} />);
    const rows = lineRows(container);
    const words = (row: HTMLElement) =>
      [...row.querySelectorAll('.ui-text-diff__word')].map((word) => word.textContent);
    expect(words(requireDefined(rows[1]))).toEqual([]);
    expect(words(requireDefined(rows[3]))).toEqual(['brown ']);
    expect(words(requireDefined(rows[2]))).toEqual([]);
    expectHooksMatchSpec(container, 'TEXT-DIFF', { slots: ['word'] });
  });

  it('UIC-TEXT-DIFF-1.4 sets the sides beside each other, padding the shorter one', () => {
    const { container } = render(<TextDiff oldText={oldText} newText={newText} layout="split" />);
    expect(container.firstElementChild).toHaveAttribute('data-layout', 'split');
    const panes = requireDefined(container.querySelector('.ui-text-diff__panes'));
    expect(
      [...panes.querySelectorAll('.ui-text-diff__pane')].map((p) => p.getAttribute('data-side')),
    ).toEqual(['old', 'new']);
    const oldRows = [...pane(container, 'old').querySelectorAll('tr')];
    const newRows = [...pane(container, 'new').querySelectorAll('tr')];
    expect(oldRows).toHaveLength(newRows.length);
    expect(oldRows.map((row) => row.className)).toEqual([
      'ui-text-diff__line',
      'ui-text-diff__line',
      'ui-text-diff__line',
      'ui-text-diff__line',
      'ui-text-diff__filler',
    ]);
    expect(newRows.map((row) => row.className)).toEqual([
      'ui-text-diff__line',
      'ui-text-diff__line',
      'ui-text-diff__filler',
      'ui-text-diff__line',
      'ui-text-diff__line',
    ]);
    expect(texts(lineRows(pane(container, 'new')))).toEqual([
      'Preheat the oven.',
      'Mix flour and brown sugar.',
      'Bake.',
      'Cool.',
    ]);
    expect(requireDefined(oldRows[1]).querySelectorAll('.ui-text-diff__number')).toHaveLength(1);
    expect(requireDefined(oldRows[1]).querySelector('.ui-text-diff__number')).toHaveAttribute(
      'data-side',
      'old',
    );
    expectHooksMatchSpec(container, 'TEXT-DIFF', { slots: ['panes', 'pane', 'filler'] });
  });

  it('UIC-TEXT-DIFF-1.5 keeps the split panes level at the rows they share', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const scroller = this.closest<HTMLElement>('.ui-scroll-region__viewport');
      if (this.tagName !== 'TR' || !scroller) return { top: 0 } as DOMRect;
      const index = [...requireDefined(this.parentElement).children].indexOf(this);
      return { top: index * 20 - scroller.scrollTop } as DOMRect;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(1000);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
    const { container } = render(
      <TextDiff
        oldText={longOld}
        newText={longNew}
        layout="split"
        context={20}
        renderLineWidget={(line) => (line.newNumber === 2 ? 'Note on step 2' : null)}
      />,
    );
    const oldViewport = viewport(container, 'old');
    const newViewport = viewport(container, 'new');
    oldViewport.scrollTop = 100;
    fireEvent.scroll(oldViewport);
    expect(newViewport.scrollTop).toBe(120);
    newViewport.scrollTop = 30;
    fireEvent.scroll(newViewport);
    expect(oldViewport.scrollTop).toBe(25);
  });

  it('UIC-TEXT-DIFF-1.6 folds long unchanged runs and shows them on request', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<TextDiff oldText={longOld} newText={longNew} />);
    const folds = [...container.querySelectorAll('.ui-text-diff__fold')];
    expect(folds).toHaveLength(2);
    expect(texts(lineRows(container))).toEqual([
      'Step 8',
      'Step 9',
      'Step 10',
      'Rest the dough.',
      'Chill the dough.',
      'Step 11',
      'Step 12',
      'Step 13',
    ]);
    const buttons = screen.getAllByRole('button', { name: 'Show 7 more lines' });
    expect(buttons[0]).toHaveClass('ui-button', 'ui-text-diff__expand');
    await user.click(requireDefined(buttons[0]));
    expect(lineRows(container)).toHaveLength(15);
    expect(lineRows(container)[0]).toHaveFocus();
    expect(container.querySelectorAll('.ui-text-diff__fold')).toHaveLength(1);
    expectHooksMatchSpec(container, 'TEXT-DIFF', { slots: ['fold', 'expand'] });
    rerender(<TextDiff oldText={longOld} newText={`${longNew}\n`} context={1} />);
    expect(container.querySelectorAll('.ui-text-diff__fold')).toHaveLength(2);
    rerender(<TextDiff oldText={`${longOld}\nStep 21`} newText={longNew} context={1} />);
    expect(container.querySelectorAll('.ui-text-diff__fold')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Show 9 more lines' })).toBeInTheDocument();
  });

  it('UIC-TEXT-DIFF-1.6 repeats the fold on the old side and focuses the new side when it opens', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UiProvider messages={{ textDiffShowLines: '{count} hidden' }}>
        <TextDiff oldText={longOld} newText={longNew} layout="split" />
      </UiProvider>,
    );
    const oldFold = requireDefined(pane(container, 'old').querySelector('.ui-text-diff__fold'));
    expect(within(oldFold as HTMLElement).queryByRole('button')).not.toBeInTheDocument();
    expect(oldFold.querySelector('[aria-hidden="true"]')).toHaveTextContent('7 hidden');
    await user.click(
      requireDefined(
        within(pane(container, 'new')).getAllByRole('button', { name: '7 hidden' })[1],
      ),
    );
    const revealed = lineRows(pane(container, 'new')).find((row) =>
      row.textContent?.includes('Step 14'),
    );
    expect(revealed).toHaveFocus();
  });

  it('UIC-TEXT-DIFF-1.7 draws widgets under lines, on the new side of a split diff when it can', () => {
    const renderLineWidget = vi.fn((line: TextDiffLine) =>
      line.oldNumber === 3 || line.newNumber === 4 ? `Comment on “${line.text}”` : null,
    );
    const { container, rerender } = render(
      <TextDiff oldText={oldText} newText={newText} renderLineWidget={renderLineWidget} />,
    );
    expect(renderLineWidget).toHaveBeenCalledWith({
      change: 'removed',
      oldNumber: 3,
      newNumber: null,
      text: 'Add two eggs.',
    });
    const widgets = [...container.querySelectorAll<HTMLElement>('.ui-text-diff__widget')];
    expect(widgets.map((widget) => widget.textContent)).toEqual([
      'Comment on “Add two eggs.”',
      'Comment on “Cool.”',
    ]);
    expect(requireDefined(widgets[0]).previousElementSibling).toBe(lineRows(container)[2]);
    expect(requireDefined(widgets[0]).querySelector('td')).toHaveAttribute('colspan', '4');
    rerender(
      <TextDiff
        oldText={oldText}
        newText={newText}
        layout="split"
        renderLineWidget={(line) => (line.change === 'added' ? null : `Note ${line.text}`)}
      />,
    );
    const oldWidgets = pane(container, 'old').querySelectorAll('.ui-text-diff__widget');
    const newWidgets = pane(container, 'new').querySelectorAll('.ui-text-diff__widget');
    expect([...oldWidgets].map((widget) => widget.textContent)).toEqual([
      'Note Mix flour and sugar.',
      'Note Add two eggs.',
    ]);
    expect([...newWidgets].map((widget) => widget.textContent)).toEqual([
      'Note Preheat the oven.',
      'Note Bake.',
    ]);
    expect(requireDefined(oldWidgets[0]).querySelector('td')).toHaveAttribute('colspan', '3');
    expectHooksMatchSpec(container, 'TEXT-DIFF', { slots: ['widget'] });
  });

  it('UIC-TEXT-DIFF-2.1 counts the added and removed lines', () => {
    const { container } = render(<TextDiff oldText={oldText} newText={newText} />);
    const counts = [...container.querySelectorAll('.ui-text-diff__count')];
    expect(counts.map((count) => [count.getAttribute('data-change'), count.textContent])).toEqual([
      ['added', '+2'],
      ['removed', '−2'],
    ]);
    expect(counts[0]).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.ui-text-diff__summary')).toHaveTextContent(
      '2 lines added, 2 lines removed',
    );
    render(<TextDiff oldText="Same" newText="Same" />);
    expect(screen.getByText('0 lines added, 0 lines removed')).toBeInTheDocument();
    expectHooksMatchSpec(container, 'TEXT-DIFF', { slots: ['summary', 'count'] });
  });

  it('UIC-TEXT-DIFF-2.2 moves between changes and marks the current one', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<TextDiff oldText={oldText} newText={newText} />);
    const previous = screen.getByRole('button', { name: 'Previous change' });
    const next = screen.getByRole('button', { name: 'Next change' });
    expect(previous).toHaveClass('ui-button', 'ui-text-diff__previous');
    expect(next).toHaveClass('ui-text-diff__next');
    expect(previous).toBeDisabled();
    await user.click(next);
    const rows = lineRows(container);
    expect(rows[1]).toHaveFocus();
    expect(rows.map((row) => row.hasAttribute('data-current'))).toEqual([
      false,
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(previous).toBeDisabled();
    await user.click(next);
    expect(rows[5]).toHaveFocus();
    expect(rows[5]).toHaveAttribute('data-current', 'true');
    expect(next).toBeDisabled();
    await user.click(previous);
    expect(rows[1]).toHaveFocus();
    rerender(<TextDiff oldText={oldText} newText={`${newText}\nServe.`} />);
    expect(container.querySelector('[data-current]')).toBeNull();
    render(<TextDiff oldText="Same" newText="Same" />);
    expect(screen.getAllByRole('button', { name: 'Next change' })[1]).toBeDisabled();
    expectHooksMatchSpec(container, 'TEXT-DIFF', { slots: ['navigation', 'previous', 'next'] });
  });

  it('UIC-TEXT-DIFF-2.2 focuses the first added line of a split change, else its removed line', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TextDiff oldText={'a\nb\nc'} newText={'a\nB\nc\nd'} layout="split" />,
    );
    await user.click(screen.getByRole('button', { name: 'Next change' }));
    expect(lineRows(pane(container, 'new'))[1]).toHaveFocus();
    const { container: removal } = render(
      <TextDiff oldText={'a\nb\nc'} newText={'a\nc'} layout="split" />,
    );
    await user.click(within(removal).getByRole('button', { name: 'Next change' }));
    expect(lineRows(pane(removal, 'old'))[1]).toHaveFocus();
  });

  it('UIC-TEXT-DIFF-2.3 moves with n and p, except inside widgets, inputs or with modifiers', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TextDiff
        oldText={oldText}
        newText={newText}
        renderLineWidget={(line) =>
          line.newNumber === 1 ? <input aria-label="Reply" defaultValue="" /> : null
        }
      />,
    );
    const rows = lineRows(container);
    await user.click(screen.getByRole('button', { name: 'Next change' }));
    await user.keyboard('n');
    expect(rows[5]).toHaveFocus();
    await user.keyboard('p');
    expect(rows[1]).toHaveFocus();
    await user.keyboard('{Control>}n{/Control}');
    expect(rows[1]).toHaveFocus();
    const input = screen.getByRole('textbox', { name: 'Reply' });
    await user.click(input);
    await user.keyboard('np');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('np');
  });

  it('UIC-TEXT-DIFF-3.1 names each row by its change and numbers', () => {
    const { container } = render(<TextDiff oldText={oldText} newText={newText} />);
    const rows = lineRows(container);
    const label = (row: HTMLElement) => row.querySelector('.ui-visually-hidden')?.textContent;
    expect(label(requireDefined(rows[0]))).toBe('Unchanged, old line 1, new line 1');
    expect(label(requireDefined(rows[1]))).toBe('Removed, old line 2');
    expect(label(requireDefined(rows[3]))).toBe('Added, new line 2');
    expect(
      requireDefined(rows[3]).querySelector('.ui-text-diff__marker [aria-hidden="true"]'),
    ).toHaveTextContent('+');
    expect(requireDefined(rows[3]).querySelector('.ui-text-diff__number span')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(rows[0]).toHaveAttribute('tabindex', '-1');
    const { container: split } = render(
      <TextDiff oldText={oldText} newText={newText} layout="split" />,
    );
    const newRows = lineRows(pane(split, 'new'));
    expect(label(requireDefined(newRows[0]))).toBe('Unchanged, new line 1');
    expect(split.querySelector('.ui-text-diff__filler')).toHaveAttribute('aria-hidden', 'true');
  });

  it('UIC-TEXT-DIFF-3.2 names the root and the focusable panes', () => {
    const { container } = render(
      <TextDiff oldText={oldText} newText={newText} aria-label="Recipe changes" />,
    );
    expect(screen.getByRole('group', { name: 'Recipe changes' })).toBe(container.firstElementChild);
    const lines = screen.getByRole('group', { name: 'Lines' });
    expect(lines).toHaveAttribute('tabindex', '0');
    expect(lines).toBe(viewport(container, 'both'));
    const { container: split } = render(
      <TextDiff oldText={oldText} newText={newText} layout="split" />,
    );
    expect(within(split).getByRole('group', { name: 'Before' })).toBe(viewport(split, 'old'));
    expect(within(split).getByRole('group', { name: 'After' })).toHaveAttribute('tabindex', '0');
  });

  it('UIC-TEXT-DIFF-3.3 forwards caller attributes and matches its hooks', () => {
    const { container } = render(
      <TextDiff
        oldText={oldText}
        newText={newText}
        className="recipe"
        id="recipe-diff"
        data-test="diff"
        aria-describedby="hint"
      />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-test', 'diff');
    expect(root).toHaveClass('ui-text-diff', 'recipe');
    expect(root).toHaveAttribute('id', 'recipe-diff');
    expect(root).toHaveAttribute('aria-describedby', 'hint');
    expectHooksMatchSpec(container, 'TEXT-DIFF', { callerAttributes: ['data-test'] });
  });
});
