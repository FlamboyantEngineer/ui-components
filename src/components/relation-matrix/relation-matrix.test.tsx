import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  RelationMatrix,
  type RelationMatrixCell,
  type RelationMatrixProps,
} from './relation-matrix.js';
import { toggleRelation, type RelationMatrixRelation } from './relation-matrix-model.js';

const rows = [
  { id: 'r1', label: 'Requirement 1' },
  { id: 'r2', label: 'Requirement 2' },
  { id: 'r3', label: 'Requirement 3' },
];
const columns = [
  { id: 't1', label: 'Test 1' },
  { id: 't2', label: 'Test 2' },
];
const kinds = [
  { id: 'verifies', label: 'Verifies', tone: 'success' as const },
  { id: 'partial', label: 'Partly verifies', tone: 'warning' as const },
];
const relations: RelationMatrixRelation[] = [
  { row: 'r1', column: 't1', kind: 'verifies' },
  { row: 'r1', column: 't2', kind: 'partial' },
  { row: 'r2', column: 't2' },
];

function Matrix(props: Partial<RelationMatrixProps>) {
  return (
    <RelationMatrix
      aria-label="Coverage"
      rows={rows}
      columns={columns}
      relations={relations}
      kinds={kinds}
      {...props}
    />
  );
}

function ToggleMatrix({ onCellAction }: { onCellAction: (cell: RelationMatrixCell) => void }) {
  const [current, setCurrent] = useState(relations);
  return (
    <Matrix
      relations={current}
      onCellAction={(cell) => {
        onCellAction(cell);
        setCurrent(toggleRelation(current, { ...cell, kind: 'verifies' }));
      }}
    />
  );
}

const cell = (row: number, column: number) =>
  document.querySelector<HTMLElement>(
    `[role="row"][aria-rowindex="${row + 2}"] > [aria-colindex="${column + 2}"]`,
  ) as HTMLElement;

describe('RelationMatrix', () => {
  it('UIC-RELATION-MATRIX-1.1 UIC-RELATION-MATRIX-1.5 UIC-RELATION-MATRIX-4.1 renders a grid of headers and cells', () => {
    const { container } = render(
      <Matrix id="coverage" className="mine" data-test="matrix" rowsLabel="Requirements" />,
    );
    const grid = screen.getByRole('grid', { name: 'Coverage' });
    expect(grid).toHaveClass('ui-relation-matrix', 'mine');
    expect(grid).toHaveAttribute('id', 'coverage');
    expect(grid).toHaveAttribute('data-test', 'matrix');
    expect(grid).toHaveAttribute('aria-rowcount', '4');
    expect(grid).toHaveAttribute('aria-colcount', '3');
    expect(grid).toHaveAttribute('data-column-labels', 'rotated');
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent('Requirements');
    expect(headers[1]).toHaveTextContent('Test 1');
    expect(
      screen
        .getAllByRole('rowheader')
        .map((header) => header.querySelector('.ui-relation-matrix__row-label')?.textContent),
    ).toEqual(['Requirement 1', 'Requirement 2', 'Requirement 3']);
    expect(
      within(screen.getAllByRole('row')[1] as HTMLElement).getAllByRole('gridcell'),
    ).toHaveLength(2);
    expectHooksMatchSpec(container, 'RELATION-MATRIX', {
      slots: 'all',
      callerAttributes: ['data-test'],
    });
  });

  it('UIC-RELATION-MATRIX-1.2 shows relation counts and marks uncovered rows and columns', () => {
    render(<Matrix columns={[...columns, { id: 't3', label: 'Test 3' }]} />);
    const rowHeaders = screen.getAllByRole('rowheader');
    expect(rowHeaders[0]).toHaveTextContent('2 relations');
    expect(rowHeaders[1]).toHaveTextContent('1 relation');
    expect(rowHeaders[2]).toHaveTextContent('No relations');
    expect(rowHeaders[2]).toHaveAttribute('data-uncovered', 'true');
    expect(rowHeaders[2]?.closest('[role="row"]')).toHaveAttribute('data-uncovered', 'true');
    expect(rowHeaders[0]).not.toHaveAttribute('data-uncovered');
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders[2]?.querySelector('.ui-relation-matrix__column-count')).toHaveTextContent(
      '22 relations',
    );
    expect(columnHeaders[3]).toHaveAttribute('data-uncovered', 'true');
  });

  it('UIC-RELATION-MATRIX-1.3 marks related cells by kind and tone', () => {
    render(<Matrix />);
    expect(cell(0, 0)).toHaveAttribute('data-related', 'true');
    expect(cell(0, 0)).toHaveAttribute('data-kind', 'verifies');
    expect(cell(0, 0)).toHaveAttribute('data-tone', 'success');
    expect(cell(0, 0)).toHaveTextContent('Verifies');
    expect(cell(0, 1)).toHaveAttribute('data-tone', 'warning');
    expect(cell(0, 1)).toHaveTextContent('Partly verifies');
    expect(cell(1, 1)).toHaveAttribute('data-tone', 'neutral');
    expect(cell(1, 1)).not.toHaveAttribute('data-kind');
    expect(cell(1, 1)).toHaveTextContent('Related');
    expect(cell(1, 0)).not.toHaveAttribute('data-related');
    expect(cell(1, 0)).toBeEmptyDOMElement();
    expect(cell(0, 0).querySelector('.ui-relation-matrix__mark .ui-glyph')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('UIC-RELATION-MATRIX-1.4 publishes how column labels fit and shows cut labels in a tooltip', () => {
    render(<Matrix columnLabels="truncated" />);
    expect(screen.getByRole('grid')).toHaveAttribute('data-column-labels', 'truncated');
    expect(document.querySelector('.ui-relation-matrix__column-label')).toHaveClass(
      'ui-truncation-tooltip',
    );
  });

  it('UIC-RELATION-MATRIX-2.1 moves focus between cells and headers with one tab stop', async () => {
    render(<Matrix />);
    expect(cell(0, 0)).toHaveAttribute('tabindex', '0');
    expect(document.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    await userEvent.tab();
    expect(cell(0, 0)).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(cell(0, 1)).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(cell(2, 1)).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(cell(2, -1)).toHaveFocus();
    expect(cell(2, -1)).toHaveAttribute('data-current', 'true');
    await userEvent.keyboard('{Control>}{Home}{/Control}');
    expect(cell(-1, -1)).toHaveFocus();
    await userEvent.keyboard('{Control>}{End}{/Control}');
    expect(cell(2, 1)).toHaveFocus();
    expect(screen.getAllByRole('columnheader')[2]).toHaveAttribute('data-current', 'true');
    await userEvent.keyboard('{PageUp}');
    expect(cell(-1, 1)).toHaveFocus();
    await userEvent.click(cell(1, 0));
    expect(cell(1, 0)).toHaveAttribute('tabindex', '0');
    expect(cell(-1, 1)).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    expect(document.querySelector('[data-current]')).toBeNull();
  });

  it('UIC-RELATION-MATRIX-2.1 swaps left and right in right-to-left text', async () => {
    render(
      <UiProvider locale="ar-EG">
        <Matrix />
      </UiProvider>,
    );
    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('{ArrowRight}');
    expect(cell(0, 0)).toHaveFocus();
  });

  it('UIC-RELATION-MATRIX-2.2 reports cell actions by press, Enter and Space', async () => {
    const onCellAction = vi.fn<(cell: RelationMatrixCell) => void>();
    render(<ToggleMatrix onCellAction={onCellAction} />);
    expect(screen.getByRole('grid')).toHaveAttribute('data-actionable', 'true');
    await userEvent.click(cell(1, 0));
    expect(onCellAction).toHaveBeenLastCalledWith({ row: 'r2', column: 't1', relation: null });
    expect(cell(1, 0)).toHaveAttribute('data-related', 'true');
    await userEvent.keyboard('{Enter}');
    expect(onCellAction).toHaveBeenLastCalledWith({
      row: 'r2',
      column: 't1',
      relation: { row: 'r2', column: 't1', kind: 'verifies' },
    });
    expect(cell(1, 0)).not.toHaveAttribute('data-related');
    await userEvent.keyboard(' ');
    expect(onCellAction).toHaveBeenCalledTimes(3);
    await userEvent.keyboard('{ArrowLeft}{Enter}');
    expect(onCellAction).toHaveBeenCalledTimes(3);
  });

  it('UIC-RELATION-MATRIX-2.2 reports nothing without onCellAction', async () => {
    render(<Matrix />);
    expect(screen.getByRole('grid')).not.toHaveAttribute('data-actionable');
    await userEvent.click(cell(0, 0));
    await userEvent.keyboard('{Enter}');
    expect(cell(0, 0)).toHaveFocus();
  });

  it('UIC-RELATION-MATRIX-3.1 renders only the rows and columns in view while virtualized', () => {
    const manyRows = Array.from({ length: 400 }, (_, index) => ({
      id: `r${index}`,
      label: `Requirement ${index}`,
    }));
    const manyColumns = Array.from({ length: 300 }, (_, index) => ({
      id: `c${index}`,
      label: `Case ${index}`,
    }));
    render(
      <Matrix
        rows={manyRows}
        columns={manyColumns}
        relations={[{ row: 'r0', column: 'c0' }]}
        virtualized
        rowHeight={24}
        columnWidth={40}
      />,
    );
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('data-virtualized', 'true');
    expect(grid).toHaveAttribute('aria-rowcount', '401');
    const bodyRows = grid.querySelectorAll('.ui-relation-matrix__row');
    expect(bodyRows.length).toBeLessThan(40);
    expect(bodyRows[1]).toHaveStyle({ position: 'absolute', top: '24px', height: '24px' });
    expect(grid.querySelector('.ui-relation-matrix__body')).toHaveStyle({ height: '9600px' });
    expect(screen.getAllByRole('columnheader').length).toBeLessThan(40);
    fireEvent.scroll(grid, { target: { scrollTop: 2400, scrollLeft: 4000 } });
    const rowLabels = [...grid.querySelectorAll('.ui-relation-matrix__row-label')].map(
      (label) => label.textContent,
    );
    expect(rowLabels).toContain('Requirement 100');
    // The focused first row stays rendered.
    expect(rowLabels[0]).toBe('Requirement 0');
    expect(rowLabels).not.toContain('Requirement 50');
    const columnLabels = [...grid.querySelectorAll('.ui-relation-matrix__column-label')].map(
      (label) => label.textContent,
    );
    expect(columnLabels.slice(0, 2)).toEqual(['Case 0', 'Case 98']);
    expect(columnLabels).not.toContain('Case 3');
    expect(cell(100, 100)).toHaveAttribute('aria-colindex', '102');
  });
});
