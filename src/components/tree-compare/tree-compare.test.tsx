import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import type { Key } from '../../core/props.js';
import type { CompareTreeNode } from '../../utils/compare-trees.js';
import { TreeCompare, type TreeCompareProps } from './tree-compare.js';

interface Section extends CompareTreeNode {
  number?: string;
  children?: Section[];
}

const LEFT: Section[] = [
  {
    id: 'intro',
    label: 'Introduction',
    children: [
      { id: 'scope', label: 'Scope' },
      { id: 'terms', label: 'Terms' },
    ],
  },
  {
    id: 'setup',
    label: 'Setup',
    children: [
      { id: 'tools', label: 'Tools' },
      { id: 'steps', label: 'Steps' },
    ],
  },
  { id: 'notes', label: 'Notes' },
];

const RIGHT: Section[] = [
  {
    id: 'intro',
    label: 'Introduction',
    children: [
      { id: 'scope', label: 'Purpose and scope' },
      { id: 'terms', label: 'Terms' },
    ],
  },
  { id: 'setup', label: 'Setup', children: [{ id: 'steps', label: 'Steps' }] },
  { id: 'appendix', label: 'Appendix', children: [{ id: 'tools', label: 'Tools' }] },
];

const ALL_ROWS = [
  'Introduction',
  'Purpose and scope, changed from Scope',
  'Terms',
  'Setup',
  'Tools, moved away',
  'Steps',
  'Notes, removed',
  'Appendix, added',
  'Tools, moved here',
];

function Compare(props: Partial<TreeCompareProps<Section>>) {
  return <TreeCompare aria-label="Outline" left={LEFT} right={RIGHT} {...props} />;
}

const row = (name: string) => screen.getByRole('row', { name });
const rowNames = () =>
  screen.queryAllByRole('row').map((element) => element.getAttribute('aria-label'));
const cells = (name: string) =>
  [...row(name).querySelectorAll('.ui-tree-compare__cell')].map((cell) =>
    cell.hasAttribute('data-empty') ? null : cell.textContent,
  );
const compareRow = (name: string) => row(name).querySelector('.ui-tree-compare__row');

describe('TreeCompare', () => {
  it('UIC-TREE-COMPARE-2.1 UIC-TREE-COMPARE-6.2 aligns both trees in one tree of rows', () => {
    const { container } = render(<Compare className="mine" id="outline" data-testid="compare" />);
    const root = screen.getByTestId('compare');
    expect(root).toHaveClass('ui-tree-compare', 'mine');
    expect(root).toHaveAttribute('id', 'outline');
    expect(screen.getByRole('treegrid', { name: 'Outline' })).toHaveClass(
      'ui-tree',
      'ui-tree-compare__tree',
    );
    expect(rowNames()).toEqual(ALL_ROWS);
    expect(cells('Purpose and scope, changed from Scope')).toEqual(['Scope', 'Purpose and scope']);
    expect(cells('Notes, removed')).toEqual(['Notes', null]);
    expect(cells('Appendix, added')).toEqual([null, 'Appendix']);
    const sides = row('Terms').querySelectorAll('.ui-tree-compare__cell');
    expect([...sides].map((cell) => cell.getAttribute('data-side'))).toEqual(['left', 'right']);
    expect(
      row('Terms').querySelector('.ui-tree-compare__row')?.closest('.ui-tree__label'),
    ).not.toBe(null);
    const labels = container.querySelectorAll('.ui-tree-compare__column-label');
    expect([...labels].map((label) => label.textContent)).toEqual(['Before', 'After']);
    expect(labels[1]).toHaveAttribute('data-side', 'right');
    expectHooksMatchSpec(container, 'TREE-COMPARE', {
      slots: 'all',
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-TREE-COMPARE-2.2 marks each row with its change and names it', () => {
    render(<Compare />);
    const change = (name: string) => compareRow(name)?.getAttribute('data-change');
    expect(ALL_ROWS.map(change)).toEqual([
      'unchanged',
      'changed',
      'unchanged',
      'unchanged',
      'moved',
      'unchanged',
      'removed',
      'added',
      'moved',
    ]);
    const glyph = (name: string) =>
      row(name).querySelector('.ui-tree-compare__marker .ui-glyph')?.getAttribute('data-glyph');
    expect(row('Terms').querySelector('.ui-tree-compare__marker')).toBeEmptyDOMElement();
    expect(row('Notes, removed').querySelector('.ui-tree-compare__marker')).toHaveAttribute(
      'data-change',
      'removed',
    );
    expect(
      ['Appendix, added', 'Notes, removed', 'Purpose and scope, changed from Scope'].map(glyph),
    ).toEqual(['plus', 'minus', 'edit']);
    expect(glyph('Tools, moved away')).toBe('move');
  });

  it('UIC-TREE-COMPARE-2.1 UIC-TREE-COMPARE-2.2 takes column labels, labels and equality from the caller', () => {
    render(
      <UiProvider strings={{ treeChangedRow: (label) => `${label} (edited)` }}>
        <Compare
          leftLabel="Version 1"
          rightLabel="Version 2"
          isEqual={(left, right) => left.label.toLowerCase() === right.label.toLowerCase()}
          right={[{ ...RIGHT[0]!, label: 'INTRODUCTION' }, ...RIGHT.slice(1)]}
          renderLabel={(node, side) => <em>{`${side}: ${node.label}`}</em>}
        />
      </UiProvider>,
    );
    expect(screen.getByText('Version 1')).toHaveClass('ui-tree-compare__column-label');
    expect(screen.getByText('Version 2')).toHaveAttribute('data-side', 'right');
    expect(compareRow('INTRODUCTION')).toHaveAttribute('data-change', 'unchanged');
    expect(cells('INTRODUCTION')).toEqual(['left: Introduction', 'right: INTRODUCTION']);
    expect(screen.getByText('right: Purpose and scope').tagName).toBe('EM');
    expect(row('Purpose and scope (edited)')).toBeInTheDocument();
  });

  it('UIC-TREE-COMPARE-2.3 indents both cells and repeats the expand glyph on the right', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    expect(row('Tools, moved here').style.getPropertyValue('--ui-tree-level')).toBe('2');
    const branch = () => row('Setup').querySelector('.ui-tree-compare__branch');
    expect(branch()).toHaveAttribute('data-glyph', 'chevron-down');
    expect(branch()?.closest('.ui-tree-compare__cell')).toHaveAttribute('data-side', 'right');
    expect(row('Terms').querySelector('.ui-tree-compare__branch')).toBeNull();
    expect(row('Setup').querySelectorAll('.ui-tree__expand')).toHaveLength(1);
    await user.click(within(row('Setup')).getByRole('button', { name: /^Collapse/ }));
    expect(branch()).toHaveAttribute('data-glyph', 'chevron-right');
  });

  it('UIC-TREE-COMPARE-3.1 expands both sides together, from the rows with differences below', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<Compare onExpandedChange={onExpandedChange} />);
    await user.click(row('Introduction'));
    expect(rowNames()).not.toContain('Terms');
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['setup', 'appendix']));
    await user.keyboard('{ArrowRight}');
    expect(rowNames()).toEqual(ALL_ROWS);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowLeft}');
    expect(rowNames()).toEqual(
      ALL_ROWS.filter((name) => name !== 'Tools, moved away' && name !== 'Steps'),
    );
  });

  it('UIC-TREE-COMPARE-3.1 takes controlled and default expansion', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Compare defaultExpandedKeys={['appendix']} />);
    expect(rowNames()).toEqual([
      'Introduction',
      'Setup',
      'Notes, removed',
      'Appendix, added',
      'Tools, moved here',
    ]);
    unmount();
    function Controlled() {
      const [keys, setKeys] = useState<Set<Key>>(new Set());
      return <Compare expandedKeys={keys} onExpandedChange={setKeys} />;
    }
    render(<Controlled />);
    expect(rowNames()).toHaveLength(4);
    await user.click(row('Setup'));
    expect(rowNames()).toContain('Steps');
  });

  it('UIC-TREE-COMPARE-3.2 keeps only the differences and the rows above them', async () => {
    const user = userEvent.setup();
    const onChangesOnlyChange = vi.fn();
    const { container } = render(<Compare onChangesOnlyChange={onChangesOnlyChange} />);
    const root = container.querySelector('.ui-tree-compare');
    expect(root).not.toHaveAttribute('data-changes-only');
    const toggle = screen.getByRole('switch', { name: 'Only differences' });
    expect(toggle.closest('.ui-tree-compare__changes-only')).not.toBeNull();
    await user.click(toggle);
    expect(onChangesOnlyChange).toHaveBeenLastCalledWith(true);
    expect(root).toHaveAttribute('data-changes-only', 'true');
    expect(rowNames()).toEqual(ALL_ROWS.filter((name) => name !== 'Terms' && name !== 'Steps'));
  });

  it('UIC-TREE-COMPARE-3.2 shows the empty state when nothing differs and only differences show', () => {
    render(<Compare right={LEFT} changesOnly />);
    expect(screen.getByRole('switch')).toBeChecked();
    expect(screen.queryAllByRole('row').filter((element) => element.ariaLabel)).toHaveLength(0);
    expect(screen.getByRole('treegrid')).toHaveTextContent('No differences');
  });

  it('UIC-TREE-COMPARE-4.1 steps between differences from the focused row, wrapping around', async () => {
    const user = userEvent.setup();
    render(<Compare />);
    const next = screen.getByRole('button', { name: 'Next difference' });
    const previous = screen.getByRole('button', { name: 'Previous difference' });
    expect(next).toHaveClass('ui-tree-compare__next');
    expect(previous).toHaveClass('ui-tree-compare__previous');
    await user.click(next);
    expect(row('Purpose and scope, changed from Scope')).toHaveFocus();
    await user.click(next);
    expect(row('Tools, moved away')).toHaveFocus();
    await user.keyboard('{F7}');
    expect(row('Notes, removed')).toHaveFocus();
    await user.keyboard('{Shift>}{F7}{/Shift}');
    expect(row('Tools, moved away')).toHaveFocus();
    await user.click(row('Appendix, added').querySelector('.ui-tree-compare__marker')!);
    expect(rowNames()).not.toContain('Tools, moved here');
    await user.click(next);
    expect(row('Tools, moved here')).toHaveFocus();
    await user.click(next);
    expect(row('Purpose and scope, changed from Scope')).toHaveFocus();
    await user.click(previous);
    expect(row('Tools, moved here')).toHaveFocus();
  });

  it('UIC-TREE-COMPARE-4.1 expands the rows above a difference before focusing it', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Compare defaultExpandedKeys={[]} />);
    await user.click(screen.getByRole('button', { name: 'Previous difference' }));
    expect(row('Tools, moved here')).toHaveFocus();
    expect(rowNames()).toContain('Tools, moved here');
    rerender(<Compare right={LEFT} />);
    expect(screen.getByRole('button', { name: 'Next difference' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous difference' })).toBeDisabled();
  });

  it('UIC-TREE-COMPARE-4.2 links the two positions of a moved node', async () => {
    const user = userEvent.setup();
    render(<Compare defaultExpandedKeys={['setup']} />);
    const away = within(row('Tools, moved away')).getByRole('button', {
      name: 'Go to new position',
    });
    expect(away).toHaveClass('ui-tree-compare__jump');
    expect(away.closest('.ui-tree__actions')).not.toBeNull();
    await user.click(away);
    expect(row('Tools, moved here')).toHaveFocus();
    await user.click(
      within(row('Tools, moved here')).getByRole('button', { name: 'Go to old position' }),
    );
    expect(row('Tools, moved away')).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowUp}{Enter}');
    expect(row('Tools, moved here')).toHaveFocus();
  });

  it('UIC-TREE-COMPARE-5.1 sums up each kind of difference', () => {
    const { container, rerender } = render(<Compare />);
    const summary = container.querySelector('.ui-tree-compare__summary');
    expect(summary?.tagName).toBe('UL');
    const counts = [...container.querySelectorAll('.ui-tree-compare__count')];
    expect(counts.map((count) => count.textContent)).toEqual([
      '1 added',
      '1 removed',
      '1 changed',
      '1 moved',
    ]);
    expect(counts.map((count) => count.getAttribute('data-change'))).toEqual([
      'added',
      'removed',
      'changed',
      'moved',
    ]);
    rerender(<Compare right={LEFT.slice(0, 2)} />);
    expect(container.querySelector('.ui-tree-compare__summary')).toHaveTextContent('1 removed');
    rerender(<Compare right={LEFT} />);
    const none = container.querySelector('.ui-tree-compare__summary');
    expect(none?.tagName).toBe('P');
    expect(none).toHaveTextContent('No differences');
  });

  it('UIC-TREE-COMPARE-6.1 names the tree by default or from the caller', () => {
    const { rerender } = render(<TreeCompare left={LEFT} right={RIGHT} />);
    expect(screen.getByRole('treegrid', { name: 'Comparison' })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="heading">Outline changes</h2>
        <p id="hint">Version 1 against version 2</p>
        <TreeCompare
          left={LEFT}
          right={RIGHT}
          aria-labelledby="heading"
          aria-describedby="hint"
          aria-details="hint"
        />
      </>,
    );
    const tree = screen.getByRole('treegrid', { name: 'Outline changes' });
    expect(tree).toHaveAccessibleDescription('Version 1 against version 2');
    expect(tree).toHaveAttribute('aria-details', 'hint');
  });
});
