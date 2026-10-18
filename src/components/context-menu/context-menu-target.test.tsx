import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Menu, MenuItem, MenuPopover, SubmenuTrigger } from '../menu/menu.js';
import { ContextMenuTrigger } from './context-menu.js';

afterEach(() => {
  vi.useRealTimers();
});

function popover() {
  return document.querySelector<HTMLElement>('.ui-menu-popover');
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
  it('UIC-CONTEXT-MENU-1.1 opens at the pointer instead of the browser menu', () => {
    const outer = vi.fn();
    render(
      <div onContextMenu={outer}>
        <ContextMenuTrigger>
          <div tabIndex={0}>Report.pdf</div>
          <FileMenu />
        </ContextMenuTrigger>
      </div>,
    );
    const notPrevented = fireEvent.contextMenu(screen.getByText('Report.pdf'), {
      clientX: 50,
      clientY: 60,
    });
    expect(notPrevented).toBe(false);
    expect(outer).not.toHaveBeenCalled();
    expect(screen.getByRole('menu', { name: 'Context menu' })).toBeInTheDocument();
    expect(popover()).toHaveAttribute('data-placement', 'bottom');
    expect(popover()?.style.left).toBe('50px');
    expect(popover()?.style.top).toBe('62px');
    expectHooksMatchSpec(document.body, 'MENU', { slots: ['label', 'submenu-indicator'] });
  });

  it('UIC-CONTEXT-MENU-1.2 opens below the focused target from the Context Menu key or Shift+F10', async () => {
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
    expect(fireEvent.keyDown(target, { key: 'ContextMenu' })).toBe(false);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    // The browser's own contextmenu event for the same key opens nothing more.
    expect(fireEvent.contextMenu(target, { clientX: 300, clientY: 300 })).toBe(false);
    expect(popover()?.style.left).not.toBe('300px');
  });

  it('UIC-CONTEXT-MENU-1.3 opens at a resting touch once, and not after the touch moves', () => {
    vi.useFakeTimers();
    render(
      <ContextMenuTrigger>
        <div tabIndex={0}>Report.pdf</div>
        <FileMenu />
      </ContextMenuTrigger>,
    );
    const target = screen.getByText('Report.pdf');
    const touch = { pointerType: 'touch', pointerId: 7, clientX: 40, clientY: 40 };
    fireEvent.pointerDown(target, touch);
    fireEvent.pointerMove(target, { ...touch, clientX: 70 });
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.pointerUp(target, touch);

    fireEvent.pointerDown(target, { pointerType: 'mouse', pointerId: 1, clientX: 40, clientY: 40 });
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.pointerDown(target, touch);
    act(() => vi.advanceTimersByTime(499));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(popover()?.style.left).toBe('40px');
    expect(fireEvent.contextMenu(target, { clientX: 200, clientY: 200 })).toBe(false);
    expect(popover()?.style.left).toBe('40px');
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
    fireEvent.contextMenu(target, { clientX: 10, clientY: 10 });
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
    fireEvent.contextMenu(target, { clientX: 10, clientY: 10 });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.contextMenu(target, { clientX: 10, clientY: 10 });
    expect(fireEvent.contextMenu(screen.getByRole('menuitem', { name: 'Open' }))).toBe(false);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body, { button: 2 });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.contextMenu(target, { clientX: 10, clientY: 10 });
    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onAction).not.toHaveBeenCalled();

    rerender(
      <ContextMenuTrigger isDisabled>
        <div tabIndex={0}>Report.pdf</div>
        <FileMenu onAction={onAction} />
      </ContextMenuTrigger>,
    );
    expect(fireEvent.contextMenu(target, { clientX: 10, clientY: 10 })).toBe(true);
    fireEvent.keyDown(target, { key: 'F10', shiftKey: true });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-CONTEXT-MENU-1.6 keeps the target own handlers, ref and role, and names the menu', () => {
    const onContextMenu = vi.fn();
    const onKeyDown = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <UiProvider strings={{ contextMenu: 'File actions' }}>
        <ContextMenuTrigger className="caller" data-testid="surface" id="file-menu">
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
    fireEvent.keyDown(target, { key: 'a' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    fireEvent.contextMenu(target, { clientX: 5, clientY: 5 });
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('menu', { name: 'File actions' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'File actions' })).toBe(
      screen.getByTestId('surface'),
    );
    expect(screen.getByTestId('surface')).toHaveClass('ui-menu-popover', 'caller');
    expect(screen.getByTestId('surface')).toHaveAttribute('data-layer', 'context-menu');
    expect(screen.getByTestId('surface')).toHaveAttribute('id', 'file-menu');
    expectHooksMatchSpec(document.body, 'MENU', { callerAttributes: ['data-testid'] });
  });
});
