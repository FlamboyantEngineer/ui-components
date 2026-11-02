import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../button/button.js';
import { Menu, MenuItem, MenuPopover, MenuTrigger } from '../menu/menu.js';
import { PortalContainerProvider } from '../portal/portal.js';
import { ContextMenu, ContextMenuTrigger } from './context-menu.js';
import { createMenuController } from './menu-controller.js';

function popover() {
  return document.querySelector<HTMLElement>('.ui-menu-popover');
}

describe('ContextMenu', () => {
  it('UIC-CONTEXT-MENU-1.8 leaves outside content reachable and scrollable when non-modal', async () => {
    const user = userEvent.setup();
    const controller = createMenuController();
    const onAction = vi.fn();
    render(
      <>
        <Button>Outside action</Button>
        <ContextMenu controller={controller} isNonModal />
      </>,
    );
    const outside = screen.getByRole('button', { name: 'Outside action' });
    act(() =>
      controller.open({ x: 10, y: 10 }, { items: [{ id: 'copy', label: 'Copy', onAction }] }),
    );
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
    expect(outside.closest('[inert], [aria-hidden="true"]')).toBeNull();
    expect(document.documentElement.style.overflow).not.toBe('hidden');
    await user.click(outside);
    expect(controller.isOpen()).toBe(false);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('UIC-CONTEXT-MENU-1.8 forwards non-modal behavior through the trigger with keyboard actions and dismissal', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <>
        <Button>Outside action</Button>
        <ContextMenuTrigger isNonModal>
          <button type="button">Excerpt</button>
          <Menu onAction={onAction}>
            <MenuItem id="copy">Copy</MenuItem>
          </Menu>
        </ContextMenuTrigger>
      </>,
    );
    const target = screen.getByRole('button', { name: 'Excerpt' });
    await user.click(target);
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(screen.getByRole('button', { name: 'Outside action' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledWith('copy');
    await waitFor(() => expect(target).toHaveFocus());
    await user.keyboard('{Shift>}{F10}{/Shift}{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(target).toHaveFocus());
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('UIC-CONTEXT-MENU-2.2 shows the controller entries at a point and closes the controller', async () => {
    const user = userEvent.setup();
    const controller = createMenuController();
    const onApple = vi.fn();
    render(<ContextMenu controller={controller} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    act(() =>
      controller.open(
        { x: 100, y: 120 },
        {
          items: [
            { id: 'apple', label: 'Apple', onAction: onApple },
            { id: 'pear', label: 'Pear' },
          ],
        },
      ),
    );
    expect(screen.getByRole('menu', { name: 'Context menu' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Apple' })).toHaveFocus();
    expect(popover()?.style.top).toBe('122px');
    await user.click(screen.getByRole('menuitem', { name: 'Apple' }));
    expect(onApple).toHaveBeenCalledTimes(1);
    expect(controller.isOpen()).toBe(false);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    act(() => controller.open({ x: 10, y: 10 }));
    await user.keyboard('{Escape}');
    expect(controller.isOpen()).toBe(false);
  });

  it('UIC-CONTEXT-MENU-1.6 names the menu and its popover from aria-label', () => {
    const controller = createMenuController();
    render(
      <ContextMenu controller={controller} aria-label="Cell actions">
        <Menu>
          <MenuItem>Copy</MenuItem>
        </Menu>
      </ContextMenu>,
    );
    act(() => controller.open({ x: 1, y: 1 }));
    expect(screen.getByRole('dialog', { name: 'Cell actions' })).toBeInTheDocument();
    expect(screen.getByRole('menu', { name: 'Cell actions' })).toBeInTheDocument();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('UIC-CONTEXT-MENU-2.2 anchors to an element and shows its Menu child', async () => {
    const user = userEvent.setup();
    const controller = createMenuController();
    const onAction = vi.fn();
    render(
      <>
        <button type="button">Cell</button>
        <ContextMenu controller={controller} placement="top start">
          <Menu aria-label="Cell actions" onAction={onAction}>
            <MenuItem id="copy">Copy</MenuItem>
          </Menu>
        </ContextMenu>
      </>,
    );
    const cell = screen.getByRole('button', { name: 'Cell' });
    act(() => cell.focus());
    act(() => controller.open(cell));
    expect(screen.getByRole('menu', { name: 'Cell actions' })).toBeInTheDocument();
    expect(popover()).toHaveAttribute('data-placement', 'top');
    await user.keyboard('{Enter}');
    expect(onAction.mock.calls.map((call) => call[0])).toEqual(['copy']);
    expect(controller.isOpen()).toBe(false);
    await waitFor(() => expect(cell).toHaveFocus());
  });

  it('UIC-CONTEXT-MENU-2.3 moves an open menu without remounting it or moving focus', async () => {
    const user = userEvent.setup();
    const controller = createMenuController();
    render(<ContextMenu controller={controller} />);
    act(() =>
      controller.open(
        { x: 20, y: 20 },
        {
          items: [
            { id: 'a', label: 'Apple' },
            { id: 'b', label: 'Banana', items: [{ id: 'c', label: 'Cherry' }] },
          ],
        },
      ),
    );
    await user.keyboard('{ArrowDown}{ArrowRight}');
    const menu = screen.getAllByRole('menu')[0];
    const cherry = screen.getByRole('menuitem', { name: 'Cherry' });
    expect(cherry).toHaveFocus();
    act(() => controller.move({ x: 200, y: 300 }));
    expect(popover()?.style.left).toBe('200px');
    expect(popover()?.style.top).toBe('302px');
    expect(screen.getAllByRole('menu')[0]).toBe(menu);
    expect(cherry).toHaveFocus();
    act(() => controller.move({ x: 60, y: 70 }));
    expect(popover()?.style.left).toBe('60px');
    expect(popover()?.style.top).toBe('72px');
  });

  it('UIC-CONTEXT-MENU-2.4 stacks on the context-menu layer, above dropdown menus', async () => {
    const user = userEvent.setup();
    const controller = createMenuController();
    render(
      <PortalContainerProvider layerZIndex={{ dropdown: 500, 'context-menu': 600 }}>
        <MenuTrigger>
          <Button>Actions</Button>
          <MenuPopover>
            <Menu aria-label="Actions">
              <MenuItem>Cut</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
        <ContextMenu controller={controller} />
      </PortalContainerProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    act(() => controller.open({ x: 5, y: 5 }, { items: [{ id: 'paste', label: 'Paste' }] }));
    const [dropdown, context] = [
      document.querySelector<HTMLElement>('.ui-menu-popover[data-layer="dropdown"]'),
      document.querySelector<HTMLElement>('.ui-menu-popover[data-layer="context-menu"]'),
    ];
    expect(dropdown?.style.zIndex).toBe('500');
    expect(context?.style.zIndex).toBe('600');
    expect(Number(context?.style.zIndex)).toBeGreaterThan(Number(dropdown?.style.zIndex));
  });
});
