import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type UserEvent, userEvent } from '@testing-library/user-event';
import { createRef, StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ListView, ListViewItem } from '../list-row/list-view.js';
import { Menu, MenuItem, MenuPopover, SubmenuTrigger } from '../menu/menu.js';
import { ContextMenuTrigger } from './context-menu.js';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function popover() {
  return document.querySelector<HTMLElement>('.ui-menu-popover');
}

/**
 * A user-event session on a fake clock that moves only when the test moves it. Testing Library
 * settles each user-event call on a zero timer it advances only through a `jest` global.
 */
function setupOnFakeClock(): UserEvent {
  vi.useFakeTimers();
  return userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
}

/** Reports whether the first `type` event dispatched during `act` had its default prevented. */
async function isPrevented(type: string, act: () => Promise<void>): Promise<boolean> {
  let seen: Event | null = null;
  const listen = (event: Event) => {
    seen ??= event;
  };
  document.addEventListener(type, listen, { capture: true });
  try {
    await act();
  } finally {
    document.removeEventListener(type, listen, { capture: true });
  }
  if (!seen) throw new Error(`No ${type} event was dispatched`);
  return (seen as Event).defaultPrevented;
}

/** Presses the secondary mouse button on the target at a viewport point. */
function rightClick(user: UserEvent, target: Element, clientX = 10, clientY = 10) {
  return user.pointer({ keys: '[MouseRight]', target, coords: { clientX, clientY } });
}

function FileMenu({ onAction }: { onAction?: (key: unknown) => void }) {
  return (
    <Menu onAction={onAction}>
      <MenuItem id="open">Open</MenuItem>
      <MenuItem id="rename">Rename</MenuItem>
      <SubmenuTrigger>
        <MenuItem id="share">Share</MenuItem>
        <MenuPopover>
          <Menu onAction={onAction}>
            <MenuItem id="mail">Mail</MenuItem>
          </Menu>
        </MenuPopover>
      </SubmenuTrigger>
    </Menu>
  );
}

describe('ContextMenuTrigger', () => {
  it('UIC-CONTEXT-MENU-1.1 opens at the pointer instead of the browser menu', async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    render(
      <div onContextMenu={outer}>
        <ContextMenuTrigger>
          <div tabIndex={0}>Report.pdf</div>
          <FileMenu />
        </ContextMenuTrigger>
      </div>,
    );
    const prevented = await isPrevented('contextmenu', () =>
      rightClick(user, screen.getByText('Report.pdf'), 50, 60),
    );
    expect(prevented).toBe(true);
    expect(outer).not.toHaveBeenCalled();
    expect(screen.getByRole('menu', { name: 'Context menu' })).toBeInTheDocument();
    expect(popover()).toHaveAttribute('data-placement', 'bottom');
    expect(popover()?.style.left).toBe('50px');
    expect(popover()?.style.top).toBe('62px');
    expectHooksMatchSpec(document.body, 'MENU', { slots: ['label', 'submenu-indicator'] });
  });

  it('UIC-CONTEXT-MENU-1.2 opens below the focused target from the Context Menu key or Shift+F10', async () => {
    // The key's own contextmenu event is ignored for a short time after the key; a stopped wall
    // clock keeps that window open however slowly the test runs.
    vi.useFakeTimers({ toFake: ['Date'] });
    const user = userEvent.setup();
    render(
      <ContextMenuTrigger>
        <button type="button">Report.pdf</button>
        <FileMenu />
      </ContextMenuTrigger>,
    );
    const target = screen.getByRole('button', { name: 'Report.pdf' });
    act(() => target.focus());
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    expect(popover()).toHaveAttribute('data-placement', 'bottom');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(target).toHaveFocus());
    expect(await isPrevented('keydown', () => user.keyboard('{ContextMenu}'))).toBe(true);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    // The browser's own contextmenu event for the same key opens nothing more.
    expect(fireEvent.contextMenu(target, { clientX: 300, clientY: 300 })).toBe(false);
    expect(popover()?.style.left).not.toBe('300px');
  });

  it('UIC-CONTEXT-MENU-1.2 opens from the keys a control inside stopped, the innermost target only', async () => {
    const user = userEvent.setup();
    const stop = (event: React.KeyboardEvent) => event.stopPropagation();
    render(
      <ContextMenuTrigger aria-label="Outer">
        <div>
          <ContextMenuTrigger aria-label="Inner">
            <div>
              <button type="button" onKeyDown={stop}>
                Choose
              </button>
            </div>
            <FileMenu />
          </ContextMenuTrigger>
        </div>
        <FileMenu />
      </ContextMenuTrigger>,
    );
    act(() => screen.getByRole('button', { name: 'Choose' }).focus());
    await user.keyboard('{Shift>}{F10}{/Shift}');
    await screen.findByRole('dialog', { name: 'Inner' });
    expect(screen.queryByRole('dialog', { name: 'Outer' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('menu')).toHaveLength(1);
  });

  it('UIC-CONTEXT-MENU-1.1 UIC-CONTEXT-MENU-1.3 keeps the browser menu on a text control inside the target', async () => {
    const user = setupOnFakeClock();
    render(
      <ContextMenuTrigger>
        <div>
          <input aria-label="Name" />
          <span>Row</span>
        </div>
        <FileMenu />
      </ContextMenuTrigger>,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(await isPrevented('contextmenu', () => rightClick(user, input))).toBe(false);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.pointer({ keys: '[TouchA>]', target: input });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.pointer({ keys: '[/TouchA]', target: input });
    expect(await isPrevented('contextmenu', () => rightClick(user, screen.getByText('Row')))).toBe(
      true,
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('UIC-CONTEXT-MENU-1.3 opens at a resting touch once, and not after the touch moves', async () => {
    const user = setupOnFakeClock();
    render(
      <ContextMenuTrigger>
        <div tabIndex={0}>Report.pdf</div>
        <FileMenu />
      </ContextMenuTrigger>,
    );
    const target = screen.getByText('Report.pdf');
    const point = { clientX: 40, clientY: 40 };
    await user.pointer([
      { keys: '[TouchA>]', target, coords: point },
      { pointerName: 'TouchA', target, coords: { ...point, clientX: 70 } },
    ]);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.pointer({ keys: '[/TouchA]', target });

    await user.pointer({ keys: '[MouseLeft>]', target, coords: point });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.pointer({ keys: '[/MouseLeft]', target });

    await user.pointer({ keys: '[TouchA>]', target, coords: point });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(popover()?.style.left).toBe('40px');
    expect(fireEvent.contextMenu(target, { clientX: 200, clientY: 200 })).toBe(false);
    expect(popover()?.style.left).toBe('40px');
  });

  it('UIC-CONTEXT-MENU-1.3 opens at a long touch on a button or a list row inside the target', async () => {
    const user = setupOnFakeClock();
    const onPress = vi.fn();
    render(
      <ContextMenuTrigger>
        <div tabIndex={0}>
          <Button onPress={onPress}>Preview</Button>
          <ListView aria-label="Files" items={[{ id: 'notes', name: 'Notes.txt' }]}>
            {(item) => <ListViewItem title={item.name} />}
          </ListView>
        </div>
        <FileMenu />
      </ContextMenuTrigger>,
    );
    for (const target of [
      screen.getByRole('button', { name: 'Preview' }),
      screen.getByRole('row', { name: 'Notes.txt' }),
    ]) {
      await user.pointer({ keys: '[TouchA>]', target, coords: { clientX: 30, clientY: 50 } });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(popover()?.style.left).toBe('30px');
      await user.keyboard('{Escape}');
      await user.pointer({ keys: '[/TouchA]', target });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    }
  });

  it('UIC-CONTEXT-MENU-1.4 focuses the first item and returns focus to the target', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <>
        <button type="button">Before</button>
        <ContextMenuTrigger>
          <div tabIndex={0}>Report.pdf</div>
          <FileMenu onAction={onAction} />
        </ContextMenuTrigger>
        <ContextMenuTrigger>
          <p>Plain text</p>
          <FileMenu onAction={onAction} />
        </ContextMenuTrigger>
      </>,
    );
    const target = screen.getByText('Report.pdf');
    await rightClick(user, target);
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onAction.mock.calls.map((call) => call[0])).toEqual(['rename']);
    await waitFor(() => expect(target).toHaveFocus());

    const before = screen.getByRole('button', { name: 'Before' });
    act(() => before.focus());
    fireEvent.contextMenu(screen.getByText('Plain text'), { clientX: 10, clientY: 10 });
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(before).toHaveFocus());
  });

  it('UIC-CONTEXT-MENU-1.3 UIC-CONTEXT-MENU-1.5 cancels a resting touch when the trigger becomes disabled', async () => {
    const user = setupOnFakeClock();
    const menu = (isDisabled: boolean) => (
      <ContextMenuTrigger isDisabled={isDisabled}>
        <div tabIndex={0}>Report.pdf</div>
        <FileMenu />
      </ContextMenuTrigger>
    );
    const { rerender } = render(menu(false));
    const target = screen.getByText('Report.pdf');
    await user.pointer({ keys: '[TouchA>]', target });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    rerender(menu(true));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    rerender(menu(false));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.pointer({ keys: '[/TouchA]', target });
    await user.pointer({ keys: '[TouchA>]', target });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('UIC-CONTEXT-MENU-1.5 closes on Escape and outside presses, and stays out of the way when disabled', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { rerender } = render(
      <ContextMenuTrigger>
        <div tabIndex={0}>Report.pdf</div>
        <FileMenu onAction={onAction} />
      </ContextMenuTrigger>,
    );
    const target = screen.getByText('Report.pdf');
    await rightClick(user, target);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await rightClick(user, target);
    const open = screen.getByRole('menuitem', { name: 'Open' });
    expect(await isPrevented('contextmenu', () => rightClick(user, open))).toBe(true);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await rightClick(user, document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await rightClick(user, target);
    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onAction).not.toHaveBeenCalled();

    // Disabling the trigger closes its open menu, which stays closed once enabled again.
    await rightClick(user, target);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    const trigger = (isDisabled: boolean) => (
      <ContextMenuTrigger isDisabled={isDisabled}>
        <div tabIndex={0}>Report.pdf</div>
        <FileMenu onAction={onAction} />
      </ContextMenuTrigger>
    );
    rerender(trigger(true));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    rerender(trigger(false));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    rerender(
      <ContextMenuTrigger isDisabled>
        <div tabIndex={0}>Report.pdf</div>
        <FileMenu onAction={onAction} />
      </ContextMenuTrigger>,
    );
    expect(await isPrevented('contextmenu', () => rightClick(user, target))).toBe(false);
    act(() => target.focus());
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-CONTEXT-MENU-1.6 keeps the target own handlers, ref and role, and names the menu', async () => {
    const user = userEvent.setup();
    const onContextMenu = vi.fn();
    const onKeyDown = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <UiProvider messages={{ contextMenu: 'File actions' }}>
        <ContextMenuTrigger className="caller" data-owner="surface" id="file-menu">
          <button type="button" ref={ref} onContextMenu={onContextMenu} onKeyDown={onKeyDown}>
            Report.pdf
          </button>
          <FileMenu />
        </ContextMenuTrigger>
      </UiProvider>,
    );
    const target = screen.getByRole('button', { name: 'Report.pdf' });
    expect(ref.current).toBe(target);
    expect(target).not.toHaveAttribute('aria-haspopup');
    act(() => target.focus());
    await user.keyboard('a');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    await rightClick(user, target, 5, 5);
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('menu', { name: 'File actions' })).toBeInTheDocument();
    const surface = screen.getByRole('dialog', { name: 'File actions' });
    expect(surface).toHaveAttribute('data-owner', 'surface');
    expect(surface).toHaveClass('ui-menu-popover', 'caller');
    expect(surface).toHaveAttribute('data-layer', 'context-menu');
    expect(surface).toHaveAttribute('id', 'file-menu');
    expectHooksMatchSpec(document.body, 'MENU', { callerAttributes: ['data-owner'] });
  });

  it('UIC-CONTEXT-MENU-1.6 UIC-COMPOSITION-2.2 runs the target ref cleanup once per attachment', () => {
    const attached: Array<HTMLElement | null> = [];
    const cleanups = vi.fn();
    const callbackRef = (node: HTMLElement | null) => {
      attached.push(node);
      return cleanups;
    };
    function Target({ targetRef }: { targetRef: (node: HTMLElement | null) => () => void }) {
      return (
        <StrictMode>
          <ContextMenuTrigger>
            <button type="button" ref={targetRef}>
              Report.pdf
            </button>
            <FileMenu />
          </ContextMenuTrigger>
        </StrictMode>
      );
    }
    const { rerender, unmount } = render(<Target targetRef={callbackRef} />);
    const target = screen.getByRole('button', { name: 'Report.pdf' });
    expect(attached.length).toBeGreaterThan(0);
    expect(cleanups).toHaveBeenCalledTimes(attached.length - 1);

    const nextCleanup = vi.fn();
    const nextRef = vi.fn((node: HTMLElement | null) => {
      void node;
      return nextCleanup;
    });
    rerender(<Target targetRef={nextRef} />);
    expect(cleanups).toHaveBeenCalledTimes(attached.length);
    expect(nextRef).toHaveBeenLastCalledWith(target);
    unmount();
    expect(nextCleanup).toHaveBeenCalledTimes(nextRef.mock.calls.length);
    expect(attached).not.toContain(null);
    expect(nextRef).not.toHaveBeenCalledWith(null);
  });
});
