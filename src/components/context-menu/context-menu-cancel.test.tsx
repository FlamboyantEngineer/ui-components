import { act, render, screen } from '@testing-library/react';
import { userEvent, type UserEvent } from '@testing-library/user-event';
import type { SyntheticEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Menu, MenuItem } from '../menu/menu.js';
import { ContextMenuTrigger } from './context-menu.js';

afterEach(() => {
  vi.useRealTimers();
});

function setupOnFakeClock(): UserEvent {
  vi.useFakeTimers();
  return userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
}

const prevent = (event: SyntheticEvent) => event.preventDefault();

function FileMenu({ label = 'File actions' }: { label?: string }) {
  return (
    <Menu aria-label={label}>
      <MenuItem id="open">Open</MenuItem>
    </Menu>
  );
}

/** Rests a touch on the target past the long-press delay, still down. */
async function longTouch(user: UserEvent, target: Element) {
  await user.pointer({ keys: '[TouchA>]', target, coords: { clientX: 20, clientY: 20 } });
  act(() => {
    vi.advanceTimersByTime(600);
  });
}

describe('ContextMenuTrigger and requests a handler cancelled', () => {
  it('UIC-CONTEXT-MENU-1.7 opens nothing when the target cancels a secondary click, once per click', async () => {
    const user = userEvent.setup();
    const onContextMenu = vi.fn(prevent);
    render(
      <ContextMenuTrigger>
        <div tabIndex={0} onContextMenu={onContextMenu}>
          Report.pdf
        </div>
        <FileMenu />
      </ContextMenuTrigger>,
    );
    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Report.pdf') });
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-CONTEXT-MENU-1.7 opens nothing when an element inside the target cancels it', async () => {
    const user = userEvent.setup();
    render(
      <ContextMenuTrigger>
        <div tabIndex={0}>
          <span onContextMenu={prevent}>Handled</span>
          <span>Open here</span>
        </div>
        <FileMenu />
      </ContextMenuTrigger>,
    );
    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Handled') });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Open here') });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('UIC-CONTEXT-MENU-1.7 schedules no long press for a cancelled touch, once per touch', async () => {
    const user = setupOnFakeClock();
    const onPointerDown = vi.fn(prevent);
    render(
      <ContextMenuTrigger>
        <div tabIndex={0} onPointerDown={onPointerDown}>
          Report.pdf
        </div>
        <FileMenu />
      </ContextMenuTrigger>,
    );
    const target = screen.getByText('Report.pdf');
    await longTouch(user, target);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.pointer({ keys: '[/TouchA]', target });
    // The cancelled press leaves no suppression behind: a secondary click still opens the menu.
    await user.pointer({ keys: '[MouseRight]', target });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('UIC-CONTEXT-MENU-1.7 opens only the innermost of nested targets on a long touch', async () => {
    const user = setupOnFakeClock();
    render(
      <ContextMenuTrigger>
        <div tabIndex={0}>
          Folder
          <ContextMenuTrigger>
            <div tabIndex={0}>Report.pdf</div>
            <FileMenu label="Report actions" />
          </ContextMenuTrigger>
        </div>
        <FileMenu label="Folder actions" />
      </ContextMenuTrigger>,
    );
    await longTouch(user, screen.getByText('Report.pdf'));
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(screen.getByRole('menu', { name: 'Report actions' })).toBeInTheDocument();
  });

  it('UIC-CONTEXT-MENU-1.7 opens nothing from a key the target cancelled', async () => {
    const user = userEvent.setup();
    render(
      <ContextMenuTrigger>
        <button type="button" onKeyDown={prevent}>
          Report.pdf
        </button>
        <FileMenu />
      </ContextMenuTrigger>,
    );
    act(() => screen.getByRole('button', { name: 'Report.pdf' }).focus());
    await user.keyboard('{Shift>}{F10}{/Shift}{ContextMenu}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
