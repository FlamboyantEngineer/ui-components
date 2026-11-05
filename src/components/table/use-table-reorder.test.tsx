import { act, createEvent, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { type UserEvent, userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { Table } from './table.js';
import { applyTableMove, type TableMove } from './table-rows.js';
import { type TableReorderOptions, useTableReorder } from './use-table-reorder.js';

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

/** Presses and holds a mouse button at a position across the row; `release` lets it go. */
function press(user: UserEvent, target: Element, x: number, button = 'MouseLeft') {
  return user.pointer({ keys: `[${button}>]`, target, coords: { clientX: x, clientY: 10 } });
}

function release(user: UserEvent, button = 'MouseLeft') {
  return user.pointer({ keys: `[/${button}]` });
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
    expect(container.querySelector('.ui-table')).toHaveAttribute('data-reordering', 'true');
    expectHooksMatchSpec(container, 'TABLE', { slots: ['drag-handle'] });
  });

  it('UIC-TABLE-5.1 keeps the rows mounted while reordering or grouping turns on and off', async () => {
    const user = userEvent.setup();
    const table = (options: { reorder: boolean; grouped: boolean }) => (
      <Table
        aria-label="Tasks"
        rows={tasks}
        columns={[{ id: 'title', header: 'Title' }]}
        selectionMode="multiple"
        defaultSelectedKeys={['dry']}
        groupBy={options.grouped ? ['title'] : []}
        reorder={options.reorder ? { onMove: vi.fn() } : undefined}
      />
    );
    const { container, rerender } = render(table({ reorder: false, grouped: false }));
    const root = container.querySelector('.ui-table');
    const dry = row('Dry');
    await user.click(screen.getByRole('rowheader', { name: 'Wash' }));
    const focused = document.activeElement;
    expect(row('Wash').contains(focused)).toBe(true);
    expect(root).not.toHaveAttribute('data-reordering');
    rerender(table({ reorder: true, grouped: false }));
    expect(row('Dry')).toBe(dry);
    expect(focused).toHaveFocus();
    expect(root).toHaveAttribute('data-reordering', 'true');
    expect(dry.querySelector('.ui-table__drag-handle')).toBeEnabled();
    rerender(table({ reorder: true, grouped: true }));
    expect(root).not.toHaveAttribute('data-reordering');
    expect(row('Dry').querySelector('.ui-table__drag-handle')).toBeNull();
    const grid = screen.getByRole('treegrid');
    rerender(table({ reorder: true, grouped: false }));
    expect(screen.getByRole('grid')).toBe(grid);
    expect(root).toHaveAttribute('data-reordering', 'true');
    const ungrouped = row('Dry');
    rerender(table({ reorder: false, grouped: false }));
    expect(root).not.toHaveAttribute('data-reordering');
    expect(row('Dry')).toBe(ungrouped);
    expect(ungrouped.querySelector('.ui-table__drag-handle')).toBeNull();
    expect(ungrouped).toHaveAttribute('aria-selected', 'true');
    expect(ungrouped).not.toHaveAttribute('draggable');
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

  it('UIC-TABLE-5.3 leaves Alt+Arrow to a text control inside a row', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <Table
        aria-label="Tasks"
        rows={tasks}
        columns={[
          { id: 'title', header: 'Title' },
          {
            id: 'note',
            header: 'Note',
            renderCell: (task) => <input aria-label={`Note for ${task.title}`} />,
          },
        ]}
        reorder={{ onMove }}
      />,
    );
    const note = screen.getByRole('textbox', { name: 'Note for Dry' });
    await user.click(note);
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}{Alt>}{ArrowUp}{/Alt}');
    expect(onMove).not.toHaveBeenCalled();
    expect(note).toHaveFocus();
  });

  it("UIC-TABLE-5.3 leaves Alt+Arrow to the table's own cell editor in a reorderable table", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <Table
        aria-label="Tasks"
        rows={tasks}
        columns={[
          { id: 'title', header: 'Title' },
          { id: 'id', header: 'Code', allowsEditing: true },
        ]}
        reorder={{ onMove }}
        onCellEdit={vi.fn()}
      />,
    );
    act(() => screen.getByRole('gridcell', { name: 'dry' }).focus());
    await user.keyboard('{F2}');
    const editor = screen.getByRole('textbox', { name: 'Code' });
    expect(editor).toHaveFocus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}{Alt>}{ArrowUp}{/Alt}');
    expect(onMove).not.toHaveBeenCalled();
    expect(editor).toHaveFocus();
  });

  it('UIC-TABLE-5.5 drags a row by its handle only', async () => {
    const user = userEvent.setup();
    render(<Tasks onMove={() => {}} reorder={{ dragTrigger: 'handle' }} />);
    const wash = row('Wash');
    expect(wash).not.toHaveAttribute('draggable');
    placeHandle('Wash');
    const cell = screen.getByRole('rowheader', { name: /Wash/ });
    await press(user, cell, 60);
    expect(wash).not.toHaveAttribute('draggable');
    await release(user);
    await press(user, cell, 10, 'MouseRight');
    expect(wash).not.toHaveAttribute('draggable');
    await release(user, 'MouseRight');
    await press(user, cell, 10);
    expect(wash).toHaveAttribute('draggable', 'true');
    await release(user);
    expect(wash).not.toHaveAttribute('draggable');
    await press(user, cell, 10);
    fireEvent(wash, createEvent.dragEnd(wash, { dataTransfer: { dropEffect: 'none' } }));
    expect(wash).not.toHaveAttribute('draggable');
    await release(user);
    placeHandle('Pinned');
    await press(user, screen.getByRole('rowheader', { name: /Pinned/ }), 10);
    expect(row('Pinned')).not.toHaveAttribute('draggable');
    await release(user);
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

  it('UIC-TABLE-5.2 moves only the dragged rows that may move now', () => {
    const onMove = vi.fn();
    const disabled = new Set(['dry']);
    const { result } = renderHook(() =>
      useTableReorder<Task>({
        rows: tasks,
        reorder: { canMove: (row) => !row.isPinned, onMove },
        isRowDisabled: (row) => disabled.has(row.id),
      }),
    );
    const drop = (keys: string[]) =>
      result.current.dragAndDrop.onMove?.({
        type: 'move',
        target: { type: 'item', key: toCollectionKey('fold'), dropPosition: 'after' },
        keys: new Set(keys.map(toCollectionKey)),
        dropOperation: 'move',
        x: 0,
        y: 0,
        isInternal: true,
        items: [],
      } as never);
    void drop(['wash', 'pinned', 'dry', 'gone']);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenLastCalledWith({
      keys: ['wash'],
      targetKey: 'fold',
      position: 'after',
    });
    void drop(['pinned', 'dry']);
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('UIC-TABLE-5.2 drops nothing when the dragged row is disabled mid-drag', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const { rerender } = render(<Tasks onMove={onMove} />);
    row('Wash').focus();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(row('Wash')).toHaveAttribute('data-dragging', 'true');
    rerender(<Tasks onMove={onMove} reorder={{ canMove: (task) => task.id !== 'wash' }} />);
    await user.keyboard('{Enter}');
    expect(onMove).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
  });

  it("UIC-TABLE-5.1 carries the dragged rows' own ids as their text", () => {
    const { result } = renderHook(() =>
      useTableReorder({
        rows: [{ id: 'a b' }, { id: 1 }],
        reorder: { onMove() {} },
        isRowDisabled: () => false,
      }),
    );
    const keys = new Set([toCollectionKey('a b'), toCollectionKey(1)]);
    expect(result.current.dragAndDrop.getItems(keys)).toEqual([
      { 'text/plain': 'a b' },
      { 'text/plain': '1' },
    ]);
  });

  it('UIC-TABLE-5.6 draws the preview from the dragged row only, beside a row of the same spelling', () => {
    const rows = [
      { id: 1, title: 'Numeric' },
      { id: '1', title: 'Text' },
    ];
    render(
      <Table
        aria-label="Typed"
        rows={rows}
        columns={[{ id: 'title', header: 'Title' }]}
        reorder={{ onMove: () => {}, renderDragPreview: (dragged) => dragged[0]?.title }}
      />,
    );
    const setDragImage = vi.fn();
    const dataTransfer = {
      clearData: () => {},
      setData: () => {},
      setDragImage,
      items: { add: () => {} },
      dropEffect: 'none',
      effectAllowed: 'all',
    };
    fireEvent(row('Text'), createEvent.dragStart(row('Text'), { dataTransfer }));
    const preview = (setDragImage.mock.lastCall?.[0] as HTMLElement)
      .firstElementChild as HTMLElement;
    expect(preview).toHaveAttribute('data-count', '1');
    expect(preview).toHaveTextContent('Text');
    fireEvent(row('Text'), createEvent.dragEnd(row('Text'), { dataTransfer }));
  });
});
