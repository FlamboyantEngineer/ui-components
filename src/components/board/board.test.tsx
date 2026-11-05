import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, type ReactNode, useState } from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { expectRowMenuReturnsFocus, RowMenuButton } from '../../../test/menu-fixtures.js';
import { SortNoneGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { Button } from '../button/button.js';
import { Board, type BoardColumn, type BoardProps } from './board.js';
import {
  applyBoardMove,
  applyColumnMove,
  type BoardColumnMove,
  type BoardMove,
} from './board-moves.js';

interface Task {
  id: string;
  title: string;
  column: string;
  lane: string;
}

const columns: BoardColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing', limit: 1 },
  { id: 'done', title: 'Done', limit: 5 },
];
const lanes = [
  { id: 'north', title: 'North team' },
  { id: 'south', title: 'South team' },
];
const tasks: Task[] = [
  { id: 'soup', title: 'Make soup', column: 'todo', lane: 'north' },
  { id: 'bread', title: 'Bake bread', column: 'todo', lane: 'north' },
  { id: 'jam', title: 'Boil jam', column: 'doing', lane: 'north' },
  { id: 'tea', title: 'Brew tea', column: 'doing', lane: 'south' },
];

type TaskBoardProps = Partial<BoardProps<Task>>;

const sortAction = (column: BoardColumn, onPress?: () => void) => (
  <Button size="sm" icon={SortNoneGlyph} label={`Sort ${column.title}`} onPress={onPress} />
);

function TaskBoard(props: TaskBoardProps) {
  return (
    <Board
      aria-label="Kitchen"
      columns={columns}
      items={tasks}
      getColumn={(task) => task.column}
      getLane={(task) => task.lane}
      getTextValue={(task) => task.title}
      renderCard={(task) => <strong>{task.title}</strong>}
      {...props}
    />
  );
}

/** Applies each reported move to its own tasks, as an owner does. */
function MovingBoard({ onMove, ...props }: TaskBoardProps) {
  const [items, setItems] = useState(tasks);
  return (
    <TaskBoard
      {...props}
      items={items}
      onMove={(move) => {
        onMove?.(move);
        setItems((current) =>
          applyBoardMove(current, move, (task, cell) => ({
            ...task,
            column: String(cell.column),
            lane: String(cell.lane ?? task.lane),
          })),
        );
      }}
    />
  );
}

function TypedBoard({ onMove }: { onMove: (move: BoardMove) => void }) {
  const [items, setItems] = useState([
    { id: 1 as Key, title: 'Numeric card', column: 1 as Key },
    { id: '1' as Key, title: 'Text card', column: 1 as Key },
  ]);
  const [currentColumns, setColumns] = useState([
    { id: 1 as Key, title: 'Numeric column' },
    { id: '1' as Key, title: 'Text column' },
  ]);
  return (
    <Board
      aria-label="Typed board"
      columns={currentColumns}
      items={items}
      getColumn={(item) => item.column}
      getTextValue={(item) => item.title}
      renderCard={(item) => item.title}
      onMove={(move) => {
        onMove(move);
        setItems((current) =>
          applyBoardMove(current, move, (item, cell) => ({ ...item, column: cell.column })),
        );
      }}
      onColumnMove={(move) => setColumns((current) => applyColumnMove(current, move))}
    />
  );
}

const grid = (name: string) => screen.getByRole('grid', { name });
const cardNames = (name: string) =>
  within(grid(name))
    .queryAllByRole('row')
    .map((row) => row.textContent);

describe('Board', () => {
  it('UIC-BOARD-1.1 returns focus to a control in a card as its menu closes', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <TaskBoard
        onAction={onAction}
        renderCard={(task) => <RowMenuButton label={`More for ${task.title}`} />}
      />,
    );
    await expectRowMenuReturnsFocus(user, 'More for Make soup', async () => {
      act(() => screen.getByRole('row', { name: 'Make soup' }).focus());
      await user.keyboard('{ArrowRight}');
    });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('UIC-BOARD-2.3 UIC-BOARD-3.2 keeps typed card and column identities through moves', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<TypedBoard onMove={onMove} />);
    screen.getByRole('row', { name: 'Text card' }).focus();
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(onMove).toHaveBeenLastCalledWith({
      key: '1',
      column: '1',
      lane: null,
      targetKey: null,
      position: 'after',
    });
    expect(within(grid('Numeric column')).getByRole('row', { name: 'Numeric card' })).toBeVisible();
    const moved = within(grid('Text column')).getByRole('row', { name: 'Text card' });
    await waitFor(() => expect(moved).toHaveFocus());
    const handle = screen.getByRole('button', { name: 'Move column Text column' });
    // A key press ends the card move's focus retries, as the person's next key would.
    await user.keyboard('{Shift}');
    handle.focus();
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    await waitFor(() => expect(handle).toHaveFocus());
    const titles = [...document.querySelectorAll('.ui-board__column-title')].map(
      (element) => element.textContent,
    );
    expect(titles).toEqual(['Text column', 'Numeric column']);
  });

  it('UIC-BOARD-1.8 forwards ref to its root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<TaskBoard ref={ref} />);
    expect(ref.current).toBe(container.querySelector('.ui-board'));
  });

  it('UIC-BOARD-1.1 UIC-BOARD-1.8 UIC-BOARD-4.1 renders columns, cells and cards', async () => {
    const onAction = vi.fn<(key: Key) => void>();
    const { container } = render(
      <TaskBoard id="kitchen" className="mine" data-test="board" onAction={onAction} />,
    );
    const board = screen.getByRole('group', { name: 'Kitchen' });
    expect(board).toHaveClass('ui-board', 'mine');
    expect(board).toHaveAttribute('id', 'kitchen');
    expect(board).toHaveAttribute('data-test', 'board');
    const titles = [...container.querySelectorAll('.ui-board__column-title')].map(
      (node) => node.textContent,
    );
    expect(titles).toEqual(['To do', 'Doing', 'Done']);
    expect(cardNames('To do')).toEqual(['Make soup', 'Bake bread']);
    expect(cardNames('Doing')).toEqual(['Boil jam', 'Brew tea']);
    expect(grid('To do')).toHaveClass('ui-board__cards');
    expect(
      screen
        .getByRole('row', { name: 'Make soup' })
        .querySelector('.ui-board__card-content strong'),
    ).toHaveTextContent('Make soup');
    await userEvent.click(screen.getByRole('row', { name: 'Bake bread' }));
    expect(onAction).toHaveBeenCalledWith('bread');
    expectHooksMatchSpec(container, 'BOARD', {
      slots: [
        'columns',
        'column',
        'column-toggle',
        'column-title',
        'column-count',
        'cells',
        'cell',
        'cards',
        'card',
        'card-content',
        'empty',
      ],
      callerAttributes: ['data-test'],
    });
  });

  it('UIC-BOARD-1.2 shows counts against limits and marks columns over their limit', () => {
    const { container } = render(<TaskBoard />);
    const headers = [...container.querySelectorAll('.ui-board__column')];
    const counts = headers.map((header) => header.querySelector('.ui-board__column-count'));
    expect(counts.map((count) => count?.querySelector('[aria-hidden]')?.textContent)).toEqual([
      '2',
      '2/1',
      '0/5',
    ]);
    expect(counts.map((count) => count?.querySelector('.ui-visually-hidden')?.textContent)).toEqual(
      ['2 cards', '2 cards, over the limit of 1', '0 cards, limit 5'],
    );
    expect(headers[1]).toHaveAttribute('data-over-limit', 'true');
    expect(headers[0]).not.toHaveAttribute('data-over-limit');
    const cells = container.querySelectorAll('.ui-board__cell');
    expect(cells[1]).toHaveAttribute('data-over-limit', 'true');
  });

  it('UIC-BOARD-1.2 UIC-BOARD-1.3 shows counts in the provider locale digits', () => {
    const { container } = render(
      <UiProvider locale="ar-EG">
        <TaskBoard lanes={lanes} />
      </UiProvider>,
    );
    const shown = (slot: string) =>
      [...container.querySelectorAll(`.ui-board__${slot} [aria-hidden]`)].map(
        (count) => count.textContent,
      );
    expect(shown('column-count')).toEqual(['٢', '٢/١', '٠/٥']);
    expect(shown('lane-count')).toEqual(['٣', '١']);
  });

  it('UIC-BOARD-1.3 UIC-BOARD-4.1 repeats the columns in named lanes', () => {
    const { container } = render(<TaskBoard lanes={lanes} />);
    const north = screen.getByRole('group', { name: 'North team' });
    expect(north).toHaveClass('ui-board__lane');
    expect(within(north).getByRole('grid', { name: 'To do North team' })).toBeInTheDocument();
    expect(cardNames('Doing South team')).toEqual(['Brew tea']);
    expect(north.querySelector('.ui-board__lane-count .ui-visually-hidden')).toHaveTextContent(
      '3 cards',
    );
    expectHooksMatchSpec(container, 'BOARD', {
      slots: ['lane', 'lane-header', 'lane-toggle', 'lane-title', 'lane-count'],
    });
  });

  it('UIC-BOARD-1.4 collapses columns and lanes, remembering them under a persist key', async () => {
    const storage = createMemoryStorage();
    const user = userEvent.setup();
    const { container, unmount } = render(
      <UiProvider storage={storage}>
        <TaskBoard lanes={lanes} persistKey="kitchen" />
      </UiProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Collapse Doing' }));
    const doing = container.querySelectorAll('.ui-board__column')[1];
    expect(doing).toHaveAttribute('data-collapsed', 'true');
    expect(screen.getByRole('button', { name: 'Expand Doing' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('grid', { name: 'Doing North team' })).toHaveTextContent('Boil jam');
    expect(container.querySelectorAll('.ui-board__cell[data-collapsed]')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Collapse South team' }));
    expect(screen.getByRole('group', { name: 'South team' })).toHaveAttribute(
      'data-collapsed',
      'true',
    );
    expect(screen.queryByRole('grid', { name: 'To do South team' })).not.toBeInTheDocument();
    expect(storage.getItem('kitchen:columns')).toBe('["doing"]');
    expect(storage.getItem('kitchen:lanes')).toBe('["south"]');
    unmount();
    render(
      <UiProvider storage={storage}>
        <TaskBoard lanes={lanes} persistKey="kitchen" />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Expand Doing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand South team' })).toBeInTheDocument();
  });

  it.each(['{}', '[null]', '["doing",{}]', '{'])(
    'UIC-BOARD-1.4 starts from the default collapsed keys when %s is stored',
    async (raw) => {
      const storage = createMemoryStorage({ 'kitchen:columns': raw, 'kitchen:lanes': raw });
      const user = userEvent.setup();
      render(
        <UiProvider storage={storage}>
          <TaskBoard lanes={lanes} persistKey="kitchen" defaultCollapsedLanes={['south']} />
        </UiProvider>,
      );
      expect(screen.getByRole('button', { name: 'Collapse Doing' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Expand South team' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Collapse Doing' }));
      expect(storage.getItem('kitchen:columns')).toBe('["doing"]');
    },
  );

  it('UIC-BOARD-1.4 restores stored numeric and text keys as distinct keys', () => {
    const storage = createMemoryStorage({ 'kitchen:lanes': '[1]' });
    render(
      <UiProvider storage={storage}>
        <TaskBoard
          lanes={[
            { id: 1, title: 'Numbered team' },
            { id: '1', title: 'Named team' },
          ]}
          persistKey="kitchen"
        />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Expand Numbered team' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse Named team' })).toBeInTheDocument();
  });

  it('UIC-BOARD-1.4 follows controlled collapsed columns and lanes', async () => {
    const onCollapsedColumnsChange = vi.fn<(keys: Set<Key>) => void>();
    const onCollapsedLanesChange = vi.fn<(keys: Set<Key>) => void>();
    render(
      <TaskBoard
        lanes={lanes}
        collapsedColumns={['todo']}
        onCollapsedColumnsChange={onCollapsedColumnsChange}
        defaultCollapsedLanes={['north']}
        onCollapsedLanesChange={onCollapsedLanesChange}
      />,
    );
    expect(screen.getByRole('group', { name: 'North team' })).toHaveAttribute(
      'data-collapsed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Expand To do' }));
    expect(onCollapsedColumnsChange).toHaveBeenCalledWith(new Set());
    expect(screen.getByRole('button', { name: 'Expand To do' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Expand North team' }));
    expect(onCollapsedLanesChange).toHaveBeenCalledWith(new Set());
    expect(screen.getByRole('group', { name: 'North team' })).not.toHaveAttribute('data-collapsed');
  });

  it('UIC-BOARD-1.5 draws an empty state in a cell without cards', () => {
    render(<TaskBoard />);
    const done = grid('Done');
    expect(done).toHaveAttribute('data-empty', 'true');
    expect(done.querySelector('.ui-board__empty')).toHaveTextContent('No cards');
  });

  it('UIC-BOARD-1.6 adds cards to the cell whose button is pressed', async () => {
    const onAddCard = vi.fn();
    const { container, rerender } = render(<TaskBoard lanes={lanes} onAddCard={onAddCard} />);
    const buttons = screen.getAllByRole('button', { name: 'Add card' });
    expect(buttons).toHaveLength(6);
    expect(buttons[4]).toHaveClass('ui-board__add', 'ui-button');
    expect(buttons[4]).toHaveAccessibleDescription('Doing South team');
    await userEvent.click(buttons[4] as HTMLElement);
    expect(onAddCard).toHaveBeenCalledWith({ column: 'doing', lane: 'south' });
    expectHooksMatchSpec(container, 'BOARD', { slots: ['add'] });
    rerender(<TaskBoard lanes={lanes} />);
    expect(screen.queryByRole('button', { name: 'Add card' })).not.toBeInTheDocument();
  });

  // Laying out a virtual list in jsdom is slow on a busy machine.
  it('UIC-BOARD-1.7 renders only the cards in view when virtualized', { timeout: 15_000 }, () => {
    const sizes = { clientWidth: 300, clientHeight: 300, scrollHeight: 80 };
    for (const [name, value] of Object.entries(sizes)) {
      Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get: () => value });
    }
    const many = Array.from({ length: 300 }, (_, index) => ({
      id: `task-${index}`,
      title: `Task ${index}`,
      column: 'todo',
      lane: 'north',
    }));
    try {
      const { container } = render(<TaskBoard items={many} virtualized />);
      expect(container.querySelector('.ui-board')).toHaveAttribute('data-virtualized', 'true');
      expect(grid('To do')).toHaveAttribute('data-virtualized', 'true');
      const rows = within(grid('To do')).getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.length).toBeLessThan(40);
    } finally {
      for (const name of Object.keys(sizes)) {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[name];
      }
    }
  });

  it('UIC-BOARD-2.2 draws drag handles only while the board takes moves, keeping the cards mounted', () => {
    const { container, rerender } = render(<TaskBoard onMove={vi.fn()} />);
    const card = screen.getByRole('row', { name: 'Make soup' });
    expect(card.closest('.ui-board__cards')).toHaveAttribute('data-reordering', 'true');
    expect(card.querySelector('.ui-board__card-handle')).toHaveClass('ui-drag-handle');
    expectHooksMatchSpec(container, 'BOARD', { slots: ['card-handle'] });
    rerender(<TaskBoard />);
    expect(screen.getByRole('row', { name: 'Make soup' })).toBe(card);
    expect(card.closest('.ui-board__cards')).not.toHaveAttribute('data-reordering');
    expect(card).not.toHaveAttribute('draggable');
    expect(container.querySelector('.ui-board__card-handle')).toBeNull();
    rerender(<TaskBoard onMove={vi.fn()} />);
    expect(screen.getByRole('row', { name: 'Make soup' })).toBe(card);
    expect(card.querySelector('.ui-board__card-handle')).not.toBeNull();
  });

  it(
    'UIC-BOARD-2.2 moves a card to another column by keyboard drag and drop',
    { timeout: 15_000 },
    async () => {
      const onMove = vi.fn<(move: BoardMove) => void>();
      render(<MovingBoard onMove={onMove} />);
      const user = userEvent.setup();
      screen.getByRole('row', { name: 'Make soup' }).focus();
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('button', { name: 'Drag Make soup' })).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(document.querySelectorAll('.ui-board__drop-indicator[data-drop-target]')).toHaveLength(
        1,
      );
      await user.keyboard('{Tab}{Enter}');
      expect(onMove).toHaveBeenCalledTimes(1);
      const move = onMove.mock.lastCall?.[0];
      expect(move?.key).toBe('soup');
      expect(move?.column).toBe('doing');
      expect(cardNames('Doing')).toContain('Make soup');
      expect(cardNames('To do')).toEqual(['Bake bread']);
    },
  );

  it('UIC-BOARD-2.3 moves the focused card with Alt+Arrow keys and keeps focus on it', async () => {
    const onMove = vi.fn<(move: BoardMove) => void>();
    render(<MovingBoard lanes={lanes} onMove={onMove} />);
    const user = userEvent.setup();
    const soup = () => screen.getByRole('row', { name: 'Make soup' });
    expect(soup()).toHaveAttribute(
      'aria-keyshortcuts',
      'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight',
    );
    act(() => soup().focus());
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(onMove).toHaveBeenLastCalledWith({
      key: 'soup',
      column: 'todo',
      lane: 'north',
      targetKey: 'bread',
      position: 'after',
    });
    expect(cardNames('To do North team')).toEqual(['Bake bread', 'Make soup']);
    expect(soup()).toHaveFocus();
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(onMove).toHaveBeenLastCalledWith({
      key: 'soup',
      column: 'doing',
      lane: 'north',
      targetKey: 'jam',
      position: 'after',
    });
    expect(cardNames('Doing North team')).toEqual(['Boil jam', 'Make soup']);
    await waitFor(() => expect(soup()).toHaveFocus());
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(onMove).toHaveBeenCalledTimes(2);
  });

  it('UIC-BOARD-2.3 leaves Alt+Arrow to a plaintext-only editable in a card', () => {
    const onMove = vi.fn<(move: BoardMove) => void>();
    render(
      <TaskBoard
        onMove={onMove}
        renderCard={(task) => (
          <span contentEditable="plaintext-only" aria-label={`${task.title} notes`} />
        )}
      />,
    );
    for (const key of ['ArrowDown', 'ArrowRight']) {
      const event = new KeyboardEvent('keydown', {
        key,
        altKey: true,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        screen.getByLabelText('Make soup notes').dispatchEvent(event);
      });
    }
    expect(onMove).not.toHaveBeenCalled();
  });

  it('UIC-BOARD-2.3 mirrors keyboard moves right to left', async () => {
    const onMove = vi.fn<(move: BoardMove) => void>();
    render(
      <UiProvider locale="ar-EG">
        <TaskBoard onMove={onMove} />
      </UiProvider>,
    );
    act(() => screen.getByRole('row', { name: 'Make soup' }).focus());
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expect(onMove).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: 'soup', column: 'doing' }),
    );
  });

  it('UIC-BOARD-2.3 leaves focus where the reader moves it during a pending move repair', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const user = userEvent.setup();
    try {
      render(<MovingBoard />);
      act(() => screen.getByRole('row', { name: 'Make soup' }).focus());
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
      const other = screen.getByRole('row', { name: 'Bake bread' });
      await user.click(other);
      act(() => {
        vi.advanceTimersByTime(16 * 5);
      });
      expect(other).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it('UIC-BOARD-3.1 UIC-DRAG-INTERACTIONS-2.3 offers column handles only while the board takes column moves', () => {
    const { container, rerender } = render(<TaskBoard onColumnMove={vi.fn()} />);
    const handle = screen.getByRole('button', { name: 'Move column Doing' });
    expect(handle).toHaveClass('ui-board__column-handle', 'ui-button');
    expect(container.querySelector('.ui-board__column')).toHaveAttribute('draggable', 'true');
    expectHooksMatchSpec(container, 'BOARD', { slots: ['column-handle'] });
    rerender(<TaskBoard />);
    expect(container.querySelector('.ui-board__column-handle')).toBeNull();
    expect(container.querySelector('.ui-board__column')).not.toHaveAttribute('draggable');
  });

  it('UIC-BOARD-3.2 UIC-DRAG-INTERACTIONS-2.3 drags a column by keyboard to an accepted target', async () => {
    const user = userEvent.setup();
    const onColumnMove = vi.fn<(move: BoardColumnMove) => void>();
    const { container } = render(<TaskBoard onColumnMove={onColumnMove} />);
    act(() => screen.getByRole('button', { name: 'Move column To do' }).focus());
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(container.querySelectorAll('.ui-board__column[data-drop-target]')).toHaveLength(1),
    );
    await user.keyboard('{Tab}{Enter}');
    expect(onColumnMove).toHaveBeenCalledExactlyOnceWith({
      key: 'todo',
      targetKey: 'done',
      position: 'after',
    });
  });

  it('UIC-BOARD-3.2 publishes the column handle chords and its keyboard drag description', () => {
    render(<TaskBoard onColumnMove={vi.fn()} />);
    const handle = screen.getByRole('button', { name: 'Move column To do' });
    expect(handle).toHaveAttribute('aria-keyshortcuts', 'Alt+ArrowLeft Alt+ArrowRight');
    expect(handle).toHaveAccessibleDescription(/\S/);
  });

  it('UIC-BOARD-3.2 moves a column with Alt+Arrow keys on its handle', async () => {
    const onColumnMove = vi.fn<(move: BoardColumnMove) => void>();
    function Reordering() {
      const [order, setOrder] = useState(columns);
      return (
        <TaskBoard
          columns={order}
          onColumnMove={(move) => {
            onColumnMove(move);
            setOrder((current) => applyColumnMove(current, move));
          }}
        />
      );
    }
    const { container } = render(<Reordering />);
    const user = userEvent.setup();
    act(() => screen.getByRole('button', { name: 'Move column To do' }).focus());
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(onColumnMove).toHaveBeenLastCalledWith({
      key: 'todo',
      targetKey: 'doing',
      position: 'after',
    });
    const titles = () =>
      [...container.querySelectorAll('.ui-board__column-title')].map((node) => node.textContent);
    expect(titles()).toEqual(['Doing', 'To do', 'Done']);
    expect(screen.getByRole('button', { name: 'Move column To do' })).toHaveFocus();
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}{Alt>}{ArrowLeft}{/Alt}');
    expect(titles()).toEqual(['To do', 'Doing', 'Done']);
    expect(onColumnMove).toHaveBeenCalledTimes(2);
  });

  it("UIC-BOARD-1.9 draws each column's actions from its own column entry, or no slot", () => {
    expectTypeOf<NonNullable<BoardProps<Task>['renderColumnActions']>>().toEqualTypeOf<
      (column: BoardColumn) => ReactNode
    >();
    const renderColumnActions = vi.fn((column: BoardColumn) =>
      column.id === 'done' ? null : sortAction(column),
    );
    const { container, rerender } = render(
      <TaskBoard onColumnMove={vi.fn()} renderColumnActions={renderColumnActions} />,
    );
    expect(renderColumnActions.mock.calls.map(([column]) => column)).toEqual(
      expect.arrayContaining(columns),
    );
    expect(renderColumnActions.mock.calls.every(([column]) => columns.includes(column))).toBe(true);
    const headers = [...container.querySelectorAll('.ui-board__column')];
    const slots = headers.map((header) => header.querySelector('.ui-board__column-actions'));
    expect(slots[0]?.previousElementSibling).toHaveClass('ui-board__column-count');
    expect(within(slots[1] as HTMLElement).getByRole('button')).toHaveAccessibleName('Sort Doing');
    expect(slots[2]).toBeNull();
    expectHooksMatchSpec(container, 'BOARD', { slots: ['column-handle', 'column-actions'] });
    rerender(<TaskBoard />);
    expect(container.querySelector('.ui-board__column-actions')).toBeNull();
  });

  it('UIC-BOARD-1.9 reaches actions by keyboard without collapsing the column or activating a card', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    const onAction = vi.fn();
    const onCollapsedColumnsChange = vi.fn();
    const { container } = render(
      <TaskBoard
        columns={columns.slice(0, 1)}
        defaultCollapsedColumns={[]}
        onAction={onAction}
        onCollapsedColumnsChange={onCollapsedColumnsChange}
        renderColumnActions={(column) => sortAction(column, () => onSort(column.id))}
      />,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Collapse To do' })).toHaveFocus();
    await user.tab();
    const sort = screen.getByRole('button', { name: 'Sort To do' });
    expect(sort).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.click(sort);
    expect(onSort).toHaveBeenCalledTimes(3);
    expect(onSort).toHaveBeenLastCalledWith('todo');
    expect(onCollapsedColumnsChange).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
    expect(container.querySelector('.ui-board__column')).not.toHaveAttribute('data-collapsed');
  });

  it('UIC-BOARD-1.4 UIC-BOARD-1.9 drops the actions of a collapsed column until it expands', async () => {
    const user = userEvent.setup();
    render(<TaskBoard defaultCollapsedColumns={['doing']} renderColumnActions={sortAction} />);
    expect(screen.queryByRole('button', { name: 'Sort Doing' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort To do' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Expand Doing' }));
    expect(screen.getByRole('button', { name: 'Sort Doing' })).toBeVisible();
  });

  it('UIC-BOARD-1.9 UIC-BOARD-3.1 refuses a column drag that starts in the actions', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TaskBoard onColumnMove={vi.fn()} renderColumnActions={sortAction} />,
    );
    const header = container.querySelector('.ui-board__column') as HTMLElement;
    await user.pointer({
      keys: '[MouseLeft>]',
      target: screen.getByRole('button', { name: 'Sort To do' }),
    });
    const refused = createEvent.dragStart(header);
    fireEvent(header, refused);
    expect(refused.defaultPrevented).toBe(true);
    expect(header).not.toHaveAttribute('data-dragging');
    await user.pointer({ keys: '[/MouseLeft]' });
    await user.pointer({ keys: '[MouseLeft>]', target: screen.getByText('To do') });
    const dataTransfer = {
      clearData: () => {},
      setData: () => {},
      setDragImage: () => {},
      items: { add: () => {} },
    };
    const allowed = createEvent.dragStart(header, { dataTransfer });
    fireEvent(header, allowed);
    expect(allowed.defaultPrevented).toBe(false);
    await user.pointer({ keys: '[/MouseLeft]' });
  });
});
