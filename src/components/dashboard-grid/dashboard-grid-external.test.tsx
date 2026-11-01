import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
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

/** Cancels a pointer as the browser does; jsdom's events carry no pointer ID of their own. */
function cancelPointer(pointerId: number) {
  act(() => {
    window.dispatchEvent(Object.assign(new MouseEvent('pointercancel'), { pointerId }));
  });
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

  it('UIC-DASHBOARD-GRID-2.7 never revives a gesture its layout change ended', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    const { rerender } = render(grid(start, { onLayoutChange }));
    await dragDown(user, 'Move');
    rerender(grid([{ ...tileA, y: 5 }, tileC], { onLayoutChange }));
    expectNothingMoving();
    // The tile's cells come back while the same pointer is still down.
    rerender(grid(start, { onLayoutChange }));
    await user.pointer({ coords: { pageX: 0, pageY: 240 } });
    expectNothingMoving();
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onLayoutChange).not.toHaveBeenCalled();
    // A new press moves again.
    await dragDown(user, 'Move');
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onLayoutChange).toHaveBeenCalledOnce();
  });

  it('UIC-DASHBOARD-GRID-2.7 ends a gesture whose handle unmounts', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    const tiles = (hidden: boolean) => (
      <DashboardGrid aria-label="Overview" layout={start} onLayoutChange={onLayoutChange} isEditing>
        {(item) =>
          hidden && item.id === 'a' ? null : (
            <DashboardTile label={`Tile ${item.id}`}>{item.id}</DashboardTile>
          )
        }
      </DashboardGrid>
    );
    const { rerender } = render(tiles(false));
    await dragDown(user, 'Move');
    rerender(tiles(true));
    rerender(tiles(false));
    await user.pointer({ coords: { pageX: 0, pageY: 160 } });
    expectNothingMoving();
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onLayoutChange).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('UIC-DASHBOARD-GRID-2.7 never writes a gesture to another persisted layout', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    const companion = { id: 'z', x: 6, y: 0, w: 3, h: 1 };
    const storage = createMemoryStorage({
      second: JSON.stringify([tileA, companion]),
    });
    const owned = (persistKey: string) => (
      <UiProvider storage={storage}>
        <DashboardGrid
          aria-label="Saved"
          defaultLayout={start}
          persistKey={persistKey}
          onLayoutChange={onLayoutChange}
          isEditing
        >
          {(item) => <DashboardTile label={`Tile ${item.id}`}>{item.id}</DashboardTile>}
        </DashboardGrid>
      </UiProvider>
    );
    const { rerender } = render(owned('first'));
    await dragDown(user, 'Move');
    rerender(owned('second'));
    await user.pointer({ coords: { pageX: 0, pageY: 160 } });
    await user.pointer({ keys: '[/MouseLeft]' });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(onLayoutChange).not.toHaveBeenCalled();
    expect(JSON.parse(storage.getItem('second') ?? '[]')).toEqual([tileA, companion]);
    expect(storage.getItem('first')).toBeNull();
  });

  it.each([
    ['mouse', 'MouseLeft'],
    ['touch', 'TouchA'],
  ])('UIC-DASHBOARD-GRID-2.2 drops a %s drag the browser cancels', async (pointerName, key) => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(grid(start, { onLayoutChange }));
    let pointerId = -1;
    // The handle stops its press from bubbling, so the test reads the pointer on the way down.
    window.addEventListener('pointerdown', (event) => (pointerId = event.pointerId), {
      once: true,
      capture: true,
    });
    const target = screen.getByRole('button', { name: 'Move Tile a' });
    await user.pointer([
      { keys: `[${key}>]`, target, coords: { pageX: 0, pageY: 0 } },
      {
        pointerName: pointerName === 'mouse' ? 'mouse' : key,
        target,
        coords: { pageX: 0, pageY: 160 },
      },
    ]);
    const tile = screen.getByRole('group', { name: 'Tile a' });
    expect(tile).toHaveAttribute('data-moving', 'true');
    // Another pointer ending changes nothing.
    cancelPointer(pointerId + 50);
    expect(tile).toHaveAttribute('data-moving', 'true');
    cancelPointer(pointerId);
    expectNothingMoving();
    await user.pointer({ keys: `[/${key}]` });
    expect(onLayoutChange).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('');
    // A new press moves the tile, and its release keeps it.
    await dragDown(user, 'Move');
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onLayoutChange).toHaveBeenCalledExactlyOnceWith([{ ...tileA, y: 1 }, tileC]);
  });
});
