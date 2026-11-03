import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MenuButton, actionKeys, fruitEntries, openMenu } from '../../../test/menu-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { PortalContainerProvider } from '../portal/portal.js';
import { Menu, MenuItem, MenuPopover, SubmenuTrigger } from './menu.js';

describe('MenuPopover and SubmenuTrigger', () => {
  it.each(['mouse', 'touch'] as const)(
    'UIC-MENU-4.3 closes once when its trigger is pressed again with %s',
    async (pointerType) => {
      const user = userEvent.setup();
      render(<MenuButton items={fruitEntries} aria-label="Fruit" />);
      const trigger = screen.getByRole('button', { name: 'Actions' });
      await openMenu(user);
      const key = pointerType === 'touch' ? 'TouchA' : 'MouseLeft';
      await user.pointer([
        { target: trigger, keys: `[${key}>]` },
        { target: trigger, keys: `[/${key}]` },
      ]);
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveFocus();
      await user.click(trigger);
      expect(screen.getByRole('menu')).toBeVisible();
      await user.click(document.body);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    },
  );

  it('UIC-MENU-4.3 places the popover against its trigger and closes on an outside press', async () => {
    const user = userEvent.setup();
    render(<MenuButton items={fruitEntries} aria-label="Fruit" />);
    await openMenu(user);
    const popover = document.querySelector('.ui-menu-popover');
    expect(popover).toHaveAttribute('data-placement', 'bottom');
    expect(popover).toHaveAttribute('data-trigger', 'MenuTrigger');
    expect(popover).toContainElement(screen.getByRole('menu'));
    expectHooksMatchSpec(document.body, 'MENU');
    await user.click(document.body);
    expect(document.querySelector('.ui-menu-popover')).toBeNull();
  });

  it('UIC-MENU-4.3 keeps the page scrollable and stays open as it scrolls', async () => {
    const user = userEvent.setup();
    render(
      <>
        <div role="region" aria-label="List">
          <MenuButton items={fruitEntries} aria-label="Fruit" />
        </div>
        <p>Page text</p>
      </>,
    );
    const overflow = document.documentElement.style.overflow;
    await openMenu(user);
    expect(document.documentElement.style.overflow).toBe(overflow);
    expect(screen.getByText('Page text')).toBeVisible();
    fireEvent.scroll(document);
    fireEvent.scroll(screen.getByText('Page text'));
    await user.keyboard('{End}{ArrowRight}');
    await screen.findByRole('menuitem', { name: 'Cherry' });
    fireEvent.scroll(document);
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    const scroller = screen.getByRole('region', { name: 'List' });
    fireEvent.scroll(scroller);
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    // A queued event with opening offsets is harmless; a later genuine scroll closes the menu.
    scroller.scrollTop = 24;
    fireEvent.scroll(scroller);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('UIC-MENU-4.3 stays open while a scroll it did not start settles, and closes on the reader’s', async () => {
    const user = userEvent.setup();
    render(
      <div role="region" aria-label="List">
        <MenuButton items={fruitEntries} aria-label="Fruit" />
      </div>,
    );
    const scroller = screen.getByRole('region', { name: 'List' });
    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeVisible();
    // A focus scroll still running when the menu opened keeps moving the list.
    for (const top of [40, 20, 0]) {
      scroller.scrollTop = top;
      fireEvent.scroll(scroller);
    }
    expect(screen.getByRole('menu')).toBeVisible();
    fireEvent.wheel(scroller);
    scroller.scrollTop = 30;
    fireEvent.scroll(scroller);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('UIC-MENU-4.3 closes on Escape pressed in the same task as a page scroll', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MenuButton items={fruitEntries} aria-label="Fruit" />);
    await openMenu(user);
    // A browser's page scroll bubbles from the document to the window.
    fireEvent(document, new Event('scroll', { bubbles: true }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('UIC-MENU-4.3 closes on reader Escape while an ignored ancestor scroll awaits cleanup', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <div role="region" aria-label="List">
        <MenuButton items={fruitEntries} aria-label="Fruit" />
      </div>,
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await openMenu(user);
    // Element scroll events do not bubble, so the guard's deferred cleanup has not run yet.
    fireEvent.scroll(screen.getByRole('region', { name: 'List' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('UIC-MENU-4.4 stacks the popover on its layer, honouring provider z-indexes', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<MenuButton items={fruitEntries} aria-label="Fruit" />);
    await openMenu(user);
    let popover = document.querySelector<HTMLElement>('.ui-menu-popover');
    expect(popover).toHaveAttribute('data-layer', 'dropdown');
    expect(popover?.style.zIndex).toBe('130');
    await user.keyboard('{End}{ArrowRight}');
    const popovers = document.querySelectorAll<HTMLElement>('.ui-menu-popover');
    expect(popovers).toHaveLength(2);
    expect(popovers[1]).toHaveAttribute('data-layer', 'dropdown');
    expect(popovers[1]).toHaveAttribute('data-trigger', 'SubmenuTrigger');
    unmount();

    render(
      <PortalContainerProvider layerZIndex={{ 'context-menu': 900 }}>
        <MenuButton items={fruitEntries} aria-label="Fruit" layer="context-menu" />
      </PortalContainerProvider>,
    );
    await openMenu(user);
    popover = document.querySelector<HTMLElement>('.ui-menu-popover');
    expect(popover).toHaveAttribute('data-layer', 'context-menu');
    expect(popover?.style.zIndex).toBe('900');
    await user.keyboard('{End}{ArrowRight}');
    expect(document.querySelectorAll<HTMLElement>('.ui-menu-popover')[1]?.style.zIndex).toBe('900');
  });

  it('UIC-MENU-4.5 opens submenus by keyboard and closes only the submenu with ArrowLeft or Escape', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <MenuButton aria-label="File" onAction={onAction}>
        <MenuItem id="open">Open</MenuItem>
        <SubmenuTrigger>
          <MenuItem id="share">Share</MenuItem>
          <MenuPopover>
            <Menu onAction={onAction}>
              <MenuItem id="mail">Mail</MenuItem>
              <MenuItem id="chat">Chat</MenuItem>
            </Menu>
          </MenuPopover>
        </SubmenuTrigger>
      </MenuButton>,
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    trigger.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    const share = screen.getByRole('menuitem', { name: 'Share' });
    expect(share).toHaveFocus();
    expect(share).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{ArrowRight}');
    expect(share).toHaveAttribute('aria-expanded', 'true');
    expect(share).toHaveAttribute('data-open', 'true');
    expect(share).toHaveAttribute('data-has-submenu', 'true');
    expect(screen.getByRole('menuitem', { name: 'Mail' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    await waitFor(() => expect(share).toHaveFocus());
    expect(screen.queryByRole('menuitem', { name: 'Mail' })).not.toBeInTheDocument();
    await user.keyboard('{ArrowRight}{Escape}');
    await waitFor(() => expect(share).toHaveFocus());
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    await user.keyboard('{ArrowRight}{ArrowDown}{Enter}');
    expect(actionKeys(onAction)).toEqual(['chat']);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('UIC-MENU-4.5 opens submenus on hover and mirrors the keys in right-to-left text', async () => {
    const user = userEvent.setup();
    render(
      <UiProvider locale="he-IL">
        <MenuButton items={fruitEntries} aria-label="Fruit" />
      </UiProvider>,
    );
    await openMenu(user);
    const more = screen.getByRole('menuitem', { name: 'More fruit' });
    await user.hover(more);
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Cherry' })).toBeVisible());
    await user.unhover(more);
    act(() => more.focus());
    await user.keyboard('{Escape}');
    await openMenu(user);
    act(() => screen.getByRole('menuitem', { name: 'More fruit' }).focus());
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('menuitem', { name: 'Cherry' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'More fruit' })).toHaveFocus());
  });
});
