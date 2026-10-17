import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Table } from './table.js';
import { applyTableMove, type TableMove } from './table-rows.js';
import type { TableReorderOptions } from './use-table-reorder.js';

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

function Tasks({
  onMove,
  reorder,
}: {
  onMove: (move: TableMove) => void;
  reorder?: Partial<TableReorderOptions<Task>>;
}) {
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
        ...reorder,
      }}
    />
  );
}

/** A pointer press at a position, which jsdom's plain events do not carry. */
function pointerDown(target: Element, x: number, button = 0) {
  const event = createEvent.pointerDown(target);
  Object.defineProperties(event, {
    clientX: { value: x },
    clientY: { value: 10 },
    button: { value: button },
  });
  fireEvent(target, event);
}

function placeHandle(name: string) {
  const handle = screen.getByRole('button', { name: `Drag ${name}` });
  vi.spyOn(handle, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    right: 20,
    top: 0,
    bottom: 20,
    width: 20,
    height: 20,
    x: 0,
    y: 0,
  } as DOMRect);
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

  it('UIC-TABLE-5.5 drags a row by its handle only', () => {
    render(<Tasks onMove={() => {}} reorder={{ dragTrigger: 'handle' }} />);
    const wash = row('Wash');
    expect(wash).not.toHaveAttribute('draggable');
    placeHandle('Wash');
    const cell = screen.getByRole('rowheader', { name: /Wash/ });
    pointerDown(cell, 60);
    expect(wash).not.toHaveAttribute('draggable');
    pointerDown(cell, 10, 2);
    expect(wash).not.toHaveAttribute('draggable');
    pointerDown(cell, 10);
    expect(wash).toHaveAttribute('draggable', 'true');
    fireEvent.pointerUp(document);
    expect(wash).not.toHaveAttribute('draggable');
    pointerDown(cell, 10);
    fireEvent(wash, createEvent.dragEnd(wash, { dataTransfer: { dropEffect: 'none' } }));
    expect(wash).not.toHaveAttribute('draggable');
    placeHandle('Pinned');
    pointerDown(screen.getByRole('rowheader', { name: /Pinned/ }), 10);
    expect(row('Pinned')).not.toHaveAttribute('draggable');
  });

  it('UIC-TABLE-5.5 keeps rows draggable from anywhere by default', () => {
    render(<Tasks onMove={() => {}} />);
    expect(row('Wash')).toHaveAttribute('draggable', 'true');
  });

  it('UIC-TABLE-5.6 draws the drag preview from the dragged rows', () => {
    const setDragImage = vi.fn();
    render(
      <Tasks
        onMove={() => {}}
        reorder={{ renderDragPreview: (rows) => `${rows.length} task: ${rows[0]?.title}` }}
      />,
    );
    const dataTransfer = {
      clearData: () => {},
      setData: () => {},
      setDragImage,
      items: { add: () => {} },
      dropEffect: 'none',
      effectAllowed: 'all',
    };
    fireEvent(row('Dry'), createEvent.dragStart(row('Dry'), { dataTransfer }));
    expect(setDragImage).toHaveBeenCalledTimes(1);
    // React Aria hands the browser its own wrapper around the preview.
    const preview = (setDragImage.mock.lastCall?.[0] as HTMLElement)
      .firstElementChild as HTMLElement;
    expect(preview).toHaveClass('ui-table__drag-preview');
    expect(preview).toHaveAttribute('data-count', '1');
    expect(preview).toHaveTextContent('1 task: Dry');
    expectHooksMatchSpec(document.body, 'TABLE', { slots: ['drag-preview'] });
    fireEvent(row('Dry'), createEvent.dragEnd(row('Dry'), { dataTransfer }));
  });
});
