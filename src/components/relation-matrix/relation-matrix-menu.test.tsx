import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CloseGlyph } from '../../core/glyphs.js';
import { UiProvider } from '../../core/provider.js';
import {
  RelationMatrix,
  type RelationMatrixAxisAction,
  type RelationMatrixItem,
  type RelationMatrixProps,
} from './relation-matrix.js';
import { setRelation, type RelationMatrixRelation } from './relation-matrix-model.js';

const kinds = [
  { id: 'verifies', label: 'Verifies', tone: 'success' as const },
  { id: 'partial', label: 'Partly verifies', tone: 'warning' as const },
  { id: 'blocked', label: 'Blocked', tone: 'danger' as const, glyph: CloseGlyph },
];
const rows: RelationMatrixItem[] = [
  { id: 1, label: 'Numeric one' },
  { id: '1', label: 'Text one' },
  { id: 'r3', label: 'Third' },
];
const columns: RelationMatrixItem[] = [
  { id: 'c1', label: 'First check' },
  { id: 'c2', label: 'Second check' },
];

function Matrix({
  initial = [],
  onChange,
  ...props
}: Partial<RelationMatrixProps> & {
  initial?: RelationMatrixRelation[];
  onChange?: (relations: RelationMatrixRelation[]) => void;
}) {
  const [relations, setRelations] = useState(initial);
  return (
    <RelationMatrix
      aria-label="Coverage"
      rows={rows}
      columns={columns}
      kinds={kinds}
      relations={relations}
      onRelationChange={(cell) => {
        const next = setRelation(relations, cell);
        setRelations(next);
        onChange?.(next);
      }}
      {...props}
    />
  );
}

const cell = (row: number, column: number) =>
  document.querySelector<HTMLElement>(
    `[role="row"][aria-rowindex="${row + 2}"] > [aria-colindex="${column + 2}"]`,
  ) as HTMLElement;

describe('RelationMatrix menus', () => {
  it('UIC-RELATION-MATRIX-2.4 sets, changes and removes a cell relation by kind', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCellAction = vi.fn();
    render(<Matrix onChange={onChange} onCellAction={onCellAction} />);
    fireEvent.contextMenu(cell(1, 0));
    const menu = await screen.findByRole('menu', { name: 'Relation of Text one and First check' });
    expect(within(menu).getByRole('menuitem', { name: 'Remove relation' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Blocked' }));
    expect(onChange).toHaveBeenLastCalledWith([{ row: '1', column: 'c1', kind: 'blocked' }]);
    // Opening the menu does not also run the cell action, and focus returns to the cell.
    expect(onCellAction).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(cell(1, 0)).toHaveFocus());
    expect(cell(1, 0)).toHaveAttribute('data-kind', 'blocked');
    expect(cell(1, 0).querySelector('[data-glyph="close"]')).not.toBeNull();
    expect(cell(0, 0)).not.toHaveAttribute('data-related');
    expect(screen.getAllByRole('rowheader')[1]).toHaveTextContent('1 relation');

    // The keyboard opens the focused cell's menu, which marks its kind.
    await user.keyboard('{Shift>}{F10}{/Shift}');
    const again = await screen.findByRole('menu');
    expect(within(again).getByRole('menuitemcheckbox', { name: 'Blocked' })).toBeChecked();
    await user.click(within(again).getByRole('menuitemcheckbox', { name: 'Verifies' }));
    expect(onChange).toHaveBeenLastCalledWith([{ row: '1', column: 'c1', kind: 'verifies' }]);
    await vi.waitFor(() => expect(cell(1, 0)).toHaveFocus());

    await user.keyboard('{Shift>}{F10}{/Shift}');
    await user.click(await screen.findByRole('menuitem', { name: 'Remove relation' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('UIC-RELATION-MATRIX-2.4 offers a kindless relation without kinds, and no menu without a callback', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<Matrix kinds={undefined} onChange={onChange} />);
    fireEvent.contextMenu(cell(0, 1));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Related' }));
    expect(onChange).toHaveBeenLastCalledWith([{ row: 1, column: 'c2' }]);
    unmount();
    render(<RelationMatrix aria-label="Plain" rows={rows} columns={columns} relations={[]} />);
    const event = fireEvent.contextMenu(cell(0, 0));
    expect(event).toBe(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-RELATION-MATRIX-2.4 closes the menu when its cell leaves the matrix', async () => {
    const { rerender } = render(<Matrix />);
    fireEvent.contextMenu(cell(2, 0));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    rerender(<Matrix rows={rows.slice(0, 1)} />);
    await vi.waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });
});

describe('RelationMatrix header menus', () => {
  function Headers(props: Partial<RelationMatrixProps>) {
    const onAxisAction = vi.fn<(action: RelationMatrixAxisAction) => void>();
    render(
      <RelationMatrix
        aria-label="Coverage"
        rows={rows}
        columns={columns}
        relations={[]}
        onAxisAction={onAxisAction}
        {...props}
      />,
    );
    return onAxisAction;
  }

  it('UIC-RELATION-MATRIX-2.5 moves, inserts and removes rows by key, with the ends unavailable', async () => {
    const user = userEvent.setup();
    const onAxisAction = Headers({});
    fireEvent.contextMenu(screen.getByRole('rowheader', { name: /Numeric one/ }));
    const menu = await screen.findByRole('menu', { name: 'Actions for Numeric one' });
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Move up', 'Move down', 'Insert above', 'Insert below', 'Remove Numeric one']);
    expect(within(menu).getByRole('menuitem', { name: 'Move up' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(within(menu).getByRole('menuitem', { name: 'Move down' }));
    expect(onAxisAction).toHaveBeenLastCalledWith({ axis: 'row', item: 1, action: 'move-after' });
    fireEvent.contextMenu(screen.getByRole('rowheader', { name: /Text one/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Insert above' }));
    expect(onAxisAction).toHaveBeenLastCalledWith({
      axis: 'row',
      item: '1',
      action: 'insert-before',
    });
  });

  it('UIC-RELATION-MATRIX-2.5 mirrors column moves right to left and offers only the chosen actions', async () => {
    const user = userEvent.setup();
    const onAxisAction = vi.fn();
    render(
      <UiProvider locale="ar">
        <RelationMatrix
          aria-label="Coverage"
          rows={rows}
          columns={columns}
          relations={[]}
          onAxisAction={onAxisAction}
          axisActions={['move']}
        />
      </UiProvider>,
    );
    const header = screen.getAllByRole('columnheader')[2] as HTMLElement;
    header.focus();
    await user.keyboard('{Shift>}{F10}{/Shift}');
    const menu = await screen.findByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    expect(items).toHaveLength(2);
    // The last column: moving it left (toward the end in right-to-left text) is unavailable.
    expect(within(menu).getByRole('menuitem', { name: 'Move left' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(within(menu).getByRole('menuitem', { name: 'Move right' }));
    expect(onAxisAction).toHaveBeenLastCalledWith({
      axis: 'column',
      item: 'c2',
      action: 'move-before',
    });
    // The corner has no menu.
    expect(fireEvent.contextMenu(screen.getAllByRole('columnheader')[0] as HTMLElement)).toBe(true);
  });
});
