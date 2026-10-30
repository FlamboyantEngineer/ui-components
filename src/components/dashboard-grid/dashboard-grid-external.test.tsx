import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardGrid, type DashboardGridItem } from './dashboard-grid.js';
import { DashboardTile } from './dashboard-tile.js';

const tileA: DashboardGridItem = { id: 'a', x: 0, y: 0, w: 3, h: 1 };
const tileC: DashboardGridItem = { id: 'c', x: 6, y: 0, w: 3, h: 1 };
const start = [tileA, tileC];

function grid(
  layout: readonly DashboardGridItem[],
  { onLayoutChange, columns }: { onLayoutChange: () => void; columns?: number },
) {
  return (
    <DashboardGrid
      aria-label="Overview"
      layout={layout}
      columns={columns}
      onLayoutChange={onLayoutChange}
      isEditing
    >
      {(item) => <DashboardTile label={`Tile ${item.id}`}>{item.id}</DashboardTile>}
    </DashboardGrid>
  );
}

/** Starts a pointer gesture on tile A's handle and drags one row down, without releasing. */
async function dragDown(user: ReturnType<typeof userEvent.setup>, kind: 'Move' | 'Resize') {
  // jsdom lays nothing out: a row steps its 80 pixel height.
  await user.pointer([
    {
      keys: '[MouseLeft>]',
      target: screen.getByRole('button', { name: `${kind} Tile a` }),
      coords: { pageX: 0, pageY: 0 },
    },
    { coords: { pageX: 0, pageY: 80 } },
  ]);
}

function expectNothingMoving() {
  for (const group of screen.getAllByRole('group'))
    expect(group).not.toHaveAttribute('data-moving');
}

const moved = { move: { y: 1 }, resize: { h: 2 } } as const;

describe('DashboardGrid layout changes during a gesture', () => {
  it.each(['move', 'resize'] as const)(
    'UIC-DASHBOARD-GRID-2.7 keeps a tile added, removed or moved while a %s lasts',
    async (kind) => {
      const user = userEvent.setup();
      const onLayoutChange = vi.fn();
      const { rerender } = render(grid(start, { onLayoutChange }));
      await dragDown(user, kind === 'move' ? 'Move' : 'Resize');
      const changed = [
        { id: 'a', x: 0, y: 0, w: 3, h: 1 },
        { id: 'c', x: 9, y: 2, w: 3, h: 1 },
        { id: 'b', x: 3, y: 0, w: 3, h: 1 },
      ];
      rerender(grid(changed, { onLayoutChange }));
      expect(screen.getByRole('group', { name: 'Tile a' })).toHaveAttribute(
        kind === 'move' ? 'data-moving' : 'data-resizing',
        'true',
      );
      await user.pointer({ keys: '[/MouseLeft]' });
      expect(onLayoutChange).toHaveBeenCalledExactlyOnceWith([
        { id: 'a', x: 0, y: 0, w: 3, h: 1, ...moved[kind] },
        { id: 'c', x: 9, y: 2, w: 3, h: 1 },
        { id: 'b', x: 3, y: 0, w: 3, h: 1 },
      ]);
      rerender(grid([tileA], { onLayoutChange }));
      await dragDown(user, kind === 'move' ? 'Move' : 'Resize');
      rerender(grid([tileA], { onLayoutChange }));
      await user.pointer({ keys: '[/MouseLeft]' });
      expect(onLayoutChange).toHaveBeenLastCalledWith([
        { id: 'a', x: 0, y: 0, w: 3, h: 1, ...moved[kind] },
      ]);
    },
  );

  it('UIC-DASHBOARD-GRID-2.7 places a gesture on the current columns', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    const { rerender } = render(grid(start, { onLayoutChange }));
    await dragDown(user, 'Move');
    rerender(grid(start, { onLayoutChange, columns: 9 }));
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onLayoutChange).toHaveBeenCalledExactlyOnceWith([
      { id: 'a', x: 0, y: 1, w: 3, h: 1 },
      { id: 'c', x: 6, y: 0, w: 3, h: 1 },
    ]);
  });

  it.each([
    { change: 'removed', before: start, after: [tileC], columns: 12 },
    { change: 'moved', before: start, after: [{ ...tileA, x: 3 }, tileC], columns: 12 },
    {
      change: 'pushed inside fewer columns',
      before: [{ ...tileA, x: 9 }, tileC],
      after: [{ ...tileA, x: 9 }, tileC],
      columns: 10,
    },
  ])(
    'UIC-DASHBOARD-GRID-2.7 cancels a gesture whose own tile is $change meanwhile',
    async ({ before, after, columns }) => {
      const user = userEvent.setup();
      const onLayoutChange = vi.fn();
      const { rerender } = render(grid(before, { onLayoutChange }));
      await dragDown(user, 'Move');
      rerender(grid(after, { onLayoutChange, columns }));
      expectNothingMoving();
      await user.pointer({ coords: { pageX: 0, pageY: 160 } });
      expectNothingMoving();
      await user.pointer({ keys: '[/MouseLeft]' });
      expect(onLayoutChange).not.toHaveBeenCalled();
    },
  );
});
