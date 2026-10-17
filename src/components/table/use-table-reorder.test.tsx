import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Table } from './table.js';
import { applyTableMove, type TableMove } from './table-rows.js';

interface Task {
  id: string;
  title: string;
  isPinned?: boolean;
}

const tasks: Task[] = [
  { id: 'wash', title: 'Wash' },
  { id: 'dry', title: 'Dry' },
  { id: 'pinned', title: 'Pinned', isPinned: true },
  { id: 'fold', title: 'Fold' },
];

function Tasks({ onMove }: { onMove: (move: TableMove) => void }) {
  const [rows, setRows] = useState(tasks);
  return (
    <Table
      aria-label="Tasks"
      rows={rows}
      columns={[{ id: 'title', header: 'Title' }]}
      reorder={{
        canMove: (row) => !row.isPinned,
        onMove: (move) => {
          onMove(move);
          setRows((current) => applyTableMove(current, move));
        },
      }}
    />
  );
}

const order = () => screen.getAllByRole('rowheader').map((cell) => cell.textContent);
const row = (name: string) => screen.getByRole('row', { name });

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table reordering', { timeout: 15_000 }, () => {
  it('UIC-TABLE-5.1 UIC-TABLE-5.2 draws drag handles, disabled on fixed rows', () => {
    const { container } = render(<Tasks onMove={() => {}} />);
    expect(screen.getByRole('button', { name: 'Drag Wash' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Drag Pinned' })).toBeDisabled();
    expect(screen.getByRole('grid')).toHaveAttribute('data-allows-dragging', 'true');
    expectHooksMatchSpec(container, 'TABLE', { slots: ['drag-handle'] });
  });

  it('UIC-TABLE-5.1 moves a row by keyboard drag and drop from its handle', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Tasks onMove={onMove} />);
    row('Wash').focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Drag Wash' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(document.querySelectorAll('.ui-table__drop-indicator').length).toBeGreaterThan(0);
    expect(row('Wash')).toHaveAttribute('data-dragging', 'true');
    expectHooksMatchSpec(document.body, 'TABLE', { slots: ['drag-handle', 'drop-indicator'] });
    await user.keyboard('{Enter}');
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove.mock.lastCall?.[0]).toMatchObject({ keys: ['wash'] });
    expect(order()).toEqual(['Dry', 'Wash', 'Pinned', 'Fold']);
    expect(document.querySelector('.ui-table__drop-indicator')).toBeNull();
  });

  it('UIC-TABLE-5.2 refuses drags that start on a fixed row', () => {
    render(<Tasks onMove={() => {}} />);
    const refused = createEvent.dragStart(row('Pinned'));
    fireEvent(row('Pinned'), refused);
    expect(refused.defaultPrevented).toBe(true);
    const dataTransfer = { clearData: () => {}, setData: () => {}, items: { add: () => {} } };
    const allowed = createEvent.dragStart(row('Wash'), { dataTransfer });
    fireEvent(row('Wash'), allowed);
    expect(allowed.defaultPrevented).toBe(false);
  });

  it('UIC-TABLE-5.2 UIC-TABLE-5.3 moves the focused movable row past its neighbour with Alt+Arrow keys', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Tasks onMove={onMove} />);
    await user.click(screen.getByRole('rowheader', { name: /Dry/ }));
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(onMove).toHaveBeenLastCalledWith({
      keys: ['dry'],
      targetKey: 'pinned',
      position: 'after',
    });
    expect(order()).toEqual(['Wash', 'Pinned', 'Dry', 'Fold']);
    row('Dry').focus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}{Alt>}{ArrowDown}{/Alt}');
    expect(order()).toEqual(['Wash', 'Pinned', 'Fold', 'Dry']);
    expect(onMove).toHaveBeenCalledTimes(2);
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(onMove).toHaveBeenLastCalledWith({
      keys: ['dry'],
      targetKey: 'fold',
      position: 'before',
    });
    row('Pinned').focus();
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(onMove).toHaveBeenCalledTimes(3);
    expect(order()).toEqual(['Wash', 'Pinned', 'Dry', 'Fold']);
  });
});
