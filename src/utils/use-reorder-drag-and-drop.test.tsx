import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { KeyboardEvent } from 'react';
import {
  DropIndicator,
  GridList,
  GridListItem,
  type DropTarget,
  type Key,
} from '../primitives/index.js';
import { describe, expect, it, vi } from 'vitest';
import { DragHandle } from '../components/drag-handle/drag-handle.js';
import { isMoveChord, useReorderDragAndDrop } from './use-reorder-drag-and-drop.js';

interface Move {
  keys: Key[];
  target: Key;
}

const FRUIT = [{ id: 'apple' }, { id: 'pear' }, { id: 'plum' }];

const renderDropIndicator = (target: DropTarget) => (
  <DropIndicator target={target} className="indicator" />
);

function Fruit({ accepts, onMove }: { accepts: boolean; onMove: (move: Move) => void }) {
  const dragAndDropHooks = useReorderDragAndDrop<object, Move>({
    resolveMove: (target, keys) =>
      accepts && target.type === 'item' && target.dropPosition !== 'on'
        ? { keys: [...keys], target: target.key }
        : null,
    onMove,
    getTextValue: (key) => `Fruit ${String(key)}`,
    renderDropIndicator,
  });
  return (
    <GridList aria-label="Fruit" items={FRUIT} dragAndDropHooks={dragAndDropHooks}>
      {(item) => (
        <GridListItem textValue={item.id}>
          <DragHandle />
          {item.id}
        </GridListItem>
      )}
    </GridList>
  );
}

async function dragPlumByKeyboard() {
  const user = userEvent.setup();
  screen.getByRole('row', { name: 'plum' }).focus();
  await user.keyboard('{ArrowRight}{Enter}');
  return user;
}

// Keyboard drag and drop in a full React Aria collection is slow in jsdom on a busy machine.
describe('useReorderDragAndDrop', { timeout: 15_000 }, () => {
  it('reports the move resolveMove makes for an accepted drop', async () => {
    const onMove = vi.fn();
    render(<Fruit accepts onMove={onMove} />);
    const user = await dragPlumByKeyboard();
    expect(document.querySelectorAll('.indicator[data-drop-target]')).toHaveLength(1);
    await user.keyboard('{Enter}');
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove.mock.lastCall?.[0]).toMatchObject({ keys: ['plum'] });
  });

  it('offers no drop target where resolveMove refuses, and checks the latest options on drop', async () => {
    const onMove = vi.fn();
    const { rerender } = render(<Fruit accepts onMove={onMove} />);
    const user = await dragPlumByKeyboard();
    rerender(<Fruit accepts={false} onMove={onMove} />);
    await user.keyboard('{Enter}');
    expect(onMove).not.toHaveBeenCalled();
  });

  it('treats Alt alone as the move chord', () => {
    const chord = (init: Partial<KeyboardEvent>) =>
      isMoveChord({
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        ...init,
      } as KeyboardEvent);
    expect(chord({ altKey: true })).toBe(true);
    expect(chord({})).toBe(false);
    expect(chord({ altKey: true, shiftKey: true })).toBe(false);
    expect(chord({ altKey: true, ctrlKey: true })).toBe(false);
    expect(chord({ altKey: true, metaKey: true })).toBe(false);
  });
});
