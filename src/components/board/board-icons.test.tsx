import { CalendarGlyph } from '../../core/glyphs.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Board, type BoardColumn, type BoardLane } from './board.js';

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
});
