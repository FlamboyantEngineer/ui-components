import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { DashboardGrid, type DashboardGridItem } from './dashboard-grid.js';
import { DashboardTile } from './dashboard-tile.js';

const titles: Record<string, string> = { visitors: 'Visitors', sales: 'Sales', notes: 'Notes' };

const layout: DashboardGridItem[] = [
  { id: 'sales', x: 6, y: 0, w: 6, h: 2 },
  { id: 'visitors', x: 0, y: 0, w: 6, h: 2 },
  { id: 'notes', x: 0, y: 2, w: 12, h: 1 },
];

function Board(props: {
  isEditing?: boolean;
  onLayoutChange?: (layout: DashboardGridItem[]) => void;
  minColumnWidth?: number;
}) {
  const [current, setCurrent] = useState(layout);
  return (
    <DashboardGrid
      aria-label="Overview"
      layout={current}
      onLayoutChange={(next) => {
        setCurrent(next);
        props.onLayoutChange?.(next);
      }}
      isEditing={props.isEditing}
      minColumnWidth={props.minColumnWidth}
    >
      {(item) => (
        <DashboardTile label={titles[item.id]!} minRowSpan={2}>
          <p>{titles[item.id]} content</p>
        </DashboardTile>
      )}
    </DashboardGrid>
  );
}

const tileNames = () =>
  [...document.querySelectorAll('.ui-dashboard-grid__tile')].map((tile) =>
    tile.getAttribute('aria-label'),
  );
const status = () => document.querySelector('.ui-dashboard-grid__status');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DashboardGrid', () => {
  it('UIC-DASHBOARD-GRID-1.1 UIC-DASHBOARD-GRID-4.1 places named tiles on its tracks in reading order', () => {
    render(<Board />);
    const grid = screen.getByRole('group', { name: 'Overview' });
    expect(grid).toHaveClass('ui-dashboard-grid');
    expect(grid.style.gridTemplateColumns).toBe('repeat(12, minmax(0, 1fr))');
    expect(grid.style.gridTemplateRows).toBe('repeat(3, 80px)');
    expect(tileNames()).toEqual(['Visitors', 'Sales', 'Notes']);
    const sales = screen.getByRole('group', { name: 'Sales' });
    expect(sales.style.gridColumn).toBe('7 / span 6');
    expect(sales.style.gridRow).toBe('1 / span 2');
    expect(sales.querySelector('.ui-dashboard-grid__tile-content')).toHaveTextContent(
      'Sales content',
    );
    expect(grid).not.toHaveAttribute('data-editing');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'DASHBOARD-GRID', {
      slots: ['tile', 'tile-content', 'status'],
    });
  });

  it('UIC-DASHBOARD-GRID-2.1 UIC-DASHBOARD-GRID-4.1 shows named handles in edit mode', () => {
    render(<Board isEditing />);
    expect(screen.getByRole('group', { name: 'Overview' })).toHaveAttribute('data-editing', 'true');
    const move = screen.getByRole('button', { name: 'Move Visitors' });
    const resize = screen.getByRole('button', { name: 'Resize Visitors' });
    expect(move).toHaveClass('ui-dashboard-grid__move');
    expect(move.querySelector('[data-glyph="drag-handle"]')).not.toBeNull();
    expect(resize.querySelector('[data-glyph="resize"]')).not.toBeNull();
    const tile = screen.getByRole('group', { name: 'Visitors' });
    expect(tile.firstElementChild).toBe(move);
    expect(tile.lastElementChild).toBe(resize);
    expectHooksMatchSpec(document.body, 'DASHBOARD-GRID', { slots: ['move', 'resize'] });
  });

  it('UIC-DASHBOARD-GRID-2.2 UIC-DASHBOARD-GRID-2.4 UIC-DASHBOARD-GRID-2.5 UIC-DASHBOARD-GRID-2.6 moves a tile with the arrow keys', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(<Board isEditing onLayoutChange={onLayoutChange} />);
    const move = screen.getByRole('button', { name: 'Move Notes' });
    move.focus();
    await user.keyboard('{ArrowUp}');
    expect(onLayoutChange).toHaveBeenLastCalledWith([
      { id: 'sales', x: 6, y: 2, w: 6, h: 2 },
      { id: 'visitors', x: 0, y: 2, w: 6, h: 2 },
      { id: 'notes', x: 0, y: 1, w: 12, h: 1 },
    ]);
    expect(tileNames()).toEqual(['Notes', 'Visitors', 'Sales']);
    expect(move).toHaveFocus();
    expect(status()).toHaveTextContent('Notes moved to column 1, row 2');
    expect(status()).toHaveAttribute('role', 'status');
    await user.keyboard('{ArrowRight}');
    expect(status()).toHaveTextContent('Notes moved to column 1, row 2');
    await user.keyboard('{ArrowUp}');
    expect(status()).toHaveTextContent('Notes moved to column 1, row 1');
    expect(tileNames()).toEqual(['Notes', 'Visitors', 'Sales']);
  });

  it('UIC-DASHBOARD-GRID-2.2 moves toward the inline end with the left arrow in right-to-left text', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(
      <UiProvider locale="ar-EG">
        <Board isEditing onLayoutChange={onLayoutChange} />
      </UiProvider>,
    );
    screen.getByRole('button', { name: 'Move Visitors' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(onLayoutChange.mock.lastCall?.[0][1]).toEqual({
      id: 'visitors',
      x: 1,
      y: 0,
      w: 6,
      h: 2,
    });
  });

  it('UIC-DASHBOARD-GRID-2.3 resizes a tile with the arrow keys within its smallest span', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(<Board isEditing onLayoutChange={onLayoutChange} />);
    const resize = screen.getByRole('button', { name: 'Resize Visitors' });
    resize.focus();
    await user.keyboard('{ArrowDown}');
    expect(onLayoutChange.mock.lastCall?.[0][1]).toEqual({
      id: 'visitors',
      x: 0,
      y: 0,
      w: 6,
      h: 3,
    });
    expect(status()).toHaveTextContent('Visitors resized to 6 columns by 3 rows');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(status()).toHaveTextContent('Visitors resized to 6 columns by 2 rows');
    await user.keyboard('{ArrowLeft}');
    expect(status()).toHaveTextContent('Visitors resized to 5 columns by 2 rows');
    expect(resize).toHaveFocus();
  });

  it('UIC-DASHBOARD-GRID-2.2 previews a pointer drag and keeps it when it ends', () => {
    const onLayoutChange = vi.fn();
    render(<Board isEditing onLayoutChange={onLayoutChange} />);
    const move = screen.getByRole('button', { name: 'Move Visitors' });
    const tile = screen.getByRole('group', { name: 'Visitors' });
    // jsdom lays nothing out: a column steps one pixel, and a row its 80 pixel height.
    fireEvent.pointerDown(move, { pointerId: 1, button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, button: 0, clientX: 2, clientY: 0 });
    expect(tile).toHaveAttribute('data-moving', 'true');
    expect(tile.style.gridColumn).toBe('3 / span 6');
    expect(onLayoutChange).not.toHaveBeenCalled();
    fireEvent.pointerUp(window, { pointerId: 1, button: 0, clientX: 2, clientY: 0 });
    expect(tile).not.toHaveAttribute('data-moving');
    expect(onLayoutChange.mock.lastCall?.[0][1]).toMatchObject({ id: 'visitors', x: 2 });
    expectHooksMatchSpec(document.body, 'DASHBOARD-GRID');
  });

  it('UIC-DASHBOARD-GRID-2.3 marks a tile while a pointer resizes it', () => {
    render(<Board isEditing />);
    const resize = screen.getByRole('button', { name: 'Resize Sales' });
    const tile = screen.getByRole('group', { name: 'Sales' });
    fireEvent.pointerDown(resize, { pointerId: 1, button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, button: 0, clientX: 0, clientY: 90 });
    expect(tile).toHaveAttribute('data-resizing', 'true');
    expect(tile.style.gridRow).toBe('1 / span 3');
    fireEvent.pointerUp(window, { pointerId: 1, button: 0, clientX: 0, clientY: 90 });
    expect(tile.style.gridRow).toBe('1 / span 3');
  });

  it('UIC-DASHBOARD-GRID-1.2 remembers an uncontrolled layout through the provider storage', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const view = (
      <UiProvider storage={storage}>
        <DashboardGrid aria-label="Saved" defaultLayout={layout} storageKey="overview" isEditing>
          {(item) => <DashboardTile label={titles[item.id]!}>{item.id}</DashboardTile>}
        </DashboardGrid>
      </UiProvider>
    );
    const { unmount } = render(view);
    screen.getByRole('button', { name: 'Move Notes' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(JSON.parse(storage.getItem('overview') ?? '[]')[2]).toEqual({
      id: 'notes',
      x: 0,
      y: 3,
      w: 12,
      h: 1,
    });
    unmount();
    render(view);
    expect(screen.getByRole('group', { name: 'Notes' }).style.gridRow).toBe('4 / span 1');
  });

  it('UIC-DASHBOARD-GRID-3.1 reflows onto fewer columns, read only, when narrow', () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly callback: ResizeObserverCallback) {}
        observe(target: Element) {
          const entry = { target, contentRect: { width: 300, height: 0 } };
          this.callback(
            [entry as unknown as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
        }
        unobserve() {}
        disconnect() {}
      },
    );
    render(<Board isEditing minColumnWidth={100} />);
    const grid = screen.getByRole('group', { name: 'Overview' });
    expect(grid).toHaveAttribute('data-reflowed', 'true');
    expect(grid).not.toHaveAttribute('data-editing');
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    expect(screen.getByRole('group', { name: 'Sales' }).style.gridColumn).toBe('2 / span 2');
    expect(screen.getByRole('group', { name: 'Notes' }).style.gridColumn).toBe('1 / span 3');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'DASHBOARD-GRID');
  });

  it('UIC-DASHBOARD-GRID-1.3 appends caller classes and forwards ids, refs and data attributes', () => {
    const ref = { current: null as HTMLDivElement | null };
    const tileRef = { current: null as HTMLDivElement | null };
    render(
      <DashboardGrid
        aria-label="Probe"
        defaultLayout={[{ id: 'a', x: 0, y: 0, w: 1, h: 1 }]}
        className="caller"
        id="probe"
        ref={ref}
        data-testid="probe"
        data-editing="caller"
        isEditing
      >
        {() => (
          <DashboardTile label="A" className="tile" id="tile" ref={tileRef} data-testid="tile">
            A
          </DashboardTile>
        )}
      </DashboardGrid>,
    );
    const grid = screen.getByTestId('probe');
    expect(grid).toHaveClass('ui-dashboard-grid', 'caller');
    expect(grid).toHaveAttribute('id', 'probe');
    expect(grid).toHaveAttribute('data-editing', 'true');
    expect(ref.current).toBe(grid);
    const tile = screen.getByTestId('tile');
    expect(tile).toHaveClass('ui-dashboard-grid__tile', 'tile');
    expect(tile).toHaveAttribute('id', 'tile');
    expect(tileRef.current).toBe(tile);
  });
});
