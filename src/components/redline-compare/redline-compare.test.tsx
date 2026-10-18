import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import type { DocumentBlock } from '../../utils/compare-blocks.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { RedlineCompare } from './redline-compare.js';

const before: DocumentBlock[] = [
  { id: 'title', type: 'heading', level: 1, text: 'Lemon tart' },
  { id: 'serves', type: 'paragraph', text: 'Serves 8.' },
  { id: 'chill', type: 'paragraph', text: 'Chill the pastry.' },
  { id: 'note', type: 'paragraph', text: 'Use unwaxed lemons.' },
  { id: 'bake', type: 'list-item', level: 1, text: 'Bake for 25 minutes.' },
  {
    id: 'tip',
    type: 'paragraph',
    text: 'Serve cold.',
    marks: [{ type: 'bold', start: 0, end: 5 }],
  },
];

const after: DocumentBlock[] = [
  { id: 'title', type: 'heading', level: 1, text: 'Lemon tart' },
  { id: 'serves', type: 'paragraph', text: 'Serves 10.' },
  { id: 'note', type: 'quote', text: 'Use unwaxed lemons.' },
  { id: 'bake', type: 'list-item', level: 1, text: 'Bake for 25 minutes.' },
  { id: 'chill', type: 'paragraph', text: 'Chill the pastry well.' },
  {
    id: 'tip',
    type: 'paragraph',
    text: 'Serve cold.',
    marks: [{ type: 'italic', start: 0, end: 5 }],
  },
  { id: 'zest', type: 'paragraph', text: 'Add zest.' },
];

const rowsOf = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('.ui-redline-compare__row'),
];

describe('RedlineCompare', () => {
  it('UIC-REDLINE-COMPARE-2.1 draws an inline redline with inserted and deleted words', () => {
    const { container } = render(<RedlineCompare oldBlocks={before} newBlocks={after} />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-layout', 'inline');
    expect(container.querySelector('ol.ui-redline-compare__rows')).not.toBeNull();
    const rows = rowsOf(container);
    expect(rows.map((row) => [row.dataset.change, row.dataset.move ?? null])).toEqual([
      ['unchanged', null],
      ['changed', null],
      ['moved', 'from'],
      ['changed', null],
      ['unchanged', null],
      ['moved', 'to'],
      ['changed', null],
      ['added', null],
    ]);
    const serves = rows[1]!;
    expect(serves.querySelector('del.ui-redline-compare__word')).toHaveTextContent('8');
    expect(serves.querySelector('del')).toHaveAttribute('data-change', 'removed');
    expect(serves.querySelector('ins.ui-redline-compare__word')).toHaveTextContent('10');
    expect(serves.querySelector('ins')).toHaveAttribute('data-change', 'added');
    expect(serves.querySelector('.ui-redline-compare__block')).toHaveTextContent('Serves 810.');
    expect(rows[0]!.querySelector('.ui-redline-compare__block')).toHaveAttribute(
      'data-type',
      'heading',
    );
    expect(rows[0]!.querySelector('.ui-redline-compare__block')).toHaveAttribute('data-level', '1');
    expect(rows[0]!.querySelector('.ui-redline-compare__cell')).toHaveAttribute(
      'data-side',
      'both',
    );
    expect(rows[2]!.querySelector('ins, del')).toBeNull();
    expect(rows[2]).toHaveTextContent('Chill the pastry.');
    expect(rows[7]!.querySelector('ins')).toHaveTextContent('Add zest.');
    expect(container.querySelector('.ui-redline-compare__columns')).toBeNull();
    expectHooksMatchSpec(container, 'REDLINE-COMPARE', {
      slots: ['header', 'summary', 'rows', 'row', 'marker', 'cell', 'block', 'word', 'notes'],
    });
  });

  it('UIC-REDLINE-COMPARE-2.1 draws a removed block whole as deleted', () => {
    const { container } = render(
      <RedlineCompare oldBlocks={[{ type: 'paragraph', text: 'Gone now' }]} newBlocks={[]} />,
    );
    const [row] = rowsOf(container);
    expect(row).toHaveAttribute('data-change', 'removed');
    expect(row!.querySelector('del')).toHaveTextContent('Gone now');
  });

  it('UIC-REDLINE-COMPARE-2.2 sets the old and new cells side by side', () => {
    const { container } = render(
      <RedlineCompare oldBlocks={before} newBlocks={after} layout="split" />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-layout', 'split');
    const labels = container.querySelectorAll('.ui-redline-compare__column-label');
    expect([...labels].map((label) => label.textContent)).toEqual(['Before', 'After']);
    expect(container.querySelector('.ui-redline-compare__columns')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    const rows = rowsOf(container);
    const cells = (row: HTMLElement) => [
      ...row.querySelectorAll<HTMLElement>('.ui-redline-compare__cell'),
    ];
    const [oldCell, newCell] = cells(rows[1]!);
    expect(oldCell).toHaveAttribute('data-side', 'old');
    expect(oldCell).toHaveTextContent('Serves 8.');
    expect(oldCell!.querySelector('ins')).toBeNull();
    expect(newCell).toHaveTextContent('Serves 10.');
    expect(newCell!.querySelector('del')).toBeNull();
    expect(cells(rows[7]!)[0]).toHaveAttribute('data-empty', 'true');
    expect(cells(rows[2]!)[1]).toHaveAttribute('data-empty', 'true');
    expect(cells(rows[5]!)[0]).toHaveAttribute('data-empty', 'true');
    expect(cells(rows[5]!)[1]).toHaveTextContent('Chill the pastry well.');
    expectHooksMatchSpec(container, 'REDLINE-COMPARE', { slots: ['columns', 'column-label'] });
  });

  it('UIC-REDLINE-COMPARE-2.2 heads the columns with the caller labels', () => {
    const { container } = render(
      <RedlineCompare
        oldBlocks={before}
        newBlocks={after}
        layout="split"
        oldLabel="Version 3"
        newLabel="Version 4"
      />,
    );
    const labels = container.querySelectorAll('.ui-redline-compare__column-label');
    expect([...labels].map((label) => label.textContent)).toEqual(['Version 3', 'Version 4']);
  });

  it('UIC-REDLINE-COMPARE-2.3 draws marks, links through the provider and unsafe links as text', () => {
    const block: DocumentBlock = {
      type: 'paragraph',
      text: 'Read the guide or this',
      marks: [
        { type: 'link', start: 9, end: 14, href: '/guide' },
        { type: 'bold', start: 0, end: 14 },
        { type: 'code', start: 9, end: 14 },
        { type: 'underline', start: 15, end: 17 },
        { type: 'strike', start: 18, end: 22 },
        { type: 'link', start: 18, end: 22, href: 'javascript:alert(1)' },
      ],
    };
    const renderLink = vi.fn((props) => <a {...props} data-routed="yes" />);
    const { container } = render(
      <UiProvider renderLink={renderLink}>
        <RedlineCompare oldBlocks={[block]} newBlocks={[block]} />
      </UiProvider>,
    );
    const link = container.querySelector('a.ui-redline-compare__mark')!;
    expect(link).toHaveAttribute('href', '/guide');
    expect(link).toHaveAttribute('data-routed', 'yes');
    expect(link).toHaveAttribute('data-mark', 'link');
    expect(link.querySelector('strong > code')).toHaveTextContent('guide');
    expect(link.closest('strong')).toBeNull();
    expect(container.querySelector('u[data-mark="underline"]')).toHaveTextContent('or');
    const unsafe = container.querySelector('span[data-mark="link"]')!;
    expect(unsafe).not.toHaveAttribute('href');
    expect(unsafe.querySelector('s[data-mark="strike"]')).toHaveTextContent('this');
    expectHooksMatchSpec(container, 'REDLINE-COMPARE', {
      slots: ['mark'],
      callerAttributes: ['data-routed'],
    });
  });

  it('UIC-REDLINE-COMPARE-2.4 marks changes and notes kind and format changes', () => {
    const { container } = render(<RedlineCompare oldBlocks={before} newBlocks={after} />);
    const rows = rowsOf(container);
    const marker = (row: HTMLElement) => row.querySelector('.ui-redline-compare__marker')!;
    expect(marker(rows[0]!)).toHaveTextContent('Unchanged: Heading 1');
    expect(marker(rows[0]!).querySelector('.ui-glyph')).toBeNull();
    expect(marker(rows[1]!)).toHaveTextContent('Changed: Paragraph');
    expect(marker(rows[1]!).querySelector('[data-glyph="edit"]')).not.toBeNull();
    expect(marker(rows[2]!)).toHaveTextContent('Moved away: Paragraph');
    expect(marker(rows[5]!)).toHaveTextContent('Moved here: Paragraph');
    expect(marker(rows[5]!).querySelector('[data-glyph="move"]')).not.toBeNull();
    expect(marker(rows[7]!).querySelector('[data-glyph="plus"]')).not.toBeNull();
    const typeNote = rows[3]!.querySelector('[data-note="type"]');
    expect(typeNote).toHaveTextContent('Paragraph became Quote');
    expect(rows[6]!.querySelector('[data-note="format"]')).toHaveTextContent('Formatting changed');
    expect(rows[1]!.querySelector('.ui-redline-compare__notes')).toBeNull();
    expectHooksMatchSpec(container, 'REDLINE-COMPARE', { slots: ['note', 'jump'] });
  });

  it('UIC-REDLINE-COMPARE-2.4 jumps between a moved block’s positions', async () => {
    const user = userEvent.setup();
    const { container } = render(<RedlineCompare oldBlocks={before} newBlocks={after} />);
    const rows = rowsOf(container);
    await user.click(within(rows[2]!).getByRole('button', { name: 'Go to new position' }));
    expect(rows[5]).toHaveFocus();
    expect(rows[5]).toHaveAttribute('data-current', 'true');
    await user.click(within(rows[5]!).getByRole('button', { name: 'Go to old position' }));
    expect(rows[2]).toHaveFocus();
    expect(rows[5]).toHaveAttribute('data-current', 'true');
  });

  it('UIC-REDLINE-COMPARE-3.1 counts changes and steps between them', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<RedlineCompare oldBlocks={before} newBlocks={after} />);
    expect(container.querySelector('.ui-redline-compare__summary')).toHaveTextContent(
      '1 added, 3 changed, 1 moved',
    );
    const rows = rowsOf(container);
    const previous = screen.getByRole('button', { name: 'Previous change' });
    const next = screen.getByRole('button', { name: 'Next change' });
    expect(previous).toBeDisabled();
    await user.click(next);
    expect(rows[1]).toHaveFocus();
    expect(rows[1]).toHaveAttribute('data-current', 'true');
    await user.keyboard('n');
    expect(rows[3]).toHaveFocus();
    await user.keyboard('n');
    expect(rows[5]).toHaveFocus();
    await user.keyboard('nn');
    expect(rows[7]).toHaveFocus();
    expect(next).toBeDisabled();
    await user.keyboard('p');
    expect(rows[6]).toHaveFocus();
    expect(rows[7]).not.toHaveAttribute('data-current');
    rerender(<RedlineCompare oldBlocks={before} newBlocks={[...after]} />);
    expect(container.querySelector('[data-current]')).toBeNull();
    expectHooksMatchSpec(container, 'REDLINE-COMPARE', {
      slots: ['navigation', 'previous', 'next'],
    });
  });

  it('UIC-REDLINE-COMPARE-3.1 reads no differences between equal documents', () => {
    const { container } = render(<RedlineCompare oldBlocks={before} newBlocks={before} />);
    expect(container.querySelector('.ui-redline-compare__summary')).toHaveTextContent(
      'No differences',
    );
    expect(screen.getByRole('button', { name: 'Next change' })).toBeDisabled();
  });

  it('UIC-REDLINE-COMPARE-3.2 reports decisions as plain data and marks them', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    const { container } = render(
      <RedlineCompare oldBlocks={before} newBlocks={after} onResolve={onResolve} />,
    );
    const rows = rowsOf(container);
    expect(rows[0]!.querySelector('.ui-redline-compare__actions')).toBeNull();
    expect(rows[2]!.querySelector('.ui-redline-compare__actions')).toBeNull();
    expect(container.querySelectorAll('.ui-redline-compare__actions')).toHaveLength(5);
    const accept = within(rows[1]!).getByRole('button', { name: 'Accept' });
    expect(accept).toHaveAccessibleDescription('Changed: Paragraph');
    await user.click(accept);
    expect(onResolve).toHaveBeenCalledTimes(1);
    const [{ decision, row }] = onResolve.mock.calls[0]!;
    expect(decision).toBe('accepted');
    expect(row).toMatchObject({ key: 'id:serves', change: 'changed', oldIndex: 1, newIndex: 1 });
    expect(rows[1]).toHaveAttribute('data-resolution', 'accepted');
    expect(accept).toHaveAttribute('aria-pressed', 'true');
    await user.click(accept);
    expect(onResolve).toHaveBeenCalledTimes(1);
    await user.click(within(rows[1]!).getByRole('button', { name: 'Reject' }));
    expect(onResolve).toHaveBeenLastCalledWith(expect.objectContaining({ decision: 'rejected' }));
    expect(rows[1]).toHaveAttribute('data-resolution', 'rejected');
    await user.click(within(rows[5]!).getByRole('button', { name: 'Reject' }));
    expect(onResolve.mock.calls[2]![0].row).toMatchObject({ move: 'to', oldIndex: 2, newIndex: 4 });
    expectHooksMatchSpec(container, 'REDLINE-COMPARE', { slots: ['actions', 'accept', 'reject'] });
  });

  it('UIC-REDLINE-COMPARE-3.2 follows controlled decisions and draws no buttons without onResolve', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    const { container, rerender } = render(
      <RedlineCompare
        oldBlocks={before}
        newBlocks={after}
        resolutions={{ 'id:zest': 'rejected' }}
        onResolve={onResolve}
      />,
    );
    const rows = rowsOf(container);
    expect(rows[7]).toHaveAttribute('data-resolution', 'rejected');
    await user.click(within(rows[7]!).getByRole('button', { name: 'Accept' }));
    expect(onResolve).toHaveBeenCalledWith(expect.objectContaining({ decision: 'accepted' }));
    expect(rows[7]).toHaveAttribute('data-resolution', 'rejected');
    rerender(<RedlineCompare oldBlocks={before} newBlocks={after} />);
    expect(container.querySelector('.ui-redline-compare__actions')).toBeNull();
  });

  it('UIC-REDLINE-COMPARE-3.2 forgets its own decisions when the documents change', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <RedlineCompare oldBlocks={before} newBlocks={after} onResolve={() => {}} />,
    );
    await user.click(within(rowsOf(container)[7]!).getByRole('button', { name: 'Accept' }));
    expect(rowsOf(container)[7]).toHaveAttribute('data-resolution', 'accepted');
    rerender(<RedlineCompare oldBlocks={before} newBlocks={[...after]} onResolve={() => {}} />);
    expect(rowsOf(container)[7]).not.toHaveAttribute('data-resolution');
  });

  it('UIC-REDLINE-COMPARE-4.1 names the group and keeps rows out of the Tab order', () => {
    const { rerender } = render(<RedlineCompare oldBlocks={before} newBlocks={after} />);
    const group = screen.getByRole('group', { name: 'Document comparison' });
    expect(rowsOf(group).every((row) => row.tabIndex === -1)).toBe(true);
    rerender(
      <>
        <h2 id="title">Recipe changes</h2>
        <RedlineCompare
          oldBlocks={before}
          newBlocks={after}
          aria-labelledby="title"
          aria-describedby="title"
        />
      </>,
    );
    const named = screen.getByRole('group', { name: 'Recipe changes' });
    expect(named).not.toHaveAttribute('aria-label');
    expect(named).toHaveAttribute('aria-describedby', 'title');
    rerender(<RedlineCompare oldBlocks={before} newBlocks={after} aria-label="Changes" />);
    expect(screen.getByRole('group', { name: 'Changes' })).toBeInTheDocument();
  });

  it('UIC-REDLINE-COMPARE-4.2 forwards the class, id and data attributes', () => {
    const { container } = render(
      <RedlineCompare
        oldBlocks={before}
        newBlocks={after}
        className="host"
        id="compare"
        data-testid="redline"
        data-layout="caller"
      />,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveClass('ui-redline-compare', 'host');
    expect(root).toHaveAttribute('id', 'compare');
    expect(root).toHaveAttribute('data-testid', 'redline');
    expect(root).toHaveAttribute('data-layout', 'inline');
    expectHooksMatchSpec(container, 'REDLINE-COMPARE', { callerAttributes: ['data-testid'] });
  });
});
