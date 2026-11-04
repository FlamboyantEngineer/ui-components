import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { readMenuIcons } from '../../../test/menu-fixtures.js';
import { DeleteGlyph, MoveGlyph } from '../../core/glyphs.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  DashboardGrid,
  type DashboardGridItem,
  type DashboardTileMenuEntry,
} from './dashboard-grid.js';
import type { DashboardTileMenuIcons } from './dashboard-grid-menu.js';
import { DashboardTile } from './dashboard-tile.js';

const layout: DashboardGridItem[] = [
  { id: 'visitors', x: 0, y: 0, w: 6, h: 1 },
  { id: 'notes', x: 6, y: 0, w: 6, h: 1 },
];

const tileMenu: DashboardTileMenuEntry[] = [
  'move',
  'resize',
  'remove',
  { id: 'wide', label: 'Full width' },
];

const spaceMenu = [{ id: 'add', label: 'Add a tile here' }];

function Board({
  isEditing = true,
  onTileAction,
  onSpaceAction,
  onLayoutChange,
  tileMenuIcons,
}: {
  tileMenuIcons?: DashboardTileMenuIcons;
  isEditing?: boolean;
  onTileAction?: (key: unknown, item: DashboardGridItem) => void;
  onSpaceAction?: (key: unknown, cell: { x: number; y: number }) => void;
  onLayoutChange?: (next: DashboardGridItem[]) => void;
}) {
  const [current, setCurrent] = useState(layout);
  return (
    <DashboardGrid
      aria-label="Overview"
      layout={current}
      onLayoutChange={(next) => {
        setCurrent(next);
        onLayoutChange?.(next);
      }}
      isEditing={isEditing}
      tileMenu={tileMenu}
      tileMenuIcons={tileMenuIcons}
      onTileAction={onTileAction}
      spaceMenu={spaceMenu}
      onSpaceAction={onSpaceAction}
    >
      {(item) => (
        <DashboardTile label={item.id === 'notes' ? 'Notes' : 'Visitors'}>
          {String(item.id)}
        </DashboardTile>
      )}
    </DashboardGrid>
  );
}

const tile = (name: string) => screen.getByRole('group', { name });

async function openTileMenu(name: string) {
  fireEvent.contextMenu(tile(name));
  return screen.findByRole('menu', { name: `${name} actions` });
}

const names = (menu: HTMLElement) =>
  within(menu)
    .getAllByRole('menuitem')
    .map((item) => item.textContent);

describe('DashboardGrid menus', () => {
  it('UIC-DASHBOARD-GRID-5.1 draws the built-in actions with the icons given, still acting', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(
      <Board
        onLayoutChange={onLayoutChange}
        tileMenuIcons={{ move: MoveGlyph, remove: DeleteGlyph }}
      />,
    );
    const menu = await openTileMenu('Notes');
    expect(readMenuIcons(menu)).toEqual({
      'Move Notes': 'move',
      'Resize Notes': null,
      'Remove Notes': 'delete',
      'Full width': null,
    });
    await user.click(within(menu).getByRole('menuitem', { name: 'Remove Notes' }));
    expect(onLayoutChange).toHaveBeenLastCalledWith([layout[0]]);
  });

  it('UIC-DASHBOARD-GRID-5.1 lists the built-in actions in edit mode and the host entries always', async () => {
    const { rerender } = render(<Board />);
    let menu = await openTileMenu('Visitors');
    expect(names(menu)).toEqual([
      'Move Visitors',
      'Resize Visitors',
      'Remove Visitors',
      'Full width',
    ]);
    await userEvent.keyboard('{Escape}');
    rerender(<Board isEditing={false} />);
    menu = await openTileMenu('Visitors');
    expect(names(menu)).toEqual(['Full width']);
  });

  it('UIC-DASHBOARD-GRID-5.1 focuses a handle, removes a tile and tells the host', async () => {
    const user = userEvent.setup();
    const onTileAction = vi.fn();
    const onLayoutChange = vi.fn();
    render(<Board onTileAction={onTileAction} onLayoutChange={onLayoutChange} />);
    let menu = await openTileMenu('Notes');
    await user.click(within(menu).getByRole('menuitem', { name: 'Resize Notes' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Resize Notes' })).toHaveFocus());
    expect(onTileAction).toHaveBeenLastCalledWith('resize', layout[1]);
    menu = await openTileMenu('Notes');
    await user.click(within(menu).getByRole('menuitem', { name: 'Remove Notes' }));
    expect(onLayoutChange).toHaveBeenLastCalledWith([layout[0]]);
    expect(screen.queryByRole('group', { name: 'Notes' })).not.toBeInTheDocument();
    expect(document.querySelector('.ui-dashboard-grid__status')).toHaveTextContent('Notes removed');
    // Focus, fallen with the removed tile, goes to the neighbour's move handle.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Move Visitors' })).toHaveFocus(),
    );
    expect(onTileAction).toHaveBeenLastCalledWith('remove', layout[1]);
  });

  it('UIC-DASHBOARD-GRID-5.1 opens from the keyboard inside a tile', async () => {
    const user = userEvent.setup();
    render(<Board />);
    screen.getByRole('button', { name: 'Move Visitors' }).focus();
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(await screen.findByRole('menu', { name: 'Visitors actions' })).toBeInTheDocument();
  });

  it('UIC-DASHBOARD-GRID-5.2 opens the empty space menu off the tiles only, with the cell', async () => {
    const user = userEvent.setup();
    const onSpaceAction = vi.fn();
    render(<Board onSpaceAction={onSpaceAction} isEditing={false} />);
    const grid = screen.getByRole('group', { name: 'Overview' });
    fireEvent.contextMenu(grid, { clientX: 0, clientY: 0 });
    const menu = await screen.findByRole('menu', { name: 'Empty space actions' });
    await user.click(within(menu).getByRole('menuitem', { name: 'Add a tile here' }));
    expect(onSpaceAction).toHaveBeenCalledWith('add', { x: 0, y: 0 });
    // A tile keeps its own menu, never the grid's.
    fireEvent.contextMenu(requireDefined(tile('Notes').firstElementChild));
    expect(await screen.findByRole('menu', { name: 'Notes actions' })).toBeInTheDocument();
    expect(screen.queryByRole('menu', { name: 'Empty space actions' })).not.toBeInTheDocument();
  });

  it('UIC-DASHBOARD-GRID-5.1 UIC-DASHBOARD-GRID-5.2 leaves the browser menu alone without menus', () => {
    render(
      <DashboardGrid aria-label="Plain" layout={layout}>
        {(item) => <DashboardTile label={String(item.id)}>{String(item.id)}</DashboardTile>}
      </DashboardGrid>,
    );
    expect(fireEvent.contextMenu(screen.getByRole('group', { name: 'Plain' }))).toBe(true);
    expect(fireEvent.contextMenu(tile('notes'))).toBe(true);
  });
});
