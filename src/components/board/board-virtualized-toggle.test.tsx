import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Key } from '../../core/props.js';
import { Board, type BoardColumn } from './board.js';

interface Note {
  id: Key;
  title: string;
}

const columns: BoardColumn[] = [{ id: 1, title: 'Open' }];
const notes: Note[] = [
  { id: 1, title: 'Alpha' },
  { id: '1', title: 'Blue' },
];

function NoteBoard({ items = notes, virtualized }: { items?: Note[]; virtualized: boolean }) {
  return (
    <Board
      aria-label="Notes"
      columns={columns}
      items={items}
      getColumn={() => 1}
      getTextValue={(note) => note.title}
      renderCard={(note) => (
        <input aria-label={`${note.title} draft`} defaultValue={`Draft ${note.title}`} />
      )}
      onMove={() => {}}
      virtualized={virtualized}
    />
  );
}

describe('Board virtualization toggle', () => {
  it('UIC-BOARD-1.7 keeps the cards, their focus and their state when virtualization turns on and off', async () => {
    const { rerender } = render(<NoteBoard virtualized={false} />);
    const user = userEvent.setup();
    const field = screen.getByRole('textbox', { name: 'Blue draft' });
    const row = screen.getByRole('row', { name: 'Blue' });
    await user.click(field);
    await user.clear(field);
    await user.type(field, 'Unsaved edit');
    const added = [...notes, { id: 2, title: 'Gamma' }];
    for (const [virtualized, items] of [
      [true, added],
      [false, added],
      [true, notes],
    ] as const) {
      rerender(<NoteBoard virtualized={virtualized} items={items} />);
      expect(screen.getByRole('row', { name: 'Blue' })).toBe(row);
      expect(screen.getByRole('textbox', { name: 'Blue draft' })).toBe(field);
      expect(field).toHaveValue('Unsaved edit');
      expect(field).toHaveFocus();
    }
    expect(screen.getByRole('textbox', { name: 'Alpha draft' })).toHaveValue('Draft Alpha');
  });

  it('UIC-BOARD-1.7 keeps a focused card focused when virtualization turns on', () => {
    const { rerender } = render(<NoteBoard virtualized={false} />);
    const row = screen.getByRole('row', { name: 'Alpha' });
    act(() => row.focus());
    rerender(<NoteBoard virtualized />);
    expect(screen.getByRole('row', { name: 'Alpha' })).toBe(row);
    expect(row).toHaveFocus();
  });
});

describe('Board scroll frames', () => {
  it('UIC-BOARD-1.1 UIC-BOARD-1.7 sets the rows in a sideways viewport and each list in a frame', () => {
    const { rerender } = render(<NoteBoard virtualized={false} />);
    const grid = screen.getByRole('grid', { name: 'Open' });
    expect(grid.closest('.ui-board__viewport')).toHaveClass('ui-scroll-region');
    const frame = grid.parentElement;
    expect(frame).toHaveClass('ui-board__list');
    expect(frame).not.toHaveAttribute('data-virtualized');
    rerender(<NoteBoard virtualized />);
    expect(screen.getByRole('grid', { name: 'Open' }).parentElement).toBe(frame);
    expect(frame).toHaveAttribute('data-virtualized', 'true');
  });
});
