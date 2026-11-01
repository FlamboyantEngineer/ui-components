import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Board, type BoardColumn } from './board.js';
import type { BoardMove } from './board-moves.js';

interface Note {
  id: string;
  title: string;
  column: string;
}

const columns: BoardColumn[] = [
  { id: 'open', title: 'Open' },
  { id: 'closed', title: 'Closed' },
];
const notes: Note[] = [
  { id: 'a', title: 'Alpha', column: 'open' },
  { id: 'b', title: 'Blue', column: 'open' },
];

const controls: Record<string, (note: Note) => ReactNode> = {
  'a native input': (note) => <input aria-label={`Notes ${note.id}`} defaultValue="draft" />,
  'plaintext-only editable content': (note) => (
    <div contentEditable="plaintext-only" role="textbox" aria-label={`Notes ${note.id}`} />
  ),
  'an element with role textbox': (note) => (
    <div role="textbox" tabIndex={0} aria-label={`Notes ${note.id}`} />
  ),
};

function NoteBoard({
  renderControl,
  onMove,
}: {
  renderControl: (note: Note) => ReactNode;
  onMove?: (move: BoardMove) => void;
}) {
  return (
    <Board
      aria-label="Notes"
      columns={columns}
      items={notes}
      getColumn={(note) => note.column}
      getTextValue={(note) => note.title}
      renderCard={(note) => (
        <>
          <button type="button">Open {note.title}</button>
          {renderControl(note)}
        </>
      )}
      onMove={onMove}
    />
  );
}

describe('Board text controls', () => {
  it.each(Object.entries(controls))(
    'UIC-BOARD-2.3 leaves arrow keys and move chords to %s in a card',
    async (_, renderControl) => {
      const onMove = vi.fn<(move: BoardMove) => void>();
      render(<NoteBoard renderControl={renderControl} onMove={onMove} />);
      const user = userEvent.setup();
      const field = screen.getByRole('textbox', { name: 'Notes a' });
      act(() => field.focus());
      for (const chord of [
        '{Alt>}{ArrowRight}{/Alt}',
        '{Alt>}{ArrowLeft}{/Alt}',
        '{Alt>}{ArrowUp}{/Alt}',
        '{Alt>}{ArrowDown}{/Alt}',
        '{ArrowLeft}',
        '{ArrowRight}',
        '{ArrowUp}',
        '{ArrowDown}',
        '{Home}',
        '{End}',
      ]) {
        await user.keyboard(chord);
        expect(field, chord).toHaveFocus();
      }
      expect(onMove).not.toHaveBeenCalled();
      await user.keyboard('b ');
      expect(field).toHaveFocus();
    },
  );

  it('UIC-BOARD-2.3 does not prevent the editing a text control does with its keys', () => {
    render(<NoteBoard renderControl={controls['a native input'] ?? (() => null)} />);
    const field = screen.getByRole('textbox', { name: 'Notes a' });
    act(() => field.focus());
    for (const [key, altKey] of [
      ['ArrowLeft', true],
      ['ArrowRight', false],
      ['ArrowDown', false],
    ] as const) {
      const event = new KeyboardEvent('keydown', { key, altKey, bubbles: true, cancelable: true });
      act(() => {
        field.dispatchEvent(event);
      });
      expect(event.defaultPrevented, key).toBe(false);
    }
  });

  it('UIC-BOARD-2.3 keeps arrow navigation between a card and its other controls', async () => {
    render(<NoteBoard renderControl={controls['a native input'] ?? (() => null)} />);
    const user = userEvent.setup();
    act(() => screen.getByRole('row', { name: 'Alpha' }).focus());
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Open Alpha' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('row', { name: 'Blue' })).toHaveFocus();
  });
});
