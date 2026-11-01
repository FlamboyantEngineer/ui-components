import { CalendarGlyph } from '../../core/glyphs.js';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Board, type BoardColumn, type BoardLane } from './board.js';
import { applyColumnMove } from './board-moves.js';

interface Task {
  id: string;
  title: string;
  column: string;
  lane: string;
}

const columns: BoardColumn[] = [
  { id: 'todo', title: 'To do', icon: CalendarGlyph },
  { id: 'done', title: 'Done' },
];
const lanes: BoardLane[] = [
  { id: 'north', title: 'North team', icon: <svg data-mark="north" /> },
  { id: 'south', title: 'South team' },
];
const tasks: Task[] = [{ id: 'soup', title: 'Make soup', column: 'todo', lane: 'north' }];

function TaskBoard({ renderColumnActions }: { renderColumnActions?: (c: BoardColumn) => null }) {
  return (
    <Board
      aria-label="Kitchen"
      columns={columns}
      lanes={lanes}
      items={tasks}
      getColumn={(task) => task.column}
      getLane={(task) => task.lane}
      getTextValue={(task) => task.title}
      renderCard={(task) => task.title}
      renderColumnActions={renderColumnActions}
    />
  );
}

describe('Board header icons', () => {
  it('UIC-BOARD-1.10 draws a decorative icon between the toggle and the title, only when given', () => {
    const { container } = render(<TaskBoard />);
    const columnIcons = container.querySelectorAll('.ui-board__column-icon');
    expect(columnIcons).toHaveLength(1);
    const [icon] = columnIcons;
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.previousElementSibling).toHaveClass('ui-board__column-toggle');
    expect(icon?.nextElementSibling).toHaveClass('ui-board__column-title');
    expect(icon?.closest('.ui-board__column')).toHaveTextContent('To do');

    const laneIcons = container.querySelectorAll('.ui-board__lane-icon');
    expect(laneIcons).toHaveLength(1);
    const [laneIcon] = laneIcons;
    expect(laneIcon).toHaveAttribute('aria-hidden', 'true');
    expect(laneIcon?.querySelector('[data-mark="north"]')).not.toBeNull();
    expect(laneIcon?.previousElementSibling).toHaveClass('ui-board__lane-toggle');
    expect(laneIcon?.nextElementSibling).toHaveClass('ui-board__lane-title');
  });

  it('UIC-BOARD-1.10 keeps the titles alone naming the cells and lanes', () => {
    render(<TaskBoard />);
    expect(screen.getByRole('grid', { name: 'To do North team' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'North team' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse To do' })).toBeInTheDocument();
  });

  it('UIC-BOARD-1.10 hands renderColumnActions the column with its icon', () => {
    const renderColumnActions = vi.fn((_column: BoardColumn) => null);
    render(<TaskBoard renderColumnActions={renderColumnActions} />);
    expect(renderColumnActions).toHaveBeenCalledWith(columns[0]);
    expect(renderColumnActions.mock.calls[0]?.[0]).toHaveProperty('icon', CalendarGlyph);
  });

  it('UIC-BOARD-1.4 UIC-BOARD-1.10 compresses a collapsed header to its icon toggle', async () => {
    const user = userEvent.setup();
    const { container } = render(<CollapsingBoard />);
    const [todo, done] = [...container.querySelectorAll<HTMLElement>('.ui-board__column')];
    const toggle = within(todo as HTMLElement).getByRole('button', { name: 'Expand To do' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveClass('ui-board__column-toggle');
    expect(toggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.ui-board__column-icon')).toBeNull();
    expect(within(todo as HTMLElement).getAllByRole('button')).toEqual([toggle]);
    expect(container.querySelector('.ui-board__column-handle')).toBeNull();
    // The title and count stay in the page, visually hidden, keeping the id that names the cells.
    const title = todo?.querySelector('.ui-board__column-title');
    expect(title?.parentElement).toHaveClass('ui-visually-hidden');
    expect(title?.id).not.toBe('');
    expect(todo).toHaveTextContent('1 card');
    // A column without an icon keeps the chevron.
    const plain = within(done as HTMLElement).getByRole('button', { name: 'Expand Done' });
    expect(plain.querySelector('svg')).not.toBeNull();

    await user.tab();
    expect(toggle).toHaveFocus();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('To do 1 card');
    expect(toggle).toHaveAttribute('aria-describedby', tooltip.id);
  });

  it('UIC-BOARD-1.4 moves a collapsed column with Alt+Arrow keys on its toggle', async () => {
    const user = userEvent.setup();
    const { container } = render(<CollapsingBoard />);
    const toggle = screen.getByRole('button', { name: 'Expand To do' });
    expect(toggle).toHaveAttribute('aria-keyshortcuts', 'Alt+ArrowLeft Alt+ArrowRight');
    toggle.focus();
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    await waitFor(() => expect(toggle).toHaveFocus());
    const titles = [...container.querySelectorAll('.ui-board__column-title')].map(
      (element) => element.textContent,
    );
    expect(titles).toEqual(['Done', 'To do']);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-BOARD-1.4 keeps focus on the toggle as the column expands and collapses', async () => {
    const user = userEvent.setup();
    const { container } = render(<CollapsingBoard />);
    const toggle = screen.getByRole('button', { name: 'Expand To do' });
    await user.click(toggle);
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAccessibleName('Collapse To do');
    expect(container.querySelector('.ui-board__column-icon')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Move column To do' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'To do North team' })).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAccessibleName('Expand To do');
  });
});

function CollapsingBoard() {
  const [current, setCurrent] = useState(columns);
  return (
    <Board
      aria-label="Kitchen"
      columns={current}
      lanes={lanes}
      items={tasks}
      getColumn={(task) => task.column}
      getLane={(task) => task.lane}
      getTextValue={(task) => task.title}
      renderCard={(task) => task.title}
      defaultCollapsedColumns={['todo', 'done']}
      onColumnMove={(move) => setCurrent((list) => applyColumnMove(list, move))}
    />
  );
}
