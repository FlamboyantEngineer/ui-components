import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Board, type BoardCardState, type BoardColumn } from './board.js';
import { applyBoardMove } from './board-moves.js';

interface Task {
  id: string;
  title: string;
  column: string;
}

const columns: BoardColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
];
const tasks: Task[] = [
  { id: 'soup', title: 'Make soup', column: 'todo' },
  { id: 'bread', title: 'Bake bread', column: 'doing' },
  { id: 'jam', title: 'Boil jam', column: 'doing' },
];

interface CollapsingBoardProps {
  onAction?: (key: unknown) => void;
  onAddCard?: () => void;
  renderCard?: (task: Task, state: BoardCardState) => string;
}

/** A board whose Doing and Done columns start collapsed, applying each move it reports. */
function CollapsingBoard({ onAction, onAddCard, renderCard }: CollapsingBoardProps) {
  const [items, setItems] = useState(tasks);
  return (
    <Board
      aria-label="Kitchen"
      columns={columns}
      items={items}
      getColumn={(task) => task.column}
      getTextValue={(task) => task.title}
      renderCard={renderCard ?? ((task) => task.title)}
      defaultCollapsedColumns={['doing', 'done']}
      onAction={onAction}
      onAddCard={onAddCard}
      onMove={(move) =>
        setItems((current) =>
          applyBoardMove(current, move, (task, cell) => ({ ...task, column: String(cell.column) })),
        )
      }
    />
  );
}

const cardNames = (column: string) =>
  within(screen.getByRole('grid', { name: column }))
    .queryAllByRole('row')
    .map((row) => row.textContent);

describe('Board collapsed columns', () => {
  it("UIC-BOARD-1.4 keeps a collapsed column's cards, telling renderCard it is collapsed", () => {
    const renderCard = vi.fn(
      (task: Task, { isColumnCollapsed }: BoardCardState) =>
        `${task.title}${isColumnCollapsed ? ' (narrow)' : ''}`,
    );
    const { container } = render(<CollapsingBoard renderCard={renderCard} onAddCard={vi.fn()} />);
    const doing = screen.getByRole('grid', { name: 'Doing' });
    expect(doing.closest('.ui-board__cell')).toHaveAttribute('data-collapsed', 'true');
    expect(cardNames('Doing')).toEqual(['Bake bread (narrow)', 'Boil jam (narrow)']);
    expect(cardNames('To do')).toEqual(['Make soup']);
    // The collapsed column's cards and their content carry the state; the open column's do not.
    for (const row of within(doing).getAllByRole('row')) {
      expect(row).toHaveAttribute('data-collapsed', 'true');
      expect(row.querySelector('.ui-board__card-content')).toHaveAttribute(
        'data-collapsed',
        'true',
      );
    }
    const open = screen.getByRole('grid', { name: 'To do' });
    expect(within(open).getByRole('row')).not.toHaveAttribute('data-collapsed');
    expect(renderCard).toHaveBeenCalledWith(tasks[0], { isColumnCollapsed: false });
    // A collapsed cell draws no add-card button, and without cards no empty state.
    expect(screen.getAllByRole('button', { name: 'Add card' })).toHaveLength(1);
    const done = screen.getByRole('grid', { name: 'Done' });
    expect(done.closest('.ui-board__cell')).toHaveAttribute('data-collapsed', 'true');
    expect(within(done).queryByText('No cards')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.ui-board__empty')).toHaveLength(0);
  });

  it('UIC-BOARD-1.4 keeps collapsed cards focusable and activatable, and mounted on expand', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<CollapsingBoard onAction={onAction} />);
    const bread = screen.getByRole('row', { name: 'Bake bread' });
    await user.click(bread);
    expect(onAction).toHaveBeenLastCalledWith('bread');
    bread.focus();
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: 'Expand Doing' }));
    expect(screen.getByRole('row', { name: 'Bake bread' })).toBe(bread);
    await user.click(screen.getByRole('button', { name: 'Collapse Doing' }));
    expect(screen.getByRole('row', { name: 'Bake bread' })).toBe(bread);
  });

  it('UIC-BOARD-2.3 moves a card into and out of a collapsed column with Alt+Arrow keys', async () => {
    const user = userEvent.setup();
    render(<CollapsingBoard />);
    screen.getByRole('row', { name: 'Make soup' }).focus();
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(cardNames('Doing')).toEqual(['Make soup', 'Bake bread', 'Boil jam']);
    await waitFor(() => expect(screen.getByRole('row', { name: 'Make soup' })).toHaveFocus());
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(cardNames('Done')).toEqual(['Make soup']);
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expect(cardNames('To do')).toEqual(['Make soup']);
  });
});
