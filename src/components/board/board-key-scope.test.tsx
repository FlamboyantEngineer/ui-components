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

interface NoteBoardProps {
  label: string;
  items: Note[];
  onMove?: ((move: BoardMove) => void) | undefined;
  renderCard?: ((note: Note) => ReactNode) | undefined;
}

function NoteBoard({ label, items, onMove, renderCard }: NoteBoardProps) {
  return (
    <Board
      aria-label={label}
      columns={columns}
      items={items}
      getColumn={(note) => note.column}
      getTextValue={(note) => note.title}
      renderCard={renderCard ?? ((note) => note.title)}
      onMove={onMove}
    />
  );
}

/** An outer board whose first card draws an inner board with the given cards. */
function NestedBoards(props: {
  inner: Note[];
  onOuterMove: (move: BoardMove) => void;
  onInnerMove?: ((move: BoardMove) => void) | undefined;
}) {
  const outer = [
    { id: 'a', title: 'Outer a', column: 'open' },
    { id: 'b', title: 'Outer b', column: 'open' },
  ];
  return (
    <NoteBoard
      label="Outer"
      items={outer}
      onMove={props.onOuterMove}
      renderCard={(note) =>
        note.id === 'a' ? (
          <NoteBoard label="Inner" items={props.inner} onMove={props.onInnerMove} />
        ) : (
          note.title
        )
      }
    />
  );
}

const innerEqual = [
  { id: 'a', title: 'Inner a', column: 'open' },
  { id: 'b', title: 'Inner b', column: 'open' },
];
const innerDisjoint = [
  { id: 'x', title: 'Inner x', column: 'open' },
  { id: 'y', title: 'Inner y', column: 'open' },
];

/** A slider that takes Alt+ArrowRight and Alt+ArrowLeft itself, as a widget drawn in a card can. */
function Slider({ label, onStep }: { label: string; onStep: (step: number) => void }) {
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={0}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        onStep(event.key === 'ArrowRight' ? 1 : -1);
      }}
    />
  );
}

describe('Board key scope', () => {
  it.each([
    ['equal', innerEqual],
    ['disjoint', innerDisjoint],
  ])(
    'UIC-BOARD-2.3 moves a nested board card on its own board when the keys are %s',
    async (_, inner) => {
      const onOuterMove = vi.fn<(move: BoardMove) => void>();
      const onInnerMove = vi.fn<(move: BoardMove) => void>();
      render(<NestedBoards inner={inner} onOuterMove={onOuterMove} onInnerMove={onInnerMove} />);
      const user = userEvent.setup();
      const [first, second] = inner.map((note) => note.id);
      act(() => screen.getByRole('row', { name: inner[0]?.title }).focus());
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
      expect(onInnerMove).toHaveBeenCalledExactlyOnceWith({
        key: first,
        column: 'open',
        lane: null,
        targetKey: second,
        position: 'after',
      });
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
      expect(onInnerMove).toHaveBeenLastCalledWith(
        expect.objectContaining({ key: first, column: 'closed' }),
      );
      expect(onOuterMove).not.toHaveBeenCalled();
    },
  );

  it('UIC-BOARD-2.3 leaves a nested board card without moves to that board', async () => {
    const onOuterMove = vi.fn<(move: BoardMove) => void>();
    render(<NestedBoards inner={innerEqual} onOuterMove={onOuterMove} />);
    const user = userEvent.setup();
    act(() => screen.getByRole('row', { name: 'Inner a' }).focus());
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}{Alt>}{ArrowRight}{/Alt}');
    expect(onOuterMove).not.toHaveBeenCalled();
    act(() => screen.getByRole('row', { name: 'Outer b' }).focus());
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(onOuterMove).toHaveBeenCalledExactlyOnceWith({
      key: 'b',
      column: 'open',
      lane: null,
      targetKey: 'a',
      position: 'before',
    });
  });

  it('UIC-BOARD-2.3 leaves a move chord a widget in the card takes to that widget', async () => {
    const onMove = vi.fn<(move: BoardMove) => void>();
    const onStep = vi.fn<(step: number) => void>();
    render(
      <NoteBoard
        label="Notes"
        items={innerEqual}
        onMove={onMove}
        renderCard={(note) => <Slider label={`${note.title} level`} onStep={onStep} />}
      />,
    );
    const user = userEvent.setup();
    const slider = screen.getByRole('slider', { name: 'Inner a level' });
    act(() => slider.focus());
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}{Alt>}{ArrowLeft}{/Alt}');
    expect(onStep.mock.calls).toEqual([[1], [-1]]);
    expect(slider).toHaveFocus();
    expect(onMove).not.toHaveBeenCalled();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(onMove).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ key: 'a', targetKey: 'b', position: 'after' }),
    );
  });
});
