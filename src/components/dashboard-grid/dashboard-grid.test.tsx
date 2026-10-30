import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  DashboardGrid,
  type DashboardGridItem,
  type DashboardGridProps,
} from './dashboard-grid.js';
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
        <DashboardTile label={requireDefined(titles[item.id])} minRowSpan={2}>
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

function stubGridWidth(width: number) {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ target, contentRect: { width, height: 0 } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }
      unobserve() {}
      disconnect() {}
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DashboardGrid', () => {
  it('UIC-DASHBOARD-GRID-2.2 UIC-DASHBOARD-GRID-3.1 discards an unfinished pointer move when reflow makes the grid read only', async () => {
    stubGridWidth(300);
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    const { rerender } = render(<Board isEditing onLayoutChange={onLayoutChange} />);
    const tile = screen.getByRole('group', { name: 'Visitors' });
    const handle = screen.getByRole('button', { name: 'Move Visitors' });
    await user.pointer([
      { keys: '[MouseLeft>]', target: handle, coords: { pageX: 0, pageY: 0 } },
      { coords: { pageX: 0, pageY: 80 } },
    ]);
    expect(tile).toHaveAttribute('data-moving', 'true');
    rerender(<Board isEditing minColumnWidth={100} onLayoutChange={onLayoutChange} />);
    expect(screen.getByRole('group', { name: 'Overview' })).toHaveAttribute(
      'data-reflowed',
      'true',
    );
    expect(tile).not.toHaveAttribute('data-moving');
    await user.pointer({ keys: '[/MouseLeft]' });
    rerender(<Board isEditing onLayoutChange={onLayoutChange} />);
    expect(tile.style.gridRow).toBe('1 / span 2');
    expect(onLayoutChange).not.toHaveBeenCalled();
  });
  it.each(['move', 'resize'] as const)(
    'UIC-DASHBOARD-GRID-2.1 UIC-DASHBOARD-GRID-2.2 UIC-DASHBOARD-GRID-2.3 discards an unfinished pointer %s when editing stops',
    async (kind) => {
      const user = userEvent.setup();
      const onLayoutChange = vi.fn();
      const original = [{ id: 'tile', x: 0, y: 0, w: 1, h: 1 }];
      const grid = (isEditing: boolean) => (
        <DashboardGrid
          defaultLayout={original}
          isEditing={isEditing}
          onLayoutChange={onLayoutChange}
        >
          {() => <DashboardTile label="Tile">Content</DashboardTile>}
        </DashboardGrid>
      );
      const { rerender } = render(grid(true));
      const tile = screen.getByRole('group', { name: 'Tile' });
      const handle = screen.getByRole('button', {
        name: kind === 'move' ? 'Move Tile' : 'Resize Tile',
      });
      await user.pointer([
        { keys: '[MouseLeft>]', target: handle, coords: { pageX: 0, pageY: 0 } },
        { coords: { pageX: 0, pageY: 80 } },
      ]);
      expect(tile.style.gridRow).toBe(kind === 'move' ? '2 / span 1' : '1 / span 2');
      rerender(grid(false));
      expect(tile.style.gridRow).toBe('1 / span 1');
      expect(tile).not.toHaveAttribute('data-moving');
      expect(tile).not.toHaveAttribute('data-resizing');
      await user.pointer({ keys: '[/MouseLeft]' });
      expect(onLayoutChange).not.toHaveBeenCalled();
      rerender(grid(true));
      const next = screen.getByRole('button', { name: 'Move Tile' });
      next.focus();
      await user.keyboard('{ArrowDown}');
      expect(onLayoutChange).toHaveBeenCalledOnce();
    },
  );
  it('UIC-DASHBOARD-GRID-1.2 UIC-DASHBOARD-GRID-2.6 keeps numeric and text tile content and handles through reordering', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    const typedLayout = [
      { id: 1, x: 0, y: 0, w: 6, h: 1 },
      { id: '1', x: 6, y: 0, w: 6, h: 1 },
    ];
    const grid = (next: DashboardGridItem[]) => (
      <DashboardGrid layout={next} isEditing onLayoutChange={onLayoutChange}>
        {(entry) => (
          <DashboardTile label={typeof entry.id === 'number' ? 'Numeric tile' : 'Text tile'}>
            <input aria-label={`${typeof entry.id} note`} />
          </DashboardTile>
        )}
      </DashboardGrid>
    );
    const { rerender } = render(grid(typedLayout));
    const numeric = screen.getByRole('group', { name: 'Numeric tile' });
    const text = screen.getByRole('group', { name: 'Text tile' });
    const note = screen.getByRole('textbox', { name: 'number note' });
    await user.type(note, 'Keep this note');
    rerender(grid(typedLayout.map((entry) => ({ ...entry, x: 6 - entry.x }))));
    expect(screen.getByRole('group', { name: 'Numeric tile' })).toBe(numeric);
    expect(screen.getByRole('group', { name: 'Text tile' })).toBe(text);
    expect(note).toHaveValue('Keep this note');
    screen.getByRole('button', { name: 'Move Numeric tile' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(onLayoutChange).toHaveBeenCalledOnce();
    expect(
      onLayoutChange.mock.calls[0]?.[0].find((entry: DashboardGridItem) => entry.id === 1)?.y,
    ).toBe(1);
    expect(screen.getByRole('button', { name: 'Move Numeric tile' })).toHaveFocus();
  });
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

  it('UIC-DASHBOARD-GRID-2.2 previews a pointer drag and keeps it when it ends', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(<Board isEditing onLayoutChange={onLayoutChange} />);
    const move = screen.getByRole('button', { name: 'Move Visitors' });
    const tile = screen.getByRole('group', { name: 'Visitors' });
    // jsdom lays nothing out: a column steps one pixel, and a row its 80 pixel height. The drag
    // reads page coordinates, which user-event does not derive from client ones.
    await user.pointer([
      {
        keys: '[MouseLeft>]',
        target: move,
        coords: { clientX: 0, clientY: 0, pageX: 0, pageY: 0 },
      },
      { coords: { clientX: 2, clientY: 0, pageX: 2, pageY: 0 } },
    ]);
    expect(tile).toHaveAttribute('data-moving', 'true');
    expect(tile.style.gridColumn).toBe('3 / span 6');
    expect(onLayoutChange).not.toHaveBeenCalled();
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(tile).not.toHaveAttribute('data-moving');
    expect(onLayoutChange.mock.lastCall?.[0][1]).toMatchObject({ id: 'visitors', x: 2 });
    expectHooksMatchSpec(document.body, 'DASHBOARD-GRID');
  });

  it('UIC-DASHBOARD-GRID-2.3 marks a tile while a pointer resizes it', async () => {
    const user = userEvent.setup();
    render(<Board isEditing />);
    const resize = screen.getByRole('button', { name: 'Resize Sales' });
    const tile = screen.getByRole('group', { name: 'Sales' });
    await user.pointer([
      {
        keys: '[MouseLeft>]',
        target: resize,
        coords: { clientX: 0, clientY: 0, pageX: 0, pageY: 0 },
      },
      { coords: { clientX: 0, clientY: 90, pageX: 0, pageY: 90 } },
    ]);
    expect(tile).toHaveAttribute('data-resizing', 'true');
    expect(tile.style.gridRow).toBe('1 / span 3');
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(tile.style.gridRow).toBe('1 / span 3');
  });

  it('UIC-DASHBOARD-GRID-1.2 remembers an uncontrolled layout through the provider storage', async () => {
    expectTypeOf<DashboardGridProps>().not.toHaveProperty('storageKey');
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const view = (
      <UiProvider storage={storage}>
        <DashboardGrid aria-label="Saved" defaultLayout={layout} persistKey="overview" isEditing>
          {(item) => (
            <DashboardTile label={requireDefined(titles[item.id])}>{item.id}</DashboardTile>
          )}
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

  it.each([
    ['not JSON', '{'],
    ['an object', '{}'],
    ['a list holding null', '[null]'],
    ['an item without an id', '[{"x":0,"y":0,"w":1,"h":1}]'],
    ['an item with a text column', '[{"id":"a","x":"0","y":0,"w":1,"h":1}]'],
    ['one invalid item among valid ones', '[{"id":"a","x":0,"y":0,"w":1,"h":1},{"id":"b"}]'],
  ])(
    'UIC-DASHBOARD-GRID-1.2 starts from the default layout when the stored one is %s',
    async (_, raw) => {
      const user = userEvent.setup();
      const storage = createMemoryStorage({ saved: raw });
      render(
        <UiProvider storage={storage}>
          <DashboardGrid aria-label="Saved" defaultLayout={layout} persistKey="saved" isEditing>
            {(item) => (
              <DashboardTile label={requireDefined(titles[item.id])}>{item.id}</DashboardTile>
            )}
          </DashboardGrid>
        </UiProvider>,
      );
      expect(tileNames()).toEqual(['Visitors', 'Sales', 'Notes']);
      screen.getByRole('button', { name: 'Move Notes' }).focus();
      await user.keyboard('{ArrowDown}');
      expect(JSON.parse(storage.getItem('saved') ?? '[]')).toEqual([
        layout[0],
        layout[1],
        { id: 'notes', x: 0, y: 3, w: 12, h: 1 },
      ]);
    },
  );

  it('UIC-DASHBOARD-GRID-2.3 keeps the start column when a resize reaches the last column', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(
      <DashboardGrid
        aria-label="Edge"
        defaultLayout={[{ id: 'a', x: 8, y: 0, w: 3, h: 2 }]}
        onLayoutChange={onLayoutChange}
        isEditing
      >
        {() => <DashboardTile label="a">A</DashboardTile>}
      </DashboardGrid>,
    );
    const resize = screen.getByRole('button', { name: 'Resize a' });
    resize.focus();
    await user.keyboard('{ArrowRight}');
    expect(onLayoutChange).toHaveBeenCalledExactlyOnceWith([{ id: 'a', x: 8, y: 0, w: 4, h: 2 }]);
    await user.keyboard('{ArrowRight}');
    expect(onLayoutChange).toHaveBeenCalledOnce();
    // jsdom lays nothing out, so a column steps one pixel: drag three columns past the edge.
    await user.pointer([
      { keys: '[MouseLeft>]', target: resize, coords: { pageX: 0, pageY: 0 } },
      { coords: { pageX: 3, pageY: 0 } },
      { keys: '[/MouseLeft]' },
    ]);
    expect(onLayoutChange).toHaveBeenCalledOnce();
    expect(screen.getByRole('group', { name: 'a' }).style.gridColumn).toBe('9 / span 4');
  });

  it('UIC-DASHBOARD-GRID-2.3 grows a tile toward the inline end with the left arrow in right-to-left text', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(
      <UiProvider locale="ar-EG">
        <Board isEditing onLayoutChange={onLayoutChange} />
      </UiProvider>,
    );
    screen.getByRole('button', { name: 'Resize Notes' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onLayoutChange.mock.lastCall?.[0][2]).toMatchObject({ id: 'notes', x: 0, w: 11 });
    await user.keyboard('{ArrowLeft}');
    expect(onLayoutChange.mock.lastCall?.[0][2]).toMatchObject({ id: 'notes', x: 0, w: 12 });
  });

  it('UIC-DASHBOARD-GRID-2.2 UIC-DASHBOARD-GRID-2.5 reports and announces nothing for an arrow press against an edge', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(<Board isEditing onLayoutChange={onLayoutChange} />);
    screen.getByRole('button', { name: 'Move Visitors' }).focus();
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(onLayoutChange).not.toHaveBeenCalled();
    expect(status()).toHaveTextContent('');
  });

  it('UIC-DASHBOARD-GRID-2.2 renders the tiles again only when a pointer drag reaches another cell', async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ width: 1200, height: 400 }),
    );
    const renderTile = vi.fn((item: DashboardGridItem) => (
      <DashboardTile label={requireDefined(titles[item.id])}>{item.id}</DashboardTile>
    ));
    render(
      <DashboardGrid aria-label="Overview" defaultLayout={layout} isEditing>
        {renderTile}
      </DashboardGrid>,
    );
    const move = screen.getByRole('button', { name: 'Move Visitors' });
    await user.pointer([
      { keys: '[MouseLeft>]', target: move, coords: { pageX: 0, pageY: 0 } },
      { coords: { pageX: 1, pageY: 0 } },
    ]);
    renderTile.mockClear();
    for (let x = 2; x <= 10; x += 1) await user.pointer({ coords: { pageX: x, pageY: 0 } });
    expect(renderTile).not.toHaveBeenCalled();
    await user.pointer({ coords: { pageX: 100, pageY: 0 } });
    expect(renderTile).toHaveBeenCalled();
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(screen.getByRole('group', { name: 'Visitors' }).style.gridColumn).toBe('2 / span 6');
  });

  it('UIC-DASHBOARD-GRID-3.1 reflows onto fewer columns, read only, when narrow', () => {
    stubGridWidth(300);
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
        data-owner="probe"
        data-editing="caller"
        isEditing
      >
        {() => (
          <DashboardTile label="A" className="tile" id="tile" ref={tileRef} data-owner="tile">
            A
          </DashboardTile>
        )}
      </DashboardGrid>,
    );
    const grid = screen.getByRole('group', { name: 'Probe' });
    expect(grid).toHaveClass('ui-dashboard-grid', 'caller');
    expect(grid).toHaveAttribute('data-owner', 'probe');
    expect(grid).toHaveAttribute('id', 'probe');
    expect(grid).toHaveAttribute('data-editing', 'true');
    expect(ref.current).toBe(grid);
    const tile = screen.getByRole('group', { name: 'A' });
    expect(tile).toHaveClass('ui-dashboard-grid__tile', 'tile');
    expect(tile).toHaveAttribute('data-owner', 'tile');
    expect(tile).toHaveAttribute('id', 'tile');
    expect(tileRef.current).toBe(tile);
  });
});
