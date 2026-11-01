import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  RelationMatrix,
  type RelationMatrixCell,
  type RelationMatrixItem,
  type RelationMatrixProps,
} from './relation-matrix.js';

const rowA = { id: 'a', label: 'Row A' };
const rowB = { id: 'b', label: 'Row B' };
const rowC = { id: 'c', label: 'Row C' };
const columnX = { id: 'x', label: 'Column X' };
const columnY = { id: 'y', label: 'Column Y' };

type Axes = Pick<RelationMatrixProps, 'virtualized'> & {
  rows: readonly RelationMatrixItem[];
  columns: readonly RelationMatrixItem[];
};

function renderMatrix(axes: Axes) {
  const onCellAction = vi.fn<(cell: RelationMatrixCell) => void>();
  const matrix = (next: Axes) => (
    <RelationMatrix aria-label="Links" relations={[]} onCellAction={onCellAction} {...next} />
  );
  const view = render(matrix(axes));
  return { onCellAction, update: (next: Axes) => view.rerender(matrix(next)) };
}

/** The body cell where a row and a column meet, found through their headers. */
function cellOf(row: string, column: string): HTMLElement {
  const rowElement = screen.getByRole('rowheader', { name: new RegExp(row) }).parentElement;
  const columnIndex = screen
    .getByRole('columnheader', { name: new RegExp(column) })
    .getAttribute('aria-colindex');
  const found = rowElement?.querySelector<HTMLElement>(`[aria-colindex="${columnIndex}"]`);
  if (!found) throw new Error(`No cell at ${row}, ${column}`);
  return found;
}

const tabStops = () => document.querySelectorAll('[role="grid"] [tabindex="0"]');

describe('RelationMatrix focus across row and column changes', () => {
  it.each([false, true])(
    'UIC-RELATION-MATRIX-2.3 acts on the focused cell after rows reorder (virtualized: %s)',
    async (virtualized) => {
      const user = userEvent.setup();
      const axes = { rows: [rowA, rowB], columns: [columnX, columnY], virtualized };
      const { onCellAction, update } = renderMatrix(axes);
      await user.click(cellOf('Row A', 'Column X'));
      update({ ...axes, rows: [rowB, rowA] });
      expect(cellOf('Row A', 'Column X')).toHaveFocus();
      expect(cellOf('Row A', 'Column X')).toHaveAttribute('tabindex', '0');
      expect(tabStops()).toHaveLength(1);
      expect(screen.getByRole('rowheader', { name: /Row A/ })).toHaveAttribute(
        'data-current',
        'true',
      );
      await user.keyboard('{Enter}');
      expect(onCellAction).toHaveBeenLastCalledWith({ row: 'a', column: 'x', relation: null });
      await user.keyboard('{ArrowUp}');
      expect(cellOf('Row B', 'Column X')).toHaveFocus();
    },
  );

  it('UIC-RELATION-MATRIX-2.3 binds the first cell to its items when a matrix mounted empty fills', async () => {
    const user = userEvent.setup();
    const { onCellAction, update } = renderMatrix({ rows: [], columns: [] });
    update({ rows: [rowA, rowB], columns: [columnX, columnY] });
    expect(cellOf('Row A', 'Column X')).toHaveAttribute('tabindex', '0');
    update({ rows: [rowB, rowA], columns: [columnX, columnY] });
    expect(cellOf('Row A', 'Column X')).toHaveAttribute('tabindex', '0');
    expect(tabStops()).toHaveLength(1);
    await user.tab();
    expect(cellOf('Row A', 'Column X')).toHaveFocus();
    expect(screen.getByRole('rowheader', { name: /Row A/ })).toHaveAttribute(
      'data-current',
      'true',
    );
    await user.keyboard('{Enter}');
    expect(onCellAction).toHaveBeenLastCalledWith({ row: 'a', column: 'x', relation: null });
  });

  it('UIC-RELATION-MATRIX-2.3 acts on the focused cell after columns reorder', async () => {
    const user = userEvent.setup();
    const axes = { rows: [rowA, rowB], columns: [columnX, columnY] };
    const { onCellAction, update } = renderMatrix(axes);
    await user.click(cellOf('Row A', 'Column X'));
    update({ ...axes, columns: [columnY, columnX] });
    expect(cellOf('Row A', 'Column X')).toHaveFocus();
    expect(screen.getByRole('columnheader', { name: /Column X/ })).toHaveAttribute(
      'data-current',
      'true',
    );
    await user.keyboard(' ');
    expect(onCellAction).toHaveBeenLastCalledWith({ row: 'a', column: 'x', relation: null });
  });

  it('UIC-RELATION-MATRIX-2.3 keeps the tab stop on its items when rows are inserted before them', () => {
    const axes = { rows: [rowA, rowB], columns: [columnX, columnY] };
    const { update } = renderMatrix(axes);
    expect(cellOf('Row A', 'Column X')).toHaveAttribute('tabindex', '0');
    update({ ...axes, rows: [rowC, rowA, rowB] });
    expect(cellOf('Row A', 'Column X')).toHaveAttribute('tabindex', '0');
    expect(tabStops()).toHaveLength(1);
  });

  it('UIC-RELATION-MATRIX-2.3 moves focus to the place of a focused row that went', async () => {
    const user = userEvent.setup();
    const axes = { rows: [rowA, rowB, rowC], columns: [columnX, columnY] };
    const { onCellAction, update } = renderMatrix(axes);
    await user.click(cellOf('Row B', 'Column Y'));
    update({ ...axes, rows: [rowA, rowC] });
    expect(cellOf('Row C', 'Column Y')).toHaveFocus();
    expect(tabStops()).toHaveLength(1);
    update({ ...axes, rows: [rowA] });
    expect(cellOf('Row A', 'Column Y')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onCellAction).toHaveBeenLastCalledWith({ row: 'a', column: 'y', relation: null });
  });
});
